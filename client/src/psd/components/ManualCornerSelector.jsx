import React, {useState, useRef} from 'react'
import {Box, Typography, Button, Stack, ToggleButtonGroup, ToggleButton} from '@mui/material'
import {useHotkeys} from 'react-hotkeys-hook'

// Attempt to snap a clicked point (in image pixel coords) to the nearest corner
// of a large dark rectangle within `searchRadiusPx` pixels.
// Returns snapped {x, y} in image pixel coords, or the original point if nothing is found.
function snapToRectCorner(imgEl, clickXPx, clickYPx, searchRadiusPx = 80) {
    const natW = imgEl.naturalWidth
    const natH = imgEl.naturalHeight

    // Draw image to offscreen canvas to read pixels
    const canvas = document.createElement('canvas')
    canvas.width = natW
    canvas.height = natH
    const ctx = canvas.getContext('2d')
    ctx.drawImage(imgEl, 0, 0, natW, natH)

    // Sample region around click point
    const x0 = Math.max(0, Math.round(clickXPx - searchRadiusPx))
    const y0 = Math.max(0, Math.round(clickYPx - searchRadiusPx))
    const x1 = Math.min(natW, Math.round(clickXPx + searchRadiusPx))
    const y1 = Math.min(natH, Math.round(clickYPx + searchRadiusPx))
    const rw = x1 - x0
    const rh = y1 - y0
    if (rw <= 0 || rh <= 0) return null

    const {data} = ctx.getImageData(x0, y0, rw, rh)

    // Threshold: mark pixels as dark (value < 80 in all channels)
    const dark = new Uint8Array(rw * rh)
    for (let i = 0; i < rw * rh; i++) {
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2]
        dark[i] = (r < 80 && g < 80 && b < 80) ? 1 : 0
    }

    // Simple connected-components (4-connected) to find largest dark blob
    const labels = new Int32Array(rw * rh).fill(-1)
    const compSizes = []
    let labelCount = 0

    for (let py = 0; py < rh; py++) {
        for (let px = 0; px < rw; px++) {
            const idx = py * rw + px
            if (!dark[idx] || labels[idx] !== -1) continue
            // BFS
            const queue = [idx]
            labels[idx] = labelCount
            let size = 0
            let head = 0
            while (head < queue.length) {
                const cur = queue[head++]
                size++
                const cy = Math.floor(cur / rw), cx = cur % rw
                for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
                    if (nx < 0 || nx >= rw || ny < 0 || ny >= rh) continue
                    const ni = ny * rw + nx
                    if (dark[ni] && labels[ni] === -1) {
                        labels[ni] = labelCount
                        queue.push(ni)
                    }
                }
            }
            compSizes.push(size)
            labelCount++
        }
    }

    if (labelCount === 0) return null

    // Find largest component
    let bestLabel = 0, bestSize = 0
    for (let l = 0; l < compSizes.length; l++) {
        if (compSizes[l] > bestSize) {
            bestSize = compSizes[l]
            bestLabel = l
        }
    }

    // Minimum size: at least 0.5% of search area to avoid noise
    if (bestSize < rw * rh * 0.005) return null

    // Bounding box of largest component in region coords
    let minX = rw, maxX = 0, minY = rh, maxY = 0
    for (let py = 0; py < rh; py++) {
        for (let px = 0; px < rw; px++) {
            if (labels[py * rw + px] === bestLabel) {
                if (px < minX) minX = px
                if (px > maxX) maxX = px
                if (py < minY) minY = py
                if (py > maxY) maxY = py
            }
        }
    }

    // Convert bbox corners back to image pixel coords
    const bboxCorners = [
        {x: x0 + minX, y: y0 + minY},
        {x: x0 + maxX, y: y0 + minY},
        {x: x0 + maxX, y: y0 + maxY},
        {x: x0 + minX, y: y0 + maxY}
    ]

    // Return nearest bbox corner to click point
    let nearest = null, nearestDist = Infinity
    for (const c of bboxCorners) {
        const d = Math.hypot(c.x - clickXPx, c.y - clickYPx)
        if (d < nearestDist) {
            nearestDist = d
            nearest = c
        }
    }

    // Only snap if within search radius
    return nearestDist <= searchRadiusPx ? nearest : null
}

export default function ManualCornerSelector({
                                                 imageUrl,
                                                 onCornersSelected,
                                                 onCancel,
                                                 templateSize,
                                                 onTemplateSizeChange
                                             }) {
    const [corners, setCorners] = useState([]) // Array of {x, y} normalized
    const [snapped, setSnapped] = useState([]) // parallel array: true if snapped
    const containerRef = useRef(null)
    const imgRef = useRef(null)

    const labels = ['Top Left', 'Top Right', 'Bottom Right', 'Bottom Left']

    const handleClick = (e) => {
        if (corners.length >= 4) return
        const rect = imgRef.current.getBoundingClientRect()
        const xNorm = (e.clientX - rect.left) / rect.width
        const yNorm = (e.clientY - rect.top) / rect.height

        const natW = imgRef.current.naturalWidth
        const natH = imgRef.current.naturalHeight
        const clickXPx = xNorm * natW
        const clickYPx = yNorm * natH

        const snappedPt = snapToRectCorner(imgRef.current, clickXPx, clickYPx)
        const finalPx = snappedPt || {x: clickXPx, y: clickYPx}
        const wasSnapped = !!snappedPt

        setCorners(prev => [...prev, {x: finalPx.x / natW, y: finalPx.y / natH}])
        setSnapped(prev => [...prev, wasSnapped])
    }

    const handleReset = () => {
        setCorners([])
        setSnapped([])
    }

    const handleSubmit = () => {
        if (corners.length === 4) {
            // Convert normalized coordinates back to actual image pixels
            const naturalWidth = imgRef.current.naturalWidth
            const naturalHeight = imgRef.current.naturalHeight
            const finalCorners = corners.map(c => ({
                x: c.x * naturalWidth,
                y: c.y * naturalHeight
            }))
            onCornersSelected(finalCorners)
        }
    }

    useHotkeys('escape', () => {
        onCancel()
        return false
    })

        return (
        <Box sx={{p: 2, textAlign: 'center'}}>
            <Typography variant='h6'>Manual Corner Selection</Typography>
            <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                Template detection failed.<br/>
                Please click the four outer corners of the template in clockwise order<br/>
                {labels[corners.length]
                    ? <span style={{
                        marginTop: 8,
                        fontSize: '1.0rem'
                    }}>Please click on: <span style={{marginTop: 8, fontWeight: 700, color: '#fff'}}>{labels[corners.length]}</span></span>
                    : <span style={{marginTop: 8, fontWeight: 700, color: '#00bb00'}}>Done</span>
                }
            </Typography>

            <Box
                ref={containerRef}
                sx={{
                    position: 'relative',
                    display: 'inline-block',
                    cursor: corners.length < 4 ? 'crosshair' : 'default',
                    lineHeight: 0
                }}
                onClick={handleClick}
            >
                <img
                    ref={imgRef}
                    src={imageUrl}
                    alt='Manual selection'
                    style={{maxWidth: '100%', maxHeight: '70vh', display: 'block'}}
                />
                {corners.map((c, i) => (
                    <Box
                        key={i}
                        sx={{
                            position: 'absolute',
                            left: `${c.x * 100}%`,
                            top: `${c.y * 100}%`,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: snapped[i] ? '#00e676' : '#0093e2',
                            border: '2px solid white',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            title: snapped[i] ? 'snapped' : undefined
                        }}
                    />
                ))}
            </Box>

            <Stack direction='column' spacing={1} justifyContent='center' alignItems='center' sx={{my: 2}}>
                <Typography variant='body2' style={{fontWeight: 700}}>Template Size (mm)</Typography>
                <ToggleButtonGroup
                    size='small'
                    value={templateSize}
                    exclusive
                    onChange={(_, v) => v && onTemplateSizeChange(v)}
                >
                    <ToggleButton value={100} style={{
                        width: 40,
                        color: templateSize === 100 ? '#0b0' : undefined,
                        fontWeight: templateSize === 100 ? 600 : undefined
                    }}>100</ToggleButton>
                    <ToggleButton value={75} style={{
                        width: 40,
                        color: templateSize === 75 ? '#0b0' : undefined,
                        fontWeight: templateSize === 75 ? 600 : undefined
                    }}>75</ToggleButton>
                    <ToggleButton value={50} style={{
                        width: 40,
                        color: templateSize === 50 ? '#0b0' : undefined,
                        fontWeight: templateSize === 50 ? 600 : undefined
                    }}>50</ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <Stack direction='row' spacing={2} justifyContent='center' sx={{mt: 3}}>
                <Button variant='outlined' onClick={handleReset}>Reset</Button>
                <Button variant='outlined' color='error' onClick={onCancel}>Cancel</Button>
                <Button
                    variant='contained'
                    disabled={corners.length < 4}
                    onClick={handleSubmit}
                    color='success'
                >
                    Submit
                </Button>
            </Stack>
        </Box>
    )
}
