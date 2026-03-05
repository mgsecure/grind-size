import * as AR_pkg from 'js-aruco2/src/aruco.js'
import {adaptiveThreshold} from './thresholdAdaptive.js'
import {PSD_TEMPLATES} from '@starter/shared'

// Legacy library uses non-standard exports. We resolve AR based on environment.
const _AR = AR_pkg.AR || (typeof window !== 'undefined' ? window.AR : null) || AR_pkg.default?.AR || AR_pkg

// All known template marker IDs for scoring detected sets
const ALL_TEMPLATE_IDS = new Set(
    Object.values(PSD_TEMPLATES).flatMap(t => t.cornerIds)
)

export function detectMarkersCandidate(imageData) {
    const {width, height, data} = imageData

    // js-aruco2's adaptive thresholding uses a fixed small kernel (2x2).
    // In high-resolution images, markers are large and this small kernel fails.
    // Downscaling the image for detection makes it much more robust.
    const maxDim = 2000
    const fullScale = Math.min(1, maxDim / Math.max(width, height))

    // Build a set of scaled images to search across
    // Include 1.0 explicitly so high-res images are also tried at native resolution
    const scales = [...new Set([1.0, fullScale, fullScale * 0.5, fullScale * 0.25])].filter(s => s > 0 && s <= 1)

    const dictionaries = ['ARUCO', 'ARUCO_MIP_36h12']
    const blockSizes = [41, 61, 101]
    const cValues = [4, 10, 1]

    let bestMarkers = []
    let bestScore = -1

    for (const scale of scales) {
        const sw = Math.round(width * scale)
        const sh = Math.round(height * scale)

        // Downscale image using canvas
        let detectionImage
        if (scale < 1) {
            const canvas = document.createElement('canvas')
            canvas.width = sw
            canvas.height = sh
            const ctx = canvas.getContext('2d')

            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = width
            tempCanvas.height = height
            const tempCtx = tempCanvas.getContext('2d')
            tempCtx.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0)
            ctx.drawImage(tempCanvas, 0, 0, sw, sh)
            detectionImage = ctx.getImageData(0, 0, sw, sh)
        } else {
            detectionImage = imageData
        }

        // Grayscale (blue channel for marker contrast)
        const gray = new Uint8ClampedArray(sw * sh)
        const dData = detectionImage.data
        for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
            gray[i] = dData[p + 2]
        }

        for (const dictName of dictionaries) {
            const detector = new _AR.Detector({dictionaryName: dictName})

            for (const blockSize of blockSizes) {
                for (const C of cValues) {
                    // Pre-threshold the image for robust detection
                    const {mask} = adaptiveThreshold({width: sw, height: sh, gray}, {blockSize, C})
                    const preThresholded = new ImageData(sw, sh)
                    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
                        const v = 255 - mask[i]
                        preThresholded.data[p] = v
                        preThresholded.data[p + 1] = v
                        preThresholded.data[p + 2] = v
                        preThresholded.data[p + 3] = 255
                    }

                    let candidates = []
                    try {
                        candidates = detector.detect(preThresholded)
                    } catch (e) {
                        continue
                    }

                    // Also try raw grayscale
                    let greyMarkers = []
                    try {
                        const greyImg = new ImageData(sw, sh)
                        for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
                            const v = gray[i]
                            greyImg.data[p] = v
                            greyImg.data[p + 1] = v
                            greyImg.data[p + 2] = v
                            greyImg.data[p + 3] = 255
                        }
                        greyMarkers = detector.detect(greyImg)
                    } catch (e) {
                        // ignore
                    }

                    // Pick whichever set has more template matches
                    const score = (markers) => {
                        const deduped = deduplicate(markers)
                        const templateMatches = deduped.filter(m => ALL_TEMPLATE_IDS.has(m.id)).length
                        return {deduped, templateMatches}
                    }

                    const s1 = score(candidates)
                    const s2 = score(greyMarkers)
                    const best = s1.templateMatches >= s2.templateMatches ? s1 : s2

                    if (best.templateMatches > bestScore) {
                        bestScore = best.templateMatches
                        // Scale corners back to original coordinates
                        bestMarkers = best.deduped.map(m => ({
                            ...m,
                            corners: m.corners.map(c => ({x: c.x / scale, y: c.y / scale}))
                        }))
                    }

                    // Early exit if we found all 4 corners of any template
                    if (bestScore >= 4) break
                }
                if (bestScore >= 4) break
            }
            if (bestScore >= 4) break
        }
        if (bestScore >= 4) break
    }

    console.log('detectMarkersCandidate: best markers', bestMarkers.map(m => m.id), 'score', bestScore)

    return bestMarkers
}

function deduplicate(markers) {
    const byId = {}
    for (const m of markers) {
        if (!byId[m.id] || m.hammingDistance < byId[m.id].hammingDistance) {
            byId[m.id] = m
        }
    }
    return Object.values(byId)
}
