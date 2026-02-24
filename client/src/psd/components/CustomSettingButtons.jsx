import IconButton from '@mui/material/IconButton'
import React, {useCallback, useContext} from 'react'
import DataContext from '../../context/DataContext.jsx'
import SaveIcon from '@mui/icons-material/Save'
import DeleteIcon from '@mui/icons-material/Delete'
import useWindowSize from '../../util/useWindowSize.jsx'
import {PSD_DEFAULTS} from '@starter/shared'
import {useTheme,alpha} from '@mui/material/styles'

export default function CustomSettingsButtons() {
    const theme = useTheme()
    const {isDesktop} = useWindowSize()
    const defaultBins = isDesktop ? 30 : 20

    const {
        customSettings, setCustomSettings,
        retainCustomSettings, setRetainCustomSettings,
        settings, setSettings,
        isCustomSettings
    } = useContext(DataContext)

    const toggleRetainCustomSettings = useCallback(() => {
        if (!retainCustomSettings && customSettings) {
            setSettings(customSettings)
        } else if (!retainCustomSettings && !customSettings) {
            setCustomSettings({...settings, name: 'custom'})
        }
        setRetainCustomSettings(!retainCustomSettings)
    }, [customSettings, retainCustomSettings, setCustomSettings, setRetainCustomSettings, setSettings, settings])

    const clearCustomSettings = useCallback(() => {
        setSettings({...PSD_DEFAULTS, bins: defaultBins, name: 'custom'})
        setCustomSettings(undefined)
        setRetainCustomSettings(false)
    }, [defaultBins, setCustomSettings, setRetainCustomSettings, setSettings])

    const disabledStyle = {opacity: 0.5, pointerEvents: 'none'}

    return (
        <>
            <IconButton onClick={toggleRetainCustomSettings} style={isCustomSettings ? undefined : disabledStyle}>
                <SaveIcon fontSize='small' style={{color: retainCustomSettings ? theme.palette.success.main : alpha(theme.palette.text.primary, 0.7)}}/>
            </IconButton>
            <IconButton onClick={clearCustomSettings} style={isCustomSettings ? undefined : disabledStyle}>
                <DeleteIcon fontSize='small' style={{color: retainCustomSettings ? theme.palette.text.primary : alpha(theme.palette.text.primary, 0.7)}}/>
            </IconButton>
        </>
    )
}
