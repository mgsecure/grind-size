import React, {useMemo, useState} from 'react'
import {Paper, ToggleButton, ToggleButtonGroup, Stack, Typography} from '@mui/material'
import CropFreeIcon from '@mui/icons-material/CropFree'
import {useTheme} from '@mui/material/styles'

export default function ImageViewer({result, overlayOptions = {}, setOverlayOptions}) {
    const theme = useTheme()
    const [mode, setMode] = useState('overlay') // original | mask | overlay
    const [showBoundaries, setShowBoundaries] = useState(true)

    const toggleBoundaries = () => {
        if (showBoundaries) {
            setOverlayOptions({
                showParticles: true,
                showMarkers: false,
                showScale: false,
                showRoi: false
            })
        } else {
            setOverlayOptions({
                showParticles: true,
                showMarkers: true,
                showScale: true,
                showRoi: true
            })
        }

        setShowBoundaries(!showBoundaries)
    }

    const src = useMemo(() => {
        if (!result) return null
        if (mode === 'mask') return result.previews?.maskPngDataUrl
        if (mode === 'original') return null
        return result.previews?.overlayPngDataUrl
    }, [result, mode])

    return (
        <Paper sx={{p: 2}}>
            <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{mb: 1}}>
                    <ToggleButtonGroup
                        size='small'
                        value={mode}
                        exclusive
                        onChange={(_, v) => v && setMode(v)}
                    >
                        <ToggleButton value='overlay'>Overlay</ToggleButton>
                        <ToggleButton value='mask'>Threshold</ToggleButton>
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        size='small'
                        value={showBoundaries}
                        onChange={() => toggleBoundaries()}
                        exclusive
                        style={{marginLeft: 8}}
                    >
                        <ToggleButton value='boundaries' selected={showBoundaries} style={{padding: 4}}>
                            <CropFreeIcon fontSize='small'/>
                        </ToggleButton>
                    </ToggleButtonGroup>
            </Stack>

            {!result && (
                <Typography variant='body2' color='text.secondary'>
                    Upload images to see previews
                </Typography>
            )}

            {(result && src)
                ? <img
                    src={src}
                    alt='analysis preview'
                    style={{width: '100%', borderRadius: 8}}
                />
                : <div style={{backgroundColor: theme.palette.divider , height: 250}}/>
            }



            {result && mode === 'original' && (
                <Typography variant='body2' color='text.secondary'>
                    Original view is not currently generated in this baseline. (Overlay includes the original pixels.)
                </Typography>
            )}
        </Paper>
    )
}
