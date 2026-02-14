import React from 'react'
import {Paper, Table, TableBody, TableCell, TableRow, Typography} from '@mui/material'

export default function StatsTable({stats, mmPerPx}) {
    if (!stats) return null

    const factor = mmPerPx || 1
    const unit = mmPerPx ? 'mm' : 'px'

    const rows = [
        ['Particle Count', stats.count.toFixed(0), ''],
        ['D10', stats.D10 * factor, unit],
        ['D50 (Median)', stats.D50 * factor, unit],
        ['D90', stats.D90 * factor, unit],
        ['Mode', stats.mode * factor, unit],
        ['Mean', stats.mean * factor, unit],
        ['Std Dev', stats.stdDev * factor, unit],
        ['Min', stats.min * factor, unit],
        ['Max', stats.max * factor, unit]
    ]

    return (
        <Paper sx={{p: 2}}>
            <Typography variant='h6' sx={{mb: 1}}>Statistics ({unit})</Typography>
            <Table size='small'>
                <TableBody>
                    {rows.map(([k, v, u]) => (
                        <TableRow key={k}>
                            <TableCell sx={{width: 200}}>{k}</TableCell>
                            <TableCell>{v == null ? '—' : (Number.isFinite(v) ? v.toFixed(3) : v)} {u}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    )
}
