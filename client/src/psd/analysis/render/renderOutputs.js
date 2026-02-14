export async function renderMaskPng(maskObj, width, height, originalImageData, validParticleIds = null) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    if (originalImageData) {
        // Draw original image first
        const tempImageData = new ImageData(
            new Uint8ClampedArray(originalImageData.data),
            width,
            height
        )
        ctx.putImageData(tempImageData, 0, 0)
        
        // Overlay red particles
        const labels = maskObj.labels
        const img = ctx.getImageData(0, 0, width, height)
        
        // If validParticleIds is provided, we only show those.
        // Otherwise we show all labeled pixels.
        const validSet = validParticleIds ? new Set(validParticleIds) : null

        for (let i = 0, p = 0; i < labels.length; i++, p += 4) {
            const label = labels[i]
            if (label !== 0 && label !== 0xFFFFFFFF) {
                if (!validSet || validSet.has(label)) {
                    img.data[p] = 255     // R
                    img.data[p + 1] = 0   // G
                    img.data[p + 2] = 0   // B
                    img.data[p + 3] = 255
                }
            }
        }
        ctx.putImageData(img, 0, 0)
    } else {
        // Fallback to binary mask if original not provided (this path might need labels too if used)
        const img = ctx.createImageData(width, height)
        const labels = maskObj.labels
        const validSet = validParticleIds ? new Set(validParticleIds) : null
        
        for (let i = 0, p = 0; i < labels.length; i++, p += 4) {
            const label = labels[i]
            let v = 0
            if (label !== 0 && label !== 0xFFFFFFFF) {
                if (!validSet || validSet.has(label)) {
                    v = 255
                }
            }
            img.data[p] = v
            img.data[p + 1] = v
            img.data[p + 2] = v
            img.data[p + 3] = 255
        }
        ctx.putImageData(img, 0, 0)
    }
    
    return canvas.toDataURL('image/png')
}

export async function renderOverlayPng(imageData, particles, meta = {}) {
    const {width, height} = imageData
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    // Create a temporary ImageData to avoid any risk of modifying the original
    const tempImageData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        width,
        height
    )
    ctx.putImageData(tempImageData, 0, 0)
    
    // 1. Draw ArUco markers (magenta #ff3399, 3px wide)
    if (meta.markers) {
        ctx.lineWidth = 3
        ctx.strokeStyle = '#ff3399'
        for (const m of meta.markers) {
            ctx.beginPath()
            ctx.moveTo(m.corners[0].x, m.corners[0].y)
            ctx.lineTo(m.corners[1].x, m.corners[1].y)
            ctx.lineTo(m.corners[2].x, m.corners[2].y)
            ctx.lineTo(m.corners[3].x, m.corners[3].y)
            ctx.closePath()
            ctx.stroke()
        }
    }

    // 2. Draw outer polygon (green #33ff33, 3px wide)
    if (meta.template) {
        const ids = meta.template.config.cornerIds
        const markerMap = {}
        meta.template.markers.forEach(m => { markerMap[m.id] = m })
        
        const outerPoints = []
        ids.forEach((id, i) => {
            if (markerMap[id]) outerPoints.push(markerMap[id].corners[i])
        })

        if (outerPoints.length >= 2) {
            ctx.lineWidth = 3
            ctx.strokeStyle = '#33ff33'
            ctx.beginPath()
            ctx.moveTo(outerPoints[0].x, outerPoints[0].y)
            for (let i = 1; i < outerPoints.length; i++) {
                ctx.lineTo(outerPoints[i].x, outerPoints[i].y)
            }
            if (outerPoints.length === 4) ctx.closePath()
            ctx.stroke()
        }
    }

    // 3. Draw inner polygon / analysis region (blue #0033ff, 3px wide)
    if (meta.roi && meta.roi.points && meta.roi.points.length >= 2) {
        ctx.lineWidth = 3
        ctx.strokeStyle = '#0033ff'
        ctx.beginPath()
        ctx.moveTo(meta.roi.points[0].x, meta.roi.points[0].y)
        for (let i = 1; i < meta.roi.points.length; i++) {
            ctx.lineTo(meta.roi.points[i].x, meta.roi.points[i].y)
        }
        if (meta.roi.points.length === 4) ctx.closePath()
        ctx.stroke()

        // Also draw the inset ROI if needed, but the spec says "inner polygon that defines the active analysis region"
        // I'll draw the rectangle used for filtering
        if (meta.roi.actualBounds) {
            const {minX, maxX, minY, maxY} = meta.roi.actualBounds
            ctx.setLineDash([10, 5])
            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
            ctx.setLineDash([])
        }
    }

    // 4. Draw detected particles (green circles as before, but maybe thinner)
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)'
    for (const p of particles) {
        const r = p.eqDiameterPx / 2
        ctx.beginPath()
        ctx.ellipse(p.cxPx, p.cyPx, r, r, 0, 0, Math.PI * 2)
        ctx.stroke()
    }
    
    return canvas.toDataURL('image/png')
}
