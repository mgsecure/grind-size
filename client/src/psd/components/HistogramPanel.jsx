import React, {useMemo, useState} from 'react'
import {Paper, Stack, Typography, ToggleButtonGroup, ToggleButton, Box} from '@mui/material'
import {ResponsiveBar} from '@nivo/bar'
import {ResponsiveLine} from '@nivo/line'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import {useTheme} from '@mui/material/styles'

function fmtNumber(n, digits = 2) {
    if (!Number.isFinite(n)) return '—'
    return n.toFixed(digits)
}

export default function HistogramPanel({
                                           histogram,
                                           xAxisLabel = 'Diameter (px)',
                                           yAxisLabel = '%',
                                           seriesId = 'Distribution'
                                       }) {

    console.log('histogram', histogram)

    const theme = useTheme()
    const tickLegendColor = theme.palette.text.primary

    const [chartMode, setChartMode] = useState('bar')

    const chartData = useMemo(() => {
        if (!histogram?.bins?.length || !histogram?.values?.length) return []
        return histogram.bins.map((b, i) => ({
            bin: fmtNumber(b.center, 3),
            lowerBound: b.start,
            upperBound: b.end,
            [seriesId]: histogram.values[i]?.percent ?? 0
        }))
    }, [histogram, seriesId])

    const keys = useMemo(() => [seriesId], [seriesId])

    const lineData = useMemo(() => {
        if (!histogram?.bins?.length || !histogram?.values?.length) return []
        return [
            {
                id: seriesId,
                data: histogram.bins.map((b, i) => ({
                    x: fmtNumber(b.center, 3),
                    y: histogram.values[i]?.percent ?? 0,
                    lowerBound: b.start,
                    upperBound: b.end
                }))
            }
        ]
    }, [histogram, seriesId])

    const commonProps = {
        margin: {top: 20, right: 20, bottom: 150, left: 60},
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
                    strokeWidth: 1,
                },
            },
        },
        axisBottom: {
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: xAxisLabel,
            legendPosition: 'middle',
            legendOffset: 55
        },
        axisLeft: {
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: yAxisLabel,
            legendPosition: 'middle',
            legendOffset: -50
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
                effects: [{ on: 'hover', style: { itemOpacity: 1 } }]
            }
        ],
        tooltip: ({id, value, color, data}) => (
            <Paper sx={{p: 1, border: `1px solid ${color}`}}>
                <Typography variant='body2' sx={{fontWeight: 'bold'}} style={{color}}>
                    {id}
                </Typography>
                <Typography variant='body2' style={{whiteSpace: 'nowrap'}}>
                    Range: {fmtNumber(data.lowerBound, 3)} – {fmtNumber(data.upperBound, 3)}
                </Typography>
                <Typography variant='body2'>
                    Value: <strong>{fmtNumber(value, 2)}%</strong>
                </Typography>
            </Paper>
        ),
        sliceTooltip: ({slice}) => (
            <Paper sx={{p: 1, border: '1px solid #ccc'}}>
                <Typography variant='body2' sx={{fontWeight: 'bold', mb: 1}} style={{whiteSpace: 'nowrap'}}>
                    Range: {fmtNumber(slice.points[0].data.lowerBound, 3)} – {fmtNumber(slice.points[0].data.upperBound, 3)}
                </Typography>
                {slice.points.map(point => (
                    <Box key={point.id} sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 0.5}}>
                        <Box sx={{width: 12, height: 12, backgroundColor: point.seriesColor}} />
                        <Typography variant='body2'>
                            <strong>{point.seriesId}:</strong> {fmtNumber(point.data.y, 2)}%
                        </Typography>
                    </Box>
                ))}
            </Paper>
        )
    }

    return (
        <Paper sx={{p: 2, height: 500}}>
            <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{mb: 1}}>
                <Typography variant='h6'>Histogram</Typography>
                <ToggleButtonGroup
                    size='small'
                    value={chartMode}
                    exclusive
                    onChange={(_, v) => v && setChartMode(v)}
                >
                    <ToggleButton value='bar'><BarChartIcon/></ToggleButton>
                    <ToggleButton value='line'><ShowChartIcon/></ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            {!chartData.length && (
                <Typography variant='body2' color='text.secondary'>
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
                    {...commonProps}
                />
            )}

            {!!chartData.length && chartMode === 'line' && (
                <ResponsiveLine
                    data={lineData}
                    enableSlices='x'
                    xScale={{type: 'point'}}
                    enablePoints={false}
                    {...commonProps}
                />
            )}
        </Paper>
    )
}
