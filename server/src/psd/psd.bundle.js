import express from 'express'
import asyncHandler from '../util/asyncHandler.js'

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

export default router
