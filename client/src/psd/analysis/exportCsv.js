export function convertParticlesToCsv(particles, pxPerMm) {
    const factor = 1000 / pxPerMm // px to microns
    const header = 'id,cx_um,cy_um,area_um2,short_axis_um,long_axis_um,roundness,eq_diameter_um\n'
    const rows = particles.map(p => {
        const cx = (p.cxPx * factor).toFixed(1)
        const cy = (p.cyPx * factor).toFixed(1)
        const area = (p.areaPx * (factor ** 2)).toFixed(1)
        const short = (p.shortAxisPx * factor).toFixed(1)
        const long = (p.longAxisPx * factor).toFixed(1)
        const eqD = (p.eqDiameterPx * factor).toFixed(1)
        return `${p.id},${cx},${cy},${area},${short},${long},${p.roundness.toFixed(3)},${eqD}`
    }).join('\n')
    return header + rows
}

export function convertStatsToCsv(stats) {
    const unit = stats.metric === 'diameter' ? 'um' : (stats.metric === 'surface' ? 'um2' : 'um3')
    const header = 'metric,value,unit\n'
    const rows = [
        ['count', stats.count, ''],
        ['D10', stats.D10, unit],
        ['D50', stats.D50, unit],
        ['D90', stats.D90, unit],
        ['efficiency', stats.efficiency, ''],
        ['span', stats.span, ''],
        ['mean', stats.mean, unit],
        ['stdDev', stats.stdDev, unit],
        ['mode', stats.mode, unit],
        ['min', stats.min, unit],
        ['max', stats.max, unit],
        ['avgShortAxis', stats.avgShortAxis, 'um'],
        ['avgLongAxis', stats.avgLongAxis, 'um'],
        ['avgRoundness', stats.avgRoundness, '']
    ].map(r => `${r[0]},${r[1] != null ? r[1].toFixed(3) : ''},${r[2]}`).join('\n')
    return header + rows
}

export function convertHistogramToCsv(histogram) {
    const header = 'binStart,binEnd,binCenter,value,percent\n'
    const rows = histogram.bins.map((b, i) => {
        const v = histogram.values[i]
        return `${b.start.toFixed(1)},${b.end.toFixed(1)},${b.center.toFixed(1)},${v.value.toFixed(3)},${v.percent.toFixed(2)}`
    }).join('\n')
    return header + rows
}

export function downloadCsv(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
