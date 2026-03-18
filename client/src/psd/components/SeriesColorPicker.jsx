import React, {useCallback, useContext, useEffect, useState} from 'react'
import {Box, Slider, Stack, Typography} from '@mui/material'
import {HexColorPicker} from 'react-colorful'
import Popover from '@mui/material/Popover'
import {useTheme} from '@mui/material/styles'
import UIContext from '../../context/UIContext.jsx'
import {setDeep} from '../../util/setDeep.js'

export default function SeriesColorPicker({seriesItem}) {
    const theme = useTheme()
    const {
        chartColors,
        customSampleParams,
        setCustomSampleParams,
        colorSwatches,
        setColorSwatches
    } = useContext(UIContext)
    const [anchorEl, setAnchorEl] = React.useState(null)
    const open = Boolean(anchorEl)
    const id = open ? 'simple-popover' : undefined
    const [color, setColor] = useState(chartColors[seriesItem.index] || '#bbb')

    const updateSwatches = useCallback((color) => {
        const newSwatches = [...colorSwatches]
        const idx = newSwatches.findIndex(c => c.toString() === color.toString())
        if (idx > -1) {
            newSwatches.unshift(newSwatches.splice(idx, 1)[0])
        } else {
            newSwatches.unshift(color)
        }
        setColorSwatches(newSwatches.splice(0, 19))
    }, [colorSwatches, setColorSwatches])

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget)
    }
    const handleClose = () => {
        document.activeElement.blur()
        document.body.focus()
        setAnchorEl(null)
        updateSwatches(color)
    }


    useEffect(() => {
        if (customSampleParams[seriesItem.id]?.color && color !== customSampleParams[seriesItem.id]?.color) {
            setColor(customSampleParams[seriesItem.id]?.color)
        } else if (!customSampleParams[seriesItem.id]?.color) {
            setColor(chartColors[seriesItem.index] || '#bbb')
        }
    }, [chartColors, color, customSampleParams, seriesItem.id, seriesItem.index])

    const handleColorChange = useCallback((color) => {
        setColor(color)
        const newSeriesParams = {...customSampleParams}
        setDeep(newSeriesParams, [seriesItem.id, 'color'], color)
        setCustomSampleParams(newSeriesParams)
    }, [customSampleParams, seriesItem.id, setCustomSampleParams])

    const [lineWeight, setLineWeight] = useState(2)
    const handleLineWeight = (weight) => {
        setLineWeight(weight)
        const newSeriesParams = {...customSampleParams}
        setDeep(newSeriesParams, [seriesItem.id, 'stroke'], weight)
        setCustomSampleParams(newSeriesParams)
    }

    return (
        <>
            <div style={{height: 14, width: 14, backgroundColor: color || '#999'}} aria-describedby={id}
                 onClick={handleClick}/>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                disableRestoreFocus
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                }}
                sx={{...hexColorPickerSx}}
                slotProps={{
                    paper: {
                        sx: {
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: 2,
                            boxShadow: theme.shadows[5],
                            justifyItems: 'center'
                        }
                    }
                }}
            >
                <HexColorPicker color={color.toString()} onChange={handleColorChange} style={{margin: 20}}/>

                {colorSwatches.length > 0 && (
                    <Stack direction='row' flexWrap='wrap' alignItems='center' justifyContent='center' gap={0.3}
                           sx={{marginBottom: 2, maxWidth: '80%'}}>
                        {colorSwatches.slice(0, 19).map((clr, i) => (
                            <Box key={i} sx={{
                                display: 'flex', alignItems: 'center', height: 17, width: 17, border: '1px solid #222',
                                backgroundColor: clr.toString()
                            }}
                                 onClick={() => handleColorChange(clr.toString())}
                            />
                        ))}
                    </Stack>
                )}

                <Stack direction='column' alignItems='center' justifyContent='space-between'
                       sx={{marginTop: 1, paddingTop: 1}}>
                    <div style={{
                        borderTop: `${lineWeight}px solid ${color}`,
                        height: '20px',
                        width: '80%'
                    }}/>
                    <Stack direction='row' alignItems='center' justifyContent='space-between'
                           sx={{mb: 3, width: '80%'}}>
                        <Typography variant='body2' sx={{whiteSpace: 'nowrap', mr: 1}}>
                            Line Weight
                        </Typography>
                        <Slider
                            value={lineWeight}
                            valueLabelDisplay='auto'
                            min={1}
                            max={5}
                            step={0.5}
                            onChange={(_, v) => handleLineWeight(v)}
                            style={{width: 85}}
                            size='medium'
                        />
                    </Stack>
                </Stack>
            </Popover>
        </>
    )
}

const hexColorPickerSx = {
    p: 2,
    '& .react-colorful__pointer': {
        height: 16,
        width: 16
    }
}