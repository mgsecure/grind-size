import React, {useContext, useEffect, useRef} from 'react'
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
                <div style={{width: '100%', fontSize: '1.0rem', marginTop: 5}}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}
                                   rehypePlugins={[[rehypeExternalLinks, {
                                       target: '_blank',
                                       rel: ['nofollow', 'noopener', 'noreferrer']
                                   }]]}>
                        {String(markdown)}
                    </ReactMarkdown>

                    <Tracker feature='SampleSetImport' page={sampleSet?.name}/>
                </div>
            }
        </Paper>
    )

}