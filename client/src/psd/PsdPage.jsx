import React, {useContext, useRef} from 'react'
import {Stack, Paper, Typography, Alert, AlertTitle} from '@mui/material'
import UploadQueuePanel from './pagePanels/UploadQueuePanel.jsx'
import ImagePanel from './pagePanels/ImagePanel.jsx'
import ExportPanel from './pagePanels/ExportPanel.jsx'
import SettingsPanel from './pagePanels/SettingsPanel.jsx'
import HistogramPanel from './pagePanels/HistogramPanel.jsx'
import ManualCornerSelector from './components/ManualCornerSelector.jsx'
import StatsPanel from './pagePanels/StatsPanel.jsx'
import DataContext from '../context/DataContext.jsx'

export default function PsdPage() {
    const {
        binSpacing,
        manualSelectionId,
        manualSelectionUrl,
        processedActive,
        handleManualCorners,
        cancelManual
    } = useContext(DataContext)

    const domEl = useRef(null)

    return (
        <Stack spacing={1} sx={{width: '100%'}}>
            {manualSelectionId && (
                <Paper sx={{p: 2}}>
                    <ManualCornerSelector
                        imageUrl={manualSelectionUrl}
                        onCornersSelected={handleManualCorners}
                        onCancel={cancelManual}
                    />
                </Paper>
            )}
            <Paper sx={{p: 2, width: '100%'}}>
                <Typography style={{fontSize: '1.5rem', fontWeight: 700}}>
                    COFFEE GRINDS <span style={{fontWeight: 300}}> PARTICLE SIZE DISTRIBUTION</span>
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Upload up to 6 images.
                </Typography>
            </Paper>

            <UploadQueuePanel/>

            <SettingsPanel/>

            {processedActive?.warnings?.length > 0 && (
                <Stack spacing={1} sx={{mb: 2}}>
                    {processedActive.warnings.map((w, i) => (
                        <Alert key={i} severity='warning'>
                            <AlertTitle>Analysis Warning</AlertTitle>
                            {w}
                        </Alert>
                    ))}
                </Stack>
            )}

            <Stack direction='column' spacing={1} sx={{width: '100%'}} ref={domEl}>

                <HistogramPanel domEl={domEl}/>

                <StatsPanel/>

            </Stack>

            <ImagePanel/>

            <ExportPanel result={processedActive} binSpacing={binSpacing}/>

            <div style={{height: 100}}/>

        </Stack>
    )
}
