import React from 'react'
import {Paper, Table, TableBody, TableCell, TableRow, Typography} from '@mui/material'

export default function StatsTable({stats}) {
    if (!stats) return null

    const rows = [
        ['Count', stats.count],
        ['D10', stats.D10],
        ['D50 (Median)', stats.D50],
        ['D90', stats.D90],
        ['Mode', stats.mode],
        ['Mean', stats.mean],
        ['Std Dev', stats.stdDev],
        ['Min', stats.min],
        ['Max', stats.max]
    ]

    return (
        <Paper sx={{p: 2}}>
            <Typography variant='h6' sx={{mb: 1}}>Statistics (px units in baseline)</Typography>
            <Table size='small'>
                <TableBody>
                    {rows.map(([k, v]) => (
                        <TableRow key={k}>
                            <TableCell sx={{width: 200}}>{k}</TableCell>
                            <TableCell>{v == null ? '—' : Number.isFinite(v) ? v.toFixed(3) : v}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    )
}
