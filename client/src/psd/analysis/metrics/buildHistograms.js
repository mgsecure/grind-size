import {BIN_DEFAULTS} from '@starter/shared'

export function buildHistograms(particles, {
    binCount = 30,
    spacing = 'log',
    weighting = 'count',
    mmPerPx = 1,
    metric = 'diameter',
    binsType = 'default'
} = {}) {

    const logHistogram = buildHistogram(particles, {
        binCount,
        spacing,
        weighting,
        mmPerPx,
        metric,
        binsType
    })
    const linearHistogram = buildHistogram(particles, {
        binCount,
        spacing: 'linear',
        weighting,
        mmPerPx,
        metric,
        binsType
    })

    return {log: logHistogram, linear: linearHistogram}

}

function buildHistogram(particles,
                        {
                            binCount = 30,
                            spacing = 'log',
                            weighting = 'count',
                            mmPerPx = 1,
                            metric = 'diameter',
                            binsType
                        }
) {
    const factor = mmPerPx * 1000 // Convert to microns
    const getMetricValue = (p) => {
        if (metric === 'surface') return (p.surfaceAreaPx || 0) * (factor ** 2) / 10000
        if (metric === 'volume') return (p.volumePx || 0) * (factor ** 3)
        
        // Default to diameter
        const dPx = (p.shortAxisPx && p.longAxisPx) 
            ? (p.shortAxisPx + p.longAxisPx) / 2 
            : p.eqDiameterPx
        return dPx * factor
    }

    const ms = particles.map(getMetricValue).filter(v => Number.isFinite(v) && v > 0)
    if (!ms.length) {
        return {bins: [], values: [], weighting, spacing, metric}
    }

    let edges
    let numBins
    let bins
    if (binsType === 'default' && metric === 'diameter') {
        // customBins is expected to be an array of [start, end, center]
        bins = spacing === 'log' ? getLogBins({...BIN_DEFAULTS, binCount}) : getLinearBins({...BIN_DEFAULTS, binCount})
        numBins = bins.length
        edges = new Array(numBins + 1)
        for (let i = 0; i < numBins; i++) {
            edges[i] = bins[i][0]
        }
        edges[numBins] = bins[numBins - 1][1]
    } else {
        const min = Math.min(...ms)
        const max = Math.max(...ms)
        numBins = binCount
        edges = buildEdges(min, max, numBins, spacing)
    }

    const values = new Array(numBins).fill(0)

    const weights = particles.map(p => {
        if (weighting === 'surface') return (p.surfaceAreaPx || 0) * (factor ** 2)
        if (weighting === 'volume' || weighting === 'mass') return (p.volumePx || 0) * (factor ** 3)
        return 1
    })
    const total = weights.reduce((a, b) => a + b, 0) || 1

    for (let i = 0; i < ms.length; i++) {
        const val = ms[i]
        const b = findBin(edges, val)
        if (b >= 0) values[b] += weights[i]
    }

    const binsOut = []
    const valsOut = []
    for (let i = 0; i < numBins; i++) {
        const start = edges[i]
        const end = edges[i + 1]
        const center = (binsType === 'default' && metric === 'diameter') ? bins[i][2] : (start + end) / 2
        const value = values[i]
        binsOut.push({start, end, center})
        valsOut.push({value, percent: (value / total) * 100})
    }

    const maxY = Math.max(...valsOut.map(v => v.value)) / total

    return {
        bins: binsOut,
        values: valsOut,
        maxY,
        weighting,
        spacing,
        metric,
        customBinsUsed: binsType !== 'default'
    }
}

function buildEdges(min, max, binCount, spacing) {
    const edges = new Array(binCount + 1)
    if (spacing === 'log') {
        const lo = Math.log10(Math.max(1e-6, min))
        const hi = Math.log10(Math.max(1e-6, max))
        for (let i = 0; i <= binCount; i++) {
            edges[i] = Math.pow(10, lo + (hi - lo) * (i / binCount))
        }
    } else {
        for (let i = 0; i <= binCount; i++) {
            edges[i] = min + (max - min) * (i / binCount)
        }
    }
    return edges
}

function findBin(edges, v) {
    if (v < edges[0] || v > edges[edges.length - 1]) return -1
    for (let i = 0; i < edges.length - 1; i++) {
        if (v >= edges[i] && v < edges[i + 1]) return i
    }
    return edges.length - 2
}


function getLinearBins({min, max, binCount}) {
    const width = (max - min) / binCount
    return Array.from({length: binCount}, (_, i) => {
        const start = min + i * width
        const end = min + (i + 1) * width
        return [start, end, (start + end) / 2] // geometric center
    })
}

function getLogBins({min, max, binCount}) {
    if (min <= 0) throw new Error('Log bins require min > 0')

    const logMin = Math.log10(min)
    const logMax = Math.log10(max)
    const logWidth = (logMax - logMin) / binCount

    return Array.from({length: binCount}, (_, i) => {
        const logStart = logMin + i * logWidth
        const logEnd = logMin + (i + 1) * logWidth
        const start = 10 ** logStart
        const end = 10 ** logEnd
        return [start, end, 10 ** ((logStart + logEnd) / 2)] // geometric center
    })
}
