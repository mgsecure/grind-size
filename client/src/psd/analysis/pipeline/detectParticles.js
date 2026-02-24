// Simple connected-component labeling on binary mask (255=foreground)
export function detectParticles(maskObj, {minAreaPx = 8, externalLabels = null} = {}) {
    const {width, height, mask} = maskObj
    const labels = externalLabels || new Uint32Array(width * height)
    const particles = []

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            if (mask[idx] === 0) continue

            // If we have external labels, we just need to calculate moments for each label
            // We'll iterate over labels differently if they are provided
            if (externalLabels) continue

            if (labels[idx] !== 0) continue

            const particleId = particles.length + 1
            const comp = flood(mask, labels, width, height, x, y, particleId)

            if (comp.area < minAreaPx) {
                continue
            }

            particles.push(finalizeParticle(comp, particleId))
        }
    }

    if (externalLabels) {
        // Collect pagePanels from existing labels
        const comps = new Map()
        for (let i = 0; i < externalLabels.length; i++) {
            const label = externalLabels[i]
            if (label === 0) continue

            const x = i % width
            const y = Math.floor(i / width)

            if (!comps.has(label)) {
                comps.set(label, {
                    area: 0, sumX: 0, sumY: 0, sumX2: 0, sumY2: 0, sumXY: 0
                })
            }
            const c = comps.get(label)
            c.area += 1
            c.sumX += x
            c.sumY += y
            c.sumX2 += x * x
            c.sumY2 += y * y
            c.sumXY += x * y
        }

        for (const [id, c] of comps.entries()) {
            if (c.area < minAreaPx) continue
            const comp = {
                area: c.area,
                cx: c.sumX / c.area,
                cy: c.sumY / c.area,
                sumX2: c.sumX2,
                sumY2: c.sumY2,
                sumXY: c.sumXY
            }
            particles.push(finalizeParticle(comp, id))
        }
    }

    return {particles, labels}
}

function finalizeParticle(comp, particleId) {
    // Calculate equivalent ellipse axes from central moments
    // Reference: https://en.wikipedia.org/wiki/Image_moment
    const mu20 = comp.sumX2 / comp.area - comp.cx * comp.cx
    const mu02 = comp.sumY2 / comp.area - comp.cy * comp.cy
    const mu11 = comp.sumXY / comp.area - comp.cx * comp.cy

    // Orientation angle
    const angleRad = 0.5 * Math.atan2(2 * mu11, mu20 - mu02)

    // Equivalent diameter for a circle with the same area
    const eqDiameterPx = 2 * Math.sqrt(comp.area / Math.PI)

    const common = Math.sqrt(Math.max(0, (mu20 - mu02) ** 2 + 4 * mu11 ** 2))

    // For coffee grounds, we prefer a "tight" fitting ellipse that better represents 
    // the physical dimensions (bounding box) of the particle.
    // Factor 4: area is only ~50% of pixel area (too small).
    // Factor 8: standard 4-sigma ellipse, represents mass but extends ~15% beyond bounds.
    // Factor 6.5: empirical balance that better fits the visual "boundary" of the pixels.
    const k = 6.5
    const majorPx = Math.sqrt(Math.max(0, k * (mu20 + mu02 + common)))
    const minorPx = Math.sqrt(Math.max(0, k * (mu20 + mu02 - common)))

    return {
        id: particleId,
        cxPx: comp.cx,
        cyPx: comp.cy,
        areaPx: ellipseArea(minorPx, majorPx),
        volumePx: ellipsoidVolume(minorPx, majorPx),
        surfaceAreaPx: ellipsoidSurfaceArea(minorPx, majorPx),
        eqDiameterPx,
        longAxisPx: majorPx,
        shortAxisPx: minorPx,
        angleRad,
        roundness: majorPx > 0 ? minorPx / majorPx : 1
    }
}

function flood(mask, labels, w, h, sx, sy, particleId) {
    const stack = [[sx, sy]]
    const QUEUED = 0xFFFFFFFF
    labels[sy * w + sx] = QUEUED
    let area = 0
    let sumX = 0
    let sumY = 0
    let sumX2 = 0
    let sumY2 = 0
    let sumXY = 0

    while (stack.length) {
        const [x, y] = stack.pop()
        const idx = y * w + x

        if (labels[idx] === particleId) continue
        labels[idx] = particleId

        area += 1
        sumX += x
        sumY += y
        sumX2 += x * x
        sumY2 += y * y
        sumXY += x * y

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

    if (area === 0) return {area: 0, cx: 0, cy: 0, sumX2: 0, sumY2: 0, sumXY: 0}
    return {
        area,
        cx: sumX / area,
        cy: sumY / area,
        sumX2,
        sumY2,
        sumXY
    }
}

function ellipseArea(shortDiameter, longDiameter) {
    const a = shortDiameter / 2
    const b = longDiameter / 2
    return Math.PI * a * b
}

function ellipsoidVolume(shortDiameter, longDiameter) {
    const a = shortDiameter / 2
    const c = longDiameter / 2
    return (4 / 3) * Math.PI * a * a * c
}

function ellipsoidSurfaceArea(shortDiameter, longDiameter) {
    const a = shortDiameter / 2
    const c = longDiameter / 2
    if (c === a) {
        return 4 * Math.PI * a * a
    }
    const e = Math.sqrt(1 - (a * a) / (c * c))
    return (
        2 * Math.PI * a * a +
        (2 * Math.PI * a * c / e) * Math.asin(e)
    )
}


