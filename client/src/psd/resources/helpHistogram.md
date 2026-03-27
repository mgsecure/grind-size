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
