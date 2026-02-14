export function buildHistograms(particles, {bins = 30, spacing = 'log', weighting = 'count', mmPerPx = 1} = {}) {
    const ds = particles.map(p => p.eqDiameterPx * mmPerPx).filter(Boolean)
    if (!ds.length) {
        return {bins: [], values: [], weighting, spacing}
    }

    const min = Math.min(...ds)
    const max = Math.max(...ds)
    const edges = buildEdges(min, max, bins, spacing)
    const values = new Array(bins).fill(0)

    const weights = particles.map(p => weightFor(p.eqDiameterPx * mmPerPx, weighting))
    const total = weights.reduce((a, b) => a + b, 0) || 1

    for (let i = 0; i < ds.length; i++) {
        const d = ds[i]
        const b = findBin(edges, d)
        if (b >= 0) values[b] += weights[i]
    }

    const binsOut = []
    const valsOut = []
    for (let i = 0; i < bins; i++) {
        const start = edges[i]
        const end = edges[i + 1]
        const center = (start + end) / 2
        const value = values[i]
        binsOut.push({start, end, center})
        valsOut.push({value, percent: (value / total) * 100})
    }

    return {bins: binsOut, values: valsOut, weighting, spacing}
}

function buildEdges(min, max, bins, spacing) {
    const edges = new Array(bins + 1)
    if (spacing === 'log') {
        const lo = Math.log10(Math.max(1e-6, min))
        const hi = Math.log10(Math.max(1e-6, max))
        for (let i = 0; i <= bins; i++) {
            edges[i] = Math.pow(10, lo + (hi - lo) * (i / bins))
        }
    } else {
        for (let i = 0; i <= bins; i++) {
            edges[i] = min + (max - min) * (i / bins)
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

function weightFor(d, mode) {
    if (mode === 'surface') return Math.PI * d * d
    if (mode === 'volume') return (Math.PI / 6) * d * d * d
    return 1
}
