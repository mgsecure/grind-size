import React, {useContext, useMemo, useState} from 'react'
import {
    Paper,
    Stack,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    Box,
    Slider,
    lighten,
    alpha,
    Link
} from '@mui/material'
import {ResponsiveBar} from '@nivo/bar'
import {ResponsiveLine} from '@nivo/line'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import {useTheme} from '@mui/material/styles'
import ScaleLinearIcon from '../resources/ScaleLinearIcon.jsx'
import ScaleLogIcon from '../resources/ScaleLogIcon.jsx'
import {line, curveLinear, curveCatmullRom} from 'd3-shape'
import DataContext from '../../context/DataContext.jsx'
import ScreenshotElementButton from '../components/ScreenshotElementButton.jsx'
import UIContext from '../../context/UIContext.jsx'
import CurveLinearIcon from '../resources/CurveLinearIcon.jsx'
import CurveCardinalIcon from '../resources/CurveCardinalIcon.jsx'
import SeriesColorPicker from '../components/SeriesColorPicker.jsx'
import Tracker from '../../app/Tracker.jsx'
import TextField from '@mui/material/TextField'

function fmtNumber(n, digits = 2) {
    if (!Number.isFinite(n)) return '—'
    return n.toFixed(digits)
}

export default function HistogramPanel({domEl}) {
    const {
        allItems,
        activeItems,
        activeIdList,
        aggregateQueueItem,
        xAxis,
        yAxis, setYAxis,
        settings, setSettings,
        binSpacing, setBinSpacing,
        globalMaxY
    } = useContext(DataContext)

    const {
        aggregateColor,
        swapColors,
        chartColors,
        customSampleParams,
        setCustomSampleParams,
        isDesktop,
        isScreenshot,
        chartTitle, setChartTitle
    } = useContext(UIContext)

    //TODO: Skip every other tick on mobile

    const [chartMode, setChartMode] = useState('line')
    const [chartCurve, setChartCurve] = useState('curve')
    const maxY = binSpacing === 'log' ? globalMaxY.logMax : globalMaxY.linearMax

    // show aggregate in normal chart if only series remaining
    const showAggregate = activeIdList.includes(aggregateQueueItem?.id) && activeIdList.length === 1

    const sampleNames = allItems.reduce((acc, item) => {
        acc[item.id] = item.sampleName
        return acc
    }, {})

    const legendItems = allItems
        .filter(item => activeIdList.includes(item.id))
        .map((item, idx) => ({
            id: item.sampleName,
            color: chartColors[idx],
            itemId: item.id,
        }))

    const theme = useTheme()
    const tickLegendColor = theme.palette.text.primary

    const strokeWidth = 2

    function formatXTick(value) {
        if (xAxis === 'diameter') return Math.floor(value / 10 + 0.5) * 10
        if (xAxis === 'surface') return value
        return fmtNumber(value)
    }

    const {chartData, lineData, xLabel, yLabel, keys} = useMemo(() => {
        const xUnits = {
            diameter: 'μm',
            surface: 'mm²',
            volume: 'mm³'
        }
        const xLab = `${xAxis.charAt(0).toUpperCase() + xAxis.slice(1)} (${xUnits[xAxis]})`

        const yLabels = {
            count: '% of Particles',
            surface: '% Surface Area',
            mass: '% Mass'
        }
        const yLab = yLabels[yAxis] || '% of Particles'

        if (!activeIdList?.length) {
            return {chartData: [], lineData: [], xLabel: xLab, yLabel: yLab, keys: []}
        }

        const itemsWithHist = activeItems && activeItems
            .filter(item => (showAggregate || item.id !== aggregateQueueItem?.id))
            .filter(item => {
                const hist = binSpacing === 'log' ? item.histograms?.log : item.histograms?.linear
                return hist?.bins?.length && hist?.values?.length
            })

        const aggregateOnly = !itemsWithHist.length && aggregateQueueItem && activeIdList.includes(aggregateQueueItem?.id)

        if (!itemsWithHist.length && !aggregateOnly) {
            return {chartData: [], lineData: [], xLabel: xLab, yLabel: yLab, keys: []}
        }

        const seriesKeys = itemsWithHist.map(item => item.id)

        // Use the first item's bins as the master set of bins for the X-axis
        const basisHist = itemsWithHist.length ? itemsWithHist[0].histograms : aggregateQueueItem.result.histograms
        const firstHist = binSpacing === 'log' ? basisHist?.log : basisHist?.linear

        const cData = firstHist.bins.map((b, i) => {
            const entry = {
                bin: fmtNumber(b.center, xAxis === 'diameter' ? 1 : 0),
                lowerBound: b.start,
                upperBound: b.end
            }
            itemsWithHist.forEach((item, idx) => {
                const h = binSpacing === 'log' ? item.histograms.log : item.histograms.linear
                // We assume all items have the same bins if they were analyzed with the same settings
                entry[item.id] = h.values[i]?.percent ?? 0
                entry.sampleName = item.sampleName
                entry[item.id + 'Color'] = customSampleParams[item.id]?.color || chartColors[idx] || aggregateColor
            })

            if (aggregateQueueItem && activeIdList.includes(aggregateQueueItem?.id)) {
                const h = binSpacing === 'log' ? aggregateQueueItem.result.histograms.log : aggregateQueueItem.result.histograms.linear
                entry.Aggregate = (aggregateQueueItem && activeIdList.includes(aggregateQueueItem?.id)) ? h.values[i]?.percent ?? 0 : undefined
            }
            return entry
        })

        const lData = itemsWithHist.map((item, idx) => {
            const h = binSpacing === 'log' ? item.histograms.log : item.histograms.linear
            return {
                id: item.id,
                color: customSampleParams[item.id]?.color || chartColors[idx] || aggregateColor,
                stroke: customSampleParams[item.id]?.stroke || 2,
                data: h.bins.map((b, i) => ({
                    x: fmtNumber(b.center, xAxis === 'diameter' ? 1 : 0),
                    y: h.values[i]?.percent ?? 0,
                    lowerBound: b.start,
                    upperBound: b.end,
                    seriesName: item.sampleName,
                    itemId: item.id
                }))
            }
        })

        // Add Aggregate line data
        !showAggregate && activeIdList.includes(aggregateQueueItem?.id) && lData.push({
            id: 'Aggregate',
            color: aggregateColor,
            data: cData.map(d => ({
                x: d.bin,
                y: d.Aggregate,
                lowerBound: d.lowerBound,
                upperBound: d.upperBound
            }))
        })

        return {chartData: cData, lineData: lData, xLabel: xLab, yLabel: yLab, keys: seriesKeys}
    }, [xAxis, yAxis, activeIdList, activeItems, binSpacing, showAggregate, aggregateQueueItem, aggregateColor, customSampleParams, chartColors])

    const aggregateBarLineLayer = ({bars, xScale, yScale}) => {
        const lineGenerator = line()
            .x(d => xScale(d.data.data.bin) + d.width / 2) // Center point on the bar
            .y(d => yScale(d.data.data.Aggregate))       // 'Aggregate' is calculated in chartData
            .curve(chartCurve === 'linear' ? curveLinear : curveCatmullRom)
        const uniqueBins = []
        const seenBins = new Set()
        bars.forEach(bar => {
            const bin = bar.data.data.bin
            if (!seenBins.has(bin)) {
                seenBins.add(bin)
                uniqueBins.push(bar)
            }
        })
        uniqueBins.sort((a, b) => xScale(a.data.data.bin) - xScale(b.data.data.bin))
        const validBins = uniqueBins.filter(bar => typeof bar.data.data.Aggregate === 'number' && !isNaN(bar.data.data.Aggregate))

        return (activeIdList.includes(aggregateQueueItem?.id) && !showAggregate && validBins.length > 0
                ? <path
                    d={lineGenerator(validBins)}
                    fill='none'
                    stroke={aggregateColor}
                    strokeWidth={3}
                    style={{pointerEvents: 'none'}}
                />
                : null
        )
    }

    const aggregateLineLayer = ({series, xScale, yScale}) => {
        const lineGenerator = line()
            .x(d => xScale(d.data.x))
            .y(d => yScale(d.data.y))
            .curve(chartCurve === 'linear' ? curveLinear : curveCatmullRom)
        return (<g>
                {series
                    .map(({id, data, color, stroke}) => (
                        <path
                            key={id}
                            d={lineGenerator(data)}
                            fill='none'
                            stroke={id === 'Aggregate' ? aggregateColor : color}
                            strokeWidth={id === 'Aggregate' ? 3 : stroke}
                        />
                    ))}
            </g>
        )
    }

    const chartHeight = isDesktop ? 450 : 250

    const commonProps = {
        margin: {top: 10, right: 10, bottom: 60, left: 40},
        enableLabel: false,
        onClick: swapColors,
        theme: {
            axis: {
                ticks: {
                    text: {fill: tickLegendColor}
                },
                legend: {
                    text: {fill: tickLegendColor}
                }
            },
            grid: {
                line: {stroke: theme.palette.divider, strokeWidth: 1}
            }
        },
        axisBottom: {
            format: (value) => formatXTick(value),
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: xLabel,
            legendPosition: 'middle',
            legendOffset: 45
        },
        axisLeft: {
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: yLabel,
            legendPosition: 'middle',
            legendOffset: -35
        },
        valueScale: {
            type: 'linear',
            min: 0,
            max: maxY,
            clamp: true
        },
        tooltip: ({id, value, color, data}) => (
            <Paper sx={{p: 1, border: `1px solid ${color}`}}>
                <Typography variant='body2' sx={{fontWeight: 'bold'}} style={{color}}>
                    {sampleNames[id]}
                </Typography>
                <Typography variant='body2' style={{whiteSpace: 'nowrap'}}>
                    Range: {fmtNumber(data.lowerBound, 1)} – {fmtNumber(data.upperBound, 1)}
                </Typography>
                <Typography variant='body2'>
                    Value: <strong>{fmtNumber(value, 2)}%</strong>
                </Typography>
                {data.Aggregate !== undefined && id !== 'Aggregate' && (
                    <Typography variant='body2'
                                sx={{mt: 0.5, pt: 0.5, borderTop: `1px solid ${theme.palette.divider}`}}>
                        Aggregate: <strong>{fmtNumber(data.Aggregate, 2)}%</strong>
                    </Typography>
                )}
            </Paper>
        ),
        sliceTooltip: ({slice}) => (
            <Paper sx={{p: 1, border: '1px solid #ccc'}}>
                <Typography variant='body2' sx={{fontWeight: 'bold', mb: 1}} style={{whiteSpace: 'nowrap'}}>
                    Range: {fmtNumber(slice.points[0].data.lowerBound, 1)} – {fmtNumber(slice.points[0].data.upperBound, 1)}
                </Typography>
                {slice.points.map((point, index) => (
                    <Box key={index} sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                        pt: point.seriesId === 'Aggregate' ? 0.5 : 0,
                        borderTop: point.seriesId === 'Aggregate' ? `1px solid ${theme.palette.divider}` : 'none'
                    }}>
                        <Box sx={{
                            width: 12,
                            height: point.seriesId === 'Aggregate' ? 12 : 12,
                            backgroundColor: point.seriesId === 'Aggregate' ? aggregateColor : point.seriesColor
                        }}/>
                        <Typography variant='body2' style={{whiteSpace: 'nowrap'}}>
                            <strong>{point.seriesId === 'Aggregate' ? 'Aggregate' : sampleNames[point.seriesId]}:</strong> {fmtNumber(point.data.y, 2)}%
                        </Typography>
                    </Box>
                ))}
            </Paper>
        )
    }

    const disabledStyle = {opacity: 0.5, pointerEvents: 'none'}

    const activeFilename = activeItems.length === 1
        ? activeItems[0].filename.replace('Aggregate', 'aggregate')
        : 'multiple'

    const toggleButtonStyle = {height: 32, padding: '0px 11px'}
    const toggleButtonStyleIcon = {height: 32, padding: '0px 8px'}
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.target.blur()
        }
    }

    const trackerMemo = useMemo(() => (
        <Tracker feature='Results'/>
    ), [])

    const test = 'bins'

    return (
        <Paper sx={{p: isDesktop ? 2 : 1, pb: 0, width: '100%'}}>
            <Stack direction='row' alignItems='flex-end' justifyContent='space-between'
                   sx={{fontSize: '1.1rem', fontWeight: 500, mb: isScreenshot ? 2 : 0}}
                   style={!chartData.length ? disabledStyle : undefined}>
                HISTOGRAM
                {!isScreenshot &&
                    <ScreenshotElementButton domEl={domEl} filename={`psd-results_${activeFilename}`}/>
                }
            </Stack>

            {!isScreenshot &&
                <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' justifyContent='space-between'
                       sx={{marginTop: isDesktop ? 1 : 0.5, marginBottom: '5px'}}
                       style={!chartData.length ? disabledStyle : undefined}>
                    <ToggleButtonGroup
                        size='small'
                        value={yAxis}
                        exclusive
                        onChange={(_, v) => {
                            if (v) {
                                setYAxis(v)
                            }
                        }}
                        style={{marginRight: 10, marginBottom: 10}}
                    >
                        <ToggleButton value='mass' style={toggleButtonStyle}>Mass</ToggleButton>
                        <ToggleButton value='surface' style={toggleButtonStyle}>Surface Area</ToggleButton>
                        <ToggleButton value='count' style={toggleButtonStyle}>Count</ToggleButton>
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        size='small'
                        value={binSpacing}
                        exclusive
                        onChange={(_, v) => v && setBinSpacing(v)}
                        style={{marginRight: 15, marginBottom: 10}}
                    >
                        <ToggleButton value='log' style={toggleButtonStyleIcon}>
                            <ScaleLogIcon width={16} height={16} style={{
                                margin: '0px 1px',
                                fill: binSpacing === 'log' ? theme.palette.text.primary : theme.palette.text.secondary
                            }}/>
                        </ToggleButton>
                        <ToggleButton value='linear' style={toggleButtonStyleIcon}>
                            <ScaleLinearIcon width={16} height={16} style={{
                                margin: '0px 1px',
                                fill: binSpacing === 'linear' ? theme.palette.text.primary : theme.palette.text.secondary
                            }}/>
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Stack direction='row' style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10}}>
                        <Stack direction='row' alignContent='center' style={{fontSize: '0.8rem', whiteSpace: 'nowrap'}}>
                            <strong>Bin Count</strong>: {settings.bins}
                        </Stack>
                        {!isScreenshot &&
                            <Stack direction='row' alignContent='center' sx={{mr: isDesktop ? 2 : 1}}>
                                <Slider
                                    value={settings.bins}
                                    onChange={(_, v) => setSettings(prev => ({...prev, [test]: v}))}
                                    min={10}
                                    max={45}
                                    step={1}
                                    style={{width: 120, marginBottom: 1}}
                                    size='medium'
                                    sx={{
                                        '& .MuiSlider-thumb': {
                                            height: 16, width: 16
                                        },
                                        '& .MuiSlider-markLabel': {
                                            fontSize: '0.5rem',
                                            lineHeight: '0.5rem',
                                            marginTop: '-7px',
                                            color: theme.palette.text.secondary
                                        }
                                    }}
                                    marks={[{value: 15}]}
                                />
                            </Stack>
                        }
                    </Stack>

                    <Stack direction='row' alignItems='center' justifyContent={isDesktop ? 'flex-end' : 'flex-start'}
                           sx={{flexGrow: 1, marginBottom: '10px'}}>
                        <ToggleButtonGroup
                            size='small'
                            value={chartMode}
                            exclusive
                            onChange={(_, v) => v && setChartMode(v)}
                            style={{marginRight: 15, marginBottom: 10}}
                        >
                            <ToggleButton value='bar' style={toggleButtonStyleIcon}>
                                <BarChartIcon width={15} height={15}/></ToggleButton>
                            <ToggleButton value='line' style={toggleButtonStyleIcon}>
                                <ShowChartIcon width={15} height={15}/></ToggleButton>
                        </ToggleButtonGroup>

                        <ToggleButtonGroup
                            size='small'
                            value={chartCurve}
                            exclusive
                            onChange={(_, v) => v && setChartCurve(v)}
                            style={{marginBottom: 10}}
                        >
                            <ToggleButton value='linear' style={toggleButtonStyleIcon}>
                                <CurveLinearIcon width={16} height={16} style={{
                                    margin: '4px 5px',
                                    stroke: chartCurve === 'linear' ? theme.palette.text.primary : theme.palette.text.secondary
                                }}/>
                            </ToggleButton>
                            <ToggleButton value='curve' style={toggleButtonStyleIcon}>
                                <CurveCardinalIcon width={16} height={16} style={{
                                    margin: '4px 5px',
                                    stroke: chartCurve === 'curve' ? theme.palette.text.primary : theme.palette.text.secondary
                                }}/>
                            </ToggleButton>
                        </ToggleButtonGroup>
                        {!!chartData.length &&
                            <>{trackerMemo}</>
                        }

                    </Stack>
                </Stack>
            }

            {!chartData.length && (
                <Box color={alpha(theme.palette.text.secondary, 0.4)}
                     sx={{
                         display: 'flex',
                         placeContent: 'center',
                         width: '100%',
                         height: 100
                     }}>
                    <Box style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%', height: '100%',
                        fontSize: '0.9rem',
                        backgroundColor: lighten(theme.palette.background.paper, 0.1),
                        borderRadius: 5
                    }}>
                        No data to display.
                    </Box>
                </Box>
            )}

            {!!chartData.length && ((chartTitle?.length && isScreenshot) || !isScreenshot) &&
                <Stack direction='row' flexWrap='wrap' spacing={2} justifyContent='center'
                       sx={{mt: 0, pl: 4, fontSize: '0.75rem'}}>
                    <TextField type='text' name='chartTitle' id='chartTitle'
                               onChange={e => setChartTitle(e.target.value)} value={chartTitle || ''}
                               onKeyDown={handleKeyDown}
                               fullWidth
                               style={{height: 42, minWidth: 280}}
                               sx={{
                                   '& .MuiInputBase-input': {
                                       textAlign: 'center',
                                       fontSize: chartTitle?.length ? '1.2rem' : '0.8rem',
                                       fontWeight: chartTitle?.length ? 500 : 400,
                                       color: chartTitle?.length ? theme.palette.text.primary : theme.palette.text.secondary
                                   },
                                   '& .MuiOutlinedInput-notchedOutline': {border: 'none'}
                               }}
                               size='small'
                               placeholder='Add title'
                               color='info'/>
                </Stack>
            }
            {!!chartData.length && chartMode === 'bar' && (
                <Box sx={{height: chartData.length ? chartHeight : 175}}>
                    <ResponsiveBar
                        data={chartData}
                        curve='basis'
                        keys={keys}
                        colors={d => d.data[d.id + 'Color']}
                        indexBy='bin'
                        padding={0.1}
                        groupMode='grouped'
                        maxValue={maxY}
                        layers={[
                            'grid',
                            'axes',
                            'bars',
                            'markers',
                            'legends',
                            'annotations',
                            aggregateBarLineLayer
                        ]}
                        {...commonProps}
                    />
                </Box>
            )}

            {!!chartData.length && chartMode === 'line' && (
                <Box sx={{height: chartData.length ? chartHeight : 175}}>
                    <ResponsiveLine
                        data={lineData}
                        colors={d => d.color}
                        curve='basis'
                        enableSlices='x'
                        enableGridX={false}
                        xScale={{type: 'point'}}
                        yScale={{type: 'linear', min: 0, max: maxY}}
                        enablePoints={false}
                        lineWidth={strokeWidth}
                        layers={[
                            'grid',
                            'markers',
                            'axes',
                            'areas',
                            'crosshair',
                            aggregateLineLayer, // Replaces 'lines'
                            'points',
                            'slices',
                            'mesh',
                            'legends'
                        ]}
                        {...commonProps}
                    />
                </Box>
            )}

            <Stack direction='row' flexWrap='wrap' spacing={2} justifyContent='center' sx={{mb: 1, pr: 2, pl: 4}}>
                {legendItems.map((li, index) => (
                    <Box key={index} sx={{display: 'flex', alignItems: 'center', gap: 0.5}} style={{marginTop: 12}}>
                        <SeriesColorPicker seriesItem={{...li, index}}/>
                        <Typography style={{fontSize: '0.75rem'}}>{li.id}</Typography>
                    </Box>
                ))}
            </Stack>
            <Stack direction='row' flexWrap='wrap' spacing={2} justifyContent='center'
                   sx={{mt: 1, pr: 2, pl: 4, mb: 1, fontSize: '0.75rem'}}>
                &nbsp;
                {Object.keys(customSampleParams) && Object.keys(customSampleParams).length > 0 && !isScreenshot &&
                    <>
                        [&nbsp;<Link onClick={() => setCustomSampleParams({})}>Reset</Link>&nbsp;]
                    </>
                }
                &nbsp;
            </Stack>

        </Paper>
    )
}