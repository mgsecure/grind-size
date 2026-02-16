import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Stack, Paper, Typography, Divider, Alert, AlertTitle} from '@mui/material'
import Dropzone from '../formUtils/Dropzone.jsx'
import UploadQueue from './components/UploadQueue.jsx'
import ImageViewer from './components/ImageViewer.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import ParameterPanel from './components/ParameterPanel.jsx'
import {analyzeImageFiles} from './analysis/analyzeImage.js'
import HistogramPanel from './components/HistogramPanel.jsx'
import ManualCornerSelector from './components/ManualCornerSelector.jsx'
import OverlayToggles from './components/OverlayToggles.jsx'
import {buildHistograms} from './analysis/metrics/buildHistograms.js'
import {calculateStatistics} from './analysis/metrics/calculateStatistics.js'
import {getFileNameWithoutExtension} from '../util/stringUtils.js'
import Footer from '../nav/Footer.jsx'

export default function PsdPage({settings, setSettings}) {
    const [queue, setQueue] = useState([]) // {id, file, status, error, result}
    const [droppedFiles, setDroppedFiles] = useState([])
    const [activeId, setActiveId] = useState(null)
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
        let activeData = null
        
        if (viewMode === 'aggregate') {
            const allDone = queue.filter(q => q.status === 'done' && q.result)
            if (allDone.length === 0) return null
            
            // Pool particles
            const pooledParticles = []
            allDone.forEach(item => {
                const mmPerPx = item.result.scale.mmPerPx
                item.result.particles.forEach(p => {
                    pooledParticles.push({
                        ...p,
                        // Ensure we use physical properties or scale them correctly
                        // The particles already have areaPx, longAxisPx etc.
                        // We need to pass the pooled scale info if we want to use calculateStatistics
                        // But calculateStatistics uses mmPerPx. If different images have different scales,
                        // we must convert pixels to microns/mm first or normalize them.
                        
                        // Let's create a "normalized" particle object for the pool
                        // where pixel values are converted to a standard scale (e.g. 1px = 1um)
                        // or just add micron properties to detectParticles output.
                    })
                })
            })

            // Actually, calculateStatistics and buildHistograms take mmPerPx as a parameter.
            // If we have a pool of particles from different images, we can't use a single mmPerPx.
            // We should modify calculateStatistics to handle pre-scaled particles or normalize them here.
            
            // For now, let's normalize to 1px = 1um
            const normalizedParticles = allDone.flatMap(item => {
                const mmPerPx = item.result.scale.mmPerPx
                const factor = mmPerPx * 1000
                return item.result.particles.map(p => ({
                    ...p,
                    // calculateStatistics expects these properties in pixels and uses factor to convert
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

            activeData = {
                filename: 'Aggregate Results',
                particles: normalizedParticles,
                scale: { mmPerPx: 0.001, pxPerMm: 1000, detectedTemplate: 'Multiple' },
                histograms: null // will be built below
            }
        } else {
            activeData = activeResult
        }

        if (!activeData) return null

        const currentBinsType = activeData.histograms?.[binSpacing]?.customBinsUsed ? 'dynamic' : 'default'

        if (activeData.histograms?.[binSpacing]?.metric !== xAxis ||
            activeData.histograms?.[binSpacing]?.weighting !== yAxis ||
            currentBinsType !== settings.binsType ||
            activeData.histograms?.[binSpacing]?.spacing !== binSpacing) {

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
    }, [activeResult, xAxis, yAxis, settings.bins, binSpacing, settings.binsType, viewMode, queue])

    const globalMaxY = useMemo(() => {
        let logMax = 0
        let linearMax = 0
        
        // Items to consider for global normalization
        const results = queue.filter(q => q.status === 'done' && q.result).map(q => q.result)
        if (viewMode === 'aggregate' && processedActive && processedActive.filename === 'Aggregate Results') {
            results.push(processedActive)
        }

        results.forEach(initialResult => {
            let result = initialResult
            if (!result) return

            // If the item's result has a different metric or weighting than current,
            // we need to recalculate its maxY to have a consistent global scale.
            const currentBinsType = result.histograms?.[binSpacing]?.customBinsUsed ? 'dynamic' : 'default'

            if (result.histograms?.log?.metric !== xAxis ||
                result.histograms?.log?.weighting !== yAxis ||
                currentBinsType !== settings.binsType) {
                
                // Recalculate histograms for this item to get the correct maxY
                const hists = buildHistograms(result.particles, {
                    binCount: settings.bins,
                    spacing: binSpacing, 
                    weighting: yAxis,
                    mmPerPx: result.scale.mmPerPx,
                    metric: xAxis,
                    binsType: settings.binsType
                })
                result = { ...result, histograms: hists }
            }

            if (result?.histograms?.log) {
                logMax = Math.max(logMax, (result.histograms.log.maxY || 0) * 100)
            }
            if (result?.histograms?.linear) {
                linearMax = Math.max(linearMax, (result.histograms.linear.maxY || 0) * 100)
            }
        })

        // Add 5% headroom for better visualization
        const log = logMax > 0 ? logMax * 1.05 : 100
        const linear = linearMax > 0 ? linearMax * 1.05 : 100
        return { logMax: log, linearMax: linear }
    }, [queue, processedActive, xAxis, yAxis, settings.bins, settings.binsType, binSpacing, viewMode])

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
                // Double check status hasn't changed while we were waiting for previous item
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
                    setQueue(prev => prev.map(p => p.id === item.id ? {...p, status: 'error', error: String(err), result: null} : p))
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

            // If options haven't actually changed since last analysis, skip
            if (JSON.stringify(item.result.parameters.overlayOptions) === JSON.stringify(overlayOptions)) return

            setQueue(prev => prev.map(p => p.id === activeId ? {...p, status: 'queued'} : p))
        }
        updateOverlays()
    }, [overlayOptions, activeId, viewMode, isAnalyzing])

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

    return (
        <Stack spacing={2} sx={{width: '100%'}}>
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

            <Paper sx={{p: 2, width: '100%'}}>
                <Dropzone
                    files={droppedFiles}
                    handleDroppedFiles={onFiles}
                    accept={{'image/*': []}}
                    multiple
                    maxFiles={15}
                    maxMBperFile ={15}
                    label='Drop grind photos here (max 6)'
                />
            </Paper>

            <Paper sx={{p: 2, width: '100%'}}>
                <UploadQueue
                    items={queue}
                    activeId={activeId}
                    onSelect={setActiveId}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />
                <HistogramPanel
                    histograms={processedActive?.histograms}
                    xAxis={xAxis}
                    setXAxis={setXAxis}
                    yAxis={yAxis}
                    setYAxis={setYAxis}
                    binSpacing={binSpacing}
                    setBinSpacing={setBinSpacing}
                    maxY={binSpacing === 'log' ? globalMaxY.logMax : globalMaxY.linearMax}
                    seriesId={processedActive?.filename}
                />
            </Paper>

            {processedActive?.warnings?.length > 0 && (
                <Stack spacing={1} sx={{mb: 2}}>
                    {processedActive.warnings.map((w, i) => (
                        <Alert key={i} severity="warning">
                            <AlertTitle>Analysis Warning</AlertTitle>
                            {w}
                        </Alert>
                    ))}
                </Stack>
            )}
            <Stack direction={{xs: 'column', md: 'row'}} spacing={2} sx={{width: '100%'}}>
                <Stack spacing={2} sx={{flex: 1, minWidth: 320}}>
                    <ParameterPanel settings={settings} setSettings={setSettings} resetToggle={resetToggle}
                                    setResetToggle={setResetToggle}/>
                    <OverlayToggles options={overlayOptions} onChange={setOverlayOptions} />
                </Stack>

                <Stack spacing={2} sx={{flex: 2}}>
                    {viewMode === 'single' && <ImageViewer result={processedActive}/>}
                    {viewMode === 'aggregate' && (
                        <Paper sx={{p: 2}}>
                            <Typography variant="h6">Aggregate Analysis</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Displaying pooled statistics from all {queue.filter(q => q.status === 'done').length} analyzed images.
                            </Typography>
                        </Paper>
                    )}
                    <Divider/>
                    <ResultsPanel result={processedActive} binSpacing={binSpacing}/>
                </Stack>
            </Stack>

            <Footer />


        </Stack>
    )
}
