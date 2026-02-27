### Pipeline Verification Guide

This document outlines methods to verify the accuracy and stability of the particle detection and analysis pipeline.

#### 1. Synthetic Verification (Automated)

We use a synthetic test suite to verify the core geometric and statistical logic. This script generates "perfect" masks with known mathematical properties and ensures the pipeline measures them correctly.

**To run the verification suite:**
```bash
yarn verify
```

**What it tests:**
- **Area Accuracy:** Verifies that `areaPx` correctly counts thresholded pixels.
- **Diameter Accuracy:** Verifies that `eqDiameterPx` matches the mathematical equivalent diameter of a circle.
- **Axis Fitting:** Verifies that the ellipse fit correctly identifies the Major and Minor axes of elongated shapes.
- **Volume Model:** Verifies that the refined oblate spheroid volume calculation matches the theoretical volume for perfect spheres.
- **Solidity:** Ensures that solid shapes are identified with high solidity (~1.0) when the `ellipseFactor` is set correctly.

#### 2. Resolution & Scale Invariance (Manual)

One of the most robust ways to verify the pipeline's scale correction is to photograph the same sample at different distances.

**Test Procedure:**
1. Place a sample of grinds on the template.
2. Take a photo from ~15cm height (Full frame).
3. Take another photo from ~30cm height (Half frame).
4. Run both through the pipeline.
5. **Expected Result:** The D10, D50, and D90 metrics should remain consistent within ±3%, even though the pixel counts per particle differ significantly between the two photos.

#### 3. Internal Consistency (Solidity)

The `detectParticlesCandidate` pipeline provides a `solidity` metric for every particle:
$$\text{Solidity} = \frac{\text{True Pixel Area}}{\text{Fitted Ellipse Area}}$$

**How to use it:**
- **High Solidity (> 0.8):** Indicates a solid, well-defined particle that matches the ellipse fit well.
- **Low Solidity (< 0.5):** Indicates a highly irregular shape, a crescent, or multiple particles that the thresholding has "glued" together.
- **Verification:** If your statistics change significantly when filtering by solidity, it suggests that the thresholding or overlap separation steps need adjustment.

#### 4. Ground Truth Comparison (Physical Reference)

If you have access to a physical reference, you can use it to calibrate the volume/mass model.

**Test Procedure:**
1. Weigh a small sample of coffee grinds on a precision scale (e.g., 1.00g).
2. Spread the entire 1.00g sample on the template and photograph it.
3. The pipeline provides a total `volumePx` (or `mass` if density is provided).
4. **Calibration:** You can derive a "Pixel Density" factor that relates the calculated `volumePx` to the actual measured weight. Consistent results across different samples verify the stability of the volume model.
