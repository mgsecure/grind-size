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

    const {scale} = result

    return (
        <Stack spacing={2}>
            {scale && (
                <Paper sx={{p: 2}}>
                    <Typography variant='h6'>Scale Info</Typography>
                    <Typography variant='body2'>
                        Detected Template: {scale.detectedTemplate ? `${scale.detectedTemplate}mm` : 'None'}
                    </Typography>
                    <Typography variant='body2'>
                        Pixel Scale: {scale.pxPerMm.toFixed(3)} px/mm
                    </Typography>
                </Paper>
            )}
            <HistogramPanel histogram={result.histogram}/>
            <StatsTable stats={result.stats} mmPerPx={scale?.mmPerPx}/>
        </Stack>
    )
}
