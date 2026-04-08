import express from 'express'
import {asyncHandler} from '../util/asyncHandler.js'

const router = express.Router()

// Client-first app: server endpoints are optional assist.

router.post('/aruco', asyncHandler(async (req, res) => {
    res.status(501).json({error: 'Not implemented (client-first).'})
}))

router.post('/analyze', asyncHandler(async (req, res) => {
    res.status(501).json({error: 'Not implemented (client-first).'})
}))

router.post('/upload', asyncHandler(async (req, res) => {
    res.status(501).json({error: 'Not implemented.'})
}))

// GET /api/psd  (optional informational route)
router.get('/', (req, res) => {
    req.log.info('psd route hit')
    res.json({ message: 'PSD endpoint', requestId: req.id })
})

router.post('/', async (req, res, next) => {
    try {
        const { default: upload } = await import('./upload.js')
        await upload(req, res)
    } catch (e) { next(e) }
})

export default router
