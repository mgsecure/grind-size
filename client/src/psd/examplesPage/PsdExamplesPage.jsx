import React, {useContext, useRef} from 'react'
import {Stack, Paper, Typography, Grid, Box} from '@mui/material'
import DataContext from '../../context/DataContext.jsx'
import UIContext from '../../context/UIContext.jsx'
import Footer from '../components/Footer.jsx'
import Tracker from '../../app/Tracker.jsx'
import Nav from '../../nav/Nav.jsx'
import {useNavigate} from 'react-router-dom'
import {useTheme} from '@mui/material/styles'
import {Image} from 'mui-image'

export default function PsdExamplesPage() {
    const theme = useTheme()
    const navigate = useNavigate()
    const contentRef = useRef(null)

    // TODO - need to be able to reset all data in both contexts

    const {sampleSets} = useContext(DataContext)
    const {isDesktop} = useContext(UIContext)

    const displaySets = sampleSets.map(s => {

        const fullDescription = `**[${s.name}](https://coffee-grind.com/psd?sampleSet=${s.id})** | ${s.description}`

        return {...s, fullDescription}
    })

    const linkSx = {
        color: '#eee',
        textDecoration: 'underline',
        cursor: 'pointer',
        fontWeight: 600,
        '&:hover': {
            color: '#fff'
        }
    }

    return (
        <Box>
            <Nav contentRef={contentRef}/>

            <Stack direction='column' justifyContent='center' spacing={2}
                   maxWidth={{xs: '100%', lg: '1200px', xl: '1600px'}}>
                <Grid container spacing={1} padding={isDesktop ? 1 : 0} ref={contentRef}
                      sx={{width: '100%', backgroundColor: theme.palette.background.default}} justifyContent='center'>

                    <Grid container spacing={1} size={{xs: 12, sm: 12, md: 11, lg: 10, xl: 12}} width='100%'
                          height='100%'>
                        <Grid container spacing={1} alignItems='stretch' height='100%' width='100%'>
                            <Grid size={{xs: 12, xl: 12}} height='100%' width='100%'>
                                <Paper sx={{p: isDesktop ? 2 : 1, width: '100%', height: '100%'}}>
                                    <Typography style={{fontSize: '1.2rem', fontWeight: 700}}>ANALYSIS EXAMPLES</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid container spacing={1} size={{xs: 12, sm: 12, md: 11, lg: 10, xl: 12}} width='100%'
                          height='100%'>
                        <Grid container spacing={1} alignItems='stretch'>
                            {displaySets.map((s, idx) => (
                                <Grid size={{xs: 12, md: 6}} key={s.id} sx={{display: 'flex'}}>
                                    <Paper sx={{
                                        p: isDesktop ? 2 : 1,
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <Typography
                                            onClick={() => navigate(`/psd?sampleSet=${s.id}`)}
                                            sx={linkSx}
                                        >
                                            {s.name}
                                        </Typography>

                                        <Stack direction='row' alignItems='flex-start' justifyContent='space-between'
                                               spacing={1} style={{marginTop: 5}}>
                                            <div>
                                                <Typography style={{marginTop: 0.5, color: '#eee', fontSize: '0.9rem'}}>
                                                    {s.description}
                                                </Typography>
                                            </div>
                                            <Box sx={{width: 140}}>
                                                <Image src={`/i/chartThumbs/${s.id}.png`}
                                                       onClick={() => navigate(`/psd?sampleSet=${s.id}`)}
                                                       alt={s.name}
                                                       duration={250 * idx}
                                                       style={{width: 140, height: 85, marginTop: 5, cursor: 'pointer'}}/>
                                            </Box>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            ))}

                        </Grid>
                    </Grid>


                </Grid>
                <Tracker feature='Examples'/>
                <Footer/>

            </Stack>
        </Box>
    )
}
