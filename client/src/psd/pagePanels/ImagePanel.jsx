import React, {useContext, useMemo, useState} from 'react'
import {Paper, Stack, Typography, alpha, Box, lighten} from '@mui/material'
import {useTheme} from '@mui/material/styles'
import DataContext from '../../context/DataContext.jsx'
import EntryImageGallery from '../components/EntryImageGallery.jsx'
import ToggleButtons from '../components/ToggleButtons.jsx'

export default function ImagePanel() {
    const {
        queue,
        activeIdList,
        isDesktop
    } = useContext(DataContext)

    const theme = useTheme()
    const [mode, setMode] = useState('mask') // original | mask | overlay

    const modeMap = [
        {key: 'mode', value: 'overlay', label: 'Overlay View'},
        {key: 'mode', value: 'mask', label: 'Threshold Image'},
        {key: 'mode', value: 'diagnostic', label: 'Diagnostic View'}
    ]

    const disabledStyle = !activeIdList.length ? {opacity: 0.5, pointerEvents: 'none'} : undefined

    const srcVar = useMemo(() => {
        if (mode === 'mask') return 'maskPngDataUrl'
        if (mode === 'diagnostic') return 'diagnosticPngDataUrl'
        return 'overlayPngDataUrl'
    }, [mode])

    const entry = {
        media: queue
            .filter(item => item.status === 'done')
            .map((item, index) => {
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
        })
    }

    return (
        <Paper sx={{p: isDesktop ? 2 : 1, width: '100%'}}>
            <Typography style={{...disabledStyle, fontSize: '1.1rem', fontWeight: 500}}>PARTICLE DETECTION</Typography>
            <Stack direction='row' spacing={1} sx={{mt: 2, mb: 2}} style={disabledStyle}>
                <ToggleButtons options={modeMap} currentValue={mode} onChange={setMode}/>
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
