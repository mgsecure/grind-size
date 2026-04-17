import React, {useContext, useRef} from 'react'
import {Stack, Paper, Typography, Grid, Link} from '@mui/material'
import UIContext from '../../context/UIContext.jsx'
import Tracker from '../../app/Tracker.jsx'
import Nav from '../../nav/Nav.jsx'
import {useTheme} from '@mui/material/styles'
import {Image} from 'mui-image'
import ReactMarkdown from 'react-markdown'
import rehypeExternalLinks from 'rehype-external-links'
import remarkGfm from 'remark-gfm'
import downloadTemplateMarkdown from '../resources/downloadTemplateMarkdown.md?raw'

export default function DownloadTemplatePage() {
    const theme = useTheme()
    const contentRef = useRef(null)

    // TODO - need to be able to reset all data in both contexts?

    const {isDesktop} = useContext(UIContext)

    return (
        <>
            <Nav contentRef={contentRef}/>

            <Stack direction='column' justifyContent='center' spacing={2}
                   maxWidth={{xs: '100%', lg: '1200px', xl: '1600px'}}>

                <Grid container spacing={1} padding={isDesktop ? 1 : 0} ref={contentRef}
                      sx={{width: '100%', backgroundColor: theme.palette.background.default}} justifyContent='center'>
                    <Grid size={{xs: 12, sm: 12, md: 11, lg: 10, xl: 12}} width='100%'>

                        <Paper sx={{
                            p: isDesktop ? 2 : 1,
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>

                            <Typography style={{fontSize: '1.2rem', fontWeight: 700, marginBottom: 16}}>
                                DOWNLOAD TEMPLATE
                            </Typography>

                            <Link
                                href={'https://coffee-grind.com/templates/coffee-grind.com_PSD_templates_v02.pdf'}
                                target={'_blank'} style={{fontWeight: 600}}>
                                Click here to download the photo template for grind
                                images.
                            </Link>


                            <Stack direction={{xs: 'column', sm: 'row'}} alignItems='flex-start'
                                   justifyContent='space-between' spacing={1} style={{marginTop: 5}}>

                                <div>
                                    <ReactMarkdown rehypePlugins={[[rehypeExternalLinks, {
                                        target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer']
                                    }]]} remarkPlugins={[remarkGfm]}>
                                        {String(downloadTemplateMarkdown)}
                                    </ReactMarkdown>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%'
                                }}>
                                    <Link
                                        href={'https://coffee-grind.com/templates/coffee-grind.com_PSD_templates_v02.pdf'}
                                        target={'_blank'}>
                                        <Image src={'/templates/templateImage.png'}
                                               alt={'alt'}
                                               duration={250}
                                               width={220}
                                               style={{marginTop: 5, cursor: 'pointer'}}/>
                                    </Link>
                                </div>

                            </Stack>

                        </Paper>

                    </Grid>
                </Grid>

                <Tracker feature='Template'/>
            </Stack>
        </>
    )
}
