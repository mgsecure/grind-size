import React, {useCallback, useContext} from 'react'
import {Stack} from '@mui/material'
import DataContext from '../../context/DataContext.jsx'
import ToggleButtons from '../components/ToggleButtons.jsx'

export default function OverlapPresetToggles({onChange}) {
    const {
        overlapSplitPresets, overlapPreset
    } = useContext(DataContext)

    const handleChange = useCallback((value) => {
        onChange(value)
    },[onChange])

    const activePresets = Object.keys(overlapSplitPresets).reduce((acc, presetId) => {
        if (!overlapSplitPresets[presetId].disabled) acc.push(presetId)
        return acc
    }, [])

    const modeMap = activePresets.map(presetId => {
        return {key: 'preset', value: presetId, label: overlapSplitPresets[presetId].overlapPresetName}
    })

    const buttonStyle = {padding: '3px 10px',marginTop: 4}

    return (
        <Stack direction='row' style={{}}>
            <ToggleButtons
                options={modeMap}
                currentValue={overlapPreset}
                onChange={(e) => handleChange(e)}
                buttonStyle={buttonStyle}
            />
        </Stack>
    )
}
