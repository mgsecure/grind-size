export default function defineROI({scaleInfo, settings, correctPerspective, debug}) {

    const {template,
        presentCorners,
        baseRoi} = scaleInfo || {}

    debug && console.log('Template info:', scaleInfo)

    let roi = {...baseRoi}

    // update ROI if correctPerspective
    if (presentCorners?.length === 4 && correctPerspective) {
        const outerMm = template?.outerMm
        const innerMm = template?.innerMm
        if (!outerMm || !innerMm) return roi
        const marginMm = (outerMm - innerMm) / 2
        // If we want 20 px/mm as target
        const targetPxPerMm = 20
        const sizePx = Math.round(outerMm * targetPxPerMm)
        const marginPx = marginMm * targetPxPerMm
        roi = {
            ...roi,
            actualBounds: {
                minX: Math.round(marginPx + (settings.insetPx || 8)),
                maxX: Math.round(sizePx - marginPx - (settings.insetPx || 8)),
                minY: Math.round(marginPx + (settings.insetPx || 8)),
                maxY: Math.round(sizePx - marginPx - (settings.insetPx || 8))
            }
        }
    }

    return roi

}