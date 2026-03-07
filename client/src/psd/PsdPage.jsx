import React, {useContext, useRef} from 'react'
import {Stack, Paper, Typography} from '@mui/material'
import UploadQueuePanel from './pagePanels/UploadQueuePanel.jsx'
import ImagePanel from './pagePanels/ImagePanel.jsx'
import SettingsPanel from './pagePanels/SettingsPanel.jsx'
import HistogramPanel from './pagePanels/HistogramPanel.jsx'
import StatsPanel from './pagePanels/StatsPanel.jsx'
import DataContext from '../context/DataContext.jsx'
import {useTheme} from '@mui/material/styles'
import UIContext from '../context/UIContext.jsx'
import VersionChecker from '../app/VersionChecker.jsx'
import Footer from './components/Footer.jsx'
import IntroCopy from '../misc/IntroCopy.jsx'
import ImportButton from './components/ImportButton.jsx'
import introCopyMarkdown from './components/introCopyMarkdown.md?raw'
import ManualCornerPanel from './pagePanels/ManualCornerPanel.jsx'

export default function PsdPage() {
    const theme = useTheme()

    const {
        manualSelectionId,
    } = useContext(DataContext)

    const {showTitleBar, isDesktop} = useContext(UIContext)

    const domEl = useRef(null)

    return (
        <Stack spacing={isDesktop ? 2 : 1} sx={{width: '100%'}}>
            <Paper sx={{p: isDesktop ? 2 : 1, width: '100%'}}>
                <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
                    <Typography style={{fontSize: '1.5rem', fontWeight: 700, lineHeight: '1.2em', marginTop: 8}}>
                        COFFEE GRINDS
                        {!isDesktop && <br/>}
                        <span style={{fontWeight: 300}}> PARTICLE SIZE DISTRIBUTION</span>
                    </Typography>
                    <VersionChecker/>
                </Stack>

                <IntroCopy introCopy={{markdown: introCopyMarkdown}} style={{fontSize: '0.9rem', padding: '0px 0px 0px 0px'}}/>

                <span style={{fontSize: '0.9rem'}}>Or, you can click here to <ImportButton linkOnly={true}/> directly.</span>

            </Paper>

            {manualSelectionId && (
                <ManualCornerPanel />
            )}

            <UploadQueuePanel/>

            <SettingsPanel/>

            <Stack direction='column' spacing={(isDesktop && !showTitleBar) ? 2 : 1}
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

            <Footer/>

        </Stack>
    )
}
