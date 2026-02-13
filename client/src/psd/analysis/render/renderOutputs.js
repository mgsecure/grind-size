export async function renderMaskPng(maskObj, width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    const img = ctx.createImageData(width, height)
    for (let i = 0, p = 0; i < maskObj.mask.length; i++, p += 4) {
        const v = maskObj.mask[i]
        img.data[p] = v
        img.data[p + 1] = v
        img.data[p + 2] = v
        img.data[p + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    return canvas.toDataURL('image/png')
}

export async function renderOverlayPng(imageData, particles) {
    const {width, height} = imageData
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.putImageData(imageData, 0, 0)
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)'
    for (const p of particles) {
        const r = p.eqDiameterPx / 2
        ctx.beginPath()
        ctx.ellipse(p.cxPx, p.cyPx, r, r, 0, 0, Math.PI * 2)
        ctx.stroke()
    }
    return canvas.toDataURL('image/png')
}
