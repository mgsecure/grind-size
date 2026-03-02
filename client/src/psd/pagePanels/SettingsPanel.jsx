import React, {useCallback, useContext, useMemo, useState} from 'react'
import {Paper, Stack, Typography, Slider, FormControlLabel} from '@mui/material'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import {PSD_PRESETS} from '@starter/shared'
import Collapse from '@mui/material/Collapse'
import DataContext from '../../context/DataContext.jsx'
import isDeepEqual from '../../util/isDeepEqual.js'
import CustomSettingsButtons from '../components/CustomSettingButtons.jsx'
import ExpandButton from '../../misc/ExpandButton.jsx'
import HelpContentDrawerButton from '../components/HelpContentDrawerButton.jsx'
import helpSettings from '../resources/helpSettings.md?raw'
import OverlapPresetToggles from '../components/OverlapPresetToggles.jsx'

export default function SettingsPanel() {
    const {
        debugLevel,
        queueItems,
        settings, setSettings,
        customSettings, setCustomSettings,
        retainCustomSettings,
        setResetToggle,
        isCustomSettings, setIsCustomSettings,
        overlapSplitPresets, setOverlapPreset,
        isDesktop
    } = useContext(DataContext)

    // TODO: implement save/load custom settings from local storage
    // console.log('customSettings', customSettings)

    const [showDetails, setShowDetails] = useState(false)
    const [preset, setPreset] = useState('default') // 'default' | 'coarse' | 'fines' | 'custom'

    const needsRefresh = useMemo(() => {
        return queueItems
            .filter(item => item.status === 'done')
            .map(item => item.settings).some(
                (itemSettings) => !isDeepEqual(itemSettings, settings, {ignore: ['name', 'bins', 'binSpacing', 'sampleName']})
            )
    }, [queueItems, settings])

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
            setIsCustomSettings(true)
            if (retainCustomSettings && customSettings) {
                setSettings(customSettings)
            } else if (retainCustomSettings && !customSettings) {
                setCustomSettings(settings)
            }
        } else {
            setIsCustomSettings(false)
        }
    }

    const handleOverlapPresetChange = useCallback((presetKey) => {
        const preset = overlapSplitPresets[presetKey]
        if (preset) {
            setOverlapPreset(presetKey)
            setSettings(prev => ({
                ...prev,
                overlapSplitPreset: presetKey,
                ...preset
            }))
        }
    }, [overlapSplitPresets, setOverlapPreset, setSettings])

    const handleCustomClick = useCallback(() => {
        if (isCustomSettings && showDetails) {
            setShowDetails(false)
        } else if (!isCustomSettings || (isCustomSettings && !showDetails)) {
            setShowDetails(true)
        }
    }, [isCustomSettings, showDetails])

    const handleParameterChange = (param, value) => {
        setSettings(prev => ({
            ...prev,
            [param]: value
        }))
        if (preset !== 'custom') handlePresetChange('custom')
        if (retainCustomSettings) setCustomSettings(prev => ({
            ...prev,
            [param]: value
        }))

        setIsCustomSettings(true)
    }

    const handleRecalculate = () => {
        setResetToggle(true)
    }

    const sliderWidth = isDesktop ? 230 : 170

    return (
        <Paper sx={{p: isDesktop ? 2 : 1, width: '100%'}}>
            <Stack direction='row' alignItems='flex-end' sx={{fontSize: '1.1rem', fontWeight: 500}}>
                <span style={{marginRight: 10}}>SETTINGS</span>
                <HelpContentDrawerButton markdown={String(helpSettings)}/>
            </Stack>


            <Stack direction='row' flexWrap='wrap' alignItems='center' justifyContent='space-between'>
                <Stack direction='row' alignItems='center' justifyContent='space-between' style={{flexGrow: 1}}>
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
                            value={preset}
                            exclusive
                            onChange={(_, v) => v && handlePresetChange(v)}
                            style={{margin: isDesktop ? '10px 8px 10px 20px' : 0}}
                        >
                            <ToggleButton key='custom' value='custom' onClick={handleCustomClick}>Custom</ToggleButton>
                        </ToggleButtonGroup>
                        <CustomSettingsButtons/>
                    </Stack>
                    <ExpandButton expanded={showDetails} onChange={() => setShowDetails(!showDetails)}/>
                </Stack>

                {queueItems.length > 0 &&
                    <Stack direction='row' alignItems='center'>
                        <Button variant='contained'
                                disabled={!needsRefresh || queueItems.length === 0}
                                onClick={handleRecalculate}
                                style={{margin: 10}}>
                            Refresh All
                        </Button>
                    </Stack>
                }
            </Stack>

            <Collapse in={showDetails} sx={{ml: isDesktop ? 1 : 0}}>

                {debugLevel >= 2 &&
                    <Stack style={{
                        backgroundColor: 'rgba(0,0,0,0.1)', padding: '18px 0px', margin: '18px 0px',
                        borderTop: '1px solid #ffffff33', borderBottom: '1px solid #ffffff33', width: '100%'
                    }}>
                        <Stack direction='row' spacing={isDesktop ? 3 : 1}
                               sx={{alignItems: 'center', width: '100%', justifyContent: 'center'}}>
                            <FormControlLabel
                                label='Test Pipeline'
                                control={
                                    <Switch size='small'
                                            checked={settings.testPipeline}
                                            onChange={(_, v) => handleParameterChange('testPipeline', v)}
                                            name='testPipeline'
                                    />}
                                labelPlacement={'start'} style={{textAlign: 'right'}}
                            />
                            <FormControlLabel
                                label='Correct Perspective'
                                control={
                                    <Switch size='small'
                                            checked={settings.correctPerspective}
                                            onChange={(_, v) => handleParameterChange('correctPerspective', v)}
                                            name='correctPerspective'
                                    />}
                                labelPlacement={'start'} style={{textAlign: 'right'}}
                            />
                            <FormControlLabel
                                labelPlacement={'start'}
                                control={
                                    <Switch size='small'
                                            checked={settings.useMorphology}
                                            onChange={(_, v) => handleParameterChange('useMorphology', v)}
                                            name='useMorphology'
                                    />}
                                label='Use Morphology' style={{textAlign: 'right'}}
                            />
                        </Stack>

                        <Stack direction='row'
                               sx={{alignItems: 'center', width: '100%', justifyContent: 'center', mt: 2}}>
                            <Stack>
                                <ToggleButtonGroup
                                    size='small'
                                    value={settings.binsType}
                                    exclusive
                                    onChange={(_e, v) => v && setSettings(prev => ({...prev, binsType: v}))}
                                >
                                    <ToggleButton value='default'>Default Bins</ToggleButton>
                                    <ToggleButton value='dynamic'>Dynamic</ToggleButton>
                                </ToggleButtonGroup>
                            </Stack>
                        </Stack>
                    </Stack>
                }

                <Stack direction='row' alignItems='top' sx={{mb: 2, mt: 2, alignContent: 'top', flexWrap: 'wrap'}}>
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
                            <Typography variant='body2' style={{whiteSpace: 'nowrap'}}>Max Surface
                                (mm²): {settings.maxAreaMm2}</Typography>
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

                    <Stack sx={{mr: 2}}>
                        <Typography variant='body2' style={{whiteSpace: 'nowrap'}}>Overlap
                            Separation</Typography>
                        <OverlapPresetToggles onChange={handleOverlapPresetChange}/>
                    </Stack>

                    {debugLevel >= 1 &&
                        <Stack style={{
                            backgroundColor: 'rgba(0,0,0,0.1)', padding: '18px 0px', margin: '24px 0px 18px',
                            borderTop: '1px solid #ffffff33', borderBottom: '1px solid #ffffff33', width: '100%'
                        }}>
                            <Stack direction='row' spacing={isDesktop ? 6 : 1}
                                   sx={{alignItems: 'center', width: '100%', justifyContent: 'center'}}>
                                <Stack style={{width: sliderWidth}}>
                                    <Typography variant='body2'>Separation
                                        Sensitivity: {settings.splitSensitivity}</Typography>
                                    <Slider
                                        value={settings.splitSensitivity}
                                        min={0.0}
                                        max={1.0}
                                        step={0.05}
                                        onChange={(_, v) => handleParameterChange('splitSensitivity', v)}
                                        style={{marginTop: 4}}
                                    />
                                </Stack>
                                <Stack style={{width: sliderWidth}}>
                                    <Typography variant='body2'>Extra Seed
                                        Sensitivity: {settings.extraSeedSensitivity}</Typography>
                                    <Slider
                                        value={settings.extraSeedSensitivity ?? 0.3}
                                        min={0.0}
                                        max={1.0}
                                        step={0.05}
                                        onChange={(_, v) => handleParameterChange('extraSeedSensitivity', v)}
                                        style={{marginTop: 4}}
                                    />
                                </Stack>
                                <Stack style={{width: sliderWidth}}>
                                    <Typography variant='body2'>Extra Seed
                                        Distance: {settings.extraSeedMinDistFactor}</Typography>
                                    <Slider
                                        value={settings.extraSeedMinDistFactor ?? 1.5}
                                        min={0.5}
                                        max={3.0}
                                        step={0.1}
                                        onChange={(_, v) => handleParameterChange('extraSeedMinDistFactor', v)}
                                        style={{marginTop: 4}}
                                    />
                                </Stack>
                            </Stack>
                        </Stack>
                    }
                </Stack>

                <Stack direction='row' alignItems='top' sx={{mb: 2, mt: 4, alignContent: 'top'}}>
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

                        <Typography variant='body2'>Adaptive Constant: {settings.adaptiveC}</Typography>
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
