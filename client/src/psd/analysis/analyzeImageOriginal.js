import {PSD_ANALYSIS_VERSION, PSD_TEMPLATES} from '@starter/shared'
import {decodeImageToImageData} from './pipeline/decodeImage.js'
import {detectMarkers} from './pipeline/detectMarkers.js'
import {warpPerspective, getUnwarpedPoint} from './pipeline/warpPerspective.js'
import {normalizeLighting} from './pipeline/normalizeLighting.js'
import {adaptiveThreshold} from './pipeline/thresholdAdaptive.js'
import {morphologyOpen} from './pipeline/morphology.js'
import {detectParticles} from './pipeline/detectParticles.js'
import {detectParticlesTest} from './pipeline/detectParticlesTest.js'
import {distanceTransform, watershed} from './pipeline/overlapSeparation.js'
import {buildHistograms} from './metrics/buildHistograms.js'
import {calculateStatistics} from './metrics/calculateStatistics.js'
import {renderMaskPng, renderOverlayPng, renderDiagnosticPng} from './render/renderOutputs.js'
import {getFileNameWithoutExtension} from '../../util/stringUtils.js'

export async function analyzeImageFiles(file, settings, manualCorners = null, overlayOptions = null, altFilename=null,) {
    const startedAt = new Date().toISOString()
    const imageData = await decodeImageToImageData(file)
    const {testPipeline=false, correctPerspective=true, useMorphology=true} = settings

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
        
        // Always estimate pxPerMm from markers if available, 
        // regardless of whether we warp or not.
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

        if (presentCorners.length === 4) {
            const warpSize = settings.warpSizePx || 2000

            analysisImageData = imageData

            if (correctPerspective) try {
                analysisImageData = warpPerspective(imageData, warpCorners, warpSize)
                pxPerMm = warpSize / template.outerMm
            } catch (e) {
                console.error('Perspective warp failed', e)
                // Fallback to original image if warp fails
                analysisImageData = imageData
            }
            // No snapping needed here as it's a fixed geometric warp
        }

        scaleInfo = {
            pxPerMm,
            mmPerPx: 1 / pxPerMm,
            templateSize: template.sizeMm,
            detectedTemplate: template.sizeMm,
            markerCount: template.markers.length,
            isWarped: correctPerspective && presentCorners.length === 4
        }

        console.log('Scale info:', scaleInfo)

        // Define ROI
        if (presentCorners.length === 4 && correctPerspective) {
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
                const validPoints = innerPoints.filter(p => p !== null)
                const minX = Math.round(Math.min(...validPoints.map(p => p.x)) + (settings.insetPx || 20))
                const maxX = Math.round(Math.max(...validPoints.map(p => p.x)) - (settings.insetPx || 20))
                const minY = Math.round(Math.min(...validPoints.map(p => p.y)) + (settings.insetPx || 20))
                const maxY = Math.round(Math.max(...validPoints.map(p => p.y)) - (settings.insetPx || 20))
                roi = { points: validPoints, actualBounds: {minX, maxX, minY, maxY} }
            }
        }
    }



    const gray = normalizeLighting(analysisImageData, {bgSigma: settings.bgSigma})
    const mask = adaptiveThreshold(gray, {blockSize: settings.adaptiveBlockSize, C: settings.adaptiveC})
    const cleaned = useMorphology ? morphologyOpen(mask) : mask

    // Filter particles by ROI and size if present
    const detectFn = testPipeline ? detectParticlesTest : detectParticles
    console.log(`Using detection function: ${testPipeline ? 'detectParticlesTest' : 'detectParticles'}`)
    let detectResult
    try {
        detectResult = detectFn(mask, {minAreaPx: settings.minAreaPx})
    } catch (e) {
        console.error('Initial particle detection failed', e)
        throw e
    }
    
    // Optional Overlap Separation (Watershed)
    if (settings.splitOverlaps) {
        try {
            const dt = distanceTransform(cleaned)
            const minPeakDist = 3 + (settings.splitSensitivity || 0.5) * 20
            const watershedLabels = watershed(dt, detectResult.labels, minPeakDist)
            detectResult = detectFn(cleaned, {
                minAreaPx: settings.minAreaPx,
                externalLabels: watershedLabels
            })
        } catch (e) {
            console.error('Overlap separation failed', e)
            // Continue with non-split results if watershed fails? 
            // For now, let it throw to surface the error.
            throw e
        }
    }
    
    let particles = detectResult.particles
    console.log(`Initial detection: ${particles.length} particles`)
    
    if (particles.length === 0) {
        throw new Error('No particles detected. Check your threshold settings or image quality.')
    }
    
    // Size filter (Max Surface)
    const maxAreaMm2 = settings.maxAreaMm2 || 10
    const maxAreaPx = maxAreaMm2 * (scaleInfo.pxPerMm ** 2)

    particles = particles.filter(p => p.areaPx <= maxAreaPx)
    console.log(`After size filtering (maxAreaPx: ${maxAreaPx}): ${particles.length} particles`)

    if (particles.length === 0) {
        throw new Error('All detected particles were filtered out (too large). Adjust Max Surface setting.')
    }

    if (roi && roi.actualBounds) {
        const {minX, maxX, minY, maxY} = roi.actualBounds
        particles = particles.filter(p => 
            p.cxPx >= minX && p.cxPx <= maxX && p.cyPx >= minY && p.cyPx <= maxY
        )
        console.log(`After ROI filtering: ${particles.length} particles`)
    }

    if (particles.length === 0) {
        throw new Error('All particles were filtered out (outside analysis region).')
    }

    // Explicitly exclude ArUco markers if not warped
    if (!scaleInfo.isWarped && uniqueMarkers.length > 0) {
        const markerBboxes = uniqueMarkers.map(m => {
            if (!m.corners) return null
            const validCorners = m.corners.filter(c => c !== null)
            if (validCorners.length === 0) return null
            const bx1 = Math.min(...validCorners.map(c => c.x)) - 10
            const bx2 = Math.max(...validCorners.map(c => c.x)) + 10
            const by1 = Math.min(...validCorners.map(c => c.y)) - 10
            const by2 = Math.max(...validCorners.map(c => c.y)) + 10
            return {minX: bx1, maxX: bx2, minY: by1, maxY: by2}
        }).filter(b => b !== null)

        const prevCount = particles.length
        particles = particles.filter(p => {
            const isMarker = markerBboxes.some(b => 
                p.cxPx >= b.minX && p.cxPx <= b.maxX && p.cyPx >= b.minY && p.cyPx <= b.maxY
            )
            return !isMarker
        })
        if (particles.length !== prevCount) {
            console.log(`Excluded ${prevCount - particles.length} particles overlapping markers`)
        }
    }

    if (particles.length === 0) {
        throw new Error('No valid particles remaining after filtering.')
    }

    console.log(`Final analysis: ${particles.length} particles`, particles)

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
        if (scaleInfo.isWarped && warpCorners && correctPerspective) {
            const warpSize = settings.warpSizePx || 2000
            overlayParticles = particles.map(p => {
                const center = getUnwarpedPoint({x: p.cxPx, y: p.cyPx}, warpCorners, warpSize)
                const rawScale = (warpSize - 1) / Math.max(imageData.width, imageData.height)
                
                let unwarpedContour = null
                if (p.contour) {
                    unwarpedContour = p.contour.map(pt => getUnwarpedPoint(pt, warpCorners, warpSize))
                }
                
                return {
                    ...p,
                    cxPx: center.x,
                    cyPx: center.y,
                    longAxisPx: p.longAxisPx / rawScale,
                    shortAxisPx: p.shortAxisPx / rawScale,
                    contour: unwarpedContour
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

    let diagnosticPngDataUrl = null
    try {
        // For the diagnostic view, we also want the threshold pixels in original coordinates.
        // If the main analysis was warped, detectResult.labels is in warped space.
        // We'd need to run a separate thresholding on the original image to show those pixels correctly.
        
        let diagnosticLabels = detectResult.labels
        let diagnosticW = analysisImageData.width
        let diagnosticH = analysisImageData.height
        let diagnosticValidIds = filteredValidIds

        if (scaleInfo.isWarped) {
            console.log('Diagnostic View: Image was warped. Re-running thresholding on original image for diagnostic overlay.')
            // Run thresholding on original image for diagnostic view overlay
            const grayOrig = normalizeLighting(imageData, {bgSigma: settings.bgSigma})
            const maskOrig = adaptiveThreshold(grayOrig, {blockSize: settings.adaptiveBlockSize, C: settings.adaptiveC})
            const cleanedOrig = useMorphology ? morphologyOpen(maskOrig) : maskOrig
            const detectOrig = detectFn(cleanedOrig, {minAreaPx: settings.minAreaPx})
            
            diagnosticLabels = detectOrig.labels
            diagnosticW = width
            diagnosticH = height

            // Filter diagnostic labels to only include those in the original image ROI
            // Note: we can't easily use filteredValidIds here because the IDs in detectOrig 
            // correspond to pagePanels in the original image, not the warped one.
            // We'll re-apply the ROI and size filters to detectOrig.particles
            let diagnosticParticles = detectOrig.particles
            const maxAreaPxOrig = maxAreaMm2 * (pxPerMm ** 2)
            diagnosticParticles = diagnosticParticles.filter(p => p.areaPx <= maxAreaPxOrig)

            if (roi) {
                // If we have template markers, roi was calculated based on them.
                // For non-warped image, it's already in original coords or estimated.
                // We need the original image ROI bounds.
                // If it was warped, the original ROI is defined by the corners of the inner template.
                
                const ids = template?.config.cornerIds
                const markerMap = {}
                template?.markers.forEach(m => { markerMap[m.id] = m })
                const innerPoints = []
                if (markerMap[ids[0]]) innerPoints.push(markerMap[ids[0]].corners[2])
                if (markerMap[ids[1]]) innerPoints.push(markerMap[ids[1]].corners[3])
                if (markerMap[ids[2]]) innerPoints.push(markerMap[ids[2]].corners[0])
                if (markerMap[ids[3]]) innerPoints.push(markerMap[ids[3]].corners[1])

                if (innerPoints.length >= 3) {
                    const validPoints = innerPoints.filter(p => p !== null)
                    const minX = Math.min(...validPoints.map(p => p.x)) + (settings.insetPx || 8)
                    const maxX = Math.max(...validPoints.map(p => p.x)) - (settings.insetPx || 8)
                    const minY = Math.min(...validPoints.map(p => p.y)) + (settings.insetPx || 8)
                    const maxY = Math.max(...validPoints.map(p => p.y)) - (settings.insetPx || 8)
                    
                    diagnosticParticles = diagnosticParticles.filter(p => 
                        p.cxPx >= minX && p.cxPx <= maxX && p.cyPx >= minY && p.cyPx <= maxY
                    )
                }
            }

            if (!scaleInfo.isWarped && uniqueMarkers.length > 0) {
                const markerBboxes = uniqueMarkers.map(m => {
                    if (!m.corners) return null
                    const validCorners = m.corners.filter(c => c !== null)
                    if (validCorners.length === 0) return null
                    const bx1 = Math.min(...validCorners.map(c => c.x)) - 10
                    const bx2 = Math.max(...validCorners.map(c => c.x)) + 10
                    const by1 = Math.min(...validCorners.map(c => c.y)) - 10
                    const by2 = Math.max(...validCorners.map(c => c.y)) + 10
                    return {minX: bx1, maxX: bx2, minY: by1, maxY: by2}
                }).filter(b => b !== null)

                diagnosticParticles = diagnosticParticles.filter(p => {
                    const isMarker = markerBboxes.some(b => 
                        p.cxPx >= b.minX && p.cxPx <= b.maxX && p.cyPx >= b.minY && p.cyPx <= b.maxY
                    )
                    return !isMarker
                })
            }

            diagnosticValidIds = diagnosticParticles.map(p => p.id)
        }

        diagnosticPngDataUrl = await renderDiagnosticPng({
            width,
            height,
            data: imageData.data.slice()
        }, overlayParticles, {
            width: diagnosticW,
            height: diagnosticH,
            labels: diagnosticLabels
        }, diagnosticValidIds, {
            markers: uniqueMarkers,
            template,
            roi,
            scaleInfo,
            warpCorners
        }, overlayOptions || undefined)
    } catch (e) {
        console.error('Diagnostic rendering failed', e)
    }

    return {
        filename: altFilename || getFileNameWithoutExtension(file.name),
        analysisVersion: PSD_ANALYSIS_VERSION,
        testPipeline,
        settings,
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
            overlayPngDataUrl,
            diagnosticPngDataUrl
        }
    }
}
