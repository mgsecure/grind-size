import React, {useContext, useMemo, useState} from 'react'
import {Paper, ToggleButton, ToggleButtonGroup, Stack, Typography, alpha, Box, lighten} from '@mui/material'
import {useTheme} from '@mui/material/styles'
import DataContext from '../../context/DataContext.jsx'

export default function ImageViewer() {
    const {processedActive: result} = useContext(DataContext)
    const theme = useTheme()
    const [mode, setMode] = useState('overlay') // original | mask | overlay

    const src = useMemo(() => {
        if (!result) return null
        if (mode === 'mask') return result.previews?.maskPngDataUrl
        if (mode === 'original') return null
        return result.previews?.overlayPngDataUrl
    }, [result, mode])

    const disabledStyle = !result ? {opacity: 0.5, pointerEvents: 'none'} : undefined

    return (
        <Paper sx={{p: 2, width: '50%'}}>
            <Typography style={{...disabledStyle, fontSize: '1.1rem', fontWeight: 500}}>PARTICLE DETECTION</Typography>
            <Stack direction='row' spacing={1} sx={{mt: 2, mb: 2}}  style={disabledStyle}>
                <ToggleButtonGroup
                    size='small'
                    value={mode}
                    exclusive
                    onChange={(_, v) => v && setMode(v)}
                >
                    <ToggleButton value='overlay'>Overlay View</ToggleButton>
                    <ToggleButton value='mask'>Threshold Image</ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            {(result && src)
                 ? <img
                    src={src}
                    alt='analysis preview'
                    style={{width: '100%', borderRadius: 8}}
                />
                : <Box color={alpha(theme.palette.text.secondary, 0.4)}
                       sx={{
                           display: 'flex',
                           placeContent: 'center',
                           padding: '10px 0px 16px 0px',
                           width: '100%',
                           height: 100
                       }}>
                    <Box style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%', height: '100%',
                        fontSize: '0.9rem',
                        backgroundColor: lighten(theme.palette.background.paper, 0.08),
                        borderRadius: 5
                    }}>
                        No image to display.
                    </Box>
                </Box>
            }


            {result && mode === 'original' && (
                <Typography variant='body2' color='text.secondary'>
                    Original view is not currently generated in this baseline. (Overlay includes the original pixels.)
                </Typography>
            )}
        </Paper>
    )
}
