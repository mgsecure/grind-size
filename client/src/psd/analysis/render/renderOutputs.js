import {getUnwarpedPoint} from '../pipeline/warpPerspective.js'

export async function renderMaskPng(maskObj, width, height, originalImageData, validParticleIds = null) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    // Use maskObj width/height if available, otherwise fallback to parameters
    const w = maskObj.width || width
    const h = maskObj.height || height
    
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
    }

    if (originalImageData) {
        // Draw original image first
        // If the originalImageData has different dimensions than w/h, we need to scale it
        if (originalImageData.width !== w || originalImageData.height !== h) {
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = originalImageData.width
            tempCanvas.height = originalImageData.height
            const tempCtx = tempCanvas.getContext('2d')
            const tempImgData = new ImageData(
                new Uint8ClampedArray(originalImageData.data),
                originalImageData.width,
                originalImageData.height
            )
            tempCtx.putImageData(tempImgData, 0, 0)
            ctx.drawImage(tempCanvas, 0, 0, w, h)
        } else {
            const tempImageData = new ImageData(
                new Uint8ClampedArray(originalImageData.data),
                originalImageData.width,
                originalImageData.height
            )
            ctx.putImageData(tempImageData, 0, 0)
        }
        
    // Overlay red particles
    const labels = maskObj.labels
    const img = ctx.getImageData(0, 0, w, h)
    
    // If validParticleIds is provided, we only show those.
    // Otherwise, we show all labeled pixels.
    const validSet = validParticleIds ? new Set(validParticleIds) : null

    if (labels.length !== w * h) {
        console.warn(`renderMaskPng: label buffer length (${labels.length}) does not match dimensions (${w}x${h}=${w*h})`)
    }

    for (let y = 0; y < h; y++) {
        const rowOffset = y * w
        for (let x = 0; x < w; x++) {
            const i = rowOffset + x
            const label = labels[i]
            if (label !== 0 && label !== 0xFFFFFFFF) {
                if (!validSet || validSet.has(label)) {
                    const p = i * 4
                    img.data[p] = 255     // R
                    img.data[p + 1] = 0   // G
                    img.data[p + 2] = 0   // B
                    img.data[p + 3] = 255
                }
            }
        }
    }
    ctx.putImageData(img, 0, 0)
    } else {
        // Fallback to binary mask if original not provided (this path might need labels too if used)
        const img = ctx.createImageData(w, h)
        const labels = maskObj.labels
        const validSet = validParticleIds ? new Set(validParticleIds) : null
        
        if (labels.length !== w * h) {
            console.warn(`renderMaskPng (fallback): label buffer length (${labels.length}) does not match dimensions (${w}x${h}=${w*h})`)
        }

        for (let y = 0; y < h; y++) {
            const rowOffset = y * w
            for (let x = 0; x < w; x++) {
                const i = rowOffset + x
                const label = labels[i]
                let v = 0
                if (label !== 0 && label !== 0xFFFFFFFF) {
                    if (!validSet || validSet.has(label)) {
                        v = 255
                    }
                }
                const p = i * 4
                img.data[p] = v
                img.data[p + 1] = v
                img.data[p + 2] = v
                img.data[p + 3] = 255
            }
        }
        ctx.putImageData(img, 0, 0)
    }
    
    return canvas.toDataURL('image/png')
}

export async function renderOverlayPng(imageData, particles, meta = {}, options = {showParticles: true, showMarkers: true, showScale: true, showRoi: true}) {
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
    if (meta.markers && options.showMarkers) {
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
    if (meta.template && meta.warpCorners && options.showScale) {
        ctx.lineWidth = 3
        ctx.strokeStyle = '#33ff33'
        ctx.beginPath()
        ctx.moveTo(meta.warpCorners[0].x, meta.warpCorners[0].y)
        for (let i = 1; i < 4; i++) {
            if (meta.warpCorners[i]) ctx.lineTo(meta.warpCorners[i].x, meta.warpCorners[i].y)
        }
        ctx.closePath()
        ctx.stroke()
    }

    // 3. Draw inner polygon / analysis region (blue #0033ff, 3px wide)
    if (meta.roi && meta.warpCorners && options.showRoi) {
        // Map warped ROI bounds back to original coordinates
        const {minX, maxX, minY, maxY} = meta.roi.actualBounds
        const p1 = getUnwarpedPoint({x: minX, y: minY}, meta.warpCorners)
        const p2 = getUnwarpedPoint({x: maxX, y: minY}, meta.warpCorners)
        const p3 = getUnwarpedPoint({x: maxX, y: maxY}, meta.warpCorners)
        const p4 = getUnwarpedPoint({x: minX, y: maxY}, meta.warpCorners)

        ctx.lineWidth = 3
        ctx.strokeStyle = '#0033ff'
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.lineTo(p3.x, p3.y)
        ctx.lineTo(p4.x, p4.y)
        ctx.closePath()
        ctx.stroke()
        
        // Draw dashed safe zone if requested or useful
        ctx.setLineDash([10, 5])
        ctx.stroke()
        ctx.setLineDash([])
    } else if (meta.roi && meta.roi.points && meta.roi.points.length >= 2 && options.showRoi) {
        ctx.lineWidth = 3
        ctx.strokeStyle = '#0033ff'
        ctx.beginPath()
        ctx.moveTo(meta.roi.points[0].x, meta.roi.points[0].y)
        for (let i = 1; i < meta.roi.points.length; i++) {
            ctx.lineTo(meta.roi.points[i].x, meta.roi.points[i].y)
        }
        if (meta.roi.points.length === 4) ctx.closePath()
        ctx.stroke()

        if (meta.roi.actualBounds) {
            ctx.setLineDash([10, 5])
            ctx.strokeRect(meta.roi.actualBounds.minX, meta.roi.actualBounds.minY, meta.roi.actualBounds.maxX - meta.roi.actualBounds.minX, meta.roi.actualBounds.maxY - meta.roi.actualBounds.minY)
            ctx.setLineDash([])
        }
    }

    // 4. Draw detected particles (green ellipses based on moments)
    if (options.showParticles) {
        ctx.lineWidth = 1
        ctx.strokeStyle = '#0000ffaa'
        for (const p of particles) {
            const radiusX = (p.longAxisPx || p.eqDiameterPx) / 2
            const radiusY = (p.shortAxisPx || p.eqDiameterPx) / 2
            const rotation = p.angleRad || 0
            
            ctx.beginPath()
            ctx.ellipse(p.cxPx, p.cyPx, radiusX, radiusY, rotation, 0, Math.PI * 2)
            ctx.stroke()
        }
    }
    
    return canvas.toDataURL('image/png')
}

export async function renderDiagnosticPng(imageData, particles, maskObj, validParticleIds = null, meta = {}, options = {showParticles: true, showMarkers: true, showScale: true, showRoi: true}) {
    const {width, height} = imageData
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    // 1. Draw original uncorrected image
    const tempImageData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        width,
        height
    )
    ctx.putImageData(tempImageData, 0, 0)

    // 2. Overlay threshold mask (red pixels)
    const labels = maskObj.labels
    const w = maskObj.width || width
    const h = maskObj.height || height
    const validSet = validParticleIds ? new Set(validParticleIds) : null

    // We only overlay if dimensions match, or we'd need more complex scaling
    if (w === width && h === height) {
        const img = ctx.getImageData(0, 0, width, height)
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i]
            if (label !== 0 && label !== 0xFFFFFFFF) {
                if (!validSet || validSet.has(label)) {
                    const p = i * 4
                    img.data[p] = 255     // R
                    img.data[p + 1] = 0   // G
                    img.data[p + 2] = 0   // B
                    img.data[p + 3] = 255
                }
            }
        }
        ctx.putImageData(img, 0, 0)
    }

    // 3. Draw ArUco markers (magenta #ff3399, 3px wide)
    if (meta.markers && options.showMarkers) {
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

    // 4. Draw detected particles (green ellipses)
    if (options.showParticles) {
        ctx.lineWidth = 1
        ctx.strokeStyle = '#0000ffaa'
        for (const p of particles) {
            const radiusX = (p.longAxisPx || p.eqDiameterPx) / 2
            const radiusY = (p.shortAxisPx || p.eqDiameterPx) / 2
            const rotation = p.angleRad || 0
            
            ctx.beginPath()
            ctx.ellipse(p.cxPx, p.cyPx, radiusX, radiusY, rotation, 0, Math.PI * 2)
            ctx.stroke()
        }
    }
    
    return canvas.toDataURL('image/png')
}
