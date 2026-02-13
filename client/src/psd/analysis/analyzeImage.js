import {PSD_ANALYSIS_VERSION} from '@starter/shared'
import {decodeImageToImageData} from './pipeline/decodeImage.js'
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

    // Placeholder: assumes whole image is the analysis area (until ArUco/quads are implemented)
    const {width, height, data} = imageData

    const gray = normalizeLighting(imageData, {bgSigma: settings.bgSigma})
    const mask = adaptiveThreshold(gray, {blockSize: settings.adaptiveBlockSize, C: settings.adaptiveC})
    const cleaned = morphologyOpen(mask)

    const particles = detectParticles(cleaned, {minAreaPx: settings.minAreaPx})

    // Placeholder scale (until ArUco implemented). Uses templateSize + assumes full width corresponds to templateSize.
    const pxPerMm = width / settings.templateSize
    const mmPerPx = 1 / pxPerMm

    const hist = buildHistograms(particles, {
        bins: settings.bins,
        spacing: settings.binSpacing,
        weighting: settings.weighting
    })

    const stats = calculateStatistics(particles, {
        weighting: settings.weighting
    })

    const maskPngDataUrl = await renderMaskPng(cleaned, width, height)
    const overlayPngDataUrl = await renderOverlayPng(imageData, particles)

    return {
        analysisVersion: PSD_ANALYSIS_VERSION,
        startedAt,
        image: {width, height},
        scale: {pxPerMm, mmPerPx, templateSize: settings.templateSize},
        parameters: settings,
        particles,
        histogram: hist,
        stats,
        previews: {
            maskPngDataUrl,
            overlayPngDataUrl
        }
    }
}
