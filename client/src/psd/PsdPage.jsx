import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Stack, Paper, Typography, Alert, AlertTitle} from '@mui/material'
import UploadQueue from './components/UploadQueue.jsx'
import ImageViewer from './components/ImageViewer.jsx'
import ExportPanel from './components/ExportPanel.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import {analyzeImageFiles} from './analysis/analyzeImage.js'
import HistogramPanel from './components/HistogramPanel.jsx'
import ManualCornerSelector from './components/ManualCornerSelector.jsx'
import {buildHistograms} from './analysis/metrics/buildHistograms.js'
import {calculateStatistics} from './analysis/metrics/calculateStatistics.js'
import StatsTable from './components/StatsTable.jsx'
import {getFileNameWithoutExtension} from '../util/stringUtils.js'

export default function PsdPage({settings, setSettings}) {
    const [queue, setQueue] = useState([]) // {id, file, status, error, result}
    const [droppedFiles, setDroppedFiles] = useState([])
    const [activeId, setActiveId] = useState(null)
    const [activeIdList, setActiveIdList] = useState([])
    const [viewMode, setViewMode] = useState('single') // 'single' | 'aggregate'
    const [xAxis, setXAxis] = useState(settings.metric || 'diameter')
    const [yAxis, setYAxis] = useState(settings.value || 'mass')
    const [binSpacing, setBinSpacing] = useState(settings.binSpacing || 'log')
    const [resetToggle, setResetToggle] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [manualSelectionId, setManualSelectionId] = useState(null) // ID of file needing manual corners
    const [manualSelectionUrl, setManualSelectionUrl] = useState(null)

    const [overlayOptions, setOverlayOptions] = useState({
        showParticles: true,
        showMarkers: true,
        showScale: true,
        showRoi: true
    })

    const activeItem = useMemo(() => queue.find(q => q.id === activeId) ?? null, [queue, activeId])

    const aggregateItem = useMemo(() => {
        const allDone = queue.filter(q => q.status === 'done' && q.result)
        if (allDone.length === 0) return null

        const normalizedParticles = allDone.flatMap(item => {
            const mmPerPx = item.result.scale.mmPerPx
            const factor = mmPerPx * 1000
            return item.result.particles.map(p => ({
                ...p,
                // calculateStatistics expects these properties in pixels and uses factor to convert.
                // So we provide them such that p.shortAxisPx * factor = actual_microns
                // If we set factor=1, then p.shortAxisPx must be microns.
                shortAxisPx: p.shortAxisPx * factor,
                longAxisPx: p.longAxisPx * factor,
                areaPx: p.areaPx * (factor ** 2),
                surfaceAreaPx: p.surfaceAreaPx * (factor ** 2),
                volumePx: p.volumePx * (factor ** 3),
                eqDiameterPx: p.eqDiameterPx * factor
            }))
        })

        const activeData = {
            id: 'aggregateResults',
            filename: 'Aggregate',
            scale: {mmPerPx: 0.001, pxPerMm: 1000, detectedTemplate: 'Multiple'},
            status: queue.find(q => q.status !== 'done') ? 'analyzing' : 'done',
            histograms: null // will be built below
        }

        const currentBinsType = activeData.histograms?.[binSpacing]?.customBinsUsed ? 'default' : 'dynamic'

        if (activeData.histograms?.[binSpacing]?.metric !== xAxis ||
            activeData.histograms?.[binSpacing]?.weighting !== yAxis ||
            currentBinsType !== settings.binsType ||
            activeData.histograms?.[binSpacing]?.spacing !== binSpacing ||
            activeData.histograms?.[binSpacing]?.binCount !== settings.bins) {

            const hists = buildHistograms(normalizedParticles, {
                binCount: settings.bins,
                spacing: binSpacing,
                weighting: yAxis,
                mmPerPx: activeData.scale.mmPerPx,
                metric: xAxis,
                binsType: settings.binsType
            })
            const stats = calculateStatistics(normalizedParticles, {
                weighting: yAxis,
                mmPerPx: activeData.scale.mmPerPx,
                metric: xAxis
            })
            return {...activeData, histograms: hists, stats}
        }
        return activeData
    }, [queue, xAxis, yAxis, settings.bins, binSpacing, settings.binsType])

    const queueItems = useMemo(() => {
        if (queue.length === 0) return []

        console.log('queue', queue)
        return queue.map(q => {
            //if (!q.result) return null
            const result = q.result || {}

            const currentBinsType = result.histograms?.[binSpacing]?.customBinsUsed ? 'default' : 'dynamic'

            if (result.histograms?.[binSpacing]?.metric !== xAxis ||
                result.histograms?.[binSpacing]?.weighting !== yAxis ||
                currentBinsType !== settings.binsType ||
                result.histograms?.[binSpacing]?.spacing !== binSpacing ||
                result.histograms?.[binSpacing]?.binCount !== settings.bins) {

                const hists = result.particles
                    ? buildHistograms(result.particles, {
                        binCount: settings.bins,
                        spacing: binSpacing,
                        weighting: yAxis,
                        mmPerPx: result.scale?.mmPerPx,
                        metric: xAxis,
                        binsType: settings.binsType
                    })
                    : {}
                const stats = result.particles
                    ? calculateStatistics(result.particles, {
                        weighting: yAxis,
                        mmPerPx: result.scale?.mmPerPx,
                        metric: xAxis
                    })
                    : {}

                return {
                    id: q.id,
                    filename: q.file.name || '',
                    stats: stats,
                    histograms: hists,
                    scale: result.scale || {},
                    status: q.status || 'queued'
                }
            }

            return {
                id: q.id,
                filename: getFileNameWithoutExtension(q.file?.name) || '',
                stats: q.result.stats || {},
                histograms: q.result.histograms || {},
                scale: q.result.scale || {},
                status: q.status || 'queued'
            }
        }).filter(Boolean)
    }, [queue, xAxis, yAxis, settings.bins, binSpacing, settings.binsType])

    const allItems = useMemo(() => (queueItems.length > 1 && aggregateItem?.status === 'done')
        ? [...queueItems, aggregateItem].filter(Boolean)
        : [...queueItems].filter(Boolean), [queueItems, aggregateItem])
    const activeItems = useMemo(() => allItems.filter(q => activeIdList.includes(q.id)), [allItems, activeIdList])

    const activeResult = activeItem?.result ?? null

    useEffect(() => {
        const item = queue.find(q => q.id === manualSelectionId)
        if (item && item.file) {
            const url = URL.createObjectURL(item.file)
            setManualSelectionUrl(url)
            return () => URL.revokeObjectURL(url)
        } else {
            setManualSelectionUrl(null)
        }
    }, [manualSelectionId, queue])


    const processedActive = useMemo(() => {
        const activeData = activeResult
        if (!activeData) return null

        const currentBinsType = activeData.histograms?.[binSpacing]?.customBinsUsed ? 'default' : 'dynamic'

        if (activeData.histograms?.[binSpacing]?.metric !== xAxis ||
            activeData.histograms?.[binSpacing]?.weighting !== yAxis ||
            currentBinsType !== settings.binsType ||
            activeData.histograms?.[binSpacing]?.spacing !== binSpacing ||
            activeData.histograms?.[binSpacing]?.binCount !== settings.bins) {

            const hists = buildHistograms(activeData.particles, {
                binCount: settings.bins,
                spacing: binSpacing,
                weighting: yAxis,
                mmPerPx: activeData.scale.mmPerPx,
                metric: xAxis,
                binsType: settings.binsType
            })
            const stats = calculateStatistics(activeData.particles, {
                weighting: yAxis,
                mmPerPx: activeData.scale.mmPerPx,
                metric: xAxis
            })
            return {...activeData, histograms: hists, stats}
        }
        return activeData
    }, [activeResult, xAxis, yAxis, settings.bins, binSpacing, settings.binsType])

    const globalMaxY = useMemo(() => {
        let logMax = 0
        let linearMax = 0

        // Items to consider for global normalization
        let results = activeItems || []

        if (results.length === 0) {
            return {logMax: 20, linearMax: 20}
        }

        results.forEach(result => {
            if (!result) return

            if (result?.histograms?.log) {
                logMax = Math.max(logMax, (result.histograms.log.maxY || 0) * 100)
            }
            if (result?.histograms?.linear) {
                linearMax = Math.max(linearMax, (result.histograms.linear.maxY || 0) * 100)
            }
        })

        // Add 5% headroom for better visualization
        const log = logMax > 0 ? logMax * 1.05 : 20
        const linear = linearMax > 0 ? linearMax * 1.05 : 20
        return {logMax: log, linearMax: linear}
    }, [activeItems])

    const onFiles = useCallback(async (files) => {
        setDroppedFiles(files)

        if (!files.length) {
            setQueue([])
            return
        }
        const candidateFiles = Array.from(files).slice(0, 6)
        const unprocessedFiles = candidateFiles
            .filter(file => !queue.find(q => (q.file.relativePath === file.path && q.status === 'done')))

        const next = unprocessedFiles.map(file => ({
            id: crypto.randomUUID(),
            file,
            status: 'queued',
            error: null,
            result: null
        }))
        setQueue(prev => [...prev, ...next])
        if (!activeId && next.length) setActiveId(next[0].id)
    }, [queue, activeId])

    const analyzeAll = useCallback(() => {
        setQueue(prevQueue => {
            return prevQueue.map(item => ({
                ...item,
                status: 'queued',
                error: null
            }))
        })
    }, [])

    useEffect(() => {
        if (resetToggle) {
            analyzeAll()
            setResetToggle(false)
        }
    }, [resetToggle, analyzeAll])

    useEffect(() => {
        const startAnalysis = async () => {
            if (isAnalyzing || manualSelectionId) return

            const toProcess = queue.filter(q => q.status === 'queued')
            if (toProcess.length === 0) return

            setIsAnalyzing(true)
            for (const item of toProcess) {
                // Double-check status hasn't changed while we were waiting for previous item
                setQueue(prev => {
                    const currentItem = prev.find(p => p.id === item.id)
                    if (currentItem?.status !== 'queued') return prev
                    return prev.map(p => p.id === item.id ? {...p, status: 'analyzing'} : p)
                })

                try {
                    const result = await analyzeImageFiles(item.file, {...settings, binSpacing}, null, overlayOptions)

                    // If no template detected, prompt for manual corners
                    if (!result.template && !result.scale?.detectedTemplate) {
                        setManualSelectionId(item.id)
                        setQueue(prev => prev.map(p => p.id === item.id ? {...p, status: 'manual_needed'} : p))
                        setIsAnalyzing(false) // Break and wait for user
                        return
                    }

                    setQueue(prev => prev.map(p => p.id === item.id ? {...p, status: 'done', result} : p))
                } catch (err) {
                    setQueue(prev => prev.map(p => p.id === item.id ? {
                        ...p,
                        status: 'error',
                        error: String(err),
                        result: null
                    } : p))
                }
            }
            setIsAnalyzing(false)
        }
        startAnalysis().then()
    }, [queue, settings, binSpacing, isAnalyzing, manualSelectionId, overlayOptions])


    useEffect(() => {
        if (!activeId || viewMode === 'aggregate' || isAnalyzing) return

        const updateOverlays = async () => {
            const item = queue.find(q => q.id === activeId)
            if (!item || !item.result || item.status === 'queued' || item.status === 'analyzing') return

            // If options haven't changed since last analysis, skip
            if (JSON.stringify(item.result.parameters.overlayOptions) === JSON.stringify(overlayOptions)) return

            setQueue(prev => prev.map(p => p.id === activeId ? {...p, status: 'queued'} : p))
        }
        updateOverlays().then()
    }, [overlayOptions, activeId, viewMode, isAnalyzing, queue])

    const handleManualCorners = async (corners) => {
        const id = manualSelectionId
        setManualSelectionId(null)
        setQueue(prev => prev.map(p => p.id === id ? {...p, status: 'analyzing'} : p))

        try {
            const item = queue.find(q => q.id === id)
            const result = await analyzeImageFiles(item.file, {...settings, binSpacing}, corners, overlayOptions)
            setQueue(prev => prev.map(p => p.id === id ? {...p, status: 'done', result} : p))
        } catch (err) {
            setQueue(prev => prev.map(p => p.id === id ? {...p, status: 'error', error: String(err)} : p))
        }
    }

    const cancelManual = () => {
        const id = manualSelectionId
        setManualSelectionId(null)
        setQueue(prev => prev.map(p => p.id === id ? {...p, status: 'error', error: 'Manual selection cancelled'} : p))
    }

    const handleQueueRemove = (id) => {
        if (id === 'all') {
            setQueue([])
            setDroppedFiles([])
        } else {
            setQueue(prev => prev.filter(p => p.id !== id))
            setDroppedFiles(prev => prev.filter(f => f.path !== queue.find(q => q.id === id)?.file.path))
        }
    }

    return (
        <Stack spacing={1} sx={{width: '100%'}}>
            {manualSelectionId && (
                <Paper sx={{p: 2}}>
                    <ManualCornerSelector
                        imageUrl={manualSelectionUrl}
                        onCornersSelected={handleManualCorners}
                        onCancel={cancelManual}
                    />
                </Paper>
            )}
            <Paper sx={{p: 2, width: '100%'}}>
                <Typography variant='h5'>Particle Size Distribution (PSD)</Typography>
                <Typography variant='body2' color='text.secondary'>
                    Upload up to 6 images.
                </Typography>
            </Paper>

            <UploadQueue
                droppedFiles={droppedFiles}
                handleDroppedFiles={onFiles}
                queueItems={allItems}
                handleQueueRemove={handleQueueRemove}
                activeId={activeId}
                activeIdList={activeIdList}
                setActiveIdList={setActiveIdList}
                onSelect={setActiveId}
                viewMode={viewMode}
                setViewMode={setViewMode}
                aggregateItem={aggregateItem}
            />

            <SettingsPanel
                queue={queue}
                settings={settings}
                setSettings={setSettings}
                resetToggle={resetToggle}
                setResetToggle={setResetToggle}/>

            <HistogramPanel
                activeItems={activeItems}
                xAxis={xAxis}
                setXAxis={setXAxis}
                yAxis={yAxis}
                setYAxis={setYAxis}
                settings={settings}
                setSettings={setSettings}
                binSpacing={binSpacing}
                setBinSpacing={setBinSpacing}
                maxY={binSpacing === 'log' ? globalMaxY.logMax : globalMaxY.linearMax}
            />

            {processedActive?.warnings?.length > 0 && (
                <Stack spacing={1} sx={{mb: 2}}>
                    {processedActive.warnings.map((w, i) => (
                        <Alert key={i} severity='warning'>
                            <AlertTitle>Analysis Warning</AlertTitle>
                            {w}
                        </Alert>
                    ))}
                </Stack>
            )}

            <Stack direction={{xs: 'column', md: 'row'}} spacing={2} sx={{width: '100%'}}>
                <Stack spacing={1} sx={{flex: 2}}>
                    {viewMode === 'aggregate' && (
                        <Paper sx={{p: 2}}>
                            <Typography variant='h6'>Aggregate Analysis</Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Displaying pooled statistics from
                                all {queue.filter(q => q.status === 'done').length} analyzed images.
                            </Typography>
                        </Paper>
                    )}

                    <StatsTable activeItems={activeItems}/>

                    <Stack direction={{xs: 'column', md: 'row'}} spacing={1} sx={{width: '100%'}}>
                        <ImageViewer result={processedActive} overlayOptions={overlayOptions}
                                     setOverlayOptions={setOverlayOptions}/>
                        <ExportPanel result={processedActive} binSpacing={binSpacing}/>
                    </Stack>
                </Stack>
            </Stack>

            <div style={{height: 100}}/>
        </Stack>
    )
}
