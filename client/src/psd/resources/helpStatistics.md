## Statistics Panel — Field Descriptions

### Sample Identity

**Template** - 
The name of the image template or reference used to calibrate and process the sample. Templates define the physical layout and scale of the imaging setup.

**Settings** - 
The name of the processing preset (settings profile) applied to this sample. Presets control thresholding, morphology, overlap splitting, and other pipeline parameters.

### Particle Statistics

**Particle Count** - 
The total number of individual particles detected and measured in the sample image.

**D10** - 
The 10th percentile of the particle size distribution. 10% of particles are smaller than this value. A low D10 indicates the presence of fine particles.

**D50 (Median)** - 
The median particle size — 50% of particles are smaller and 50% are larger than this value. This is the most commonly cited single-number summary of a particle size distribution.

**D90** - 
The 90th percentile of the particle size distribution. 90% of particles are smaller than this value. A high D90 indicates the presence of coarse particles.

**Mode** - 
The most frequently occurring particle size in the distribution — the peak of the histogram.

**Mean** - 
The arithmetic average of all measured particle sizes. Sensitive to outliers; compare with the median (D50) to assess skewness.

**Std Dev** - 
The standard deviation of the particle size distribution. A larger value indicates a wider, more variable distribution; a smaller value indicates a tighter, more uniform grind.

**Min** - 
The smallest particle size measured in the sample.

**Max** - 
The largest particle size measured in the sample.

### Distribution Quality Metrics

**Span** -
A measure of the width of the particle size distribution, calculated as `(D90 − D10) / D50`, displayed as a percentage (0–100%). A lower span indicates a narrower, more uniform distribution; a higher span indicates a broader spread of particle sizes.

**Efficiency** -
A uniformity metric calculated as `D10 / D90`, displayed as a percentage (0–100%). It measures how narrow the distribution is relative to its spread: a higher value means D10 and D90 are closer together, indicating a tighter, more uniform grind. There is no fixed "target size range" — it is purely a ratio of the fine end to the coarse end of the distribution.

### Shape Statistics

**Avg Short Axis** -
The average length of the shorter axis across all detected particles (in μm). Useful for characterising particle elongation.

**Avg Long Axis** -
The average length of the longer axis across all detected particles (in μm). Together with Avg Short Axis, this describes the typical aspect ratio of particles.

**Avg Roundness** - 
The average roundness of detected particles, scored from 0 to 1. A value of 1 represents a perfect circle. Lower values indicate more irregular or elongated particles.

### Calibration

**Pixel Scale** -
The calibration factor used to convert pixel measurements to physical units (μm). Derived from the template and imaging setup. Ensures that all size measurements reflect real-world dimensions.
