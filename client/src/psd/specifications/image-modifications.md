In `analyzeImage.js`, the following functions directly change or process the "actual pixels" being analyzed from the original image:

### 1. `decodeImageToImageData(file)`
This is the entry point where the raw file is decoded into an `ImageData` object. While it doesn't "change" the content, it converts the compressed image data into the RGBA pixel array used by all subsequent steps.

### 2. `warpPerspective(imageData, warpCorners, warpSize)`
This is the most significant transformation. If all four template markers are detected, this function uses a homography matrix to unwarp the image into a fixed-size square (default 2000x2000px).
*   **Effect:** It re-samples the pixels from the original image to correct perspective distortion. After this point, `analysisImageData` becomes the warped version, and all subsequent particle detection is performed on this new pixel grid.

### 3. `normalizeLighting(analysisImageData, {bgSigma})`
This function processes the color pixels to handle uneven lighting.
*   **Effect:** It converts the image to grayscale and applies a background subtraction (division) method. The output is a single-channel grayscale buffer where each pixel represents a normalized intensity value relative to its local background.

### 4. `adaptiveThreshold(gray, {blockSize, C})`
This takes the normalized grayscale pixels and converts them into a binary mask.
*   **Effect:** It transforms every pixel into either `255` (foreground/particle) or `0` (background) based on local adaptive criteria. This binary "mask" is what the detection algorithms actually "see" as particles.

### 5. `morphologyOpen(mask)`
This performs morphological operations (erosion followed by dilation) on the binary mask.
*   **Effect:** It removes small isolated noise pixels and "smooths" the boundaries of the detected particles by modifying the binary state of pixels at the edges of shapes.

### 6. `detectMarkers({ width, height, data: imageData.data.slice() })`
While primarily for finding markers, the underlying library (`js-aruco2`) performs its own internal grayscale conversion and thresholding on a copy of the pixel data to identify the square marker candidates.

### Summary of Data Flow
*   **`imageData`**: Raw RGBA pixels.
*   **`analysisImageData`**: May be warped/resampled (perspective correction).
*   **`gray`**: Grayscale and lighting-normalized pixels.
*   **`mask` / `cleaned`**: Binary pixels (the ultimate "actual" pixels used for shape analysis).