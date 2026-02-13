// Simple connected-component labeling on binary mask (255=foreground)
export function detectParticles(maskObj, {minAreaPx = 8} = {}) {
    const {width, height, mask} = maskObj
    const visited = new Uint8Array(width * height)
    const particles = []

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            if (visited[idx] || mask[idx] === 0) continue
            const comp = flood(mask, visited, width, height, x, y)
            if (comp.area < minAreaPx) continue
            const eqDiameterPx = 2 * Math.sqrt(comp.area / Math.PI)
            particles.push({
                id: particles.length + 1,
                cxPx: comp.cx,
                cyPx: comp.cy,
                areaPx: comp.area,
                eqDiameterPx
            })
        }
    }
    return particles
}

function flood(mask, visited, w, h, sx, sy) {
    const stack = [[sx, sy]]
    visited[sy * w + sx] = 1
    let area = 0
    let sumX = 0
    let sumY = 0

    while (stack.length) {
        const [x, y] = stack.pop()
        area += 1
        sumX += x
        sumY += y

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (!dx && !dy) continue
                const nx = x + dx
                const ny = y + dy
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
                const nidx = ny * w + nx
                if (visited[nidx] || mask[nidx] === 0) continue
                visited[nidx] = 1
                stack.push([nx, ny])
            }
        }
    }

    return {area, cx: sumX / area, cy: sumY / area}
}
