export function calculateStatistics(particles, {weighting = 'count', mmPerPx = 1} = {}) {
    const ds = particles.map(p => p.eqDiameterPx * mmPerPx).filter(Boolean).sort((a, b) => a - b)
    if (!ds.length) {
        return {
            count: 0,
            D10: null,
            D50: null,
            D90: null,
            mode: null,
            mean: null,
            stdDev: null,
            min: null,
            max: null,
            weighting
        }
    }

    const ws = particles
        .map(p => ({d: p.eqDiameterPx * mmPerPx, w: weightFor(p.eqDiameterPx * mmPerPx, weighting)}))
        .filter(x => Number.isFinite(x.d) && Number.isFinite(x.w))
        .sort((a, b) => a.d - b.d)

    const totalW = ws.reduce((a, b) => a + b.w, 0) || 1
    const cdf = []
    let acc = 0
    for (const x of ws) {
        acc += x.w
        cdf.push(acc / totalW)
    }

    const D10 = weightedPercentile(ws, cdf, 0.10)
    const D50 = weightedPercentile(ws, cdf, 0.50)
    const D90 = weightedPercentile(ws, cdf, 0.90)

    const mean = ws.reduce((a, b) => a + b.d * (b.w / totalW), 0)
    const variance = ws.reduce((a, b) => {
        const p = b.w / totalW
        return a + p * Math.pow(b.d - mean, 2)
    }, 0)
    const stdDev = Math.sqrt(variance)

    const min = ws[0].d
    const max = ws[ws.length - 1].d

    const mode = estimateMode(ds)

    return {
        count: ws.length,
        D10,
        D50,
        D90,
        mode,
        mean,
        stdDev,
        min,
        max,
        weighting
    }
}

function weightedPercentile(ws, cdf, p) {
    const idx = cdf.findIndex(v => v >= p)
    if (idx <= 0) return ws[0].d
    if (idx >= ws.length) return ws[ws.length - 1].d
    const d0 = ws[idx - 1].d
    const d1 = ws[idx].d
    const c0 = cdf[idx - 1]
    const c1 = cdf[idx]
    const t = (p - c0) / Math.max(1e-12, (c1 - c0))
    return d0 + (d1 - d0) * t
}

function weightFor(d, mode) {
    if (mode === 'surface') return Math.PI * d * d
    if (mode === 'volume') return (Math.PI / 6) * d * d * d
    return 1
}

function estimateMode(sortedDs) {
    // simple: return median of highest-density bin among 30 bins
    const bins = 30
    const min = sortedDs[0]
    const max = sortedDs[sortedDs.length - 1]
    if (min === max) return min
    const edges = new Array(bins + 1).fill(0).map((_, i) => min + (max - min) * (i / bins))
    const counts = new Array(bins).fill(0)
    for (const d of sortedDs) {
        const b = Math.min(bins - 1, Math.max(0, Math.floor(((d - min) / (max - min)) * bins)))
        counts[b] += 1
    }
    const best = counts.indexOf(Math.max(...counts))
    return (edges[best] + edges[best + 1]) / 2
}
