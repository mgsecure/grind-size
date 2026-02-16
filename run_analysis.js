import { detectMarkers } from './client/src/psd/analysis/pipeline/detectMarkers.js';
import { normalizeLighting } from './client/src/psd/analysis/pipeline/normalizeLighting.js';
import { adaptiveThreshold } from './client/src/psd/analysis/pipeline/thresholdAdaptive.js';
import { morphologyOpen } from './client/src/psd/analysis/pipeline/morphology.js';
import { detectParticles } from './client/src/psd/analysis/pipeline/detectParticles.js';
import { calculateStatistics } from './client/src/psd/analysis/metrics/calculateStatistics.js';
import { loadImage, createCanvas } from 'canvas';

async function run() {
    const imgPath = 'client/src/psd/testFiles/M47-stock-2.0.0-100.jpg';
    const image = await loadImage(imgPath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const imageData = {
        width: image.width,
        height: image.height,
        data: ctx.getImageData(0, 0, image.width, image.height).data
    };

    const markers = detectMarkers({ ...imageData, data: imageData.data.slice() });
    
    // Scale calculation (simplified)
    let pxPerMm = 20;
    const matched100 = markers.filter(m => [0,1,2,3].includes(m.id));
    if (matched100.length >= 2) {
        const getDist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
        // IDs 0 and 1 are TL and TR
        const m0 = matched100.find(m => m.id === 0);
        const m1 = matched100.find(m => m.id === 1);
        if (m0 && m1) {
            pxPerMm = getDist(m0.corners[1], m1.corners[0]) / 130; // outer corners
            // wait, 130mm is total width.
        }
    }
    // Let's use the reference scale if possible
    pxPerMm = 21.976;

    const gray = normalizeLighting(imageData, { bgSigma: 35 });
    const mask = adaptiveThreshold(gray, { blockSize: 201, C: 4 });
    const cleaned = morphologyOpen(mask);
    const { particles } = detectParticles(cleaned, { minAreaPx: 8 });

    // ROI filter
    const minX = 300, maxX = 2700, minY = 300, maxY = 2700; // rough ROI
    const filtered = particles.filter(p => p.cxPx > minX && p.cxPx < maxX && p.cyPx > minY && p.cyPx < maxY);

    const stats = calculateStatistics(filtered, { mmPerPx: 1/pxPerMm, metric: 'diameter' });

    console.log('--- Current Analysis Stats ---');
    console.log('Count:', stats.count);
    console.log('Avg Short Axis:', stats.avgShortAxis.toFixed(2));
    console.log('Avg Long Axis:', stats.avgLongAxis.toFixed(2));
    console.log('Avg Roundness:', stats.avgRoundness.toFixed(3));
    console.log('Mean Diameter:', stats.mean.toFixed(2));
}

run();
