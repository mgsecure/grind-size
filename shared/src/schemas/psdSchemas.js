import {z} from 'zod'

export const PsdParametersSchema = z.object({
    analysisVersion: z.string(),
    templateSizeMm: z.number().nullable(),
    warpSizePx: z.number().int().positive(),
    insetPx: z.number().int().nonnegative(),
    bgSigma: z.number().positive(),
    adaptiveBlockSize: z.number().int().positive(),
    adaptiveC: z.number(),
    minAreaPx: z.number().int().nonnegative(),
    splitOverlaps: z.boolean(),
    splitSensitivity: z.number().min(0).max(1),
    bins: z.number().int().positive(),
    binSpacing: z.enum(['linear', 'log']),
    weighting: z.enum(['count', 'surface', 'volume']),
    chartType: z.enum(['bar', 'line'])
})

export const ParticleSchema = z.object({
    id: z.string(),
    cxPx: z.number(),
    cyPx: z.number(),
    areaPx: z.number(),
    eqDiameterUm: z.number()
})

export const HistogramBinSchema = z.object({
    binStart: z.number(),
    binEnd: z.number(),
    binCenter: z.number(),
    value: z.number(),
    percent: z.number()
})

export const PsdStatsSchema = z.object({
    count: z.number().int(),
    pxPerMm: z.number(),
    mmPerPx: z.number(),
    imageWidthPx: z.number().int(),
    imageHeightPx: z.number().int(),
    unit: z.enum(['um', 'mm']).default('um'),
    d10: z.number().nullable(),
    d50: z.number().nullable(),
    d90: z.number().nullable(),
    mode: z.number().nullable(),
    stdDev: z.number().nullable(),
    mean: z.number().nullable(),
    min: z.number().nullable(),
    max: z.number().nullable(),
})

export const PsdResultSchema = z.object({
    analysisVersion: z.string(),
    fileName: z.string(),
    parameters: PsdParametersSchema,
    templateSizeMm: z.number(),
    pxPerMm: z.number(),
    mmPerPx: z.number(),
    imageWidthPx: z.number().int(),
    imageHeightPx: z.number().int(),
    particles: z.array(ParticleSchema),
    stats: PsdStatsSchema,
    histogram: z.array(HistogramBinSchema),
    overlayDataUrl: z.string().nullable(),
    maskDataUrl: z.string().nullable(),
    warnings: z.array(z.string())
})
