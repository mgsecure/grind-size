import * as CV_pkg from 'js-aruco2/src/cv.js'
const _CV = CV_pkg.CV || CV_pkg.default?.CV || CV_pkg

export function detectParticlesTest(maskObj, {minAreaPx = 8, _maxAreaMm2=10, externalLabels = null} = {}) {
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
                    particles.push(finalizeParticle(comp, particleId))
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
            particles.push(finalizeParticle(comp, id))
        }
    }

    // 2. Extract Exact Boundaries using CV.findContours
    // CV.findContours needs a destination buffer for the binary border: (width + 2) * (height + 2)
    // To save memory, we can manually create a 0/1 version to avoid its grayscale pass if it had one.
    const binaryData = new Uint8Array(mask.length)
    for (let i = 0; i < mask.length; i++) {
        binaryData[i] = mask[i] === 0 ? 0 : 1
    }
    
    let contours = []
    try {

        // CRASHES
        //const borderBuffer = new Uint8Array((width + 2) * (height + 2))
        //contours = _CV.findContours({width, height, data: binaryData}, borderBuffer)

        contours = _CV.findContours({width, height, data: binaryData}, {})

    } catch (e) {
        console.warn('CV.findContours failed with borderBuffer, retrying with empty object', e)
        try {
            contours = _CV.findContours({width, height, data: binaryData}, {})
        } catch (e2) {
            console.error('CV.findContours failed completely', e2)
        }
    }

    // 3. Match Contours to Particle Labels
    contours.forEach(c => {
        if (c.length === 0) return
        
        // Find most frequent label in the contour points
        const labelCounts = new Map()
        
        // Optimization: if contour is long, sample points to avoid O(N) work
        const step = c.length > 200 ? Math.floor(c.length / 50) : 1
        
        for (let i = 0; i < c.length; i += step) {
            const pt = c[i]
            // Check exact point and 4-neighbors to handle borderFollowing offsets
            const candidates = [
                [pt.x, pt.y],
                [pt.x - 1, pt.y], [pt.x + 1, pt.y], [pt.x, pt.y - 1], [pt.x, pt.y + 1]
            ]
            
            for (const [nx, ny] of candidates) {
                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
                const label = labels[ny * width + nx]
                if (label > 0 && label !== QUEUED) {
                    labelCounts.set(label, (labelCounts.get(label) || 0) + 1)
                    // If we found a very strong match early, we can stop for this point
                    break 
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

function finalizeParticle(comp, particleId) {
    const mu20 = comp.sumX2 / comp.area - comp.cx * comp.cx
    const mu02 = comp.sumY2 / comp.area - comp.cy * comp.cy
    const mu11 = comp.sumXY / comp.area - comp.cx * comp.cy

    const angleRad = 0.5 * Math.atan2(2 * mu11, mu20 - mu02)
    const eqDiameterPx = 2 * Math.sqrt(comp.area / Math.PI)
    const common = Math.sqrt(Math.max(0, (mu20 - mu02) ** 2 + 4 * mu11 ** 2))

    // Tighter factor (k=4.2) for coffee grounds in the Test pipeline
    const k = 4.2 
    const majorPx = Math.sqrt(Math.max(0, k * (mu20 + mu02 + common)))
    const minorPx = Math.sqrt(Math.max(0, k * (mu20 + mu02 - common)))

    return {
        id: particleId,
        cxPx: comp.cx,
        cyPx: comp.cy,
        areaPx: comp.area, 
        volumePx: ellipsoidVolume(minorPx, majorPx),
        surfaceAreaPx: ellipsoidSurfaceArea(minorPx, majorPx),
        eqDiameterPx,
        longAxisPx: majorPx,
        shortAxisPx: minorPx,
        angleRad,
        roundness: majorPx > 0 ? minorPx / majorPx : 1,
        bbox: {minX: comp.minX, maxX: comp.maxX, minY: comp.minY, maxY: comp.maxY},
        contour: null
    }
}

function flood(mask, labels, w, h, sx, sy, particleId) {
    const stack = new Uint32Array(100000) // Start with a reasonable size
    let stackCapacity = 100000
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
            const newCapacity = stackCapacity * 2
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
