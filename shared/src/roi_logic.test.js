import assert from 'node:assert/strict'

// Mock settings
const settings = {
    insetPx: 8,
    warpSizePx: 2000
}

// Mock template
const template = {
    sizeMm: 100,
    outerMm: 130,
    innerMm: 100
}

// Mock pxPerMm based on 2000px warp size and 130mm outer size
const pxPerMm = 2000 / 130 // 15.3846

// Logic from analyzeImage.js (lines 58-73)
const outerMm = template.outerMm
const innerMm = template.innerMm
const marginMm = (outerMm - innerMm) / 2
const marginPx = marginMm * pxPerMm
const sizePx = settings.warpSizePx || 2000

const actualBounds = {
    minX: Math.round(marginPx + (settings.insetPx || 8)),
    maxX: Math.round(sizePx - marginPx - (settings.insetPx || 8)),
    minY: Math.round(marginPx + (settings.insetPx || 8)),
    maxY: Math.round(sizePx - marginPx - (settings.insetPx || 8))
}

console.log('ROI actualBounds:', actualBounds)
console.log('marginPx:', marginPx)
console.log('marginPx + insetPx:', marginPx + settings.insetPx)

// If marginPx is the distance to the marker inner edge, 
// then in the warped image (which starts at the outer marker edge),
// the inner marker edge should be at marginPx.
// The ROI should be insetPx INSIDE the inner marker edge.
// So minX should be marginPx + insetPx.

const expectedMinX = Math.round(15 * (2000/130) + 8) // 15 * 15.3846 + 8 = 230.769 + 8 = 238.769 -> 239
assert.equal(actualBounds.minX, expectedMinX, 'minX should be marginPx + insetPx')

console.log('ok: ROI logic test passed')
