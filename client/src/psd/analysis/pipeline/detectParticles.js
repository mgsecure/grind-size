// Simple connected-component labeling on binary mask (255=foreground)
export function detectParticles(maskObj, {minAreaPx = 8} = {}) {
    const {width, height, mask} = maskObj
    const labels = new Uint32Array(width * height)
    const particles = []

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            if (labels[idx] !== 0 || mask[idx] === 0) continue
            
            const particleId = particles.length + 1
            const comp = flood(mask, labels, width, height, x, y, particleId)
            
            if (comp.area < minAreaPx) {
                // Optionally clear labels if too small, but flood already marked them.
                // We'll just ignore them in the particles list.
                continue
            }
            const eqDiameterPx = 2 * Math.sqrt(comp.area / Math.PI)
            particles.push({
                id: particleId,
                cxPx: comp.cx,
                cyPx: comp.cy,
                areaPx: comp.area,
                eqDiameterPx
            })
        }
    }
    return {particles, labels}
}

function flood(mask, labels, w, h, sx, sy, particleId) {
    const stack = [[sx, sy]]
    const QUEUED = 0xFFFFFFFF
    labels[sy * w + sx] = QUEUED
    let area = 0
    let sumX = 0
    let sumY = 0

    while (stack.length) {
        const [x, y] = stack.pop()
        const idx = y * w + x
        
        if (labels[idx] === particleId) continue
        labels[idx] = particleId

        area += 1
        sumX += x
        sumY += y

        // Use 8-connectivity to help bridge minor fragmentation or noise
        const neighbors = [
            [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
            [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]
        ]
        for (const [nx, ny] of neighbors) {
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
            const nidx = ny * w + nx
            if (labels[nidx] !== 0 || mask[nidx] === 0) continue
        
            labels[nidx] = QUEUED
            stack.push([nx, ny])
        }
    }

    if (area === 0) return {area: 0, cx: 0, cy: 0}
    return {area, cx: sumX / area, cy: sumY / area}
}
