import React, {useContext, useRef} from 'react'
import {Stack, Paper, Typography, Alert, AlertTitle} from '@mui/material'
import UploadQueuePanel from './pagePanels/UploadQueuePanel.jsx'
import ImagePanel from './pagePanels/ImagePanel.jsx'
import SettingsPanel from './pagePanels/SettingsPanel.jsx'
import HistogramPanel from './pagePanels/HistogramPanel.jsx'
import ManualCornerSelector from './components/ManualCornerSelector.jsx'
import StatsPanel from './pagePanels/StatsPanel.jsx'
import DataContext from '../context/DataContext.jsx'
import {useTheme} from '@mui/material/styles'
import UIContext from '../context/UIContext.jsx'
import VersionChecker from '../app/VersionChecker.jsx'
import DebugToggles from './components/DebugToggles.jsx'
import Footer from './components/Footer.jsx'

export default function PsdPage() {
    const theme = useTheme()

    const {
        manualSelectionId,
        manualSelectionUrl,
        processedActive,
        handleManualCorners,
        cancelManual,
        isDesktop
    } = useContext(DataContext)

    const {showTitleBar} = useContext(UIContext)

    const domEl = useRef(null)

    return (
        <Stack spacing={isDesktop ? 2 : 1} sx={{width: '100%'}}>
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
                <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
                    <Typography style={{fontSize: '1.5rem', fontWeight: 700, lineHeight: '1.2em'}}>
                        COFFEE GRINDS
                        {!isDesktop && <br/>}
                        <span style={{fontWeight: 300}}> PARTICLE SIZE DISTRIBUTION</span>
                    </Typography>
                    <VersionChecker/>

                </Stack>
                <Typography variant='body2' color='text.secondary' style={{marginTop: 4}}>
                    Intro copy and help links will go here.
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

            <Stack direction='column' spacing={isDesktop ? 2 : 1}
                   sx={{width: '100%', backgroundColor: theme.palette.background.default}} ref={domEl}>

                {showTitleBar && (
                    <Paper sx={{p: 2, width: '100%'}}>
                        <Typography style={{fontSize: '1.5rem', fontWeight: 700}}>
                            COFFEE GRINDS <span style={{fontWeight: 300}}> PARTICLE SIZE DISTRIBUTION</span>
                        </Typography>
                    </Paper>
                )}

                <HistogramPanel domEl={domEl}/>

                <StatsPanel/>

            </Stack>

            <ImagePanel/>

            <Footer />

        </Stack>
    )
}
