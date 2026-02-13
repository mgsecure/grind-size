import {describe, expect, test} from 'vitest'
import {buildHistograms} from './buildHistograms.js'

describe('buildHistograms', () => {
    test('builds bins and percents', () => {
        const particles = [
            {eqDiameterPx: 10},
            {eqDiameterPx: 20},
            {eqDiameterPx: 30}
        ]
        const h = buildHistograms(particles, {bins: 3, spacing: 'linear', weighting: 'count'})
        expect(h.bins.length).toBe(3)
        const total = h.values.reduce((a, b) => a + b.percent, 0)
        expect(total).toBeGreaterThan(99.9)
    })
})
