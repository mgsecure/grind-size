import {describe, expect, test} from 'vitest'
import {calculateStatistics} from './calculateStatistics.js'

describe('calculateStatistics', () => {
    test('computes percentiles', () => {
        const particles = Array.from({length: 10}).map((_, i) => ({eqDiameterPx: i + 1}))
        const s = calculateStatistics(particles, {weighting: 'count'})
        expect(s.count).toBe(10)
        expect(s.D50).toBeGreaterThan(0)
    })
})
