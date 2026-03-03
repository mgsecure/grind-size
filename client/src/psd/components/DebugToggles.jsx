import React, {useContext} from 'react'
import {Stack} from '@mui/material'
import DataContext from '../../context/DataContext.jsx'
import ToggleButtons from '../components/ToggleButtons.jsx'

export default function DebugToggles() {

    const {
        debugLevel, setDebugLevel
    } = useContext(DataContext)

    const modeMap = [
        {key: 'debug', value: '0', label: '0'},
        {key: 'debug', value: '1', label: '1'},
        {key: 'debug', value: '2', label: '2'}
    ]

    const buttonStyle = {
        fontSize: '0.8rem',
        height: 22, width: 22,
        padding: '0px 0px',
        marginTop: 4,
        borderRadius: '50%',
        marginLeft: 4,
        color: '#444',
        border: '1px solid #444',
    }

    return (
        <Stack direction='row' style={{}}>
            <ToggleButtons
                options={modeMap}
                currentValue={debugLevel}
                onChange={(v) => setDebugLevel(parseInt(v))}
                buttonStyle={buttonStyle}
                selectedBackground={'#292929'}
            />
        </Stack>
    )
}
