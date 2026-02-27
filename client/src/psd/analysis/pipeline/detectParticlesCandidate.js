import * as CV_pkg from 'js-aruco2/src/cv.js'
const _CV = CV_pkg.CV || CV_pkg.default?.CV || CV_pkg

export function detectParticlesCandidate(maskObj, {minAreaPx = 8, _maxAreaMm2=10, externalLabels = null, ellipseFactor = 5.0} = {}) {
    const {width, height, mask} = maskObj
    const labels = externalLabels || new Uint32Array(width * height)
    const particles = []

    // 1. Labeling / Component Analysis
    if (!externalLabels) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x
                if (mask[idx] === 0 || labels[idx] !== 0) continue

                const particleId = particles.length + 1
                const comp = flood(mask, labels, width, height, x, y, particleId)

                if (comp.area >= minAreaPx) {
                    particles.push(finalizeParticle(comp, particleId, ellipseFactor))
                }
            }
        }
    } else {
        // Collect pagePanels from existing external labels (e.g. from Watershed)
        const comps = new Map()
        for (let i = 0; i < externalLabels.length; i++) {
            const label = externalLabels[i]
            if (label === 0) continue

            const x = i % width
            const y = Math.floor(i / width)

            if (!comps.has(label)) {
                comps.set(label, {
                    area: 0, sumX: 0, sumY: 0, sumX2: 0, sumY2: 0, sumXY: 0,
                    minX: x, maxX: x, minY: y, maxY: y
                })
            }
            const c = comps.get(label)
            c.area += 1
            c.sumX += x
            c.sumY += y
            c.sumX2 += x * x
            c.sumY2 += y * y
            c.sumXY += x * y
            if (x < c.minX) c.minX = x
            if (x > c.maxX) c.maxX = x
            if (y < c.minY) c.minY = y
            if (y > c.maxY) c.maxY = y
        }

        for (const [id, c] of comps.entries()) {
            if (c.area < minAreaPx) continue
            const comp = {
                area: c.area,
                cx: c.sumX / c.area,
                cy: c.sumY / c.area,
                sumX2: c.sumX2,
                sumY2: c.sumY2,
                sumXY: c.sumXY,
                minX: c.minX,
                maxX: c.maxX,
                minY: c.minY,
                maxY: c.maxY
            }
            particles.push(finalizeParticle(comp, id, ellipseFactor))
        }
    }

    // 2. Extract Exact Boundaries using CV.findContours
    const binaryData = new Uint8Array(mask.length)
    for (let i = 0; i < mask.length; i++) {
        binaryData[i] = mask[i] === 0 ? 0 : 1
    }

    let contours = []
    try {
        // CV.findContours might crash or enter a `while(true)` loop if passed an array as the borderBuffer.
        // It's more stable to pass an empty object ({}) and let it manage internal memory.
        contours = _CV.findContours({width, height, data: binaryData}, {})
    } catch (e) {
        console.error('CV.findContours failed completely', e)
    }

    // 3. Match Contours to Particle Labels
    contours.forEach(c => {
        if (c.length === 0) return

        const labelCounts = new Map()
        const step = c.length > 200 ? Math.floor(c.length / 50) : 1

        for (let i = 0; i < c.length; i += step) {
            const pt = c[i]
            // Robust 3x3 window check around contour point
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = pt.x + dx
                    const ny = pt.y + dy
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
                    const label = labels[ny * width + nx]
                    if (label > 0 && label !== QUEUED) {
                        labelCounts.set(label, (labelCounts.get(label) || 0) + 1)
                    }
                }
            }
        }

        if (labelCounts.size > 0) {
            // Pick the label with the most votes
            let bestLabel = -1
            let maxVotes = -1
            for (const [label, votes] of labelCounts.entries()) {
                if (votes > maxVotes) {
                    maxVotes = votes
                    bestLabel = label
                }
            }

            if (bestLabel !== -1) {
                const particle = particles.find(p => p.id === bestLabel)
                if (particle && !particle.contour) {
                    particle.contour = c
                }
            }
        }
    })

    return {particles, labels}
}

const QUEUED = 0xFFFFFFFF

function finalizeParticle(comp, particleId, k = 5.0) {
    const mu20 = comp.sumX2 / comp.area - comp.cx * comp.cx
    const mu02 = comp.sumY2 / comp.area - comp.cy * comp.cy
    const mu11 = comp.sumXY / comp.area - comp.cx * comp.cy

    const angleRad = 0.5 * Math.atan2(2 * mu11, mu20 - mu02)
    const eqDiameterPx = 2 * Math.sqrt(comp.area / Math.PI)
    const common = Math.sqrt(Math.max(0, (mu20 - mu02) ** 2 + 4 * mu11 ** 2))

    const majorPx = Math.sqrt(Math.max(0, k * (mu20 + mu02 + common)))
    const minorPx = Math.sqrt(Math.max(0, k * (mu20 + mu02 - common)))

    // REFINED VOLUME: For the candidate, we calculate volume as an oblate spheroid
    // using the TRUE pixel area to define the radius, then using the aspect ratio
    // from the ellipse fit to determine the thickness (z-axis).
    // This is more accurate than relying purely on the k-factor ellipse.
    const eqRadius = eqDiameterPx / 2
    const aspectRatio = majorPx > 0 ? minorPx / majorPx : 1
    const volumePx = (4 / 3) * Math.PI * (eqRadius ** 3) * aspectRatio

    const ellipseAreaPx = Math.PI * (minorPx / 2) * (majorPx / 2)
    const solidity = comp.area / ellipseAreaPx

    return {
        id: particleId,
        cxPx: comp.cx,
        cyPx: comp.cy,
        areaPx: comp.area, // True pixel area
        ellipseAreaPx,
        solidity,
        volumePx,
        surfaceAreaPx: ellipsoidSurfaceArea(minorPx, majorPx),
        eqDiameterPx,
        longAxisPx: majorPx,
        shortAxisPx: minorPx,
        aspectRatio: majorPx > 0 ? majorPx / minorPx : 1,
        angleRad,
        roundness: majorPx > 0 ? minorPx / majorPx : 1,
        bbox: {minX: comp.minX, maxX: comp.maxX, minY: comp.minY, maxY: comp.maxY},
        contour: null
    }
}

function flood(mask, labels, w, h, sx, sy, particleId) {
    const stack = new Uint32Array(32768) // More efficient initial size
    let stackCapacity = 32768
    let currentStack = stack
    let stackPtr = 0

    currentStack[stackPtr++] = sy * w + sx
    labels[sy * w + sx] = QUEUED

    let area = 0
    let sumX = 0
    let sumY = 0
    let sumX2 = 0
    let sumY2 = 0
    let sumXY = 0
    let minX = sx
    let maxX = sx
    let minY = sy
    let maxY = sy

    while (stackPtr > 0) {
        const idx = currentStack[--stackPtr]
        const x = idx % w
        const y = (idx / w) | 0

        if (labels[idx] === particleId) continue
        labels[idx] = particleId

        area += 1
        sumX += x
        sumY += y
        sumX2 += x * x
        sumY2 += y * y
        sumXY += x * y

        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y

        // Use 8-connectivity to help bridge minor fragmentation or noise
        const n1 = idx - w
        const n2 = idx + w
        const n3 = idx - 1
        const n4 = idx + 1
        const n5 = n1 - 1
        const n6 = n1 + 1
        const n7 = n2 - 1
        const n8 = n2 + 1

        if (y > 0) {
            if (labels[n1] === 0 && mask[n1] !== 0) { labels[n1] = QUEUED; push(n1) }
            if (x > 0 && labels[n5] === 0 && mask[n5] !== 0) { labels[n5] = QUEUED; push(n5) }
            if (x < w - 1 && labels[n6] === 0 && mask[n6] !== 0) { labels[n6] = QUEUED; push(n6) }
        }
        if (y < h - 1) {
            if (labels[n2] === 0 && mask[n2] !== 0) { labels[n2] = QUEUED; push(n2) }
            if (x > 0 && labels[n7] === 0 && mask[n7] !== 0) { labels[n7] = QUEUED; push(n7) }
            if (x < w - 1 && labels[n8] === 0 && mask[n8] !== 0) { labels[n8] = QUEUED; push(n8) }
        }
        if (x > 0 && labels[n3] === 0 && mask[n3] !== 0) { labels[n3] = QUEUED; push(n3) }
        if (x < w - 1 && labels[n4] === 0 && mask[n4] !== 0) { labels[n4] = QUEUED; push(n4) }
    }

    function push(nidx) {
        if (stackPtr >= stackCapacity) {
            const newCapacity = (stackCapacity * 1.5) | 0 // 1.5x growth is more memory-friendly
            const newStack = new Uint32Array(newCapacity)
            newStack.set(currentStack)
            currentStack = newStack
            stackCapacity = newCapacity
        }
        currentStack[stackPtr++] = nidx
    }

    return {
        area,
        cx: sumX / area,
        cy: sumY / area,
        sumX2,
        sumY2,
        sumXY,
        minX, maxX, minY, maxY
    }
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
