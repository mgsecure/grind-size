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
    adaptiveBlockSize: 201,
    adaptiveC: 4,
    minAreaPx: 8,
    maxAreaMm2: 10,
    bins: 30,
    binsType: 'default', // 'auto' | 'default'
    binSpacing: 'log', // 'log' | 'linear'
    weighting: 'count', // 'count' | 'surface' | 'volume' | 'mass'
    metric: 'diameter', // 'diameter' | 'surface' | 'volume'
    chartMode: 'bar', // 'bar' | 'line'
    splitOverlaps: true,
    splitSensitivity: 0.4,
    value: 'mass',
    templateSize: 100,
}

export const PSD_PRESETS = {
    default: {
        name: 'Default (Phone)',
        params: {
            bgSigma: 35,
            adaptiveBlockSize: 201,
            adaptiveC: 4,
            minAreaPx: 8,
            maxAreaMm2: 10,
            splitOverlaps: true,
            splitSensitivity: 0.4
        }
    },
    coarse: {
        name: 'Coarse',
        params: {
            bgSigma: 45,
            adaptiveBlockSize: 301,
            adaptiveC: 5,
            minAreaPx: 12,
            maxAreaMm2: 20,
            splitOverlaps: true,
            splitSensitivity: 0.3
        }
    },
    fines: {
        name: 'Fines/Macro',
        params: {
            bgSigma: 25,
            adaptiveBlockSize: 101,
            adaptiveC: 3,
            minAreaPx: 4,
            maxAreaMm2: 5,
            splitOverlaps: true,
            splitSensitivity: 0.6
        }
    }
}


export const BIN_DEFAULTS = {
    min: 100,
    max: 2000,
    nBins: 30
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
