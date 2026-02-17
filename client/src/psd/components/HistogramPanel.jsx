import React, {useContext, useMemo, useState} from 'react'
import {Paper, Stack, Typography, ToggleButtonGroup, ToggleButton, Box, Slider, lighten, alpha} from '@mui/material'
import {ResponsiveBar} from '@nivo/bar'
import {ResponsiveLine} from '@nivo/line'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import {useTheme} from '@mui/material/styles'
import ScaleLinearIcon from '../resources/ScaleLinearIcon.jsx'
import ScaleLogIcon from '../resources/ScaleLogIcon.jsx'
import {line} from 'd3-shape'
import {getFileNameWithoutExtension} from '../../util/stringUtils.js'
import DataContext from '../../context/DataContext.jsx'

function fmtNumber(n, digits = 2) {
    if (!Number.isFinite(n)) return '—'
    return n.toFixed(digits)}

export default function HistogramPanel() {
    const {
        allColors, swappedColors, aggregateColor, reverseColors, swapColors,
        activeItems,
        xAxis,
        yAxis, setYAxis,
        settings, setSettings,
        binSpacing, setBinSpacing,
        globalMaxY
    } = useContext(DataContext)


    //TODO: add aggregate to bar chart legeng if displayed

    const maxY = binSpacing === 'log' ? globalMaxY.logMax : globalMaxY.linearMax

    const [chartMode, setChartMode] = useState('bar')
    const aggregateItem = activeItems.find(item => item.filename === 'Aggregate')
    const nonAggregateItems = activeItems.filter(item => item.filename !== 'Aggregate')

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

        if (!activeItems?.length) {
            return {chartData: [], lineData: [], xLabel: xLab, yLabel: yLab, keys: []}
        }

        const itemsWithHist = activeItems && activeItems
            .filter(item => item.filename !== 'Aggregate')
            .filter(item => {
                const hist = binSpacing === 'log' ? item.histograms?.log : item.histograms?.linear
                return hist?.bins?.length && hist?.values?.length
            })

        if (!itemsWithHist.length) {
            return {chartData: [], lineData: [], xLabel: xLab, yLabel: yLab, keys: []}
        }

        const seriesKeys = itemsWithHist.map(item => getFileNameWithoutExtension(item.filename))

        // Use the first item's bins as the master set of bins for the X-axis
        const firstHist = binSpacing === 'log' ? itemsWithHist[0].histograms.log : itemsWithHist[0].histograms.linear

        const cData = firstHist.bins.map((b, i) => {
            const entry = {
                bin: fmtNumber(b.center, xAxis === 'diameter' ? 1 : 0),
                lowerBound: b.start,
                upperBound: b.end
            }
            itemsWithHist.forEach(item => {
                const h = binSpacing === 'log' ? item.histograms.log : item.histograms.linear
                // We assume all items have the same bins if they were analyzed with the same settings
                entry[getFileNameWithoutExtension(item.filename)] = h.values[i]?.percent ?? 0
            })

            if (aggregateItem) {
                const h = binSpacing === 'log' ? aggregateItem.histograms.log : aggregateItem.histograms.linear
                entry.Aggregate = aggregateItem ? h.values[i]?.percent ?? 0 : undefined
            }
            return entry
        })

        const lData = itemsWithHist.map(item => {
            const h = binSpacing === 'log' ? item.histograms.log : item.histograms.linear
            return {
                id: getFileNameWithoutExtension(item.filename),
                data: h.bins.map((b, i) => ({
                    x: fmtNumber(b.center, xAxis === 'diameter' ? 1 : 0),
                    y: h.values[i]?.percent ?? 0,
                    lowerBound: b.start,
                    upperBound: b.end
                }))
            }
        })

        // Add Aggregate line data
        aggregateItem && lData.push({
            id: 'Aggregate',
            data: cData.map(d => ({
                x: d.bin,
                y: d.Aggregate,
                lowerBound: d.lowerBound,
                upperBound: d.upperBound
            }))
        })

        return {chartData: cData, lineData: lData, xLabel: xLab, yLabel: yLab, keys: seriesKeys}
    }, [xAxis, yAxis, activeItems, binSpacing, aggregateItem])

    const aggregateBarLineLayer = ({bars, xScale, yScale}) => {
        const lineGenerator = line()
            .x(d => xScale(d.data.data.bin) + d.width / 2) // Center point on the bar
            .y(d => yScale(d.data.data.Aggregate))       // 'Aggregate' is calculated in chartData
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
        return (aggregateItem
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

    const baseColors = reverseColors
        ? swappedColors.slice(0, nonAggregateItems.length)
        : allColors.slice(0, nonAggregateItems.length)

    const chartColors = [...baseColors, aggregateColor]

    const commonProps = {
        margin: {top: 20, right: 20, bottom: 95, left: 50},
        colors: chartColors,
        enableLabel: false,
        theme: {
            axis: {
                ticks: {
                    text: {
                        fill: tickLegendColor
                    }
                },
                legend: {
                    text: {
                        fill: tickLegendColor
                    }
                }
            },
            legends: {
                text: {
                    fill: tickLegendColor
                }
            },
            grid: {
                line: {
                    stroke: theme.palette.divider,
                    strokeWidth: 1
                }
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
            legendOffset: -40
        },
        legends: [
            {
                dataFrom: 'keys',
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: 90,
                itemsSpacing: 30,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
                onClick: swapColors,
                effects: [{on: 'hover', style: {itemOpacity: 1}}]
            }
        ],
        valueScale: {
            type: 'linear',
            min: 0,
            max: maxY,
            clamp: true
        },
        tooltip: ({id, value, color, data}) => (
            <Paper sx={{p: 1, border: `1px solid ${color}`}}>
                <Typography variant='body2' sx={{fontWeight: 'bold'}} style={{color}}>
                    {id}
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
                        <Typography variant='body2'>
                            <strong>{point.seriesId}:</strong> {fmtNumber(point.data.y, 2)}%
                        </Typography>
                    </Box>
                ))}
            </Paper>
        )
    }

    const disabledStyle = {opacity: 0.5, pointerEvents: 'none'}

    return (
        <Paper sx={{p: 2}}>
            <Typography sx={{fontSize: '1.1rem', fontWeight: 500}}
                        style={!chartData.length ? disabledStyle : undefined}>
                HISTOGRAM
            </Typography>
            <Stack direction='row' alignItems='center' justifyContent='space-between'
                   sx={{mb: 0}} style={!chartData.length ? disabledStyle : undefined}>
                <ToggleButtonGroup
                    size='small'
                    value={yAxis}
                    exclusive
                    onChange={(_, v) => {
                        if (v) {
                            setYAxis(v)
                        }
                    }}
                >
                    <ToggleButton value='mass'>Mass</ToggleButton>
                    <ToggleButton value='surface'>Surface Area</ToggleButton>
                    <ToggleButton value='count'>Count</ToggleButton>
                </ToggleButtonGroup>

                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{mb: 1}}>

                    <Stack sx={{mr: 2, mt: 1}}>
                        <Typography variant='body2'>
                            Bin Count: {settings.bins}
                        </Typography>
                        <Slider
                            value={settings.bins}
                            min={10}
                            max={50}
                            step={1}
                            onChange={(_, v) => setSettings(prev => ({...prev, bins: v}))}
                            style={{marginTop: 0, width: 120}}
                        />
                    </Stack>

                    <ToggleButtonGroup
                        size='small'
                        value={chartMode}
                        exclusive
                        onChange={(_, v) => v && setChartMode(v)}
                        style={{marginRight: 20}}
                    >
                        <ToggleButton value='bar'><BarChartIcon/></ToggleButton>
                        <ToggleButton value='line'><ShowChartIcon/></ToggleButton>
                    </ToggleButtonGroup>
                    <ToggleButtonGroup
                        size='small'
                        value={binSpacing}
                        exclusive
                        onChange={(_, v) => v && setBinSpacing(v)}
                    >
                        <ToggleButton value='log' style={{padding: 8}}><ScaleLogIcon width={20}
                                                                                     height={20}/></ToggleButton>
                        <ToggleButton value='linear' style={{padding: 8}}><ScaleLinearIcon width={20}
                                                                                           height={20}/></ToggleButton>
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
                <Box sx={{height: chartData.length ? 450 : 175}}>
                    <ResponsiveBar
                        data={chartData}
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
                <Box sx={{height: chartData.length ? 450 : 175}}>
                    <ResponsiveLine
                        data={lineData}
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
        </Paper>
    )
}
