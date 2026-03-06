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
    testPipeline: true,
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
    templateSize: 100,
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
            splitOverlaps: false,
            splitSensitivity: 0.4
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
            splitOverlaps: false,
            splitSensitivity: 0.3
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
            splitOverlaps: false,
            splitSensitivity: 0.6
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
            splitOverlaps: false,
            splitSensitivity: 0.6
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
            splitOverlaps: false,
            splitSensitivity: 0.6
        }
    },
}


export const BIN_DEFAULTS = {
    min: 75,
    max: 3000,
    nBins: 15
}


//bin_start_um, bin_end_um, bin_center_um
export const PSD_TEST_BINS = [
    [150.0, 211.7, 180.8],
    [211.7, 273.3, 242.5],
    [273.3, 335.0, 304.2],
    [335.0, 396.7, 365.8],
    [396.7, 458.3, 427.5],
    [458.3, 520.0, 489.2],
    [520.0, 581.7, 550.8],
    [581.7, 643.3, 612.5],
    [643.3, 705.0, 674.2],
    [705.0, 766.7, 735.8],
    [766.7, 828.3, 797.5],
    [828.3, 890.0, 859.2],
    [890.0, 951.7, 920.8],
    [951.7, 1013.3, 982.5],
    [1013.3, 1075.0, 1044.2],
    [1075.0, 1136.7, 1105.8],
    [1136.7, 1198.3, 1167.5],
    [1198.3, 1260.0, 1229.2],
    [1260.0, 1321.7, 1290.8],
    [1321.7, 1383.3, 1352.5],
    [1383.3, 1445.0, 1414.2],
    [1445.0, 1506.7, 1475.8],
    [1506.7, 1568.3, 1537.5],
    [1568.3, 1630.0, 1599.2],
    [1630.0, 1691.7, 1660.8],
    [1691.7, 1753.3, 1722.5],
    [1753.3, 1815.0, 1784.2],
    [1815.0, 1876.7, 1845.8],
    [1876.7, 1938.3, 1907.5],
    [1938.3, 2000.0, 1969.2]
]


export const API_PREFIX = '/api'
