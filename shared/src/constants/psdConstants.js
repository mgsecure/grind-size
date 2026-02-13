export const PSD_ANALYSIS_VERSION = '1.0.0'

// Template signatures: unique corner ID sets per template size (mm)
export const PSD_TEMPLATES = {
    100: {sizeMm: 100, cornerIds: [0, 1, 2, 3]},
    50: {sizeMm: 50, cornerIds: [10, 11, 12, 13]}
}

// Defaults
export const PSD_DEFAULTS = {
    warpSizePx: 2000,
    insetPx: 8,
    bgSigma: 35,
    adaptiveBlockSize: 71,
    adaptiveC: 4,
    minAreaPx: 8,
    bins: 30,
    binSpacing: 'log', // 'log' | 'linear'
    weighting: 'count', // 'count' | 'surface' | 'volume'
    chartMode: 'bar' // 'bar' | 'line'
}

export const API_PREFIX = '/api'
