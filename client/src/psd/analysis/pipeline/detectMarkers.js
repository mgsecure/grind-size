import * as AR_pkg from 'js-aruco2/src/aruco.js'
import {adaptiveThreshold} from './thresholdAdaptive.js'

// Legacy library uses non-standard exports. We resolve AR based on environment.
const _AR = AR_pkg.AR || AR_pkg.default?.AR || AR_pkg

export function detectMarkers(imageData) {
    const {width, height, data} = imageData
    
    // js-aruco2's adaptive thresholding uses a fixed small kernel (2x2).
    // In high-resolution images, markers are large and this small kernel fails.
    // Downscaling the image for detection makes it much more robust.
    const maxDim = 1000
    const scale = Math.min(1, maxDim / Math.max(width, height))
    
    let sw = width
    let sh = height
    let detectionImage = imageData
    
    if (scale < 1) {
        sw = Math.round(width * scale)
        sh = Math.round(height * scale)
        
        // We use a canvas to downscale efficiently
        const canvas = document.createElement('canvas')
        canvas.width = sw
        canvas.height = sh
        const ctx = canvas.getContext('2d')
        
        // Use ImageBitmap if available for potentially better performance, otherwise use canvas
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width
        tempCanvas.height = height
        const tempCtx = tempCanvas.getContext('2d')
        const tempImgData = new ImageData(new Uint8ClampedArray(data), width, height)
        tempCtx.putImageData(tempImgData, 0, 0)
        
        // Draw scaled
        ctx.drawImage(tempCanvas, 0, 0, sw, sh)
        detectionImage = ctx.getImageData(0, 0, sw, sh)
    }

    // Preprocessing: override internal thresholding by providing a binary image
    // ArUco markers are typically ~5-7% of the image width. 
    // In a 1000px image, they are ~50-70px. A blockSize of 41 is a good balance.
    const gray = new Uint8ClampedArray(sw * sh)
    const dData = detectionImage.data
    for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
        gray[i] = (dData[p] * 0.299 + dData[p + 1] * 0.587 + dData[p + 2] * 0.114) | 0
    }
    
    const {mask} = adaptiveThreshold({width: sw, height: sh, gray}, {blockSize: 61, C: 10})
    
    // js-aruco2 expects a grayscale image and will do CV.adaptiveThreshold internally.
    // We want to "pre-threshold" it so that its internal thresholding becomes a no-op or very stable.
    // Since js-aruco2 subtracts the blurred version from the original, 
    // if we provide 0 and 255 values, it works well.
    const preThresholded = new ImageData(sw, sh)
    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
        const v = 255 - mask[i] // Invert because our mask has 255 for dark particles (markers)
        preThresholded.data[p] = v
        preThresholded.data[p + 1] = v
        preThresholded.data[p + 2] = v
        preThresholded.data[p + 3] = 255
    }

    const detector = new _AR.Detector({
        dictionaryName: 'ARUCO'
    })
    
    // Try detection on the pre-thresholded image first (robust for rotation/high-res)
    let markers = detector.detect(preThresholded)
    
    // If fewer than 3 markers found, try on the original grayscale (sometimes better for straight/clean images)
    if (markers.length < 3) {
        const greyImg = new ImageData(sw, sh)
        for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
            const v = gray[i]
            greyImg.data[p] = v
            greyImg.data[p + 1] = v
            greyImg.data[p + 2] = v
            greyImg.data[p + 3] = 255
        }
        const fallbackMarkers = detector.detect(greyImg)
        if (fallbackMarkers.length > markers.length) {
            markers = fallbackMarkers
        }
    }
    
    if (scale < 1) {
        // Map corners back to original coordinates
        markers.forEach(m => {
            m.corners.forEach(c => {
                c.x /= scale
                c.y /= scale
            })
        })
    }
    
    return markers
}
