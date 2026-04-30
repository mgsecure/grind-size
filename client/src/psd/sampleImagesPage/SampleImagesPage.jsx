import React, {useContext, useEffect, useMemo, useRef} from 'react'
import {Stack, Paper, Typography, Grid, Link} from '@mui/material'
import UIContext from '../../context/UIContext.jsx'
import Tracker from '../../app/Tracker.jsx'
import Nav from '../../nav/Nav.jsx'
import {useTheme} from '@mui/material/styles'
import ReactMarkdown from 'react-markdown'
import rehypeExternalLinks from 'rehype-external-links'
import remarkGfm from 'remark-gfm'
import sampleImagesIntro from '../resources/sampleImagesIntro.md?raw'
import {SampleImageQueue} from './sampleImageQueue.js'
import EntryImageGallery from '../components/EntryImageGallery.jsx'

export default function SampleImagesPage() {
    const theme = useTheme()
    const contentRef = useRef(null)

    const {isDesktop, imageViewMode, setImageViewMode} = useContext(UIContext)

    useEffect(() => {
        if (SampleImageQueue.length) {
            setImageViewMode('source')
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const srcVar = useMemo(() => {
        if (imageViewMode === 'source') return 'sourceUrl'
        if (imageViewMode === 'original') return 'originalPngDataUrl'
        if (imageViewMode === 'mask') return 'maskPngDataUrl'
        if (imageViewMode === 'diagnostic') return 'diagnosticPngDataUrl'
        return 'overlayPngDataUrl'
    }, [imageViewMode])

    const entry = {
        media: SampleImageQueue
            .filter(item => item.result?.previews?.[srcVar] !== undefined)
            .map((item, index) => {
                if (item.result) {
                    return {
                        label: item.label || '',
                        title: item.sampleName || `Sample ${index}`,
                        subtitle: item.result?.settings?.name || '',
                        thumbnailUrl: item.result?.previews?.[`${srcVar}Thumb`] || item.result?.previews?.[srcVar],
                        sequenceId: index + 1,
                        fullSizeUrl: item.result?.previews?.[srcVar],
                        id: item.id
                    }
                } else return {}
            })
    }

    const activeIdList = SampleImageQueue.map(item => item.id)

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
                                SAMPLE IMAGES
                            </Typography>

                            <Link
                                href={'https://coffee-grind.com/templates/coffee-grind.com_PSD_templates_v02.pdf'}
                                target={'_blank'} style={{fontWeight: 400}}>
                                Click here to download the photo template for grind
                                images.
                            </Link>


                            <Stack direction={{xs: 'column', sm: 'row'}} alignItems='flex-start'
                                   justifyContent='space-between' spacing={1} style={{marginTop: 5}}>
                                <div>
                                    <ReactMarkdown rehypePlugins={[[rehypeExternalLinks, {
                                        target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer']
                                    }]]} remarkPlugins={[remarkGfm]}>
                                        {String(sampleImagesIntro)}
                                    </ReactMarkdown>
                                </div>
                            </Stack>
                            <EntryImageGallery entry={entry} queue={SampleImageQueue} activeIdList={activeIdList}/>

                        </Paper>

                    </Grid>
                </Grid>


                <Tracker feature='Template'/>
            </Stack>
        </>
    )
}
