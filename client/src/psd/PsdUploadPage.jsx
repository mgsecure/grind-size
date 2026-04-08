import React, {useCallback, useContext, useRef} from 'react'
import {Stack, Paper, Typography, Grid} from '@mui/material'
import SampleQueuePanel from './pagePanels/SampleQueuePanel.jsx'
import ImagePanel from './pagePanels/ImagePanel.jsx'
import SettingsPanel from './pagePanels/SettingsPanel.jsx'
import HistogramPanel from './pagePanels/HistogramPanel.jsx'
import StatsPanel from './pagePanels/StatsPanel.jsx'
import DataContext from '../context/DataContext.jsx'
import {useTheme} from '@mui/material/styles'
import UIContext from '../context/UIContext.jsx'
import VersionChecker from '../app/VersionChecker.jsx'
import Footer from './components/Footer.jsx'
import Tracker from '../app/Tracker.jsx'

export default function PsdPage() {
    const theme = useTheme()

    // TODO - need to be able to reset all data in both contexts

    const {resetDataContext} = useContext(DataContext)
    const {isScreenshot, isDesktop, resetUIContext, breakpoint} = useContext(UIContext)
    const domEl = useRef(null)

    const resetContexts = useCallback(() => {
        resetUIContext()
        resetDataContext()
    }, [resetDataContext, resetUIContext])

    return (
        <Stack direction='column' justifyContent='center' spacing={2}
               maxWidth={{xs: '100%', lg: '1200px', xl: '1600px'}}>
            <Grid container spacing={1} padding={isDesktop ? 1 : 0} sx={{width: '100%'}} justifyContent='center'>
                <Grid container spacing={1} size={{xs: 12, sm: 12, md: 11, lg: 10, xl: 12}} width='100%' height='100%'>
                    <Grid container spacing={1} alignItems='stretch' height='100%'>
                        <Grid size={{xs: 12, xl: 8}} height='100%'>
                            <Paper sx={{p: isDesktop ? 2 : 1, width: '100%', height: '100%'}}>
                                <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
                                    <Typography
                                        style={{
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                            lineHeight: '1.2em',
                                            marginTop: 8
                                        }}>
                                        COFFEE GRIND
                                        {!isDesktop && <br/>}
                                        <span style={{fontWeight: 300}}> PARTICLE SIZE DISTRIBUTION</span>
                                    </Typography>
                                    <VersionChecker/>
                                </Stack>
                                <div>UPLOAD IMAGES</div>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid container spacing={1} size={{xs: 12, sm: 12, md: 11, lg: 10, xl: 5}}>
                    <Grid container spacing={1} alignItems='stretch' height='100%'>
                        <Grid size={12}>
                            <SampleQueuePanel resetContexts={resetContexts}/>
                        </Grid>
                        <Grid size={12}>
                            <SettingsPanel/>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid container spacing={1} size={{xs: 12, sm: 12, md: 11, lg: 10, xl: 7}} alignItems='stretch'
                      sx={{width: '100%', backgroundColor: theme.palette.background.default}} ref={domEl}>
                    {isScreenshot && (
                        <Grid direction='column' spacing={(isDesktop && !isScreenshot) ? 1 : 1}
                              sx={{width: '100%', backgroundColor: theme.palette.background.default}}>
                            <Paper sx={{p: 2, width: '100%'}}>
                                <Typography style={{fontSize: '1.5rem', fontWeight: 700}}>
                                    COFFEE GRIND <span style={{fontWeight: 300}}> PARTICLE SIZE DISTRIBUTION</span>
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    <HistogramPanel domEl={domEl}/>

                    {isScreenshot && (
                        <Grid size={12}><StatsPanel/></Grid>
                    )}
                </Grid>

                {breakpoint === 'xl' && (
                    <Grid size={{xs: 12, sm: 12, md: 11, lg: 10, xl: 5}} alignItems='stretch'>
                        <ImagePanel/>
                    </Grid>
                )}

                <Grid size={{xs: 12, sm: 12, md: 11, lg: 10, xl: 7}} alignItems='stretch'>
                    <StatsPanel/>
                </Grid>

                {breakpoint !== 'xl' && (
                    <Grid size={{xs: 12, sm: 12, md: 11, lg: 10, xl: 5}} alignItems='stretch'>
                        <ImagePanel/>
                    </Grid>
                )}

            </Grid>
            <Tracker feature='Upload'/>
            <Footer/>

        </Stack>
    )
}
