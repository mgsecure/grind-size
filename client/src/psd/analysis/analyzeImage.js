import {PSD_ANALYSIS_VERSION, PSD_TEMPLATES} from '@starter/shared'
import {decodeImageToImageData} from './pipeline/decodeImage.js'
import {detectMarkers} from './pipeline/detectMarkers.js'
import {warpPerspective, getUnwarpedPoint} from './pipeline/warpPerspective.js'
import {normalizeLighting} from './pipeline/normalizeLighting.js'
import {adaptiveThreshold} from './pipeline/thresholdAdaptive.js'
import {morphologyOpen} from './pipeline/morphology.js'
import {detectParticles} from './pipeline/detectParticles.js'
import {distanceTransform, watershed} from './pipeline/overlapSeparation.js'
import {buildHistograms} from './metrics/buildHistograms.js'
import {calculateStatistics} from './metrics/calculateStatistics.js'
import {renderMaskPng, renderOverlayPng} from './render/renderOutputs.js'
import {getFileNameWithoutExtension} from '../../util/stringUtils.js'

export async function analyzeImageFiles(file, settings, manualCorners = null, overlayOptions = null) {
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
    // Filter duplicate markers (keep lowest hammingDistance)
    const uniqueMarkers = []
    const markerById = {}
    markers.forEach(m => {
        if (!markerById[m.id] || m.hammingDistance < markerById[m.id].hammingDistance) {
            markerById[m.id] = m
        }
    })
    Object.values(markerById).forEach(m => uniqueMarkers.push(m))

    // Identify template
    let template = null
    try {
        const matched100 = uniqueMarkers.filter(m => PSD_TEMPLATES[100].cornerIds.includes(m.id))
        const matched50 = uniqueMarkers.filter(m => PSD_TEMPLATES[50].cornerIds.includes(m.id))

        if (matched100.length >= matched50.length && (matched100.length >= 3 || manualCorners)) {
            template = {sizeMm: 100, outerMm: 130, innerMm: 100, markers: matched100, config: PSD_TEMPLATES[100]}
        } else if (matched50.length >= 3 || manualCorners) {
            template = {sizeMm: 50, outerMm: 70, innerMm: 50, markers: matched50, config: PSD_TEMPLATES[50]}
        }
    } catch (e) {
        console.error('Template identification failed', e)
    }

    let pxPerMm = width / settings.templateSize // fallback
    let roi = null
    let scaleInfo = {pxPerMm, templateSize: settings.templateSize}
    let analysisImageData = imageData
    let warpCorners = manualCorners || null

    if (template) {
        const markerMap = {}
        template.markers.forEach(m => {
            markerMap[m.id] = m
        })

        const ids = template.config.cornerIds
        
        if (!warpCorners) {
            // Use outer corners for perspective warp
            // corners: [TL, TR, BR, BL]
            warpCorners = ids.map((id, i) => {
                return markerMap[id] ? markerMap[id].corners[i] : null
            })
        }

        const presentCorners = warpCorners.filter(c => c !== null)
        
        if (presentCorners.length === 4) {
            const warpSize = settings.warpSizePx || 2000
            try {
                analysisImageData = warpPerspective(imageData, warpCorners, warpSize)
                pxPerMm = warpSize / template.outerMm
            } catch (e) {
                console.error('Perspective warp failed', e)
                // Fallback to original image if warp fails
                analysisImageData = imageData
                pxPerMm = width / template.outerMm
            }
            // No snapping needed here as it's a fixed geometric warp
        } else {
            // Fallback: estimate scale from available markers
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
            }
        }

        scaleInfo = {
            pxPerMm,
            mmPerPx: 1 / pxPerMm,
            templateSize: template.sizeMm,
            detectedTemplate: template.sizeMm,
            markerCount: template.markers.length,
            isWarped: presentCorners.length === 4
        }

        // Define ROI
        if (presentCorners.length === 4) {
            const outerMm = template.outerMm
            const innerMm = template.innerMm
            const marginMm = (outerMm - innerMm) / 2
            const marginPx = marginMm * pxPerMm
            const sizePx = settings.warpSizePx || 2000
            
            roi = {
                actualBounds: {
                    minX: Math.round(marginPx + (settings.insetPx || 8)),
                    maxX: Math.round(sizePx - marginPx - (settings.insetPx || 8)),
                    minY: Math.round(marginPx + (settings.insetPx || 8)),
                    maxY: Math.round(sizePx - marginPx - (settings.insetPx || 8))
                }
            }
        } else {
            const innerPoints = []
            if (markerMap[ids[0]]) innerPoints.push(markerMap[ids[0]].corners[2])
            if (markerMap[ids[1]]) innerPoints.push(markerMap[ids[1]].corners[3])
            if (markerMap[ids[2]]) innerPoints.push(markerMap[ids[2]].corners[0])
            if (markerMap[ids[3]]) innerPoints.push(markerMap[ids[3]].corners[1])

            if (innerPoints.length >= 3) {
                const validPoints = innerPoints.filter(p => p != null)
                if (validPoints.length >= 3) {
                    const minX = Math.round(Math.min(...validPoints.map(p => p.x)) + (settings.insetPx || 20))
                    const maxX = Math.round(Math.max(...validPoints.map(p => p.x)) - (settings.insetPx || 20))
                    const minY = Math.round(Math.min(...validPoints.map(p => p.y)) + (settings.insetPx || 20))
                    const maxY = Math.round(Math.max(...validPoints.map(p => p.y)) - (settings.insetPx || 20))
                    roi = { points: validPoints, actualBounds: {minX, maxX, minY, maxY} }
                }
            }
        }
    }

    const gray = normalizeLighting(analysisImageData, {bgSigma: settings.bgSigma})
    const mask = adaptiveThreshold(gray, {blockSize: settings.adaptiveBlockSize, C: settings.adaptiveC})
    const cleaned = morphologyOpen(mask)

    // Filter particles by ROI and size if present
    let detectResult = detectParticles(cleaned, {minAreaPx: settings.minAreaPx})
    
    // Optional Overlap Separation (Watershed)
    if (settings.splitOverlaps) {
        const dt = distanceTransform(cleaned)
        const minPeakDist = 3 + (settings.splitSensitivity || 0.5) * 20
        const watershedLabels = watershed(dt, detectResult.labels, minPeakDist)
        detectResult = detectParticles(cleaned, {
            minAreaPx: settings.minAreaPx,
            externalLabels: watershedLabels
        })
    }
    
    let particles = detectResult.particles
    
    // Size filter (Max Surface)
    const maxAreaMm2 = settings.maxAreaMm2 || 10
    const maxAreaPx = maxAreaMm2 * (scaleInfo.pxPerMm ** 2)

    particles = particles.filter(p => p.areaPx <= maxAreaPx)

    if (roi && roi.actualBounds) {
        const {minX, maxX, minY, maxY} = roi.actualBounds
        particles = particles.filter(p => 
            p.cxPx >= minX && p.cxPx <= maxX && p.cyPx >= minY && p.cyPx <= maxY
        )
    }

    // Explicitly exclude ArUco markers if not warped
    if (!scaleInfo.isWarped && uniqueMarkers.length > 0) {
        const markerBboxes = uniqueMarkers.map(m => {
            if (!m.corners) return null
            const validCorners = m.corners.filter(c => c != null)
            if (validCorners.length === 0) return null
            const bx1 = Math.min(...validCorners.map(c => c.x)) - 10
            const bx2 = Math.max(...validCorners.map(c => c.x)) + 10
            const by1 = Math.min(...validCorners.map(c => c.y)) - 10
            const by2 = Math.max(...validCorners.map(c => c.y)) + 10
            return {minX: bx1, maxX: bx2, minY: by1, maxY: by2}
        }).filter(b => b != null)

        const prevCount = particles.length
        particles = particles.filter(p => {
            const isMarker = markerBboxes.some(b => 
                p.cxPx >= b.minX && p.cxPx <= b.maxX && p.cyPx >= b.minY && p.cyPx <= b.maxY
            )
            return !isMarker
        })
        if (particles.length !== prevCount) {
            console.log(`Excluded ${prevCount - particles.length} particles overlapping markers`);
        }
    }

    const filteredValidIds = particles.map(p => p.id)

    // Calculate confidence / warnings (Section 14)
    const warnings = []
    if (uniqueMarkers.length < 4) {
        warnings.push(`Low marker confidence: only ${uniqueMarkers.length} markers detected. Results may be less accurate.`)
    }
    
    // Check for lighting unevenness (crude heuristic based on normalization range)
    // We could use gray.gray (the normalized image) stats
    let sumVal = 0, sumSq = 0
    for (let i = 0; i < gray.gray.length; i++) {
        const v = gray.gray[i]
        sumVal += v
        sumSq += v * v
    }
    const avg = sumVal / gray.gray.length
    const std = Math.sqrt(sumSq / gray.gray.length - avg * avg)
    if (std < 10) {
        warnings.push('Low contrast detected. Ensure the image is well-lit and grinds are distinct from the background.')
    }

    // Map particles back to original coordinates for the overlay if warped
    let overlayParticles = particles
    try {
        if (scaleInfo.isWarped && warpCorners) {
            overlayParticles = particles.map(p => {
                const center = getUnwarpedPoint({x: p.cxPx, y: p.cyPx}, warpCorners, settings.warpSizePx || 2000)
                const rawScale = (settings.warpSizePx || 2000) / imageData.width // approximate
                return {
                    ...p,
                    cxPx: center.x,
                    cyPx: center.y,
                    longAxisPx: p.longAxisPx / rawScale,
                    shortAxisPx: p.shortAxisPx / rawScale,
                }
            })
        }
    } catch (e) {
        console.error('Particle unwarping failed', e)
    }

    const hist = buildHistograms(particles, {
        binCount: settings.bins,
        spacing: settings.binSpacing,
        weighting: settings.weighting,
        mmPerPx: scaleInfo.mmPerPx,
        metric: settings.metric,
        binsType: settings.binsType
    })

    const stats = calculateStatistics(particles, {
        weighting: settings.weighting,
        mmPerPx: scaleInfo.mmPerPx,
        metric: settings.metric || 'diameter'
    })

    let maskPngDataUrl = null
    try {
        maskPngDataUrl = await renderMaskPng({
            labels: detectResult.labels,
            width: analysisImageData.width,
            height: analysisImageData.height
        }, analysisImageData.width, analysisImageData.height, {
            width: analysisImageData.width,
            height: analysisImageData.height,
            data: analysisImageData.data.slice()
        }, filteredValidIds)
    } catch (e) {
        console.error('Mask rendering failed', e)
    }
    
    // We pass a clone to renderOverlayPng just in case, though it should be read-only
    let overlayPngDataUrl = null
    try {
        overlayPngDataUrl = await renderOverlayPng({
            width,
            height,
            data: imageData.data.slice()
        }, overlayParticles, {
            markers: uniqueMarkers,
            template,
            roi,
            scaleInfo,
            warpCorners
        }, overlayOptions || undefined)
    } catch (e) {
        console.error('Overlay rendering failed', e)
    }

    return {
        filename: getFileNameWithoutExtension(file.name),
        analysisVersion: PSD_ANALYSIS_VERSION,
        startedAt,
        image: {width, height},
        scale: scaleInfo,
        parameters: { ...settings, overlayOptions },
        particles,
        histograms: hist,
        stats,
        markers: uniqueMarkers,
        template: template ? {sizeMm: template.sizeMm} : null,
        roi,
        warnings,
        previews: {
            maskPngDataUrl,
            overlayPngDataUrl
        }
    }
}
