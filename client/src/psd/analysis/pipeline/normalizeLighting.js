// Background correction: large blur approximation using a separable box blur on grayscale
export function normalizeLighting(imageData, {bgSigma = 35} = {}) {
    const {width, height, data} = imageData
    const gray = new Uint8ClampedArray(width * height)

    for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
        gray[i] = (data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114) | 0
    }

    // crude blur radius derived from sigma
    const r = Math.max(3, Math.min(80, Math.round(bgSigma)))
    const blurred = boxBlur(gray, width, height, r)

    // divide normalization
    const out = new Uint8ClampedArray(gray.length)
    for (let i = 0; i < gray.length; i++) {
        const g = gray[i] + 1
        const b = blurred[i] + 1
        const v = Math.min(255, Math.max(0, Math.round((g / b) * 128)))
        out[i] = v
    }
    return {width, height, gray: out}
}

function boxBlur(src, w, h, r) {
    // horizontal then vertical
    const tmp = new Uint32Array(w * h)
    const out = new Uint32Array(w * h)

    for (let y = 0; y < h; y++) {
        let sum = 0
        const row = y * w
        for (let x = -r; x <= r; x++) {
            const xx = clamp(x, 0, w - 1)
            sum += src[row + xx]
        }
        for (let x = 0; x < w; x++) {
            tmp[row + x] = sum
            const x1 = clamp(x - r, 0, w - 1)
            const x2 = clamp(x + r + 1, 0, w - 1)
            sum += src[row + x2] - src[row + x1]
        }
    }

    for (let x = 0; x < w; x++) {
        let sum = 0
        for (let y = -r; y <= r; y++) {
            const yy = clamp(y, 0, h - 1)
            sum += tmp[yy * w + x]
        }
        for (let y = 0; y < h; y++) {
            out[y * w + x] = sum
            const y1 = clamp(y - r, 0, h - 1)
            const y2 = clamp(y + r + 1, 0, h - 1)
            sum += tmp[y2 * w + x] - tmp[y1 * w + x]
        }
    }

    const denom = (2 * r + 1) * (2 * r + 1)
    const dst = new Uint8ClampedArray(w * h)
    for (let i = 0; i < dst.length; i++) dst[i] = Math.round(out[i] / denom)
    return dst
}

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v))
}
