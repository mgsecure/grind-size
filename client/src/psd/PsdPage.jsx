import React, {useCallback, useMemo, useState} from 'react'
import {Stack, Paper, Typography, Divider} from '@mui/material'
import Dropzone from '../formUtils/Dropzone.jsx'
import UploadQueue from './components/UploadQueue.jsx'
import ImageViewer from './components/ImageViewer.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import ParameterPanel from './components/ParameterPanel.jsx'
import {analyzeImageFiles} from './analysis/analyzeImage.js'

export default function PsdPage({settings, setSettings}) {
    const [queue, setQueue] = useState([]) // {id, file, status, error, result}
    const [droppedFiles, setDroppedFiles] = useState([])
    const [activeId, setActiveId] = useState(null)

    const active = useMemo(() => queue.find(q => q.id === activeId)?.result ?? null, [queue, activeId])

    const onFiles = useCallback(async files => {
        setDroppedFiles(files)
        const next = Array.from(files).slice(0, 5).map(file => ({
            id: crypto.randomUUID(),
            file,
            status: 'queued',
            error: null,
            result: null
        }))
        setQueue(prev => [...prev, ...next])
        if (!activeId && next.length) setActiveId(next[0].id)

        // analyze sequentially to keep UI responsive
        for (const item of next) {
            setQueue(prev => prev.map(p => p.id === item.id ? {...p, status: 'analyzing'} : p))
            try {
                console.log('Analyzing file:', item.file.name)
                const result = await analyzeImageFiles(item.file, settings)

                console.log('Result for:', item.file.name, result)

                setQueue(prev => prev.map(p => p.id === item.id ? {...p, status: 'done', result} : p))
            } catch (err) {
                setQueue(prev => prev.map(p => p.id === item.id ? {...p, status: 'error', error: String(err)} : p))
            }
        }
    }, [settings, activeId])

    return (
        <Stack spacing={2} sx={{width: '100%'}}>
            <Paper sx={{p: 2, width: '100%'}}>
                <Typography variant='h5'>Particle Size Distribution (PSD)</Typography>
                <Typography variant='body2' color='text.secondary'>
                    Upload up to 5 images. This build uses a client-first analysis pipeline; ArUco + manual corner UX are added in the next patch.
                </Typography>
            </Paper>

            <Paper sx={{p: 2, width: '100%'}}>
                <Dropzone
                    files={droppedFiles}
                    handleDroppedFiles={onFiles}
                    accept={{'image/*': []}}
                    multiple
                    maxFiles={5}
                    label='Drop grind photos here (max 5)'
                />

            </Paper>

            <Stack direction={{xs: 'column', md: 'row'}} spacing={2} sx={{width: '100%'}}>
                <Stack spacing={2} sx={{flex: 1, minWidth: 320}}>
                    <UploadQueue
                        items={queue}
                        activeId={activeId}
                        onSelect={setActiveId}
                    />
                    <ParameterPanel settings={settings} setSettings={setSettings}/>
                </Stack>

                <Stack spacing={2} sx={{flex: 2}}>
                    <ImageViewer result={active}/>
                    <Divider/>
                    <ResultsPanel result={active}/>
                </Stack>
            </Stack>
        </Stack>
    )
}
