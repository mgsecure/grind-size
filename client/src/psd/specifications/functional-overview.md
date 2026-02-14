# Particle Size Distribution (PSD) Web App: Functional Overview

This document provides a detailed overview of the folder structure, component architecture, and analysis pipeline for the PSD Web App located in `client/src/psd`.

## Folder Structure Overview

The `client/src/psd` directory contains the source code for the coffee grind analysis application.

```text
client/src/psd/
├── analysis/               # Core image processing and analysis logic
│   ├── metrics/            # Statistical calculations and histogram building
│   ├── pipeline/           # Sequential image processing steps (decoding, thresholding, etc.)
│   ├── render/             # Rendering logic for masks and overlays
│   └── analyzeImage.js     # Orchestrator for the analysis pipeline
├── components/             # React UI components specific to the PSD page
│   ├── HistogramPanel.jsx  # Charting component for PSD distribution
│   ├── ImageViewer.jsx     # Previewer for original, mask, and overlay images
│   ├── ParameterPanel.jsx  # UI for adjusting analysis settings (e.g., sigma, block size)
│   ├── ResultsPanel.jsx    # Container for stats and histogram panels
│   ├── StatsTable.jsx      # Display for D10, D50, D90, Mean, etc.
│   └── UploadQueue.jsx     # Manages and displays the state of uploaded files
├── specifications/         # Documentation and specification files
│   ├── PSD_Web_App_Spec_v02_full.md
│   └── functional-overview.md  # [This File]
├── version1/               # Archive of the previous application version
├── PsdPage.jsx             # Main application entry point and state coordinator
├── PsdRoute.jsx            # Routing configuration for the PSD module
└── PsdParentRoute.jsx      # Layout/Parent route wrapper
```

---

## Client Rendering & UI Flow

The client is built using React and Material UI (MUI).

### 1. Main Page Coordinator (`PsdPage.jsx`)
`PsdPage` manages the high-level state of the application:
- **Queue State**: Manages an array of items representing uploaded files, their analysis status (`queued`, `analyzing`, `done`, `error`), and the resulting analysis data.
- **File Upload**: Uses a `Dropzone` component to accept image files. When files are dropped, it triggers `onFiles`, which adds items to the queue and starts the sequential analysis.
- **Layout**: Renders a responsive stack containing the `Dropzone`, `UploadQueue`, `ParameterPanel`, `ImageViewer`, and `ResultsPanel`.

### 2. UI Components (`components/`)
- **`UploadQueue.jsx`**: Lists uploaded images and their status. Allows the user to select which image's results are displayed in the viewer and results panel.
- **`ImageViewer.jsx`**: Provides a toggleable view between the "Overlay" (original image with particle detections) and the "Threshold" (binary mask).
- **`ParameterPanel.jsx`**: Allows real-time adjustment of analysis parameters like template size, minimum particle area, and adaptive thresholding settings.
- **`ResultsPanel.jsx`**: Orchestrates the display of `StatsTable` and `HistogramPanel` once analysis is complete.
- **`HistogramPanel.jsx`**: Uses `@nivo` charts to render the particle size distribution as either a bar chart or a line graph, supporting different weightings (count, surface, volume).

---

## Analysis Pipeline (`analysis/`)

The analysis is performed entirely in the client's browser to ensure responsiveness and privacy. The orchestration happens in `analyzeImage.js`.

### 1. Orchestration (`analyzeImage.js`)
The `analyzeImageFiles(file, settings)` function executes the following sequence:
1. **Decode**: `decodeImageToImageData` converts the file to a standard `ImageData` object.
2. **Normalize**: `normalizeLighting` reduces lighting gradients to prepare for thresholding.
3. **Threshold**: `adaptiveThreshold` converts the grayscale image to a binary mask (foreground vs. background).
4. **Clean**: `morphologyOpen` removes small noise artifacts.
5. **Detect**: `detectParticles` identifies connected components in the mask.
6. **Scale**: Computes `pxPerMm` based on the provided template size (ArUco integration pending).
7. **Metrics**: `buildHistograms` and `calculateStatistics` compute the PSD data.
8. **Render**: `renderMaskPng` and `renderOverlayPng` generate preview images.

### 2. Processing Steps (`pipeline/`)
- **`thresholdAdaptive.js`**: Implements an adaptive thresholding algorithm that calculates local thresholds for blocks of pixels, making it robust to uneven lighting.
- **`detectParticles.js`**: Uses a connected-component labeling (flood fill) algorithm to identify distinct particles and calculate their area and equivalent diameter in pixels.
- **`morphology.js`**: Performs morphological "opening" (erosion followed by dilation) to detach lightly touching particles and remove single-pixel noise.

### 3. Metrics & Statistics (`metrics/`)
- **`calculateStatistics.js`**: Computes key metrics including:
    - **Percentiles**: D10, D50 (Median), D90.
    - **Moments**: Mean, Standard Deviation, Variance.
    - **Extremes**: Min, Max.
    - **Weighting**: Supports 'count', 'surface', and 'volume' weighted statistics.
- **`buildHistograms.js`**: Bins particle diameters into a histogram. Supports both linear and logarithmic bin spacing.

### 4. Rendering Output (`render/`)
- **`renderOutputs.js`**: Uses a hidden `<canvas>` to generate PNG Data URLs for the UI.
    - `renderOverlayPng` draws green ellipses over the original image at the location and size of every detected particle.
    - `renderMaskPng` visualizes the binary thresholded image.
