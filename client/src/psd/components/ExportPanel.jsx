import React from 'react'
import {Stack, Paper, Typography, Button} from '@mui/material'
import StatsTable from './StatsTable.jsx'
import DownloadIcon from '@mui/icons-material/Download'
import {convertHistogramToCsv, convertParticlesToCsv, convertStatsToCsv, downloadCsv} from '../analysis/exportCsv.js'

export default function ExportPanel({result, binSpacing}) {
    if (!result) {
        return (
            <Paper sx={{p: 2}}>
                <Typography variant='body2' color='text.secondary'>
                    No analysis result selected
                </Typography>
            </Paper>
        )
    }

    const handleExportParticles = () => {
        const csv = convertParticlesToCsv(result.particles, result.scale.pxPerMm)
        downloadCsv(`${result.filename}_particles.csv`, csv)
    }

    const handleExportStats = () => {
        const csv = convertStatsToCsv(result.stats)
        downloadCsv(`${result.filename}_stats.csv`, csv)
    }

    const handleExportHistogram = () => {
        const histogram = binSpacing === 'log' ? result.histograms?.log : result.histograms?.linear
        if (histogram) {
            const csv = convertHistogramToCsv(histogram)
            downloadCsv(`${result.filename}_histogram.csv`, csv)
        }
    }

    return (
        <Stack spacing={2}>
            <Paper sx={{p: 2}}>
                <Typography variant='h6' sx={{mb: 1}}>Exports</Typography>
                <Stack direction='row' spacing={1}>
                    <Button
                        variant='outlined'
                        size='small'
                        startIcon={<DownloadIcon/>}
                        onClick={handleExportParticles}
                    >
                        Particles
                    </Button>
                    <Button
                        variant='outlined'
                        size='small'
                        startIcon={<DownloadIcon/>}
                        onClick={handleExportStats}
                    >
                        Stats
                    </Button>
                    <Button
                        variant='outlined'
                        size='small'
                        startIcon={<DownloadIcon/>}
                        onClick={handleExportHistogram}
                    >
                        Histogram
                    </Button>
                </Stack>
            </Paper>
        </Stack>
    )
}
