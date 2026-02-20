import React, {useContext} from 'react'
import {Stack, Paper, Typography, Button} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import {convertHistogramToCsv, convertParticlesToCsv, convertStatsToCsv, downloadCsv} from '../analysis/exportCsv.js'
import DataContext from '../../context/DataContext.jsx'

export default function ExportPanel({result, binSpacing}) {
    const {isDesktop} = useContext(DataContext)

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

    const disabledStyle = !result ? {opacity: 0.5, pointerEvents: 'none'} : undefined

    return (
            <Paper sx={{p: 2}}>
                <Typography style={{...disabledStyle, fontSize: '1.1rem', fontWeight: 500}}>EXPORT</Typography>
                <Stack direction='row' spacing={1} sx={{mt: 2}} style={disabledStyle}>
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
    )
}
