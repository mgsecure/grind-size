import {ToggleButton, ToggleButtonGroup} from '@mui/material'
import React from 'react'

export default function ToggleButtons({
                                          options, currentValue, onChange = (x) => {
        console.log('', x)
    }, buttonStyle = {}, selectedBackground}) {

    const handleChange = (newValue) => {
        onChange(newValue)
    }

    return (
        <ToggleButtonGroup
            size='small'
            value={currentValue}
            exclusive
            onChange={(_, v) => v && handleChange(v)}
        >{
            options.map(({key, value, label}) =>
                <ToggleButton
                    key={key}
                    value={value}
                    selected={currentValue.toString() === value.toString()}
                    style={{...buttonStyle, backgroundColor: currentValue.toString() === value.toString() ? selectedBackground : undefined}}
                    >
                    {label}
                </ToggleButton>)
        }
        </ToggleButtonGroup>
    )
}