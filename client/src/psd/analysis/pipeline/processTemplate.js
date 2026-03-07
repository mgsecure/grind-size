import {PSD_TEMPLATES} from '@starter/shared'

export function processTemplate({
                                             markers,
                                             width,
                                             height,
                                             settings,
                                             manualCorners = null
                                         }) {

    // Filter duplicate markers (keep lowest hammingDistance)
    const uniqueMarkers = []
    const markerById = {}
    markers.forEach(m => {
        if (!markerById[m.id] || m.hammingDistance < markerById[m.id].hammingDistance) {
            markerById[m.id] = m
        }
    })
    Object.values(markerById).forEach(m => uniqueMarkers.push(m))

    // Identify template by finding the best match across all defined templates
    let template = null
    try {
        let bestMatch = null
        let bestCount = 0
        for (const [_key, tmpl] of Object.entries(PSD_TEMPLATES)) {
            const matched = uniqueMarkers.filter(m => tmpl.cornerIds.includes(m.id))
            if (matched.length > bestCount || (matched.length === bestCount && bestMatch && tmpl.sizeMm > bestMatch.sizeMm)) {
                bestCount = matched.length
                bestMatch = {sizeMm: tmpl.sizeMm, outerMm: tmpl.outerMm, innerMm: tmpl.innerMm, markers: matched, config: tmpl}
            }
        }
        if (bestCount >= 3 || manualCorners) {
            template = bestMatch
        }
    } catch (e) {
        console.error('Template identification failed', e)
    }

    let pxPerMm = width / settings.templateSize // fallback
    let scaleInfo = {pxPerMm, templateSize: settings.templateSize}
    let templateCorners = manualCorners || null

    if (template) {
        const markerMap = {}
        template.markers.forEach(m => {
            markerMap[m.id] = m
        })

        const ids = template.config.cornerIds
        const imgCx = width / 2
        const imgCy = (height || width) / 2

        if (!templateCorners) {
            // Use outer corners for perspective warp: farthest corner from image center
            templateCorners = ids.map((id) => {
                if (!markerMap[id]) return null
                const corners = markerMap[id].corners
                let best = corners[0], bestDist = -1
                corners.forEach(c => {
                    const d = (c.x - imgCx) ** 2 + (c.y - imgCy) ** 2
                    if (d > bestDist) { bestDist = d; best = c }
                })
                return best
            })
        }

        const presentCorners = templateCorners.filter(c => c !== null)

        // Always estimate pxPerMm from markers if available,
        // regardless of whether we warp or not.
        const getDist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
        const getPInner = (i) => {
            if (!markerMap[ids[i]]) return null
            // Find the corner closest to the image center — that is the inner corner
            const corners = markerMap[ids[i]].corners
            let best = corners[0], bestDist = Infinity
            corners.forEach(c => {
                const d = (c.x - imgCx) ** 2 + (c.y - imgCy) ** 2
                if (d < bestDist) { bestDist = d; best = c }
            })
            return best
        }
        const pairs = [[0, 1], [1, 2], [2, 3], [3, 0]]

        let distSum = 0
        let count = 0
        pairs.forEach(([i1, i2]) => {
            const p1 = getPInner(i1)
            const p2 = getPInner(i2)
            if (p1 && p2) {
                distSum += getDist(p1, p2)
                count++
            }
        })

        if (count > 0) {
            pxPerMm = distSum / (count * template.innerMm)
        }

        scaleInfo = {
            pxPerMm,
            mmPerPx: 1 / pxPerMm,
            templateSize: template.sizeMm,
            detectedTemplate: template.sizeMm,
            markerCount: template.markers.length,
            presentCorners
        }

        // Define ROI
        let baseRoi = null
        const innerPoints = []
        ids.forEach(id => {
            if (markerMap[id]) innerPoints.push(getPInner(ids.indexOf(id)))
        })

        if (innerPoints.length >= 3) {
            const validPoints = innerPoints.filter(p => p !== null)
            const minX = Math.round(Math.min(...validPoints.map(p => p.x)) + (settings.insetPx || 8))
            const maxX = Math.round(Math.max(...validPoints.map(p => p.x)) - (settings.insetPx || 8))
            const minY = Math.round(Math.min(...validPoints.map(p => p.y)) + (settings.insetPx || 8))
            const maxY = Math.round(Math.max(...validPoints.map(p => p.y)) - (settings.insetPx || 8))
            baseRoi = {points: validPoints, actualBounds: {minX, maxX, minY, maxY}}
        }

        return {
            ...scaleInfo,
            pxPerMm,
            mmPerPx: 1 / pxPerMm,
            template : template || {},
            templateSize: template.sizeMm,
            detectedTemplate: template.sizeMm,
            templateCorners,
            uniqueMarkers,
            markerCount: template.markers.length,
            markerMap,
            presentCorners,
            baseRoi
        }

    } else if (manualCorners && manualCorners.length === 4) {
        // No markers detected but user provided manual corners — compute scale from corner geometry
        const tmplConfig = PSD_TEMPLATES[settings.templateSize]
        const outerMm = tmplConfig ? tmplConfig.outerMm : settings.templateSize

        const getDist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
        const sides = [
            getDist(manualCorners[0], manualCorners[1]),
            getDist(manualCorners[1], manualCorners[2]),
            getDist(manualCorners[2], manualCorners[3]),
            getDist(manualCorners[3], manualCorners[0]),
        ]
        const avgSidePx = sides.reduce((a, b) => a + b, 0) / sides.length
        pxPerMm = avgSidePx / outerMm

        return {
            pxPerMm,
            mmPerPx: 1 / pxPerMm,
            templateSize: settings.templateSize,
            detectedTemplate: null,
            template: tmplConfig ? {sizeMm: tmplConfig.sizeMm, outerMm, innerMm: tmplConfig.innerMm, markers: [], config: tmplConfig} : {},
            templateCorners: manualCorners,
            uniqueMarkers,
            markerCount: 0,
            markerMap: {},
            presentCorners: manualCorners,
            baseRoi: null
        }
    }

}