import {PSD_TEMPLATES} from '@starter/shared'

export function processTemplate({
                                    markers,
                                    width,
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

    // Identify template
    let template = null
    try {
        const matched100 = uniqueMarkers.filter(m => PSD_TEMPLATES[100].cornerIds.includes(m.id))
        const matched50 = uniqueMarkers.filter(m => PSD_TEMPLATES[50].cornerIds.includes(m.id))

        if (matched100.length >= matched50.length && (matched100.length >= 3 || manualCorners)) {
            template = {sizeMm: 100, outerMm: 130, innerMm: 100, markers: matched100, config: PSD_TEMPLATES[100]}
        } else if (matched50.length >= 3 || manualCorners) {
            template = {sizeMm: 50, outerMm: 70, innerMm: 50, markers: matched50, config: PSD_TEMPLATES[50]}
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

        if (!templateCorners) {
            // Use outer corners for perspective warp
            // corners: [TL, TR, BR, BL]
            templateCorners = ids.map((id, i) => {
                return markerMap[id] ? markerMap[id].corners[i] : null
            })
        }

        const presentCorners = templateCorners.filter(c => c !== null)

        // Always estimate pxPerMm from markers if available,
        // regardless of whether we warp or not.
        const getDist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
        const getP = (i) => markerMap[ids[i]] ? markerMap[ids[i]].corners[i] : null
        const pairs = [[0, 1], [1, 2], [2, 3], [3, 0]]

        let distSum = 0
        let count = 0
        pairs.forEach(([i1, i2]) => {
            const p1 = getP(i1)
            const p2 = getP(i2)
            if (p1 && p2) {
                distSum += getDist(p1, p2)
                count++
            }
        })

        if (count > 0) {
            pxPerMm = distSum / (count * template.outerMm)
            if (Math.abs(pxPerMm - 20) < 0.02) pxPerMm = 20
        }

        scaleInfo = {
            pxPerMm,
            mmPerPx: 1 / pxPerMm,
            templateSize: template.sizeMm,
            detectedTemplate: template.sizeMm,
            markerCount: template.markers.length,
            presentCorners
        }

        console.log('Scale info:', scaleInfo)

        // Define ROI
        let baseRoi = null
        const innerPoints = []
        if (markerMap[ids[0]]) innerPoints.push(markerMap[ids[0]].corners[2])
        if (markerMap[ids[1]]) innerPoints.push(markerMap[ids[1]].corners[3])
        if (markerMap[ids[2]]) innerPoints.push(markerMap[ids[2]].corners[0])
        if (markerMap[ids[3]]) innerPoints.push(markerMap[ids[3]].corners[1])

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
            template,
            templateSize: template.sizeMm,
            detectedTemplate: template.sizeMm,
            templateCorners,
            uniqueMarkers,
            markerCount: template.markers.length,
            markerMap,
            presentCorners,
            baseRoi
        }

    }

}