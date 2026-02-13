export function morphologyOpen(maskObj) {
    const {width, height, mask} = maskObj
    const eroded = erode(mask, width, height)
    const dilated = dilate(eroded, width, height)
    return {width, height, mask: dilated}
}

function erode(src, w, h) {
    const out = new Uint8ClampedArray(src.length)
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            let ok = 255
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (src[(y + dy) * w + (x + dx)] === 0) ok = 0
                }
            }
            out[y * w + x] = ok
        }
    }
    return out
}

function dilate(src, w, h) {
    const out = new Uint8ClampedArray(src.length)
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            let v = 0
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (src[(y + dy) * w + (x + dx)] === 255) v = 255
                }
            }
            out[y * w + x] = v
        }
    }
    return out
}
