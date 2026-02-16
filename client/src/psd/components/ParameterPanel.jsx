import React, {useState} from 'react'
import {Paper, Stack, Typography, Slider, FormControl, InputLabel, Select, MenuItem, Divider, Box} from '@mui/material'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Button from '@mui/material/Button'
import {PSD_PRESETS} from '@starter/shared'

export default function ParameterPanel({settings, setSettings, resetToggle, setResetToggle}) {
    const [viewMode, setViewMode] = useState('standard') // 'standard' | 'advanced'

    const handlePresetChange = (presetKey) => {
        const preset = PSD_PRESETS[presetKey]
        if (preset) {
            setSettings(prev => ({
                ...prev,
                ...preset.params
            }))
        }
    }

    return (
        <Paper sx={{p: 2}}>
            <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{mb: 1}}>
                <Typography variant='h6'>Parameters</Typography>
                <ToggleButtonGroup
                    size='small'
                    value={viewMode}
                    exclusive
                    onChange={(_, v) => v && setViewMode(v)}
                >
                    <ToggleButton value='standard'>Standard</ToggleButton>
                    <ToggleButton value='advanced'>Advanced</ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <Stack spacing={2}>
                <Typography variant='body2'>Preset</Typography>
                <ToggleButtonGroup
                    size='small'
                    value={Object.keys(PSD_PRESETS).find(key => 
                        Object.entries(PSD_PRESETS[key].params).every(([p, val]) => settings[p] === val)
                    ) || 'custom'}
                    exclusive
                    onChange={(_, v) => v && v !== 'custom' && handlePresetChange(v)}
                >
                    {Object.entries(PSD_PRESETS).map(([key, preset]) => (
                        <ToggleButton key={key} value={key}>{preset.name}</ToggleButton>
                    ))}
                    <ToggleButton value='custom' disabled>Custom</ToggleButton>
                </ToggleButtonGroup>

                <Divider />

                {viewMode === 'advanced' ? (
                    <>
                        <Typography variant='body2'>Background Sigma: {settings.bgSigma}</Typography>
                        <Slider
                            value={settings.bgSigma}
                            min={5}
                            max={80}
                            step={1}
                            onChange={(_, v) => setSettings(prev => ({...prev, bgSigma: v}))}
                        />

                        <Typography variant='body2'>Adaptive Block Size: {settings.adaptiveBlockSize}</Typography>
                        <Slider
                            value={settings.adaptiveBlockSize}
                            min={21}
                            max={301}
                            step={2}
                            onChange={(_, v) => setSettings(prev => ({...prev, adaptiveBlockSize: v}))}
                        />

                        <Typography variant='body2'>Adaptive C: {settings.adaptiveC}</Typography>
                        <Slider
                            value={settings.adaptiveC}
                            min={0}
                            max={15}
                            step={1}
                            onChange={(_, v) => setSettings(prev => ({...prev, adaptiveC: v}))}
                        />

                        <Typography variant='body2'>Min Area (px): {settings.minAreaPx}</Typography>
                        <Slider
                            value={settings.minAreaPx}
                            min={1}
                            max={100}
                            step={1}
                            onChange={(_, v) => setSettings(prev => ({...prev, minAreaPx: v}))}
                        />

                        <Typography variant='body2'>Max Surface (mm²): {settings.maxAreaMm2}</Typography>
                        <Slider
                            value={settings.maxAreaMm2}
                            min={1}
                            max={100}
                            step={1}
                            onChange={(_, v) => setSettings(prev => ({...prev, maxAreaMm2: v}))}
                        />

                        <Typography variant='body2'>Overlap Separation</Typography>
                        <ToggleButtonGroup
                            size='small'
                            value={settings.splitOverlaps ? 'on' : 'off'}
                            exclusive
                            onChange={(e, v) => setSettings(prev => ({...prev, splitOverlaps: v === 'on'}))}
                        >
                            <ToggleButton value='on'>On</ToggleButton>
                            <ToggleButton value='off'>Off</ToggleButton>
                        </ToggleButtonGroup>

                        {settings.splitOverlaps && (
                            <>
                                <Typography variant='body2'>Separation Sensitivity: {settings.splitSensitivity}</Typography>
                                <Slider
                                    value={settings.splitSensitivity}
                                    min={0.0}
                                    max={1.0}
                                    step={0.1}
                                    onChange={(_, v) => setSettings(prev => ({...prev, splitSensitivity: v}))}
                                />
                            </>
                        )}
                    </>
                ) : (
                    <Box sx={{py: 1}}>
                        <Typography variant='body2' color='text.secondary'>
                            Switch to Advanced mode to manually tune image processing parameters.
                        </Typography>
                    </Box>
                )}

                <Divider />

                <Typography variant='body2'>Binning</Typography>
                <ToggleButtonGroup
                    size='small'
                    value={settings.binsType}
                    exclusive
                    onChange={(e, v) => v && setSettings(prev => ({...prev, binsType: v}))}
                >
                    <ToggleButton value='default'>Default</ToggleButton>
                    <ToggleButton value='dynamic'>Dynamic</ToggleButton>
                </ToggleButtonGroup>

                <Typography variant='body2'>
                    Bin Count: {settings.bins}
                </Typography>

                <Slider
                    value={settings.bins}
                    min={10}
                    max={100}
                    step={1}
                    disabled={settings.binsType === 'default'}
                    onChange={(_, v) => setSettings(prev => ({...prev, bins: v}))}
                />

                <Button variant="contained" onClick={() => setResetToggle(true)}>Analyze All</Button>
            </Stack>
        </Paper>
    )
}
