import * as AR_pkg from 'js-aruco2/src/aruco.js'
import {adaptiveThreshold} from './thresholdAdaptive.js'
import {PSD_TEMPLATES} from '@starter/shared'

// Legacy library uses non-standard exports. We resolve AR based on environment.
const _AR = AR_pkg.AR || (typeof window !== 'undefined' ? window.AR : null) || AR_pkg.default?.AR || AR_pkg

// All known template marker IDs for scoring detected sets
const ALL_TEMPLATE_IDS = new Set(
    Object.values(PSD_TEMPLATES).flatMap(t => t.cornerIds)
)

export function detectMarkers(imageData) {
    const {width, height, data} = imageData

    // js-aruco2's adaptive thresholding uses a fixed small kernel (2x2).
    // In high-resolution images, markers are large and this small kernel fails.
    // Downscaling the image for detection makes it much more robust.
    const maxDim = 2000
    const fullScale = Math.min(1, maxDim / Math.max(width, height))

    // Two scales: capped and half-capped. 1.0 only if image is already small.
    const scales = [...new Set([fullScale, fullScale * 0.5, 1.0])].filter(s => s > 0 && s <= 1)

    const blockSizes = [41, 61]
    const cValues = [4, 1]

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

        // Create detector once per scale
        const detector = new _AR.Detector({dictionaryName: 'ARUCO'})

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
                } catch (_e) {
                    continue
                }

                const deduped = deduplicate(candidates)
                const templateMatches = deduped.filter(m => ALL_TEMPLATE_IDS.has(m.id)).length

                if (templateMatches > bestScore) {
                    bestScore = templateMatches
                    // Scale corners back to original coordinates
                    bestMarkers = deduped.map(m => ({
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
