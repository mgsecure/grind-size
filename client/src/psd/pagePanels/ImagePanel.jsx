import React, {useContext, useMemo, useState} from 'react'
import {Paper, ToggleButton, ToggleButtonGroup, Stack, Typography, alpha, Box, lighten} from '@mui/material'
import {useTheme} from '@mui/material/styles'
import DataContext from '../../context/DataContext.jsx'
import EntryImageGallery from '../components/EntryImageGallery.jsx'

export default function ImagePanel() {
    const {
        allDone,
        activeIdList
    } = useContext(DataContext)

    const theme = useTheme()
    const [mode, setMode] = useState('diagnostic') // original | mask | overlay

    const disabledStyle = !activeIdList.length ? {opacity: 0.5, pointerEvents: 'none'} : undefined

    const srcVar = useMemo(() => {
        if (mode === 'mask') return 'maskPngDataUrl'
        if (mode === 'diagnostic') return 'diagnosticPngDataUrl'
        return 'overlayPngDataUrl'
    }, [mode])

    const entry = { media: allDone.map((item, index) => {
            if (item.result) {
                return {
                    title: item.result?.filename || `Image ${index + 1}`,
                    subtitle: item.result?.settings?.name || '',
                    thumbnailUrl: item.result?.previews?.[srcVar],
                    sequenceId: index + 1,
                    fullSizeUrl: item.result?.previews?.[srcVar],
                    id: item.id
                }
            } else return {}
        }) }

    return (
        <Paper sx={{p: 2}}>
            <Typography style={{...disabledStyle, fontSize: '1.1rem', fontWeight: 500}}>PARTICLE DETECTION</Typography>
            <Stack direction='row' spacing={1} sx={{mt: 2, mb: 2}} style={disabledStyle}>
                <ToggleButtonGroup
                    size='small'
                    value={mode}
                    exclusive
                    onChange={(_, v) => v && setMode(v)}
                >
                    <ToggleButton value='overlay'>Overlay View</ToggleButton>
                    <ToggleButton value='mask'>Threshold Image</ToggleButton>
                    <ToggleButton value='diagnostic'>Diagnostic View</ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            {(entry.media?.length > 0)
                ? <EntryImageGallery entry={entry}/>
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
                        {activeIdList.length === 0 ? 'No image to display.' : 'Multiple images selected.'}
                    </Box>
                </Box>
            }
        </Paper>
    )
}
