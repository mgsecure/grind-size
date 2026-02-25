import React, {useCallback, useEffect, useMemo, useState} from 'react'
import DataContext from '../context/DataContext.jsx'
import {PSD_DEFAULTS, PSD_PRESETS} from '@starter/shared'
import {analyzeImageFiles} from './analysis/analyzeImage.js'
import {buildHistograms} from './analysis/metrics/buildHistograms.js'
import {calculateStatistics} from './analysis/metrics/calculateStatistics.js'
import {getFileNameWithoutExtension} from '../util/stringUtils.js'
import {v4 as uuidv4} from 'uuid'
import useWindowSize from '../util/useWindowSize.jsx'
import {useLocalStorage} from 'usehooks-ts'

export function PsdDataProvider({children}) {
    const {isDesktop} = useWindowSize()

    const defaultBins = useMemo(() => isDesktop ? 30 : 20, [isDesktop])

    // State from PsdPage
    const [settings, setSettings] = useState({...PSD_DEFAULTS, bins: defaultBins})
    const [customSettings, setCustomSettings] = useLocalStorage('psd-custom', undefined)
    const [retainCustomSettings, setRetainCustomSettings] = useState(!!customSettings)
    const [isCustomSettings, setIsCustomSettings] = useState(false)
    const [queue, setQueue] = useState([]) // {id, file, status, error, result}
    const [droppedFiles, setDroppedFiles] = useState([])
    const [activeIdList, setActiveIdList] = useState([])
    const [xAxis, setXAxis] = useState(settings.metric || 'diameter')
    const [yAxis, setYAxis] = useState(settings.value || 'mass')
    const [binSpacing, setBinSpacing] = useState(settings.binSpacing || 'log')
    const [resetToggle, setResetToggle] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [manualSelectionId, setManualSelectionId] = useState(null) // ID of file needing manual corners
    const [manualSelectionUrl, setManualSelectionUrl] = useState(null)
    const [overlayOptions, setOverlayOptions] = useState({
        showParticles: true, showMarkers: true, showScale: true, showRoi: true
    })
    const [showTitleBar, setShowTitleBar] = useState(false)

    const processedCount = useMemo(() => queue.reduce((acc, q) => {
        acc = acc + ((q.status === 'done' && q.result) || q.status === 'error' ? 1 : 0)
        return acc
    }, 0), [queue])

    const processingComplete = useMemo(() => {
        return (queue.length === processedCount)
    }, [processedCount, queue.length])

    const normalizedParticles = useMemo(() => {
        return queue.filter(q => q.status === 'done' && q.result).flatMap(item => {
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
    }, [queue])

    // TODO: create aggregate item for export/import

    const aggregateItem = useMemo(() => {
        if (queue.filter(q => q.status === 'done' && q.result).length < 2) return null
        const activeData = {
            id: 'aggregateResults',
            filename: 'Aggregate',
            scale: {mmPerPx: 0.001, pxPerMm: 1000, detectedTemplate: 'Multiple'},
            status: queue.find(q => q.status !== 'done') ? 'analyzing' : 'done',
            histograms: null
        }
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
        return {
            ...activeData,
            histograms: hists,
            stats,
            status: processingComplete ? 'done' : 'analyzing'
        }
    }, [queue, normalizedParticles, settings.bins, settings.binsType, binSpacing, yAxis, xAxis, processingComplete])

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
                    filename: q.filename || result.filename || q.file?.name || '',
                    stats: stats,
                    histograms: hists,
                    scale: result.scale || {},
                    settings: result.settings || {},
                    error: q.error,
                    status: q.status || 'queued',
                    source: q.source || 'upload'
                }
            }
            return {
                id: q.id,
                filename: q.result.filename || getFileNameWithoutExtension(q.file?.name) || '',
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

    const getItemDetails = useCallback((item) => {
        if (!item) return {}
        return {
            filename: item.filename,
            scale: item.scale,
            settings: item.settings,
            error: item.error,
            status: item.status,
            source: item.source,
            imported: item.source === 'import',
            active: activeIdList.includes(item.id),
            aggregate: item.filename === 'Aggregate'
        }
    },[activeIdList])

    const activeItems = useMemo(() => allItems.filter(q => !!getItemDetails(q).active), [allItems, getItemDetails])

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
            id: uuidv4(),
            file,
            status: 'queued',
            error: null,
            result: null
        }))
        setQueue(prev => [...prev, ...next])
        setDroppedFiles([])

    }, [queue])

    const analyzeAll = useCallback(() => {
        setQueue(prevQueue => {
            return prevQueue
                .map(item => item.source !== 'import'
                    ? ({
                        ...item,
                        status: 'queued',
                        error: null
                    })
                    : item
                )
        })
    }, [])

    useEffect(() => {
        if (resetToggle) {
            console.log('Resetting queue', {settings})
            analyzeAll()
            setResetToggle(false)
        }
    }, [resetToggle, analyzeAll, settings])

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
                    console.log(`Starting analysis for ${item.file?.name}`)
                    const result = await analyzeImageFiles(item.file, {
                        ...settings,
                        binSpacing
                    }, null, overlayOptions, null)

                    console.log('Analysis result:', result)
                    if (!result.template && !result.scale?.detectedTemplate) {
                        setManualSelectionId(item.id)
                        setQueue(prev => prev.map(p => p.id === item.id ? {...p, status: 'manual_needed'} : p))
                        setIsAnalyzing(false)
                        return
                    }
                    setActiveIdList(prev => prev.concat(item.id))
                    setQueue(prev => prev.map(p => p.id === item.id
                        ? {
                            ...p, sampleName: result.filename,
                            status: 'done',
                            result
                        }
                        : p
                    ))
                } catch (err) {
                    console.error('Analysis failed:', err)
                    // Log the full error object and stack trace
                    if (err instanceof Error) {
                        console.error(err.stack)
                    }
                    setQueue(prev => prev.map(p => p.id === item.id ? {
                        ...p,
                        status: 'error',
                        error: err.message || String(err),
                        result: null
                    } : p))
                }
            }
            setIsAnalyzing(false)
        }
        startAnalysis().then()
    }, [queue, settings, binSpacing, isAnalyzing, manualSelectionId, overlayOptions])

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

// Process selected image with multiple settings
    const processMultipleSettings = useCallback(async (id, settingsList = {...PSD_PRESETS}) => {
        const item = queue.find(q => q.id === id)
        if (!item) return

        if (isCustomSettings) {
            settingsList.custom.params = {...PSD_DEFAULTS, ...settings}
        } else {
            delete settingsList.custom
        }
        for (const [key, value] of Object.entries(settingsList)) {
            try {
                const result = await analyzeImageFiles(item.file, {
                    ...PSD_DEFAULTS, ...value.params,
                    binSpacing
                }, null, overlayOptions, `${item.result.filename}-${key}`)
                console.log('Processed', {result})
                const newItem = {...item, id: uuidv4(), status: 'done', result}
                setQueue(prev => prev.concat(newItem))
            } catch (err) {
                console.error('err', {err})
            }
        }
        setQueue(prev => prev.filter(p => p.id !== id))
        setActiveIdList([])

    }, [binSpacing, isCustomSettings, overlayOptions, queue, settings])

// Manual corner selection
    const handleManualCorners = useCallback(async (corners) => {
        const id = manualSelectionId
        setManualSelectionId(null)
        setQueue(prev => prev.map(p => p.id === id ? {...p, status: 'analyzing'} : p))

        try {
            const item = queue.find(q => q.id === id)
            const result = await analyzeImageFiles(item.file, {...settings, binSpacing}, corners, overlayOptions, null)
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


    const value = useMemo(() => ({
        settings, setSettings,
        customSettings, setCustomSettings,
        retainCustomSettings, setRetainCustomSettings,
        isCustomSettings, setIsCustomSettings,
        queue, setQueue,
        processingComplete,
        droppedFiles, setDroppedFiles,
        activeIdList, setActiveIdList,
        xAxis, setXAxis,
        yAxis, setYAxis,
        binSpacing, setBinSpacing,
        resetToggle, setResetToggle,
        isAnalyzing, setIsAnalyzing,
        manualSelectionId, setManualSelectionId,
        manualSelectionUrl, setManualSelectionUrl,
        overlayOptions, setOverlayOptions,
        aggregateItem,
        queueItems,
        allItems,
        activeItems,
        getItemDetails,
        globalMaxY,
        isDesktop,
        onFiles,
        analyzeAll,
        handleQueueRemove,
        processMultipleSettings,
        handleManualCorners,
        cancelManual,
        showTitleBar, setShowTitleBar,
    }), [
        settings, setSettings,
        customSettings, setCustomSettings,
        retainCustomSettings, setRetainCustomSettings,
        isCustomSettings, setIsCustomSettings,
        queue, setQueue,
        processingComplete,
        droppedFiles, setDroppedFiles,
        activeIdList, setActiveIdList,
        xAxis, setXAxis,
        yAxis, setYAxis,
        binSpacing, setBinSpacing,
        resetToggle, setResetToggle,
        isAnalyzing, setIsAnalyzing,
        manualSelectionId, setManualSelectionId,
        manualSelectionUrl, setManualSelectionUrl,
        overlayOptions, setOverlayOptions,
        aggregateItem,
        queueItems,
        allItems,
        activeItems,
        getItemDetails,
        globalMaxY,
        isDesktop,
        onFiles,
        analyzeAll,
        handleQueueRemove,
        processMultipleSettings,
        handleManualCorners,
        cancelManual,
        showTitleBar, setShowTitleBar,
    ])

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    )
}

export default PsdDataProvider
