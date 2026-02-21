### Settings and Presets Documentation

This document provides a comprehensive guide to the settings and presets available in the `SettingsPanel` of the Particle Size Distribution (PSD) module.

---

### Core Settings (Analysis Parameters)

These settings directly control how the image is processed and how particles are detected.

#### Detection & Image Processing
*   **Lighting Sigma (`bgSigma`):** Used for background normalization. It helps smooth out uneven lighting or shadows across the image before detection.
*   **Adaptive Block Size:** The size of the neighborhood used for the adaptive thresholding algorithm. Larger blocks are better for images with soft lighting transitions, while smaller blocks can capture more localized detail.
*   **Adaptive C:** A constant subtracted from the mean during thresholding. Increasing this value makes the detection more "conservative," filtering out noise but potentially missing faint particles.
*   **Split Overlaps (`splitOverlaps`):** When enabled, uses a watershed algorithm to try and separate particles that are touching or slightly overlapping.
*   **Split Sensitivity:** Adjusts how aggressive the overlap separation is. Higher sensitivity will more readily break up clusters, but may incorrectly split elongated single particles.

#### Size Filtering
*   **Min Area (px):** The minimum size of a detected object (in pixels) to be considered a particle. This helps filter out camera noise and tiny dust specks.
*   **Max Surface (mm²):** The maximum surface area a particle can have. This is used to exclude objects that are clearly too large to be coffee grounds, such as hair or parts of the template itself.
*   **Inset (px):** A safety margin applied to the Region of Interest (ROI). It ensures that particles touching the very edge of the detection zone are excluded, as their full size cannot be accurately measured.

---

### Display & Calculation Settings

These settings affect how the results are presented in the histograms and statistics.

*   **Bin Count:** The number of intervals (bars) used in the histogram. More bins provide more detail but can make the chart look "noisy."
*   **Bin Type:** 
    *   *Default:* Uses fixed, standardized bin ranges.
    *   *Dynamic:* Adjusts the bin ranges based on the actual size distribution of the current samples for better resolution.
*   **Bin Spacing:** 
    *   *Log:* Uses logarithmic intervals. This is standard in coffee science as it better represents the wide range of particle sizes (from fines to coarse).
    *   *Linear:* Uses equal-sized intervals.
*   **Metric:** The primary dimension used for the X-axis (Diameter, Surface Area, or Volume).
*   **Weighting:** How much "importance" each particle has on the Y-axis. 
    *   *Mass/Volume:* Larger particles contribute more to the percentage (standard for brewing).
    *   *Surface Area:* Represents the available surface for extraction.
    *   *Count:* Every particle counts as 1, regardless of size (highlights the number of fines).

---

### Analysis Presets

The presets are curated configurations optimized for different grind sizes and imaging environments.

#### 1. Default / Phone
*   **Characteristics:** Balanced settings designed for general-purpose use.
*   **Use Case:** Typical filter/drip grinds and photos taken with modern smartphones under decent lighting. It has moderate sensitivity to both fines and larger particles.

#### 2. Coarse
*   **Characteristics:** Uses larger processing blocks (`Adaptive Block Size: 301`) and a more conservative threshold. It filters out more small noise (`Min Area: 12px`) and allows for much larger particles (`Max Surface: 20mm²`).
*   **Use Case:** French Press, Cold Brew, or very coarse pour-overs. These grinds often produce large chunks and more shadows, which these settings handle more robustly.

#### 3. Fines / Macro
*   **Characteristics:** Highly sensitive settings with small processing blocks (`Adaptive Block Size: 101`) and lower thresholds. It captures very small particles (`Min Area: 4px`) and uses higher split sensitivity to separate tiny, crowded grains.
*   **Use Case:** Espresso grinds, or images taken with a dedicated macro lens/microscope. It is optimized for high-resolution images where fine detail is paramount.

#### 4. Custom
*   **Characteristics:** Activated automatically when you manually adjust any slider.
*   **Use Case:** When none of the presets perfectly capture your specific setup (e.g., unusual lighting or very specific brewing needs).

---

### Visualization & Interpretation

The PSD module provides two primary ways to visualize detected particles, each serving a different purpose:

#### 1. Threshold Image (Mask View)
*   **What it represents:** This is the "ground truth" of the analysis. It shows the exact pixels that were identified as foreground (particle) by the thresholding and morphology algorithms.
*   **Analyzed Data:** If a pixel is colored in this view, it was directly used to calculate the area and moments of that particle. This view accurately reflects irregular shapes, jagged edges, and any noise that might have survived filtering.
*   **Use Case:** Use this to verify that the lighting and threshold settings are correctly capturing the particles without too much background noise or "ghost" detections.
*   **Recent Improvements (2026-02-19):** Enhanced the adaptive thresholding logic to better distinguish between legitimate particles and shadow-induced "halos" by implementing stricter dark-region verification.

#### 2. Overlay View (Outlines)
*   **What it represents:** A visual representation of the detected particles overlaid on the original image.
*   **Baseline Pipeline:** Draws ellipses calculated from image moments. While mathematically useful for mass/volume estimation, these can sometimes "overshoot" the actual pixels.
*   **Test Pipeline (Exact Boundaries):** Extracts the **exact pixel boundaries** (contours) for every particle and maps them back to the original photo. This ensures that the green outlines perfectly "hug" the red threshold pixels, eliminating any visual offset or abstraction error.
*   **Analyzed Data:** In the **Baseline Pipeline**, the dimensions of the ellipses (Major Axis, Minor Axis, and Equivalent Diameter) are used for histograms. In the **Test Pipeline**, the statistics are based on the **actual pixel count** for superior accuracy with irregular coffee grounds.
*   **Use Case:** Use this for a quick visual check of the particle sizes relative to the original photo and to ensure the detection is perfectly aligned.

**Note on Differences:** You may notice that the "Threshold Image" looks more jagged while the "Overlay View" looks perfectly smooth. This is expected. The analysis calculates a "best-fit" ellipse for every detected blob; the statistics are based on that mathematical fit, not on the raw pixel count alone.
