import React, {useCallback, useContext, useEffect, useRef} from 'react'
import DataContext from '../../context/DataContext.jsx'
import UIContext from '../../context/UIContext.jsx'
import {useSearchParams} from 'react-router-dom'
import {Paper, Stack, Typography} from '@mui/material'
import SampleSetsButton from '../components/SampleSetsButton.jsx'
import fetchData from '../../util/fetchData.js'
import loadImport from '../components/loadImport.jsx'
import MiniFilterContext from '../../context/MiniFilterContext.jsx'
import Tracker from '../../app/Tracker.jsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeExternalLinks from 'rehype-external-links'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import LinkIcon from '@mui/icons-material/Link'
import {enqueueSnackbar} from 'notistack'

export default function SampleSetsPanel() {

    const {
        sampleSets,
        sampleSet,
        setSampleSet,
        queue,
        setQueue,
        setActiveIdList,
        setViewOnly,
        setSettings
    } = useContext(DataContext)
    const {setChartTitle, isDesktop, setCustomSampleParams} = useContext(UIContext)
    const {removeFilters} = useContext(MiniFilterContext)

    const [searchParams] = useSearchParams()
    const sampleSetId = searchParams.get('sampleSet')
    const sampleSetData = sampleSets.find(s => s.id === sampleSetId)

    //console.log('sampleSet', sampleSetId, sampleSetData)
    const loadedRef = useRef(null)

    const markdown = `**${sampleSet?.name || 'Demo Sample Set'}** • ${sampleSet?.description || 'A collection of demo samples.'}`

    const handleCopyLink = useCallback(async () => {
        const href = `https://coffee-grind.com/psd?sampleSet=${sampleSet?.id}`
        await navigator.clipboard.writeText(href)
        enqueueSnackbar('Link to entry copied to clipboard.')
    }, [sampleSet])

    useEffect(() => {
        if (sampleSetData && sampleSetData.dataUrl && !loadedRef.current) {
            fetchData(sampleSetData.dataUrl).then(r => {
                if (r.data) {
                    setQueue([])
                    loadImport(r.data, {queue, setQueue, setActiveIdList, setCustomSampleParams})
                    //setViewOnly(true)
                    setSettings(prev => ({...prev, bins: sampleSetData.binCount}))
                    setSampleSet(sampleSetData)
                    setChartTitle(sampleSetData.chartTitle)
                }
            }).catch(e => {
                console.error('error fetching sample set', e)
            }).finally(() => removeFilters(['sampleSet']))
            loadedRef.current = true
        }
    }, [queue, removeFilters, sampleSetData, setActiveIdList, setChartTitle, setCustomSampleParams, setQueue, setSampleSet, setSettings, setViewOnly])

    return (
        <Paper sx={{p: isDesktop ? 2 : 1, width: '100%', height: '100%'}}>
            <Stack direction='row' alignItems='center' justifyContent='space-between' width='100%'>
                <Typography style={{fontSize: '1.1rem', fontWeight: 500}}>EXAMPLE DATASETS</Typography>
                <SampleSetsButton iconOnly={false}/>
            </Stack>

            {sampleSet &&
                <div style={{display: 'flex', width: '100%', fontSize: '1.0rem', marginTop: 0, alignItems: 'flex-end', justifyContent: 'space-between'}}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}
                                   rehypePlugins={[[rehypeExternalLinks, {
                                       target: '_blank',
                                       rel: ['nofollow', 'noopener', 'noreferrer']
                                   }]]}>
                        {String(markdown)}
                    </ReactMarkdown>

                    <Tooltip title='Copy Link to Example' arrow disableFocusListener>
                    <span>
                        <IconButton
                            color='inherit'
                            onClick={handleCopyLink}
                            aria-label='copyLink'
                            size='small'
                        >
                            <LinkIcon/>
                        </IconButton>
                    </span>
                    </Tooltip>

                    <Tracker feature='SampleSetImport' page={sampleSet?.name}/>
                </div>
            }
        </Paper>
    )

}