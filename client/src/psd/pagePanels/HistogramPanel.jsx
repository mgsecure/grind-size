import React, {useCallback, useContext, useMemo, useState} from 'react'
import {Paper, Stack, Typography, ToggleButtonGroup, ToggleButton, Box, Slider, lighten, alpha} from '@mui/material'
import {ResponsiveBar} from '@nivo/bar'
import {ResponsiveLine} from '@nivo/line'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import {useTheme} from '@mui/material/styles'
import ScaleLinearIcon from '../resources/ScaleLinearIcon.jsx'
import ScaleLogIcon from '../resources/ScaleLogIcon.jsx'
import {line, curveLinear, curveCardinal, curveCatmullRom} from 'd3-shape'
import DataContext from '../../context/DataContext.jsx'
import ScreenshotElementButton from '../components/ScreenshotElementButton.jsx'
import UIContext from '../../context/UIContext.jsx'
import ItemInformationButton from '../components/ItemInformationButton.jsx'
import CurveLinearIcon from '../resources/CurveLinearIcon.jsx'
import CurveCardinalIcon from '../resources/CurveCardinalIcon.jsx'

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

    const {aggregateColor, swapColors, chartColors, isDesktop} = useContext(UIContext)

    const [settingsItem, setSettingsItem] = useState([])
    const [settingsOpen, setSettingsOpen] = useState(false)

    const openSettings = useCallback((e, id) => {
        e.preventDefault()
        e.stopPropagation()
        setSettingsItem(allItems.find(item => item.sampleName === id))
        setSettingsOpen(true)
        document.activeElement.blur()
    }, [allItems])
    const closeSettings = useCallback(() => {
        document.activeElement.blur()
        setSettingsOpen(false)
    }, [])


    //TODO: Skip every other tick on mobile

    const [chartMode, setChartMode] = useState('line')
    const [chartCurve, setChartCurve] = useState('cardinal')
    const maxY = binSpacing === 'log' ? globalMaxY.logMax : globalMaxY.linearMax

    // show aggregate in normal chart if only series remaining
    const showAggregate = activeIdList.includes(aggregateQueueItem?.id) && activeIdList.length === 1

    const sampleNames = allItems.reduce((acc, item) => {
        acc[item.id] = item.sampleName
        return acc
    },{})

    const legendItems = allItems
        .filter(item => activeIdList.includes(item.id))
        .map((item, idx) => ({id: item.sampleName, color: chartColors[idx]}))

    const theme = useTheme()
    const tickLegendColor = theme.palette.text.primary

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

        if (!itemsWithHist.length) {
            return {chartData: [], lineData: [], xLabel: xLab, yLabel: yLab, keys: []}
        }

        const seriesKeys = itemsWithHist.map(item => item.id)

        // Use the first item's bins as the master set of bins for the X-axis
        const firstHist = binSpacing === 'log' ? itemsWithHist[0].histograms.log : itemsWithHist[0].histograms.linear

        const cData = firstHist.bins.map((b, i) => {
            const entry = {
                bin: fmtNumber(b.center, xAxis === 'diameter' ? 1 : 0),
                lowerBound: b.start,
                upperBound: b.end,
            }
            itemsWithHist.forEach(item => {
                const h = binSpacing === 'log' ? item.histograms.log : item.histograms.linear
                // We assume all items have the same bins if they were analyzed with the same settings
                entry[item.id] = h.values[i]?.percent ?? 0
                entry.sampleName = item.sampleName
            })

            if (aggregateQueueItem && activeIdList.includes(aggregateQueueItem?.id)) {
                const h = binSpacing === 'log' ? aggregateQueueItem.result.histograms.log : aggregateQueueItem.result.histograms.linear
                entry.Aggregate = (aggregateQueueItem && activeIdList.includes(aggregateQueueItem?.id)) ? h.values[i]?.percent ?? 0 : undefined
            }
            return entry
        })

        const lData = itemsWithHist.map(item => {
            const h = binSpacing === 'log' ? item.histograms.log : item.histograms.linear
            return {
                id: item.id,
                data: h.bins.map((b, i) => ({
                    x: fmtNumber(b.center, xAxis === 'diameter' ? 1 : 0),
                    y: h.values[i]?.percent ?? 0,
                    lowerBound: b.start,
                    upperBound: b.end,
                    seriesName: item.sampleName,
                }))
            }
        })

        // Add Aggregate line data
        !showAggregate && activeIdList.includes(aggregateQueueItem?.id) && lData.push({
            id: 'Aggregate',
            data: cData.map(d => ({
                x: d.bin,
                y: d.Aggregate,
                lowerBound: d.lowerBound,
                upperBound: d.upperBound
            }))
        })

        return {chartData: cData, lineData: lData, xLabel: xLab, yLabel: yLab, keys: seriesKeys}
    }, [xAxis, yAxis, activeItems, binSpacing, showAggregate, aggregateQueueItem, activeIdList])

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
        return (activeIdList.includes(aggregateQueueItem?.id) && !showAggregate
                ? <path
                    d={lineGenerator(uniqueBins)}
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
                    .map(({id, data, color}) => (
                        <path
                            key={id}
                            d={lineGenerator(data)}
                            fill='none'
                            stroke={color}
                            strokeWidth={id === 'Aggregate' ? 3 : 2}
                        />
                    ))}
            </g>
        )
    }

    const chartHeight = isDesktop ? 450 : 250

    const commonProps = {
        margin: {top: 20, right: 10, bottom: 60, left: 40},
        colors: chartColors,
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
                {slice.points.map(point => (
                    <Box key={point.id} sx={{
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


    return (
        <Paper sx={{p: isDesktop ? 2 : 1, width: '100%'}}>
            <Stack direction='row' alignItems='flex-end' justifyContent='space-between'
                   sx={{fontSize: '1.1rem', fontWeight: 500}}
                   style={!chartData.length ? disabledStyle : undefined}>
                HISTOGRAM
                <ScreenshotElementButton domEl={domEl} filename={`psd-results_${activeFilename}`}/>
            </Stack>

            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' justifyContent='space-between'
                   style={!chartData.length ? disabledStyle : undefined}>
                <ToggleButtonGroup
                    size='small'
                    value={yAxis}
                    exclusive
                    onChange={(_, v) => {if (v) {setYAxis(v)}}}
                    style={{margin: '10px 10px 10px 0'}}
                >
                    <ToggleButton value='mass'>Mass</ToggleButton>
                    <ToggleButton value='surface'>Surface Area</ToggleButton>
                    <ToggleButton value='count'>Count</ToggleButton>
                </ToggleButtonGroup>

                <ToggleButtonGroup
                    size='small'
                    value={binSpacing}
                    exclusive
                    onChange={(_, v) => v && setBinSpacing(v)}
                    style={{margin: '10px 10px 10px 10px'}}
                >
                    <ToggleButton value='log' style={{padding: 9}}>
                        <ScaleLogIcon width={18} height={18} style={{margin: '0px 1px'}}/>
                    </ToggleButton>
                    <ToggleButton value='linear' style={{padding: 9}}>
                        <ScaleLinearIcon width={18} height={18} style={{margin: '0px 1px'}}/>
                    </ToggleButton>
                </ToggleButtonGroup>

                <Stack direction='row' alignContent='center' justifyContent='flex-end' sx={{mb: 0, flexGrow: 1}}>
                    <Stack sx={{mr: isDesktop ? 2 : 1, mt: 0}}>
                        <Typography variant='body2'>
                            Bin Count: {settings.bins}
                        </Typography>
                        <Slider
                            value={settings.bins}
                            min={10}
                            max={40}
                            step={1}
                            onChange={(_, v) => setSettings(prev => ({...prev, bins: v}))}
                            style={{width: 120}}
                            size='medium'
                        />
                    </Stack>
                </Stack>

                <Stack direction='row' alignItems='center' justifyContent={isDesktop ? 'flex-end' : 'flex-start'}
                       sx={{flexGrow: 1}}>

                    <ToggleButtonGroup
                        size='small'
                        value={chartMode}
                        exclusive
                        onChange={(_, v) => v && setChartMode(v)}
                        style={{margin: '10px 10px 10px 10px'}}
                    >
                        <ToggleButton value='bar' style={{}}><BarChartIcon/></ToggleButton>
                        <ToggleButton value='line' style={{}}><ShowChartIcon/></ToggleButton>
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        size='small'
                        value={chartCurve}
                        exclusive
                        onChange={(_, v) => v && setChartCurve(v)}
                        style={{margin: '10px 0px 10px 10px'}}
                    >
                        <ToggleButton value='linear' style={{}}>
                            <CurveLinearIcon width={16} height={16} style={{margin: '4px 5px'}}/>
                        </ToggleButton>
                        <ToggleButton value='curve' >
                            <CurveCardinalIcon width={16} height={16} style={{margin: '4px 5px'}}/>
                        </ToggleButton>
                    </ToggleButtonGroup>

                </Stack>
            </Stack>

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

            {!!chartData.length && chartMode === 'bar' && (
                <Box sx={{height: chartData.length ? chartHeight : 175}}>
                    <ResponsiveBar
                        data={chartData}
                        curve='basis'
                        keys={keys}
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
                        curve='basis'
                        enableSlices='x'
                        enableGridX={false}
                        xScale={{type: 'point'}}
                        yScale={{type: 'linear', min: 0, max: maxY}}
                        enablePoints={false}
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

            <ItemInformationButton item={settingsItem} noButton={true} openOverride={settingsOpen}
                                   onClose={closeSettings}/>

            <Stack direction='row' flexWrap='wrap' spacing={2} justifyContent='center' sx={{mb: 1, pr: 2, pl: 4}}>
                {legendItems.map(li => (
                    <Box key={li.id} sx={{display: 'flex', alignItems: 'center', gap: 0.5}} style={{marginTop: 12}}>
                        <Box sx={{width: 14, height: 14, backgroundColor: li.color}}
                             onClick={(e) => openSettings(e, li.id)}/>
                        <Typography style={{fontSize: '0.75rem'}}>{li.id}</Typography>
                    </Box>
                ))}
            </Stack>

        </Paper>
    )
}
