# Particle Size Distribution (PSD) Module Guidelines

This guide focuses on the functions and logic within `client/src/psd`, which handles coffee grind analysis.

## Core Analysis Pipeline (`analysis/`)

The analysis is performed in the browser using an orchestrator: `analyzeImageFiles(file, settings)` in `analysis/analyzeImage.js`.

### 1. Image Processing (`pipeline/`)
- **`decodeImageToImageData(file)`**: Converts an uploaded file to `ImageData`.
- **`normalizeLighting(imageData, {bgSigma})`**: 
    - Converts to grayscale.
    - Performs a large-radius box blur to approximate the background.
    - Normalizes the image by dividing the original by the background to mitigate lighting gradients.
- **`adaptiveThreshold(grayObj, {blockSize, C})`**: 
    - Uses an integral image to efficiently calculate local means.
    - Particles (darker than mean - C) are marked as foreground (255) in the mask.
- **`morphologyOpen(maskObj)`**: 
    - Performs erosion followed by dilation.
    - Removes single-pixel noise and detaches lightly touching particles.
- **`detectMarkers(imageData)`**:
    - Uses `js-aruco2` to detect ArUco markers.
    - Configured to use the `ARUCO` dictionary by default for compatibility with existing templates.
    - Returns an array of marker objects with `id`, `corners`, and `hammingDistance`.
- **`detectParticles(maskObj, {minAreaPx})`**:
    - Implements connected-component labeling (flood fill).
    - Returns a `labels` buffer (Uint32Array) where each pixel contains the particle ID.
    - Calculates area and equivalent diameter ($D = 2\sqrt{Area/\pi}$) in pixels.
- **Filtering**:
    - Particles are filtered by an analysis ROI (if markers are detected) with a 20px safe-zone inset.
    - Particles are filtered by a configurable `maxAreaMm2` (default 10mm²) to exclude large noise or artifacts.

### 2. Metrics & Statistics (`metrics/`)
- **`calculateStatistics(particles, {weighting})`**: 
    - Computes count, D10, D50, D90, Mode, Mean, Std Dev, Min, and Max.
    - Supports 'count', 'surface', and 'volume' weightings.
- **`buildHistograms(particles, {bins, spacing, weighting})`**: 
    - Bins particle diameters using either linear or logarithmic spacing.
    - Generates percentage distributions for the UI.

### 3. Rendering Output (`render/`)
- **`renderMaskPng(detectResult, width, height, originalImageData, validParticleIds)`**:
    - Generates a red-on-source overlay (Threshold view) or binary PNG.
    - Now supports filtering by `validParticleIds` to only show particles that passed all analysis steps (excluding markers, out-of-ROI noise, etc.).
- **`renderOverlayPng(imageData, particles)`**: Draws green ellipses representing detected particles over the original image and returns a PNG Data URL.

## React UI Components (`components/`)

- **`PsdPage.jsx`**: 
    - Entry point and main state coordinator.
    - Manages the `queue` of images and triggers sequential analysis to keep the UI responsive.
- **`ParameterPanel.jsx`**: 
    - UI for adjusting settings: Template size, Background Sigma, Adaptive Block Size/C, Min Area, Weighting, and Bin Spacing.
- **`ImageViewer.jsx`**: 
    - Displays the analysis results (Overlay or Threshold views).
- **`HistogramPanel.jsx`**: 
    - Visualizes PSD using `@nivo/bar` or `@nivo/line`.
- **`StatsTable.jsx`**: 
    - Tabulates statistical metrics calculated by the analysis engine.
- **`UploadQueue.jsx`**: 
    - Manages and selects between multiple uploaded images.

## Development Patterns
- **Pure Functions**: Image processing steps in `pipeline/` and `metrics/` should remain pure and testable.
- **Sequential Execution**: In `PsdPage.jsx`, use the `for...of` loop for analysis of multiple files to avoid freezing the browser main thread.
- **Canvas for Rendering**: Use hidden `<canvas>` elements for generating preview images (`renderOutputs.js`).
