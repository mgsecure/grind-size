import React, {useState, useRef} from 'react'
import {Box, Typography, Button, Stack} from '@mui/material'

export default function ManualCornerSelector({imageUrl, onCornersSelected, onCancel}) {
    const [corners, setCorners] = useState([]) // Array of {x, y}
    const containerRef = useRef(null)
    const imgRef = useRef(null)

    const labels = ['Top-Left', 'Top-Right', 'Bottom-Right', 'Bottom-Left']

    const handleClick = (e) => {
        if (corners.length >= 4) return

        const rect = imgRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        
        setCorners(prev => [...prev, {x, y}])
    }

    const handleReset = () => setCorners([])

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

    return (
        <Box sx={{p: 2, textAlign: 'center'}}>
            <Typography variant="h6">Manual Corner Selection</Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                Marker detection failed. Please click the four outer corners of the template in clockwise order:
                <strong> {labels[corners.length] || 'Done'}</strong>
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
                    alt="Manual selection" 
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
                            backgroundColor: '#ff3399',
                            border: '2px solid white',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none'
                        }}
                    />
                ))}
            </Box>

            <Stack direction="row" spacing={2} justifyContent="center" sx={{mt: 2}}>
                <Button variant="outlined" onClick={handleReset}>Reset</Button>
                <Button variant="outlined" color="error" onClick={onCancel}>Cancel</Button>
                <Button 
                    variant="contained" 
                    disabled={corners.length < 4}
                    onClick={handleSubmit}
                >
                    Confirm Corners
                </Button>
            </Stack>
        </Box>
    )
}
