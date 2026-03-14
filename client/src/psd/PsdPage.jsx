import React, {useCallback, useContext, useRef} from 'react'
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
import introCopyMarkdown from './resources/introCopyMarkdown.md?raw'
import ManualCornerPanel from './pagePanels/ManualCornerPanel.jsx'
import SampleSetsPanel from './pagePanels/SampleSetsPanel.jsx'
import Tracker from '../app/Tracker.jsx'

export default function PsdPage() {
    const theme = useTheme()

    // TODO - need to be able to reset all data in both contexts

    const {manualSelectionId, viewOnly} = useContext(DataContext)
    const {showTitleBar, isDesktop, resetUI} = useContext(UIContext)
    const domEl = useRef(null)

    const resetContexts = useCallback(() => {
        resetUI()
        //resetData()
    }, [resetUI])

    return (
        <Stack spacing={isDesktop ? 1 : 1} sx={{width: '100%'}}>
            <Paper sx={{p: isDesktop ? 2 : 1, width: '100%'}}>
                <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
                    <Typography style={{fontSize: '1.5rem', fontWeight: 700, lineHeight: '1.2em', marginTop: 8}}>
                        COFFEE GRINDS
                        {!isDesktop && <br/>}
                        <span style={{fontWeight: 300}}> PARTICLE SIZE DISTRIBUTION</span>
                    </Typography>
                    <VersionChecker/>
                </Stack>

                <IntroCopy introCopy={{markdown: introCopyMarkdown}}
                           style={{fontSize: '0.9rem', padding: '0px 0px 0px 0px'}}/>

            </Paper>

            <SampleSetsPanel/>

            {manualSelectionId && (
                <ManualCornerPanel/>
            )}

            <UploadQueuePanel resetContexts={resetContexts}/>

            {!viewOnly &&
                <SettingsPanel/>
            }

            <Stack direction='column' spacing={(isDesktop && !showTitleBar) ? 1 : 1}
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

            {!viewOnly &&
                <ImagePanel/>
            }

            <Tracker feature='MainPage'/>
            <Footer/>

        </Stack>
    )
}
