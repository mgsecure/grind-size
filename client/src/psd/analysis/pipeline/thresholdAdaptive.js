// Adaptive threshold (Gaussian-ish) using mean of neighborhood (box filter) + constant C.
export function adaptiveThreshold(grayObj, {blockSize = 201, C = 4} = {}) {
    const {width, height, gray} = grayObj
    const bs = blockSize % 2 === 0 ? blockSize + 1 : blockSize
    const r = Math.floor(bs / 2)

    const integral = buildIntegral(gray, width, height)
    const mask = new Uint8ClampedArray(width * height)

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const x1 = Math.max(0, x - r)
            const x2 = Math.min(width - 1, x + r)
            const y1 = Math.max(0, y - r)
            const y2 = Math.min(height - 1, y + r)

            const area = (x2 - x1 + 1) * (y2 - y1 + 1)
            const sum = rectSum(integral, width, x1, y1, x2, y2)
            const mean = sum / area
            const idx = y * width + x
            // Invert: particles are dark → 255 in mask
            // In digital templates, black is 0, white is 255.
            // In coffee photos, particles are dark, background is lighter.
            
            // If the local neighborhood is very dark (mean < 50), we are likely 
            // deep inside a large particle or a dark area (like ArUco marker bits).
            // We should keep it as foreground (255) IF the pixel itself is dark.
            const isInsideDark = mean < 50 && gray[idx] < 128;
            
            mask[idx] = (gray[idx] < (mean - C)) || isInsideDark ? 255 : 0
        }
    }
    return {width, height, mask}
}

function buildIntegral(src, w, h) {
    const it = new Uint32Array((w + 1) * (h + 1))
    for (let y = 1; y <= h; y++) {
        let rowSum = 0
        for (let x = 1; x <= w; x++) {
            rowSum += src[(y - 1) * w + (x - 1)]
            it[y * (w + 1) + x] = it[(y - 1) * (w + 1) + x] + rowSum
        }
    }
    return it
}

function rectSum(it, w, x1, y1, x2, y2) {
    const W = w + 1
    const A = it[y1 * W + x1]
    const B = it[y1 * W + (x2 + 1)]
    const C = it[(y2 + 1) * W + x1]
    const D = it[(y2 + 1) * W + (x2 + 1)]
    return D - B - C + A
}
