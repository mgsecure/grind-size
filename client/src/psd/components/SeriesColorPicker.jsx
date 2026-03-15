import React, {useCallback, useContext, useEffect, useState} from 'react'
import {Slider, Stack, Typography} from '@mui/material'
import {HexColorPicker} from 'react-colorful'
import Popover from '@mui/material/Popover'
import {useTheme} from '@mui/material/styles'
import UIContext from '../../context/UIContext.jsx'
import {setDeep} from '../../util/setDeep.js'

export default function SeriesColorPicker({seriesItem}) {
    const theme = useTheme()
    const {chartColors, customSampleParams, setCustomSampleParams} = useContext(UIContext)


    const [anchorEl, setAnchorEl] = React.useState(null)

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget)
    }
    const handleClose = () => {
        document.activeElement.blur()
        document.body.focus()
        setAnchorEl(null)
    }

    const open = Boolean(anchorEl)
    const id = open ? 'simple-popover' : undefined

    const [color, setColor] = useState(chartColors[seriesItem.index] || '#bbb')

    useEffect(() => {
        if (customSampleParams[seriesItem.id]?.color && color !== customSampleParams[seriesItem.id]?.color) {
            setColor(customSampleParams[seriesItem.id]?.color)
        } else if (!customSampleParams[seriesItem.id]?.color) {
            setColor(chartColors[seriesItem.index] || '#bbb')
        }
    },[chartColors, color, customSampleParams, seriesItem.id, seriesItem.index])

    const [lineWeight, setLineWeight] = useState(2)
    const handleLineWeight = (weight) => {
        setLineWeight(weight)
        const newSeriesParams = {...customSampleParams}
        setDeep(newSeriesParams, [seriesItem.id, 'stroke'], weight)
        setCustomSampleParams(newSeriesParams)
    }
    const handleColorChange = useCallback((color) => {
        setColor(color)
        const newSeriesParams = {...customSampleParams}
        setDeep(newSeriesParams, [seriesItem.id, 'color'], color)
        setCustomSampleParams(newSeriesParams)
    },[customSampleParams, seriesItem.id, setCustomSampleParams])

    return (
        <>
            <div style={{height: 14, width: 14, backgroundColor: color || '#999'}} aria-describedby={id} onClick={handleClick}/>
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
                            boxShadow: theme.shadows[5]
                        }
                    }
                }}
            >
                <HexColorPicker color={color.toString()} onChange={handleColorChange} style={{margin: 20}}/>

                <Stack direction='column' alignItems='center' justifyContent='space-between'
                       sx={{margin: 0, paddingTop: 0}}>
                    <div style={{
                        borderTop: `${lineWeight}px solid ${color}`,
                        height: '20px',
                        width: '80%'
                    }}/>

                    <Stack direction='row' alignItems='center' justifyContent='space-between'
                           sx={{mb: 3, width: '80%'}}>
                        <Typography variant='body2'>
                            Line Weight
                        </Typography>
                        <Slider
                            value={lineWeight}
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