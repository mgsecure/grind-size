import {ToggleButton, ToggleButtonGroup} from '@mui/material'
import React from 'react'

export default function ToggleButtons({options, currentValue, onChange=(x) => {console.log('', x)}, style={}}) {

    const handleChange = (newValue) => {
        onChange(newValue)
    }

    return (
        <ToggleButtonGroup
            size='small'
            value={currentValue}
            exclusive
            onChange={(_, v) => v && handleChange(v)}
            style={style}
        >{
            options.map(({key, value, label}) =>
                <ToggleButton key={key} value={value}>{label}</ToggleButton>)
        }
        </ToggleButtonGroup>
    )
}