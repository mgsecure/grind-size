import { detectParticlesCandidate } from '../client/src/psd/analysis/pipeline/detectParticlesCandidate.js';
import { calculateStatistics } from '../client/src/psd/analysis/metrics/calculateStatistics.js';
import assert from 'node:assert/strict';

/**
 * Verification Suite for the Particle Detection Pipeline
 * This script generates synthetic images (masks) with known properties
 * to verify the accuracy of the geometric and statistical calculations.
 */

function createSyntheticMask(width, height, drawFn) {
    const mask = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (drawFn(x, y)) {
                mask[y * width + x] = 255;
            }
        }
    }
    return { width, height, mask };
}

async function testPerfectCircle() {
    console.log('Testing: Perfect Circle accuracy...');
    const width = 200;
    const height = 200;
    const centerX = 100;
    const centerY = 100;
    const radius = 30;
    
    // Create a circle with radius 30 (Diameter 60)
    const maskObj = createSyntheticMask(width, height, (x, y) => {
        return Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) <= radius;
    });

    const { particles } = detectParticlesCandidate(maskObj, { minAreaPx: 10, ellipseFactor: 8.0 });
    
    assert.strictEqual(particles.length, 1, 'Should detect exactly one particle');
    const p = particles[0];
    
    // Area of circle = PI * r^2
    const expectedArea = Math.PI * (radius ** 2);
    // Integer pixel count might be slightly different due to rasterization
    const areaDiff = Math.abs(p.areaPx - expectedArea) / expectedArea;
    
    console.log(`  Area Px: ${p.areaPx} (Expected: ~${expectedArea.toFixed(2)})`);
    assert.ok(areaDiff < 0.05, `Area deviation too high: ${areaDiff.toFixed(4)}`);

    console.log(`  Diameter: ${p.eqDiameterPx.toFixed(2)} (Expected: ${radius * 2})`);
    assert.ok(Math.abs(p.eqDiameterPx - (radius * 2)) < 1.0, 'Diameter deviation too high');

    // For a perfect circle, solidity should be high
    // solidity = trueArea / (PI * major/2 * minor/2)
    // For circle with k=8: major = minor = sqrt(k * (varX + varY)) = sqrt(8 * (r^2/4 + r^2/4)) = sqrt(8 * r^2/2) = 2r
    // So solidity should be ~1.0
    console.log(`  Solidity: ${p.solidity.toFixed(4)}`);
    assert.ok(p.solidity > 0.9, `Solidity for a circle should be high: ${p.solidity.toFixed(4)}`);
    
    console.log('✓ Perfect Circle test passed');
}

async function testEllipse() {
    console.log('Testing: Ellipse axis and aspect ratio...');
    const width = 200;
    const height = 200;
    const a = 40; // semi-major
    const b = 20; // semi-minor
    
    const maskObj = createSyntheticMask(width, height, (x, y) => {
        return ((x - 100) ** 2) / (a ** 2) + ((y - 100) ** 2) / (b ** 2) <= 1;
    });

    // Use ellipseFactor 4.0 for pure geometric fit (theoretical for solid shapes)
    const { particles } = detectParticlesCandidate(maskObj, { minAreaPx: 10, ellipseFactor: 8.0 });
    const p = particles[0];

    console.log(`  Long Axis: ${p.longAxisPx.toFixed(2)} (Expected: ${a * 2})`);
    console.log(`  Short Axis: ${p.shortAxisPx.toFixed(2)} (Expected: ${b * 2})`);
    console.log(`  Aspect Ratio: ${p.aspectRatio.toFixed(2)} (Expected: ${a/b})`);

    assert.ok(Math.abs(p.longAxisPx - a * 2) < 2.0, `Long axis deviation too high: ${p.longAxisPx.toFixed(2)} vs ${a*2}`);
    assert.ok(Math.abs(p.shortAxisPx - b * 2) < 2.0, `Short axis deviation too high: ${p.shortAxisPx.toFixed(2)} vs ${b*2}`);
    
    console.log('✓ Ellipse test passed');
}

async function testVolumeModel() {
    console.log('Testing: Volume calculation consistency...');
    // We use the refined volume model: V = 4/3 * PI * r^3 * (minor/major)
    // For a circle (minor=major), V = 4/3 * PI * r^3
    const radius = 10;
    const width = 100;
    const height = 100;
    const maskObj = createSyntheticMask(width, height, (x, y) => {
        return Math.sqrt((x - 50) ** 2 + (y - 50) ** 2) <= radius;
    });

    const { particles } = detectParticlesCandidate(maskObj, { minAreaPx: 5, ellipseFactor: 8.0 });
    const p = particles[0];
    
    const expectedVolume = (4/3) * Math.PI * (radius ** 3);
    const volDiff = Math.abs(p.volumePx - expectedVolume) / expectedVolume;
    
    console.log(`  Volume Px: ${p.volumePx.toFixed(2)} (Expected: ~${expectedVolume.toFixed(2)})`);
    assert.ok(volDiff < 0.1, `Volume deviation too high: ${volDiff.toFixed(4)}`);
    console.log('✓ Volume model test passed');
}

async function runAllTests() {
    try {
        console.log('=== Starting Pipeline Verification ===\n');
        await testPerfectCircle();
        console.log('');
        await testEllipse();
        console.log('');
        await testVolumeModel();
        console.log('\n=== All Verification Tests Passed ===');
    } catch (err) {
        console.error('\n❌ Verification Failed:');
        console.error(err);
        process.exit(1);
    }
}

runAllTests();
