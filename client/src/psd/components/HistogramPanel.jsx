import React, {useMemo, useState} from 'react'
import {Paper, Stack, Typography, ToggleButtonGroup, ToggleButton, Box, Slider} from '@mui/material'
import {ResponsiveBar} from '@nivo/bar'
import {ResponsiveLine} from '@nivo/line'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import {useTheme} from '@mui/material/styles'
import ScaleLinearIcon from '../resources/ScaleLinearIcon.jsx'
import ScaleLogIcon from '../resources/ScaleLogIcon.jsx'

function fmtNumber(n, digits = 2) {
    if (!Number.isFinite(n)) return '—'
    return n.toFixed(digits)
}

export default function HistogramPanel({
                                           histograms,
                                           xAxis,
                                           setXAxis,
                                           yAxis,
                                           setYAxis,
                                           settings,
                                           setSettings,
                                           binSpacing,
                                           setBinSpacing,
                                           seriesId = 'Distribution',
                                           maxY
                                       }) {

    const [chartMode, setChartMode] = useState('bar')
    const histogram = binSpacing === 'log' ? histograms?.log : histograms?.linear

    const theme = useTheme()
    const tickLegendColor = theme.palette.text.primary

    function formatXTick(value) {
        if (xAxis === 'diameter') return Math.floor(value / 10 + 0.5) * 10
        if (xAxis === 'surface') return value
        return fmtNumber(value)
    }

    const {chartData, lineData, xLabel, yLabel} = useMemo(() => {
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

        if (!histogram?.bins?.length || !histogram?.values?.length) {
            return {chartData: [], lineData: [], xLabel: xLab, yLabel: yLab}
        }

        // We assume the histogram already contains the correct metric if provided from analyzeImage
        // but for safety, we'll check if it matches the current xAxis toggle.
        // If it doesn't match, we might need to re-calculate, but usually analyzeImage handles it.

        const cData = histogram.bins.map((b, i) => ({
            bin: fmtNumber(b.center, xAxis === 'diameter' ? 1 : 0),
            lowerBound: b.start,
            upperBound: b.end,
            [seriesId]: histogram.values[i]?.percent ?? 0
        }))

        const lData = [
            {
                id: seriesId,
                data: histogram.bins.map((b, i) => ({
                    x: fmtNumber(b.center, xAxis === 'diameter' ? 1 : 0),
                    y: histogram.values[i]?.percent ?? 0,
                    lowerBound: b.start,
                    upperBound: b.end
                }))
            }
        ]

        return {chartData: cData, lineData: lData, xLabel: xLab, yLabel: yLab}
    }, [histogram, seriesId, xAxis, yAxis])

    const keys = useMemo(() => [seriesId], [seriesId])

    const commonProps = {
        margin: {top: 20, right: 20, bottom: 160, left: 50},
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
                    stroke: '#999', // Desired color
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
            legendOffset: 50
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
                itemsSpacing: 20,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
                //onClick: swapColors,
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
            </Paper>
        ),
        sliceTooltip: ({slice}) => (
            <Paper sx={{p: 1, border: '1px solid #ccc'}}>
                <Typography variant='body2' sx={{fontWeight: 'bold', mb: 1}} style={{whiteSpace: 'nowrap'}}>
                    Range: {fmtNumber(slice.points[0].data.lowerBound, 1)} – {fmtNumber(slice.points[0].data.upperBound, 1)}
                </Typography>
                {slice.points.map(point => (
                    <Box key={point.id} sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 0.5}}>
                        <Box sx={{width: 12, height: 12, backgroundColor: point.seriesColor}}/>
                        <Typography variant='body2'>
                            <strong>{point.seriesId}:</strong> {fmtNumber(point.data.y, 2)}%
                        </Typography>
                    </Box>
                ))}
            </Paper>
        )
    }

    return (
        <Paper sx={{p: 2, height: histogram ? 500 : 150}}>
            <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{mb: 1}}>
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

                    <Stack sx={{mr:2, mt:1}}>
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
                        <ToggleButton value='log' style={{padding: 8}}><ScaleLogIcon width={20} height={20}/></ToggleButton>
                        <ToggleButton value='linear' style={{padding: 8}}><ScaleLinearIcon width={20} height={20}/></ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
            </Stack>

            {!chartData.length && (
                <Typography variant='body2' color='text.secondary' style={{marginTop: 30}}>
                    No histogram data yet
                </Typography>
            )}

            {!!chartData.length && chartMode === 'bar' && (
                <ResponsiveBar
                    data={chartData}
                    keys={keys}
                    indexBy='bin'
                    padding={0.1}
                    groupMode='grouped'
                    maxValue={maxY}
                    {...commonProps}
                />
            )}

            {!!chartData.length && chartMode === 'line' && (
                <ResponsiveLine
                    data={lineData}
                    enableSlices='x'
                    xScale={{type: 'point'}}
                    yScale={{type: 'linear', min: 0, max: maxY}}
                    enablePoints={false}
                    {...commonProps}
                />
            )}
        </Paper>
    )
}
