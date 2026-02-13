import React, {useMemo, useState} from 'react'
import {Paper, ToggleButton, ToggleButtonGroup, Stack, Typography} from '@mui/material'

export default function ImageViewer({result}) {
    const [mode, setMode] = useState('overlay') // original | mask | overlay

    const src = useMemo(() => {
        if (!result) return null
        if (mode === 'mask') return result.previews?.maskPngDataUrl
        if (mode === 'original') return null
        return result.previews?.overlayPngDataUrl
    }, [result, mode])

    return (
        <Paper sx={{p: 2}}>
            <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{mb: 1}}>
                <Typography variant='h6'>Preview</Typography>
                <ToggleButtonGroup
                    size='small'
                    value={mode}
                    exclusive
                    onChange={(_, v) => v && setMode(v)}
                >
                    <ToggleButton value='overlay'>Overlay</ToggleButton>
                    <ToggleButton value='mask'>Threshold</ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            {!result && (
                <Typography variant='body2' color='text.secondary'>
                    Upload images to see previews
                </Typography>
            )}

            {result && src && (
                <img
                    src={src}
                    alt='analysis preview'
                    style={{width: '100%', borderRadius: 8}}
                />
            )}

            {result && mode === 'original' && (
                <Typography variant='body2' color='text.secondary'>
                    Original view is not currently generated in this baseline. (Overlay includes the original pixels.)
                </Typography>
            )}
        </Paper>
    )
}
