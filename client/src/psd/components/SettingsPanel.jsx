import React, {useState} from 'react'
import {Paper, Stack, Typography, Slider, FormControl, InputLabel, Select, MenuItem, Divider, Box} from '@mui/material'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import {PSD_PRESETS} from '@starter/shared'
import Collapse from '@mui/material/Collapse'
import SettingsIcon from '@mui/icons-material/Settings'
import useWindowSize from '../../util/useWindowSize.jsx'

export default function SettingsPanel({queue, settings, setSettings, resetToggle, setResetToggle}) {
    const [showDetails, setShowDetails] = useState(false)
    const [preset, setPreset] = useState('default') // 'default' | 'coarse' | 'fines' | 'custom'
    const [settingsChanged, setSettingsChanged] = useState(false)

    const handlePresetChange = (presetKey) => {
        setPreset(presetKey)
        const preset = PSD_PRESETS[presetKey]
        if (preset) {
            setSettings(prev => ({
                ...prev,
                ...preset.params
            }))
        }
        if (presetKey === 'custom') {
            setShowDetails(true)
        } else {
            setSettingsChanged(true)
        }
    }

    const handleParameterChange = (param, value) => {
        setSettings(prev => ({
            ...prev,
            [param]: value
        }))
        handlePresetChange('custom')
        setSettingsChanged(true)
    }

    const handleRecalculate = () => {
        setResetToggle(true)
        setSettingsChanged(false)
    }

    const {isMobile} = useWindowSize()
    const sliderWidth = isMobile ? 170 : 230

    return (
        <Paper sx={{p: 2}}>
            <Typography style={{fontSize:'1.1rem', fontWeight: 500}}>SETTINGS</Typography>
            <Stack direction='row' flexWrap='wrap' alignItems='center' sx={{mb: 0}}>
                <Stack direction='row' flexWrap='wrap' alignItems='center'>
                    <ToggleButtonGroup
                        size='small'
                        value={preset}
                        exclusive
                        onChange={(_, v) => v && handlePresetChange(v)}
                        style={{margin: '10px 10px 10px 0'}}
                    >
                        {Object.entries(PSD_PRESETS).map(([key, preset]) => (
                            <ToggleButton key={key} value={key}>{preset.name}</ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    <ToggleButtonGroup
                        size='small'
                        value={showDetails}
                        exclusive
                        onChange={() => setShowDetails(!showDetails)}
                        style={{margin: '10px 0px 10px 0'}}
                    >
                        <ToggleButton style={{width: 120}} selected={showDetails}
                                      value='advanced'>{showDetails ? 'Hide' : 'Show'} Details</ToggleButton>
                    </ToggleButtonGroup>

                    <Button variant='contained'
                            disabled={!settingsChanged || queue.length === 0}
                            onClick={handleRecalculate}
                            style={{margin: 10}}>
                        Recalculate
                    </Button>
                </Stack>
            </Stack>

            <Collapse in={showDetails} sx={{ml: !isMobile ? 3 : 0}}>
                <Divider sx={{mt: 2, mb: 2}}/>
                <Stack direction='row' alignItems='center' sx={{mb: 3, alignContent: 'center'}}>
                    <Stack sx={{mr: 2}}>
                        <ToggleButtonGroup
                            size='small'
                            value={settings.binsType}
                            exclusive
                            onChange={(e, v) => v && setSettings(prev => ({...prev, binsType: v}))}
                        >
                            <ToggleButton value='default'>Default Bins</ToggleButton>
                            <ToggleButton value='dynamic'>Dynamic</ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>

                    <Stack sx={{}}>
                        <Typography variant='body2'>
                            Bin Count: {settings.bins}
                        </Typography>
                        <Slider
                            value={settings.bins}
                            min={10}
                            max={50}
                            step={1}
                            onChange={(_, v) => setSettings(prev => ({...prev, bins: v}))}
                            style={{marginTop: 0, width: 180}}
                        />
                    </Stack>
                </Stack>

                <Stack direction='row' alignItems='top' sx={{mb: 2, alignContent: 'top', flexWrap: 'wrap' }}>
                    <Stack direction='row' style={{width: 350}}>
                        <Stack style={{width: sliderWidth, marginRight: 24}}>
                            <Typography variant='body2'>Min Area (px): {settings.minAreaPx}</Typography>
                            <Slider
                                value={settings.minAreaPx}
                                min={1}
                                max={100}
                                step={1}
                                onChange={(_, v) => handleParameterChange('minAreaPx', v)}
                                style={{marginTop: 4}}
                            />
                        </Stack>
                        <Stack style={{width: sliderWidth, marginRight: 24}}>
                            <Typography variant='body2' style={{whiteSpace: 'nowrap'}}>Max Surface (mm²): {settings.maxAreaMm2}</Typography>
                            <Slider
                                value={settings.maxAreaMm2}
                                min={1}
                                max={100}
                                step={1}
                                onChange={(_, v) => handleParameterChange('maxAreaMm2', v)}
                                style={{marginTop: 4}}
                            />
                        </Stack>
                    </Stack>

                    <Stack direction='row' style={{width: 350}}>

                        <Stack direction='row'>
                            <Stack sx={{mr: 2}}>
                                <Typography variant='body2' style={{whiteSpace: 'nowrap'}}>Overlap
                                    Separation</Typography>
                                <Switch
                                    onChange={(_, v) => handleParameterChange('splitOverlaps', v)}
                                    checked={settings.splitOverlaps}
                                    color='primary'
                                    name='checkedB'
                                />
                            </Stack>
                            <Stack style={{width: sliderWidth, marginRight: 24}}>
                                {settings.splitOverlaps && (
                                    <>
                                        <Typography variant='body2'>Separation
                                            Sensitivity: {settings.splitSensitivity}</Typography>
                                        <Slider
                                            value={settings.splitSensitivity}
                                            min={0.0}
                                            max={1.0}
                                            step={0.1}
                                            onChange={(_, v) => handleParameterChange('splitSensitivity', v)}
                                            style={{marginTop: 4}}
                                        />
                                    </>
                                )}
                            </Stack>
                        </Stack>
                    </Stack>
                </Stack>

                <Stack direction='row' alignItems='top' sx={{mb: 2, alignContent: 'top'}}>
                    <Stack style={{width: sliderWidth, marginRight: 24}}>
                        <Typography variant='body2'>Background Sigma: {settings.bgSigma}</Typography>
                        <Slider
                            value={settings.bgSigma}
                            min={5}
                            max={80}
                            step={1}
                            onChange={(_, v) => handleParameterChange('bgSigma', v)}
                        />
                    </Stack>

                    <Stack style={{width: sliderWidth, marginRight: 24}}>
                        <Typography variant='body2'>Adaptive Block Size: {settings.adaptiveBlockSize}</Typography>
                        <Slider
                            value={settings.adaptiveBlockSize}
                            min={21}
                            max={301}
                            step={2}
                            onChange={(_, v) => handleParameterChange('adaptiveBlockSize', v)}
                        />
                    </Stack>

                    <Stack style={{width: sliderWidth, marginRight: 24}}>

                        <Typography variant='body2'>Adaptive C: {settings.adaptiveC}</Typography>
                        <Slider
                            value={settings.adaptiveC}
                            min={0}
                            max={15}
                            step={1}
                            onChange={(_, v) => handleParameterChange('adaptiveC', v)}
                        />
                    </Stack>
                </Stack>

            </Collapse>
        </Paper>
    )
}
