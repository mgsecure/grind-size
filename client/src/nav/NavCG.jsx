import React from 'react'
import {Paper, Stack, Typography} from '@mui/material'
import useWindowSize from '../util/useWindowSize.jsx'

export default function NavCG() {
    const {isDesktop} = useWindowSize()

    return (
            <Stack spacing={isDesktop ? 1 : 1} sx={{width: '100%'}}>
                <Paper sx={{p: isDesktop ? 2 : 1, width: '100%', borderTopRightRadius: 0, borderTopLeftRadius: 0}}>
                    <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
                        <Typography style={{fontSize: '1.5rem', fontWeight: 700, lineHeight: '1.2em', marginTop: 8}}>
                            COFFEE GRINDS
                            {!isDesktop && <br/>}
                            <span style={{fontWeight: 300}}> PARTICLE SIZE DISTRIBUTION</span>
                        </Typography>
                    </Stack>
                </Paper>
            </Stack>
    )

}

