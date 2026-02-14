import pkg from 'js-aruco2'
const {AR} = pkg

export function detectMarkers(imageData) {
    const detector = new AR.Detector({
        dictionaryName: 'ARUCO'
    })
    // js-aruco2 expects an object with width, height and data (RGBA)
    // which imageData already is.
    const markers = detector.detect(imageData)
    
    // markers is an array of AR.Marker objects: { id, corners, hammingDistance }
    // corners is an array of 4 points: { x, y }
    return markers
}
