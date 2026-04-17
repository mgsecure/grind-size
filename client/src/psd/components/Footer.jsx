import React, {useContext} from 'react'
import {Stack} from '@mui/material'
import DebugToggles from './DebugToggles.jsx'
import AuthContext from '../../app/AuthContext.jsx'

export default function Footer() {
    const {isAdmin} = useContext(AuthContext)

    if (!isAdmin) return null

    return (
        <Stack sx={{width: '100%', padding: '0px 0px 0px'}} justifyContent='center' alignItems='center'>
            <DebugToggles/>
        </Stack>
    )
}
