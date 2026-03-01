import React, {useContext, useMemo} from 'react'
import {Paper, Stack, Typography, alpha, Box, lighten} from '@mui/material'
import {useTheme} from '@mui/material/styles'
import DataContext from '../../context/DataContext.jsx'
import EntryImageGallery from '../components/EntryImageGallery.jsx'
import ToggleButtons from '../components/ToggleButtons.jsx'
import UIContext from '../../context/UIContext.jsx'
import ImageViewModeToggles from '../components/ImageViewModeToggles.jsx'

export default function ImagePanel() {
    const {
        queue,
        activeIdList,
        isDesktop
    } = useContext(DataContext)

    const {imageViewMode, setImageViewMode} = useContext(UIContext) // original | mask | overlay | diagnostic

    const theme = useTheme()

    console.log('queue', queue)

    const availableImageModes = Array.from(queue.reduce((acc, item) => {
        item.result?.previews?.originalPngDataUrl && acc.add('original')
        item.result?.previews?.overlayPngDataUrl && acc.add('overlay')
        item.result?.previews?.maskPngDataUrl && acc.add('mask')
        item.result?.previews?.diagnosticPngDataUrl && acc.add('diagnostic')
        return acc
    }, new Set()))

    const modeMap = [
        {key: 'mode', value: 'original', label: 'Original'},
        {key: 'mode', value: 'overlay', label: 'Overlay'},
        {key: 'mode', value: 'mask', label: 'Mask'},
        {key: 'mode', value: 'diagnostic', label: 'Diagnostic'}
    ].filter(item => availableImageModes.includes(item.value))

    const srcVar = useMemo(() => {
        if (imageViewMode === 'original') return 'originalPngDataUrl'
        if (imageViewMode === 'mask') return 'maskPngDataUrl'
        if (imageViewMode === 'diagnostic') return 'diagnosticPngDataUrl'
        return 'overlayPngDataUrl'
    }, [imageViewMode])

    const entry = {
        media: queue
            .filter(item => item.status === 'done' && item.result?.previews?.[srcVar] !== undefined)
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

    const disabledStyle = !activeIdList.length ? {opacity: 0.5, pointerEvents: 'none'} : undefined

    return (
        <Paper sx={{p: isDesktop ? 2 : 1, width: '100%'}}>
            <Typography style={{...disabledStyle, fontSize: '1.1rem', fontWeight: 500}}>PARTICLE DETECTION IMAGES</Typography>
            <ImageViewModeToggles />

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
