export default function defineROI({scaleInfo, settings, correctPerspective, warpSize, debug}) {

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
        const sizePx = warpSize !== null ? warpSize : Math.round(outerMm * 20)
        const marginPx = (marginMm / outerMm) * sizePx
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