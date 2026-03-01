import React, {useContext} from 'react'
import {Stack} from '@mui/material'
import DataContext from '../../context/DataContext.jsx'
import ToggleButtons from '../components/ToggleButtons.jsx'
import UIContext from '../../context/UIContext.jsx'

export default function ImageViewModeToggles() {
    const {
        queue,
        activeIdList,
    } = useContext(DataContext)

    const {imageViewMode, setImageViewMode} = useContext(UIContext) // original | mask | overlay | diagnostic

    const availableImageModes = Array.from(queue.reduce((acc, item) => {
        item.result?.previews?.originalPngDataUrl && acc.add('original')
        item.result?.previews?.overlayPngDataUrl && acc.add('overlay')
        item.result?.previews?.maskPngDataUrl && acc.add('mask')
        item.result?.previews?.diagnosticPngDataUrl && acc.add('diagnostic')
        return acc
    }, new Set()))

    const modeMap = [
        {key: 'mode', value: 'original', label: 'Original'},
        {key: 'mode', value: 'mask', label: 'Mask'},
        {key: 'mode', value: 'overlay', label: 'Overlay'},
        {key: 'mode', value: 'diagnostic', label: 'Diagnostic'}
    ].filter(item => availableImageModes.includes(item.value))

    const disabledStyle = !activeIdList.length ? {opacity: 0.5, pointerEvents: 'none'} : undefined

    return (
        <Stack direction='row' spacing={1} sx={{mt: 2, mb: 2}} style={disabledStyle}>
            <ToggleButtons options={modeMap} currentValue={imageViewMode} onChange={setImageViewMode}/>
        </Stack>
    )
}
