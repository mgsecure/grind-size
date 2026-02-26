export default function defineROI({scaleInfo, settings, correctPerspective, debug}) {

    const {template,
        presentCorners,
        baseRoi} = scaleInfo

    debug && console.log('Template info:', scaleInfo)

    let roi = {...baseRoi}

    // update ROI if correctPerspective
    if (presentCorners.length === 4 && correctPerspective) {
        const outerMm = template.outerMm
        const innerMm = template.innerMm
        const marginMm = (outerMm - innerMm) / 2
        const sizePx = settings.warpSizePx || 2000
        const marginPx = marginMm * (sizePx / outerMm)
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