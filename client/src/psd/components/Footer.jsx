import React from 'react'
import {Stack} from '@mui/material'
import DebugToggles from './DebugToggles.jsx'
import ToggleColorMode from '../../misc/ToggleColorMode.jsx'

export default function Footer() {

    return (
        <Stack sx={{width: '100%', padding: '100px 0px 40px'}} justifyContent='center' alignItems='center'>
            <ToggleColorMode />
            <DebugToggles />
        </Stack>
    )
}
