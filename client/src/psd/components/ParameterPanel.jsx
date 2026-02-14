import React from 'react'
import {Paper, Stack, Typography, Slider, FormControl, InputLabel, Select, MenuItem} from '@mui/material'

export default function ParameterPanel({settings, setSettings}) {
    return (
        <Paper sx={{p: 2}}>
            <Typography variant='h6' sx={{mb: 1}}>Parameters</Typography>
            <Stack spacing={2}>
                <FormControl size='small' fullWidth>
                    <InputLabel>Template</InputLabel>
                    <Select
                        label='Template'
                        value={settings.templateSize}
                        onChange={e => setSettings(prev => ({...prev, templateSize: e.target.value}))}
                    >
                        <MenuItem value={100}>100mm</MenuItem>
                        <MenuItem value={50}>50mm</MenuItem>
                    </Select>
                </FormControl>

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

                <FormControl size='small' fullWidth>
                    <InputLabel>Weighting</InputLabel>
                    <Select
                        label='Weighting'
                        value={settings.weighting}
                        onChange={e => setSettings(prev => ({...prev, weighting: e.target.value}))}
                    >
                        <MenuItem value='count'>Count</MenuItem>
                        <MenuItem value='surface'>Surface</MenuItem>
                        <MenuItem value='volume'>Volume</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size='small' fullWidth>
                    <InputLabel>Bin Spacing</InputLabel>
                    <Select
                        label='Bin Spacing'
                        value={settings.binSpacing}
                        onChange={e => setSettings(prev => ({...prev, binSpacing: e.target.value}))}
                    >
                        <MenuItem value='log'>Log</MenuItem>
                        <MenuItem value='linear'>Linear</MenuItem>
                    </Select>
                </FormControl>

                <Typography variant='body2'>Bins: {settings.bins}</Typography>
                <Slider
                    value={settings.bins}
                    min={10}
                    max={100}
                    step={1}
                    onChange={(_, v) => setSettings(prev => ({...prev, bins: v}))}
                />
            </Stack>
        </Paper>
    )
}
