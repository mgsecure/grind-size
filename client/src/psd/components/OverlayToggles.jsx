import React from 'react'
import {Paper, FormGroup, FormControlLabel, Checkbox, Typography} from '@mui/material'

export default function OverlayToggles({options = {}, onChange = () => {}}) {
    return (
        <Paper sx={{p: 2}}>
            <Typography variant='h6' sx={{mb: 1}}>Overlay</Typography>
            <FormGroup>
                <FormControlLabel
                    control={<Checkbox checked={!!options.showParticles} onChange={e => onChange({...options, showParticles: e.target.checked})}/>}
                    label='Particle outlines'
                />
                <FormControlLabel
                    control={<Checkbox checked={!!options.showMarkers} onChange={e => onChange({...options, showMarkers: e.target.checked})}/>}
                    label='ArUco markers'
                />
                <FormControlLabel
                    control={<Checkbox checked={!!options.showScale} onChange={e => onChange({...options, showScale: e.target.checked})}/>}
                    label='Scale boundary'
                />
                <FormControlLabel
                    control={<Checkbox checked={!!options.showRoi} onChange={e => onChange({...options, showRoi: e.target.checked})}/>}
                    label='Analysis region'
                />
            </FormGroup>
        </Paper>
    )
}
