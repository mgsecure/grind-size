
export function distanceTransform(maskObj) {
    const { width, height, mask } = maskObj;
    const dist = new Float32Array(width * height);
    const INF = 1e10;

    // Initialization
    for (let i = 0; i < mask.length; i++) {
        dist[i] = mask[i] > 0 ? INF : 0;
    }

    // Two-pass 4-connectivity distance transform (Manhattan-ish, but Euclidean-ish squared is better)
    // For simplicity, we'll start with a 4-neighbor pass for an approximation
    // Pass 1: Top-Left to Bottom-Right
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (dist[idx] > 0) {
                let d = dist[idx];
                if (x > 0) d = Math.min(d, dist[idx - 1] + 1);
                if (y > 0) d = Math.min(d, dist[idx - width] + 1);
                dist[idx] = d;
            }
        }
    }

    // Pass 2: Bottom-Right to Top-Left
    for (let y = height - 1; y >= 0; y--) {
        for (let x = width - 1; x >= 0; x--) {
            const idx = y * width + x;
            if (dist[idx] > 0) {
                let d = dist[idx];
                if (x < width - 1) d = Math.min(d, dist[idx + 1] + 1);
                if (y < height - 1) d = Math.min(d, dist[idx + width] + 1);
                dist[idx] = d;
            }
        }
    }

    return { width, height, dist };
}

// Standard Watershed using a Priority Queue based on distance
export function watershed(distObj, labels, minPeakDist = 5) {
    const { width, height, dist } = distObj;
    
    // 1. Find local maxima in distance transform to serve as seeds
    const seeds = [];
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            if (dist[idx] < minPeakDist) continue;
            
            let isMax = true;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    if (dist[idx + dy * width + dx] > dist[idx]) {
                        isMax = false;
                        break;
                    }
                }
                if (!isMax) break;
            }
            
            if (isMax) {
                // For seeds, we only care about distance, but we should also check
                // if they are part of a very large component.
                seeds.push({ x, y, val: dist[idx] });
            }
        }
    }

    // 2. Sort seeds by distance (highest first)
    seeds.sort((a, b) => b.val - a.val);

    // 3. Assign new labels to seeds
    let nextId = 0;
    const seedLabels = new Uint32Array(width * height);
    const pq = new PriorityQueue((a, b) => dist[b] - dist[a]); // Max-priority by distance
    
    // Deduplicate seeds that are too close to each other
    // We increase the distance threshold for deduplication to avoid over-segmentation
    const filteredSeeds = [];
    const minSeedDistSq = minPeakDist * minPeakDist;
    for (const seed of seeds) {
        let tooClose = false;
        for (const existing of filteredSeeds) {
            const d2 = (seed.x - existing.x) ** 2 + (seed.y - existing.y) ** 2;
            if (d2 < minSeedDistSq) {
                tooClose = true;
                break;
            }
        }
        if (!tooClose) {
            filteredSeeds.push(seed);
        }
    }

    for (const seed of filteredSeeds) {
        const idx = seed.y * width + seed.x;
        if (seedLabels[idx] === 0) {
            nextId++;
            seedLabels[idx] = nextId;
            pq.push(idx);
        }
    }

    // 4. Watershed region growing
    let swivel = 0;
    const maxSwivel = width * height * 4; // Use a more conservative multiplier
    while (!pq.isEmpty()) {
        swivel++;
        if (swivel > maxSwivel) { 
            console.error('Watershed: Possible infinite loop detected in region growing.');
            break;
        }
        const idx = pq.pop();
        const x = idx % width;
        const y = Math.floor(idx / width);
        const curLabel = seedLabels[idx];

        const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
        for (const [nx, ny] of neighbors) {
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const nidx = ny * width + nx;
            // Only grow into foreground pixels that aren't labeled yet
            // Added check: don't grow into pixels with distance larger than current to avoid moving uphill
            // (Standard watershed doesn't necessarily need this if seeds are global maxima,
            // but it helps stability with noisy distance transforms)
            if (dist[nidx] > 0 && seedLabels[nidx] === 0) {
                // Potential improvement: only assign label if neighbor is "downhill" or "level"
                // But priority queue already handles "uphill" seeds by popping them first.
                seedLabels[nidx] = curLabel;
                pq.push(nidx);
            }
        }
    }

    // 5. Restore "lost" particles that didn't have a watershed seed
    // We do this by finding all foreground pixels (dist > 0) that still have label 0
    // and running a simple connected components pass on them.
    for (let i = 0; i < seedLabels.length; i++) {
        if (dist[i] > 0 && seedLabels[i] === 0) {
            nextId++;
            // Simple flood fill for the lost component
            const stack = [i];
            seedLabels[i] = nextId;
            let safetyCount = 0;
            const maxSafety = width * height;
            while (stack.length > 0) {
                safetyCount++;
                if (safetyCount > maxSafety) {
                    console.error('Watershed: Possible infinite loop in lost particle restoration.');
                    break;
                }
                const currIdx = stack.pop();
                const cx = currIdx % width;
                const cy = Math.floor(currIdx / width);
                
                const neighbors = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
                for (const [nx, ny] of neighbors) {
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                    const nidx = ny * width + nx;
                    if (dist[nidx] > 0 && seedLabels[nidx] === 0) {
                        seedLabels[nidx] = nextId;
                        stack.push(nidx);
                    }
                }
            }
        }
    }

    return seedLabels;
}

class PriorityQueue {
    constructor(comparator) {
        this.heap = [];
        this.comparator = comparator;
    }
    push(val) {
        this.heap.push(val);
        this.siftUp();
    }
    pop() {
        if (this.size() === 0) return null;
        const top = this.heap[0];
        const last = this.heap.pop();
        if (this.size() > 0) {
            this.heap[0] = last;
            this.siftDown();
        }
        return top;
    }
    size() { return this.heap.length; }
    isEmpty() { return this.size() === 0; }
    siftUp() {
        let node = this.size() - 1;
        while (node > 0) {
            const parent = (node - 1) >> 1;
            if (this.comparator(this.heap[node], this.heap[parent]) < 0) {
                [this.heap[node], this.heap[parent]] = [this.heap[parent], this.heap[node]];
                node = parent;
            } else break;
        }
    }
    siftDown() {
        let node = 0;
        while (true) {
            let smallest = node;
            const left = (node << 1) + 1;
            const right = (node << 1) + 2;
            if (left < this.size() && this.comparator(this.heap[left], this.heap[smallest]) < 0) smallest = left;
            if (right < this.size() && this.comparator(this.heap[right], this.heap[smallest]) < 0) smallest = right;
            if (smallest !== node) {
                [this.heap[node], this.heap[smallest]] = [this.heap[smallest], this.heap[node]];
                node = smallest;
            } else break;
        }
    }
}
