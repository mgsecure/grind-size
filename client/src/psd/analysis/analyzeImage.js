import {PSD_ANALYSIS_VERSION, PSD_TEMPLATES} from '@starter/shared'
import {decodeImageToImageData} from './pipeline/decodeImage.js'
import {detectMarkers} from './pipeline/detectMarkers.js'
import {normalizeLighting} from './pipeline/normalizeLighting.js'
import {adaptiveThreshold} from './pipeline/thresholdAdaptive.js'
import {morphologyOpen} from './pipeline/morphology.js'
import {detectParticles} from './pipeline/detectParticles.js'
import {buildHistograms} from './metrics/buildHistograms.js'
import {calculateStatistics} from './metrics/calculateStatistics.js'
import {renderMaskPng, renderOverlayPng} from './render/renderOutputs.js'

export async function analyzeImageFiles(file, settings) {
    const startedAt = new Date().toISOString()
    const imageData = await decodeImageToImageData(file)
    const {width, height} = imageData

    // detectMarkers might modify imageData.data (grayscale/threshold in js-aruco2)
    // We use slice() to ensure a deep copy of the buffer.
    const markers = detectMarkers({
        width,
        height,
        data: imageData.data.slice()
    })
    console.log('Detected markers:', markers)

    const gray = normalizeLighting(imageData, {bgSigma: settings.bgSigma})
    const mask = adaptiveThreshold(gray, {blockSize: settings.adaptiveBlockSize, C: settings.adaptiveC})
    const cleaned = morphologyOpen(mask)

    // Identify template
    let template = null
    const matched100 = markers.filter(m => PSD_TEMPLATES[100].cornerIds.includes(m.id))
    const matched50 = markers.filter(m => PSD_TEMPLATES[50].cornerIds.includes(m.id))

    if (matched100.length >= matched50.length && matched100.length >= 3) {
        template = {sizeMm: 100, outerMm: 130, innerMm: 100, markers: matched100, config: PSD_TEMPLATES[100]}
    } else if (matched50.length >= 3) {
        template = {sizeMm: 50, outerMm: 70, innerMm: 50, markers: matched50, config: PSD_TEMPLATES[50]}
    }

    let pxPerMm = width / settings.templateSize // fallback
    let roi = null
    let scaleInfo = {pxPerMm, templateSize: settings.templateSize}

    if (template) {
        const markerMap = {}
        template.markers.forEach(m => {
            markerMap[m.id] = m
        })

        const ids = template.config.cornerIds
        // corners: [TL, TR, BR, BL]
        const outerPoints = []
        const innerPoints = []

        if (markerMap[ids[0]]) {
            outerPoints.push(markerMap[ids[0]].corners[0])
            innerPoints.push(markerMap[ids[0]].corners[2])
        }
        if (markerMap[ids[1]]) {
            outerPoints.push(markerMap[ids[1]].corners[1])
            innerPoints.push(markerMap[ids[1]].corners[3])
        }
        if (markerMap[ids[2]]) {
            outerPoints.push(markerMap[ids[2]].corners[2])
            innerPoints.push(markerMap[ids[2]].corners[0])
        }
        if (markerMap[ids[3]]) {
            outerPoints.push(markerMap[ids[3]].corners[3])
            innerPoints.push(markerMap[ids[3]].corners[1])
        }

        // Calculate scale from outer corners
        if (outerPoints.length >= 2) {
            const getDist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
            const getP = (i) => markerMap[ids[i]] ? markerMap[ids[i]].corners[i] : null
            const pairs = [[0, 1], [1, 2], [2, 3], [3, 0]]
            
            let distSum = 0
            let count = 0
            pairs.forEach(([i1, i2]) => {
                const p1 = getP(i1)
                const p2 = getP(i2)
                if (p1 && p2) {
                    distSum += getDist(p1, p2)
                    count++
                }
            })
            
            if (count > 0) {
                pxPerMm = distSum / (count * template.outerMm)
                if (Math.abs(pxPerMm - 20) < 0.02) pxPerMm = 20
            } else if (outerPoints.length === 2) {
                const p1 = outerPoints[0]
                const p2 = outerPoints[1]
                pxPerMm = getDist(p1, p2) / (Math.sqrt(2) * template.outerMm)
            }
        }

        // Define ROI polygon from inner points
        if (innerPoints.length >= 3) {
            roi = {
                points: innerPoints,
                insetPx: settings.insetPx || 20
            }
        }

        scaleInfo = {
            pxPerMm,
            mmPerPx: 1 / pxPerMm,
            templateSize: template.sizeMm,
            detectedTemplate: template.sizeMm,
            markerCount: template.markers.length
        }
    }

    // Filter particles by ROI and size if present
    const detectResult = detectParticles(cleaned, {minAreaPx: settings.minAreaPx})
    let particles = detectResult.particles
    
    // Size filter (Max Surface)
    const maxAreaMm2 = settings.maxAreaMm2 || 10
    const maxAreaPx = maxAreaMm2 * (scaleInfo.pxPerMm ** 2)

    particles = particles.filter(p => p.areaPx <= maxAreaPx)

    if (roi && roi.points.length >= 3) {
        // Use bounding box of inner corners + inset
        const minX = Math.round(Math.min(...roi.points.map(p => p.x)) + roi.insetPx)
        const maxX = Math.round(Math.max(...roi.points.map(p => p.x)) - roi.insetPx)
        const minY = Math.round(Math.min(...roi.points.map(p => p.y)) + roi.insetPx)
        const maxY = Math.round(Math.max(...roi.points.map(p => p.y)) - roi.insetPx)

        roi.actualBounds = {minX, maxX, minY, maxY}

        particles = particles.filter(p => 
            p.cxPx >= minX && p.cxPx <= maxX && p.cyPx >= minY && p.cyPx <= maxY
        )
        
        // Also explicitly exclude ArUco markers themselves using their bounding boxes
        // Increase marker bbox size slightly to catch bits or fragmentation
        const markerBboxes = markers.map(m => {
            const bx1 = Math.min(...m.corners.map(c => c.x)) - 10
            const bx2 = Math.max(...m.corners.map(c => c.x)) + 10
            const by1 = Math.min(...m.corners.map(c => c.y)) - 10
            const by2 = Math.max(...m.corners.map(c => c.y)) + 10
            return {minX: bx1, maxX: bx2, minY: by1, maxY: by2}
        })

        particles = particles.filter(p => {
            const isMarker = markerBboxes.some(b => 
                p.cxPx >= b.minX && p.cxPx <= b.maxX && p.cyPx >= b.minY && p.cyPx <= b.maxY
            )
            return !isMarker
        })
    }

    const hist = buildHistograms(particles, {
        bins: settings.bins,
        spacing: settings.binSpacing,
        weighting: settings.weighting,
        mmPerPx: scaleInfo.mmPerPx
    })

    const stats = calculateStatistics(particles, {
        weighting: settings.weighting,
        mmPerPx: scaleInfo.mmPerPx
    })

    const maskPngDataUrl = await renderMaskPng(detectResult, width, height, {
        width,
        height,
        data: imageData.data.slice()
    }, particles.map(p => p.id))
    
    // We pass a clone to renderOverlayPng just in case, though it should be read-only
    const overlayPngDataUrl = await renderOverlayPng({
        width,
        height,
        data: imageData.data.slice()
    }, particles, {
        markers,
        template,
        roi,
        scaleInfo
    })

    return {
        analysisVersion: PSD_ANALYSIS_VERSION,
        startedAt,
        image: {width, height},
        scale: scaleInfo,
        parameters: settings,
        particles,
        histogram: hist,
        stats,
        markers,
        template: template ? {sizeMm: template.sizeMm} : null,
        roi,
        previews: {
            maskPngDataUrl,
            overlayPngDataUrl
        }
    }
}
