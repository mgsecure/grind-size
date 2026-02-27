export function calculateStatistics(particles, {weighting = 'mass', mmPerPx = 1, metric = 'diameter'} = {}) {
    const factor = mmPerPx * 1000 // Convert to microns
    
    const getMetricValue = (p) => {
        if (metric === 'surface') return (p.surfaceAreaPx || 0) * (factor ** 2)
        if (metric === 'volume') return (p.volumePx || 0) * (factor ** 3)
        
        // Use true equivalent diameter from pixel area if available
        if (p.eqDiameterPx) return p.eqDiameterPx * factor

        const dPx = (p.shortAxisPx && p.longAxisPx) 
            ? (p.shortAxisPx + p.longAxisPx) / 2 
            : 0
        return dPx * factor
    }

    const ms = particles.map(getMetricValue).filter(v => Number.isFinite(v) && v > 0).sort((a, b) => a - b)
    if (!ms.length) {
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
            avgShortAxis: null,
            avgLongAxis: null,
            avgRoundness: null,
            weighting,
            metric
        }
    }

    const ws = particles
        .map(p => {
            const val = getMetricValue(p)
            let w = 1
            if (weighting === 'surface') w = (p.surfaceAreaPx || 0) * (factor ** 2)
            else if (weighting === 'volume' || weighting === 'mass') w = (p.volumePx || 0) * (factor ** 3)
            
            return {val, w, p}
        })
        .filter(x => Number.isFinite(x.val) && Number.isFinite(x.w))
        .sort((a, b) => a.val - b.val)

    const totalW = ws.reduce((a, b) => a + b.w, 0) || 1
    
    // Aggregate metrics
    const avgShortAxis = ws.reduce((a, b) => a + (b.p.shortAxisPx || 0) * factor * (b.w / totalW), 0)
    const avgLongAxis = ws.reduce((a, b) => a + (b.p.longAxisPx || 0) * factor * (b.w / totalW), 0)
    const avgRoundness = ws.reduce((a, b) => a + (b.p.roundness || 0) * (b.w / totalW), 0)
    const cdf = []
    let acc = 0
    for (const x of ws) {
        acc += x.w
        cdf.push(acc / totalW)
    }

    const D10 = weightedPercentile(ws, cdf, 0.10)
    const D50 = weightedPercentile(ws, cdf, 0.50)
    const D90 = weightedPercentile(ws, cdf, 0.90)

    const efficiency = D10 / D90 // Crude efficiency/uniformity metric (Section 8)
    const span = (D90 - D10) / D50

    const mean = ws.reduce((a, b) => a + b.val * (b.w / totalW), 0)
    const variance = ws.reduce((a, b) => {
        const p = b.w / totalW
        return a + p * Math.pow(b.val - mean, 2)
    }, 0)
    const stdDev = Math.sqrt(variance)

    const min = ws[0].val
    const max = ws[ws.length - 1].val

    const mode = estimateMode(ms)

    return {
        count: ws.length,
        D10,
        D50,
        D90,
        efficiency,
        span,
        mode,
        mean,
        stdDev,
        min,
        max,
        avgShortAxis,
        avgLongAxis,
        avgRoundness,
        weighting,
        metric
    }
}

function weightedPercentile(ws, cdf, p) {
    const idx = cdf.findIndex(v => v >= p)
    if (idx <= 0) return ws[0].val
    if (idx >= ws.length) return ws[ws.length - 1].val
    const d0 = ws[idx - 1].val
    const d1 = ws[idx].val
    const c0 = cdf[idx - 1]
    const c1 = cdf[idx]
    const t = (p - c0) / Math.max(1e-12, (c1 - c0))
    return d0 + (d1 - d0) * t
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
