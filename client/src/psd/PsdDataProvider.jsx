import React, {useCallback, useEffect, useMemo, useState} from 'react'
import DataContext from '../context/DataContext.jsx'
import {useTheme} from '@mui/material/styles'
import {PSD_DEFAULTS} from '@starter/shared'
import {analyzeImageFiles} from './analysis/analyzeImage.js'
import {buildHistograms} from './analysis/metrics/buildHistograms.js'
import {calculateStatistics} from './analysis/metrics/calculateStatistics.js'
import {getFileNameWithoutExtension} from '../util/stringUtils.js'

export function PsdDataProvider({children}) {
    const theme = useTheme()

    // State from PsdPage
    const [settings, setSettings] = useState(PSD_DEFAULTS)
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
    const [reverseColors, setReverseColors] = useState(false)
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
            histograms: null
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
        return queue.map(q => {
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
                    filename: q.file?.name || '',
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

    const allItems = useMemo(() => (queueItems.length > 1 && aggregateItem)
        ? [...queueItems, aggregateItem].filter(Boolean)
        : [...queueItems].filter(Boolean), [queueItems, aggregateItem])

    const activeItems = useMemo(() => allItems.filter(q => activeIdList.includes(q.id)), [allItems, activeIdList])
    const nonAggregateItems = useMemo(() => activeItems.filter(item => item.filename !== 'Aggregate'), [activeItems])

    const activeResult = useMemo(() => {
        if (activeId === 'aggregateResults') return aggregateItem
        return activeItem?.result ?? null
    }, [activeId, aggregateItem, activeItem])

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
        let results = activeItems || []
        if (results.length === 0) return {logMax: 20, linearMax: 20}

        results.forEach(result => {
            if (!result) return
            if (result?.histograms?.log) {
                logMax = Math.max(logMax, (result.histograms.log.maxY || 0) * 100)
            }
            if (result?.histograms?.linear) {
                linearMax = Math.max(linearMax, (result.histograms.linear.maxY || 0) * 100)
            }
        })

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
                setQueue(prev => {
                    const currentItem = prev.find(p => p.id === item.id)
                    if (currentItem?.status !== 'queued') return prev
                    return prev.map(p => p.id === item.id ? {...p, status: 'analyzing'} : p)
                })

                try {
                    const result = await analyzeImageFiles(item.file, {...settings, binSpacing}, null, overlayOptions)
                    if (!result.template && !result.scale?.detectedTemplate) {
                        setManualSelectionId(item.id)
                        setQueue(prev => prev.map(p => p.id === item.id ? {...p, status: 'manual_needed'} : p))
                        setIsAnalyzing(false)
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
            if (JSON.stringify(item.result.parameters.overlayOptions) === JSON.stringify(overlayOptions)) return
            setQueue(prev => prev.map(p => p.id === activeId ? {...p, status: 'queued'} : p))
        }
        updateOverlays().then()
    }, [overlayOptions, activeId, viewMode, isAnalyzing, queue])

    const handleQueueRemove = useCallback((id) => {
        if (!id) return
        setDroppedFiles(prev => prev.filter(f => f.path !== queue.find(q => q.id === id)?.file.path))

        let newQueue = [...queue].filter(q => q.id !== id)
        setQueue(newQueue)

        if (id === 'all' || newQueue.length === 0) {
            setQueue([])
            setDroppedFiles([])
            setActiveIdList([])
        }
    }, [queue])

    const handleManualCorners = useCallback(async (corners) => {
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
    }, [binSpacing, manualSelectionId, overlayOptions, queue, settings])

    const cancelManual = useCallback(() => {
        const id = manualSelectionId
        setManualSelectionId(null)
        setQueue(prev => prev.map(p => p.id === id ? {...p, status: 'error', error: 'Manual selection cancelled'} : p))
    }, [manualSelectionId])

    const allColors = useMemo(() => theme.palette.mode === 'dark'
            ? ['#a6cee3', '#1f78b4', '#e8c1a0', '#f47560', '#b2df8a', '#33a02c']
            : ['#a6cee3', '#1f78b4', '#e8c1a0', '#f47560', '#b2df8a', '#33a02c']
        , [theme.palette.mode])
    const swappedColors = useMemo(() => theme.palette.mode === 'dark'
            ? ['#1f78b4', '#a6cee3', '#f47560', '#e8c1a0', '#33a02c', '#b2df8a']
            : ['#1f78b4', '#a6cee3', '#f47560', '#e8c1a0', '#33a02c', '#b2df8a']
        , [theme.palette.mode])
    const aggregateColor = theme.palette.mode === 'dark' ? '#eeee33' : '#eeee33'
    const baseColors = reverseColors
        ? swappedColors.slice(0, nonAggregateItems.length)
        : allColors.slice(0, nonAggregateItems.length)
    const chartColors = useMemo(() => [...baseColors, aggregateColor], [baseColors, aggregateColor])
    const swapColors = useCallback(() => setReverseColors(!reverseColors), [reverseColors])

    const value = useMemo(() => ({
        allColors,
        swappedColors,
        aggregateColor,
        reverseColors,
        chartColors,
        swapColors,
        settings, setSettings,
        queue, setQueue,
        droppedFiles, setDroppedFiles,
        activeId, setActiveId,
        activeIdList, setActiveIdList,
        viewMode, setViewMode,
        xAxis, setXAxis,
        yAxis, setYAxis,
        binSpacing, setBinSpacing,
        resetToggle, setResetToggle,
        isAnalyzing, setIsAnalyzing,
        manualSelectionId, setManualSelectionId,
        manualSelectionUrl, setManualSelectionUrl,
        overlayOptions, setOverlayOptions,
        activeItem,
        aggregateItem,
        queueItems,
        allItems,
        activeItems,
        activeResult,
        processedActive,
        globalMaxY,
        onFiles,
        analyzeAll,
        handleManualCorners,
        cancelManual,
        handleQueueRemove
    }), [
        allColors,
        swappedColors,
        aggregateColor,
        reverseColors,
        chartColors,
        swapColors,
        settings, setSettings,
        queue, setQueue,
        droppedFiles, setDroppedFiles,
        activeId, setActiveId,
        activeIdList, setActiveIdList,
        viewMode, setViewMode,
        xAxis, setXAxis,
        yAxis, setYAxis,
        binSpacing, setBinSpacing,
        resetToggle, setResetToggle,
        isAnalyzing, setIsAnalyzing,
        manualSelectionId, setManualSelectionId,
        manualSelectionUrl, setManualSelectionUrl,
        overlayOptions, setOverlayOptions,
        activeItem,
        aggregateItem,
        queueItems,
        allItems,
        activeItems,
        activeResult,
        processedActive,
        globalMaxY,
        onFiles,
        analyzeAll,
        handleManualCorners,
        cancelManual,
        handleQueueRemove
    ])

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    )
}

export default PsdDataProvider
