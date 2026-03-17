import React, {useContext} from 'react'
import {Stack} from '@mui/material'
import DebugToggles from './DebugToggles.jsx'
import ToggleColorMode from '../../misc/ToggleColorMode.jsx'
import AuthContext from '../../app/AuthContext.jsx'
import DoNotTrackButton from '../../nav/UseTrackerButton.jsx'

export default function Footer() {
    const {isAdmin} = useContext(AuthContext)

    if (!isAdmin) return null

    return (
        <Stack sx={{width: '100%', padding: '100px 0px 40px'}} justifyContent='center' alignItems='center'>
            <Stack direction='row' justifyContent='center' alignItems='center' spacing={0} style={{marginBottom: 10}}>
                <ToggleColorMode/>
                <DoNotTrackButton/>
            </Stack>
            <DebugToggles/>
        </Stack>
    )
}
