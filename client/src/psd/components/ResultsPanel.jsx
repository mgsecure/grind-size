import React from 'react'
import {Stack, Paper, Typography} from '@mui/material'
import HistogramPanel from './HistogramPanel.jsx'
import StatsTable from './StatsTable.jsx'

export default function ResultsPanel({result}) {
    if (!result) {
        return (
            <Paper sx={{p: 2}}>
                <Typography variant='body2' color='text.secondary'>
                    No analysis result selected
                </Typography>
            </Paper>
        )
    }

    return (
        <Stack spacing={2}>
            <HistogramPanel histogram={result.histogram}/>
            <StatsTable stats={result.stats}/>
        </Stack>
    )
}
