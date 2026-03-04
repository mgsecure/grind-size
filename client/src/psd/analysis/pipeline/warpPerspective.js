// Warp perspective using homography
// Reference: https://github.com/damianofalcioni/js-aruco2/blob/master/src/cv.js (CV.warp)

import * as CV_pkg from 'js-aruco2/src/cv.js'

// Legacy library uses non-standard exports. We resolve CV based on environment.
// In Vite/Rollup production, CV might not be exported as a named export.
const _CV = CV_pkg.CV || (typeof window !== 'undefined' ? window.CV : null) || CV_pkg.default?.CV || CV_pkg

export function warpPerspective(imageData, corners, targetSize = 2000) {
    const { width, height, data } = imageData

    console.log(`Warping image from ${width}x${height} to ${targetSize}x${targetSize} using corners:`, corners)

    if (!_CV || !_CV.Image) {
        throw new Error('CV library (Image) not found. Perspective warp failed.')
    }

    // Let's create a function that warps a single channel
    const warpChannel = (channelData) => {
        const srcImg = new _CV.Image(width, height, channelData)
        const dstImg = new _CV.Image(targetSize, targetSize)
        _CV.warp(srcImg, dstImg, corners, targetSize)
        return dstImg.data
    }

    // Extract channels
    const r = new Uint8ClampedArray(width * height)
    const g = new Uint8ClampedArray(width * height)
    const b = new Uint8ClampedArray(width * height)
    const a = new Uint8ClampedArray(width * height)

    for (let i = 0, p = 0; i < width * height; i++, p += 4) {
        r[i] = data[p]
        g[i] = data[p + 1]
        b[i] = data[p + 2]
        a[i] = data[p + 3]
    }

    const rw = warpChannel(r)
    const gw = warpChannel(g)
    const bw = warpChannel(b)
    const aw = warpChannel(a)

    const outData = new Uint8ClampedArray(targetSize * targetSize * 4)
    for (let i = 0, p = 0; i < targetSize * targetSize; i++, p += 4) {
        outData[p] = rw[i]
        outData[p + 1] = gw[i]
        outData[p + 2] = bw[i]
        outData[p + 3] = aw[i]
    }

    return {
        width: targetSize,
        height: targetSize,
        data: outData
    }
}

// Map a point from warped coordinates (0..targetSize) back to original coordinates
export function getUnwarpedPoint(p, corners, targetSize = 2000) {
    if (!corners || corners.length < 4 || corners.some(c => c === null)) {
        console.warn('getUnwarpedPoint: Invalid corners provided', corners)
        return p
    }
    // CV.getPerspectiveTransform returns a matrix for square-to-quad (unwarp to raw)
    const m = _CV.getPerspectiveTransform(corners, targetSize - 1)
    
    const x = p.x
    const y = p.y
    
    // Homogeneous coordinates transformation
    const den = m[6] * x + m[7] * y + m[8]
    return {
        x: (m[0] * x + m[1] * y + m[2]) / den,
        y: (m[3] * x + m[4] * y + m[5]) / den
    }
}

// Inverse mapping: Map a point from original coordinates to warped square (0..targetSize)
export function getWarpedPoint(p, corners, targetSize = 2000) {
    if (!corners || corners.length < 4 || corners.some(c => c === null)) {
        console.warn('getWarpedPoint: Invalid corners provided', corners)
        return p
    }
    // Same matrix as above (square -> quad); we need its inverse (quad -> square)
    const m = _CV.getPerspectiveTransform(corners, targetSize - 1)

    // Invert 3x3 homography
    const det =
        m[0] * (m[4] * m[8] - m[5] * m[7]) -
        m[1] * (m[3] * m[8] - m[5] * m[6]) +
        m[2] * (m[3] * m[7] - m[4] * m[6])

    if (Math.abs(det) < 1e-12) {
        console.warn('getWarpedPoint: Homography is singular; returning input point')
        return p
    }

    const inv = new Array(9)
    inv[0] =  (m[4] * m[8] - m[5] * m[7]) / det
    inv[1] = -(m[1] * m[8] - m[2] * m[7]) / det
    inv[2] =  (m[1] * m[5] - m[2] * m[4]) / det
    inv[3] = -(m[3] * m[8] - m[5] * m[6]) / det
    inv[4] =  (m[0] * m[8] - m[2] * m[6]) / det
    inv[5] = -(m[0] * m[5] - m[2] * m[3]) / det
    inv[6] =  (m[3] * m[7] - m[4] * m[6]) / det
    inv[7] = -(m[0] * m[7] - m[1] * m[6]) / det
    inv[8] =  (m[0] * m[4] - m[1] * m[3]) / det

    const x = p.x
    const y = p.y
    const den = inv[6] * x + inv[7] * y + inv[8]
    return {
        x: (inv[0] * x + inv[1] * y + inv[2]) / den,
        y: (inv[3] * x + inv[4] * y + inv[5]) / den
    }
}

// Optional: Warp to a canvas if we are in a browser environment
export function warpToCanvas(imageData, corners, targetSize = 2000) {
    const warped = warpPerspective(imageData, corners, targetSize)
    const canvas = document.createElement('canvas')
    canvas.width = targetSize
    canvas.height = targetSize
    const ctx = canvas.getContext('2d')
    const imgData = new ImageData(new Uint8ClampedArray(warped.data), targetSize, targetSize)
    ctx.putImageData(imgData, 0, 0)
    return canvas
}
