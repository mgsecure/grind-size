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
    const {setChartTitle, isDesktop} = useContext(UIContext)
    const {removeFilters} = useContext(MiniFilterContext)

    const [searchParams] = useSearchParams()
    const sampleSetId = searchParams.get('sampleSet')
    const sampleSetData = sampleSets.find(s => s.id === sampleSetId)

    //console.log('sampleSet', sampleSetId, sampleSetData)
    const loadedRef = useRef(null)

    useEffect(() => {
        if (sampleSetData && sampleSetData.dataUrl && !loadedRef.current) {
            fetchData(sampleSetData.dataUrl).then(r => {
                if (r.data) {
                    setQueue([])
                    loadImport(r.data, {queue, setQueue, setActiveIdList})
                    //setViewOnly(true)
                    setSettings(prev => ({...prev, bins: sampleSetData.binCount}))
                    setSampleSet(sampleSetData)
                    setChartTitle(sampleSetData.chartTitle)
                    removeFilters(['sampleSet'])
                }
            }).catch(e => {
                console.error('error fetching sample set', e)
            })
            loadedRef.current = true
        }
    }, [queue, removeFilters, sampleSetData, setActiveIdList, setChartTitle, setQueue, setSampleSet, setSettings, setViewOnly])

    return (
        <Paper sx={{p: isDesktop ? 2 : 1, width: '100%'}}>
            <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{width: '100%'}}>
                <Typography style={{fontSize: '1.1rem', fontWeight: 500}}>EXAMPLE DATASETS</Typography>
                <SampleSetsButton iconOnly={false}/>
            </Stack>

            {sampleSet &&
                <div style={{width: '100%', fontSize: '0.9rem', marginTop: 5}}>
                    <strong>{sampleSet?.name || 'Demo Sample Set'}</strong> | {sampleSet?.description || 'A collection of demo samples.'}
                    <Tracker feature='SampleSetImport' page={sampleSet?.name} />
                </div>
            }
        </Paper>
    )

}