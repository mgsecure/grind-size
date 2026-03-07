export const PSD_ANALYSIS_VERSION = '1.0.0'

// Template signatures: unique corner ID sets per template size (mm)
export const PSD_TEMPLATES = {
    100: {sizeMm: 100, cornerIds: [0, 1, 2, 3], outerMm: 130, innerMm: 100},
    75: {sizeMm: 75, cornerIds: [20, 21, 22, 23], outerMm: 105, innerMm: 75},
    50: {sizeMm: 50, cornerIds: [10, 11, 12, 13], outerMm: 70, innerMm: 50} // 10mm margins
}

export const overlapSplitPresets = {
    'Off': {
        overlapPresetName: 'Off',
        splitOverlaps: false,
        splitSensitivity: 0,
        extraSeedSensitivity: 0,
        extraSeedMinDistFactor: 0,
    },
    'Low': {
        overlapPresetName: 'Low',
        splitOverlaps: true,
        splitSensitivity: 0.5,
        extraSeedSensitivity: 0.3,
        extraSeedMinDistFactor: 1.4,
    },
    'Normal': {
        overlapPresetName: 'Normal',
        splitOverlaps: true,
        splitSensitivity: 0.3,
        extraSeedSensitivity: 0.3,
        extraSeedMinDistFactor: 1.2,
    },
    'High': {
        overlapPresetName: 'High ?',
        disabled: true,
        splitOverlaps: true,
        splitSensitivity: 0.25,
        extraSeedSensitivity: 0.3,
        extraSeedMinDistFactor: 0.5,
    },
}

export const defaultOverlapPreset = 'Normal'

// Defaults
export const PSD_DEFAULTS = {
    name: 'default',
    testPipeline: false,
    useMorphology: true,
    correctPerspective: true,
    warpSizePx: 2000,
    insetPx: 18,
    bgSigma: 35,
    adaptiveBlockSize: 201,
    adaptiveC: 4,
    minAreaPx: 8,
    maxAreaMm2: 10,
    bins: 15,
    binsType: 'default', // 'auto' | 'default'
    binSpacing: 'log', // 'log' | 'linear'
    weighting: 'mass', // 'count' | 'surface' | 'volume' | 'mass'
    metric: 'diameter', // 'diameter' | 'surface' | 'volume'
    chartMode: 'bar', // 'bar' | 'line'
    splitOverlaps: false,
    overlapSplitPreset: defaultOverlapPreset,
    splitSensitivity: overlapSplitPresets[defaultOverlapPreset].splitSensitivity,
    extraSeedSensitivity: overlapSplitPresets[defaultOverlapPreset].extraSeedSensitivity,
    extraSeedMinDistFactor: overlapSplitPresets[defaultOverlapPreset].extraSeedMinDistFactor,
    ellipseFactor: 5.0,
    minSolidity: 0.3,
    analysisChannel: 'grayscale', // 'grayscale' | 'blue'
    value: 'mass',
    templateSize: 75,
}


export const PSD_PRESETS = {
    default: {
        name: 'Default',
        params: {
            name: 'default',
            bgSigma: 35,
            adaptiveBlockSize: 201,
            adaptiveC: 4,
            minAreaPx: 8,
            maxAreaMm2: 10,
        }
    },
    coarse: {
        name: 'Coarse',
        params: {
            name: 'coarse',
            bgSigma: 45,
            adaptiveBlockSize: 301,
            adaptiveC: 5,
            minAreaPx: 12,
            maxAreaMm2: 20,
        }
    },
    fines: {
        name: 'Fines',
        params: {
            name: 'fines',
            bgSigma: 25,
            adaptiveBlockSize: 100,
            adaptiveC: 3,
            minAreaPx: 4,
            maxAreaMm2: 5,
        }
    },
    camera: {
        name: 'Camera',
        debugOnly: false,
        params: {
            name: 'camera',
            minAreaPx: 4,
            maxAreaMm2: 8,
            bgSigma: 25,
            adaptiveBlockSize: 120,
            adaptiveC: 6,
        }
    },
    c1: {
        name: 'C1',
        debugOnly: true,
        params: {
            name: 'c1',
            minAreaPx: 4,
            maxAreaMm2: 8,
            bgSigma: 25,
            adaptiveBlockSize: 120,
            adaptiveC: 6,
        }
    },
}


export const BIN_DEFAULTS = {
    min: 75,
    max: 3000,
    nBins: 15
}

export const API_PREFIX = '/api'
