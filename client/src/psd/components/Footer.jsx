import React from 'react'
import {Stack} from '@mui/material'
import DebugToggles from './DebugToggles.jsx'

export default function Footer() {

    return (
        <Stack sx={{width: '100%', padding: '100px 0px 40px'}} justifyContent='center' alignItems='center'>
            <DebugToggles />
        </Stack>
    )
}
