import React from 'react'
import {Paper, Table, TableBody, TableCell, TableRow, Typography} from '@mui/material'

export default function StatsTable({result}) {
    if (!result?.stats) return null

    const {stats={}, scale={}} = result
    const metric = stats.metric || 'diameter'
    const unit = metric === 'diameter' ? 'μm' : (metric === 'surface' ? 'μm²' : 'μm³')

    const rows = [
        ['File', result.filename, ''],
        ['Template', scale?.detectedTemplate ? `${scale?.detectedTemplate}mm` : 'None', ''],
        ['Pixel Scale', `${scale?.pxPerMm?.toFixed(2)} px/mm`, ''],
        ['Particle Count', stats.count.toFixed(0), ''],
        ['D10', stats?.D10?.toFixed(0), unit],
        ['D50 (Median)', stats?.D50?.toFixed(0), unit],
        ['D90', stats?.D90?.toFixed(0), unit],
        ['Efficiency', stats?.efficiency?.toFixed(2), ''],
        ['Span', stats?.span?.toFixed(2), ''],
        ['Mode', stats?.mode?.toFixed(0), unit],
        ['Mean', stats?.mean?.toFixed(0), unit],
        ['Std Dev', stats?.stdDev?.toFixed(0), unit],
        ['Min', stats?.min?.toFixed(0), unit],
        ['Max', stats?.max?.toFixed(0), unit],
        ['Avg Short Axis', stats.avgShortAxis, 'μm'],
        ['Avg Long Axis', stats.avgLongAxis, 'μm'],
        ['Avg Roundness', stats.avgRoundness, '']
    ]

    return (
        <Paper sx={{p: 2}}>
            <Typography variant='h6' sx={{mb: 1}}>Statistics</Typography>
            <Table size='small'>
                <TableBody>
                    {rows.map(([k, v, u]) => (
                        <TableRow key={k}>
                            <TableCell sx={{width: 200}}>{k}</TableCell>
                            <TableCell>{v == null ? '—' : (typeof v === 'number' ? v.toFixed(metric === 'diameter' || u === 'μm' ? 1 : 3) : v)} {u}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    )
}
