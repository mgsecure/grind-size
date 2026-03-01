
export async function separateOverlapsCandidate(detectFn, detectResult, cleaned, settings) {

    console.log('using separateOverlaps')

    try {
        const dt = distanceTransform(cleaned)
        const minPeakDist = 3 + (settings.splitSensitivity || 0.5) * 20
        const watershedLabels = watershed(dt, detectResult.labels, minPeakDist, settings.minAreaPx)
        return await detectFn(cleaned, {
            minAreaPx: settings.minAreaPx,
            externalLabels: watershedLabels
        })
    } catch (e) {
        console.error('Overlap separation failed', e)
        // Continue with non-split results if watershed fails?
        // For now, let it throw to surface the error.
        throw e
    }

}

export function distanceTransform(maskObj) {
    const { width, height, mask } = maskObj
    const dist = new Float32Array(width * height)
    const INF = 1e10

    // Initialization
    for (let i = 0; i < mask.length; i++) {
        dist[i] = mask[i] > 0 ? INF : 0
    }

    // Two-pass 8-connectivity distance transform (Euclidean approximation using Chamfer 5-7-11 or similar)
    // We'll use a simpler but better-than-Manhattan approach: 8-connectivity with weight 1 and 1.414
    const SQRT2 = Math.sqrt(2)

    // Pass 1: Top-Left to Bottom-Right
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x
            if (dist[idx] > 0) {
                let d = dist[idx]
                // 8 neighbors in previous scan (top-left, top, top-right, left)
                if (x > 0) d = Math.min(d, dist[idx - 1] + 1)
                if (y > 0) {
                    d = Math.min(d, dist[idx - width] + 1)
                    if (x > 0) d = Math.min(d, dist[idx - width - 1] + SQRT2)
                    if (x < width - 1) d = Math.min(d, dist[idx - width + 1] + SQRT2)
                }
                dist[idx] = d
            }
        }
    }

    // Pass 2: Bottom-Right to Top-Left
    for (let y = height - 1; y >= 0; y--) {
        for (let x = width - 1; x >= 0; x--) {
            const idx = y * width + x
            if (dist[idx] > 0) {
                let d = dist[idx]
                // 8 neighbors in next scan (bottom-right, bottom, bottom-left, right)
                if (x < width - 1) d = Math.min(d, dist[idx + 1] + 1)
                if (y < height - 1) {
                    d = Math.min(d, dist[idx + width] + 1)
                    if (x < width - 1) d = Math.min(d, dist[idx + width + 1] + SQRT2)
                    if (x > 0) d = Math.min(d, dist[idx + width - 1] + SQRT2)
                }
                dist[idx] = d
            }
        }
    }

    return { width, height, dist }
}

// Standard Watershed using a Priority Queue based on distance
export function watershed(distObj, originalLabels, minPeakDist = 5, minAreaPx = 8) {
    const { width, height, dist } = distObj

    // 1. Find local maxima in distance transform to serve as seeds
    let seeds = []
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x
            if (dist[idx] < minPeakDist) continue

            let isMax = true
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue
                    if (dist[idx + dy * width + dx] > dist[idx]) {
                        isMax = false
                        break
                    }
                }
                if (!isMax) break
            }

            if (isMax) {
                seeds.push({ x, y, val: dist[idx], originalId: originalLabels[idx] })
            }
        }
    }

    // 2. Sort seeds by distance (highest first)
    seeds.sort((a, b) => b.val - a.val)

    // 2a. Pre-filter seeds: prominence check (H-maxima-like approach)
    // We only keep seeds that are not "too close" in value to an existing higher seed
    // that belongs to the same original particle.
    const hMaximaThreshold = 1.0 // Lowered from 1.5 to be more sensitive to real overlaps
    const filteredSeedsByHeight = []
    for (const seed of seeds) {
        let isSuppressed = false
        for (const existing of filteredSeedsByHeight) {
            if (seed.originalId === existing.originalId) {
                const dx = seed.x - existing.x
                const dy = seed.y - existing.y
                const distBetweenSeeds = Math.sqrt(dx * dx + dy * dy)
                
                // If the new seed is very close to a higher peak, AND the distance value difference is small
                // compared to the distance between them, it's likely noise on a smooth slope.
                // We also consider the 'valley' between them for irregular clumps.
                if (distBetweenSeeds < minPeakDist * 1.5 && (existing.val - seed.val) < hMaximaThreshold) {
                    isSuppressed = true
                    break
                }
            }
        }
        if (!isSuppressed) {
            filteredSeedsByHeight.push(seed)
        }
    }
    seeds = filteredSeedsByHeight

    // 2b. Secondary seed detection for irregular clumps: "Prominent Local Inflexions"
    // If an original particle only has ONE seed but has low solidity, it might be a clump
    // that the distance transform failed to split (e.g. thin dog-bone shape).
    // We can't easily do full contour analysis here without refactoring, 
    // but we can look for secondary maxima that were filtered out but are far from the main peak.
    const originalParticleSeedCount = new Map()
    for (const s of seeds) {
        originalParticleSeedCount.set(s.originalId, (originalParticleSeedCount.get(s.originalId) || 0) + 1)
    }

    // Identify particles that might need more seeds
    const candidateParticlesForExtraSeeds = new Set()
    for (const [id, count] of originalParticleSeedCount.entries()) {
        if (count === 1) candidateParticlesForExtraSeeds.add(id)
    }

    if (candidateParticlesForExtraSeeds.size > 0) {
        // Look at the original seeds (before height filtering) and see if any 
        // rejected seeds are actually good candidates for thin clumps.
        for (const y = 2; y < height - 2; y++) {
            for (const x = 2; x < width - 2; x++) {
                const idx = y * width + x
                const origId = originalLabels[idx]
                if (origId === 0 || !candidateParticlesForExtraSeeds.has(origId)) continue
                
                // If this is a local max but smaller than minPeakDist
                // It might be a seed for a thin part of a clump
                const dVal = dist[idx]
                if (dVal < minPeakDist && dVal > minPeakDist * 0.5) {
                    let isLocalMax = true
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue
                            if (dist[idx + dy * width + dx] > dVal) { isLocalMax = false; break }
                        }
                        if (!isLocalMax) break
                    }
                    
                    if (isLocalMax) {
                        // Check distance to existing seed
                        const mainSeed = seeds.find(s => s.originalId === origId)
                        if (mainSeed) {
                            const d2 = (x - mainSeed.x) ** 2 + (y - mainSeed.y) ** 2
                            // If it's far enough from the main seed, it's a candidate for a thin clump split
                            if (d2 > (minPeakDist * 2) ** 2) {
                                seeds.push({ x, y, val: dVal, originalId: origId })
                                candidateParticlesForExtraSeeds.delete(origId) // Only add one extra
                            }
                        }
                    }
                }
            }
        }
    }

    // 3. Assign new labels to seeds
    let nextId = 0
    const seedLabels = new Uint32Array(width * height)
    const pq = new PriorityQueue((a, b) => dist[b] - dist[a]) // Max-priority by distance

    // Deduplicate seeds that are too close to each other
    // We increase the distance threshold for deduplication to avoid over-segmentation
    const filteredSeeds = []
    const minSeedDistSq = minPeakDist * minPeakDist
    for (const seed of seeds) {
        let tooClose = false
        for (const existing of filteredSeeds) {
            const d2 = (seed.x - existing.x) ** 2 + (seed.y - existing.y) ** 2
            if (d2 < minSeedDistSq) {
                tooClose = true
                break
            }
        }
        if (!tooClose) {
            filteredSeeds.push(seed)
        }
    }

    for (const seed of filteredSeeds) {
        const idx = seed.y * width + seed.x
        if (seedLabels[idx] === 0) {
            nextId++
            seedLabels[idx] = nextId
            pq.push(idx)
        }
    }

    // 4. Watershed region growing
    let swivel = 0
    const maxSwivel = width * height * 4 // Use a more conservative multiplier
    while (!pq.isEmpty()) {
        swivel++
        if (swivel > maxSwivel) {
            console.error('Watershed: Possible infinite loop detected in region growing.')
            break
        }
        const idx = pq.pop()
        const x = idx % width
        const y = Math.floor(idx / width)
        const curLabel = seedLabels[idx]

        const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
        for (const [nx, ny] of neighbors) {
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
            const nidx = ny * width + nx
            // Only grow into foreground pixels that aren't labeled yet
            if (dist[nidx] > 0 && seedLabels[nidx] === 0) {
                seedLabels[nidx] = curLabel
                pq.push(nidx)
            }
        }
    }

    // 5. Restore "lost" particles that didn't have a watershed seed
    for (let i = 0; i < seedLabels.length; i++) {
        if (dist[i] > 0 && seedLabels[i] === 0) {
            nextId++
            // Simple flood fill for the lost component
            const stack = [i]
            seedLabels[i] = nextId
            let safetyCount = 0
            const maxSafety = width * height
            while (stack.length > 0) {
                safetyCount++
                if (safetyCount > maxSafety) {
                    console.error('Watershed: Possible infinite loop in lost particle restoration.')
                    break
                }
                const currIdx = stack.pop()
                const cx = currIdx % width
                const cy = Math.floor(currIdx / width)

                const neighbors = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]
                for (const [nx, ny] of neighbors) {
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
                    const nidx = ny * width + nx
                    if (dist[nidx] > 0 && seedLabels[nidx] === 0) {
                        seedLabels[nidx] = nextId
                        stack.push(nidx)
                    }
                }
            }
        }
    }

    // 6. Post-processing: Merge segments smaller than minAreaPx
    // We identify segments from the same original particle and merge them if too small.
    const labelCounts = new Map()
    for (let i = 0; i < seedLabels.length; i++) {
        const label = seedLabels[i]
        if (label === 0) continue
        labelCounts.set(label, (labelCounts.get(label) || 0) + 1)
    }

    const smallLabels = []
    for (const [label, count] of labelCounts.entries()) {
        if (count < minAreaPx) {
            smallLabels.push(label)
        }
    }

    if (smallLabels.length > 0) {
        const smallLabelSet = new Set(smallLabels)
        // For each small label, find its neighbors
        const neighborMap = new Map() // label -> Set of neighboring labels

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x
                const label = seedLabels[idx]
                if (label === 0) continue

                const neighbors = [[x + 1, y], [x, y + 1]]
                for (const [nx, ny] of neighbors) {
                    if (nx >= width || ny >= height) continue
                    const nidx = ny * width + nx
                    const nlabel = seedLabels[nidx]
                    if (nlabel !== 0 && nlabel !== label) {
                        if (smallLabelSet.has(label)) {
                            if (!neighborMap.has(label)) neighborMap.set(label, new Set())
                            neighborMap.get(label).add(nlabel)
                        }
                        if (smallLabelSet.has(nlabel)) {
                            if (!neighborMap.has(nlabel)) neighborMap.set(nlabel, new Set())
                            neighborMap.get(nlabel).add(label)
                        }
                    }
                }
            }
        }

        // Merge small labels into their largest neighbor
        // We iterate and merge. If a small label has multiple neighbors, pick the largest one.
        const mergeMap = new Map() // smallLabel -> largestNeighbor
        for (const smallLabel of smallLabels) {
            const neighbors = neighborMap.get(smallLabel)
            if (neighbors) {
                let largestNeighbor = -1
                let maxCount = -1
                for (const n of neighbors) {
                    const c = labelCounts.get(n) || 0
                    if (c > maxCount) {
                        maxCount = c
                        largestNeighbor = n
                    }
                }
                if (largestNeighbor !== -1) {
                    mergeMap.set(smallLabel, largestNeighbor)
                    // Update count of largestNeighbor
                    labelCounts.set(largestNeighbor, (labelCounts.get(largestNeighbor) || 0) + (labelCounts.get(smallLabel) || 0))
                }
            }
        }

        if (mergeMap.size > 0) {
            // Pre-flatten the mergeMap to avoid O(D) path following in the loop (where D is depth of merge chains)
            const flattenedMergeMap = new Map()
            for (const startLabel of mergeMap.keys()) {
                let target = startLabel
                const visited = new Set()
                while (mergeMap.has(target)) {
                    visited.add(target)
                    target = mergeMap.get(target)
                    if (visited.has(target)) break // Cycle break
                }
                flattenedMergeMap.set(startLabel, target)
            }

            // Single pass to update all pixels
            for (let i = 0; i < seedLabels.length; i++) {
                const label = seedLabels[i]
                if (flattenedMergeMap.has(label)) {
                    seedLabels[i] = flattenedMergeMap.get(label)
                }
            }
        }
    }

    return seedLabels
}

class PriorityQueue {
    constructor(comparator) {
        this.heap = []
        this.comparator = comparator
    }
    push(val) {
        this.heap.push(val)
        this.siftUp()
    }
    pop() {
        if (this.size() === 0) return null
        const top = this.heap[0]
        const last = this.heap.pop()
        if (this.size() > 0) {
            this.heap[0] = last
            this.siftDown()
        }
        return top
    }
    size() { return this.heap.length }
    isEmpty() { return this.size() === 0 }
    siftUp() {
        let node = this.size() - 1
        while (node > 0) {
            const parent = (node - 1) >> 1
            if (this.comparator(this.heap[node], this.heap[parent]) < 0) {
                [this.heap[node], this.heap[parent]] = [this.heap[parent], this.heap[node]]
                node = parent
            } else break
        }
    }
    siftDown() {
        let node = 0
        while (true) {
            let smallest = node
            const left = (node << 1) + 1
            const right = (node << 1) + 2
            if (left < this.size() && this.comparator(this.heap[left], this.heap[smallest]) < 0) smallest = left
            if (right < this.size() && this.comparator(this.heap[right], this.heap[smallest]) < 0) smallest = right
            if (smallest !== node) {
                [this.heap[node], this.heap[smallest]] = [this.heap[smallest], this.heap[node]]
                node = smallest
            } else break
        }
    }
}
