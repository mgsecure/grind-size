import React from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import {circularProgressClasses} from '@mui/material'

export default function LoadingDisplaySmall({size='small', color='#fff'}) {

    const diameterValues = {xsmall: 18, small: 20, medium: 24, large: 35}
    const diameter = diameterValues[size] || 20

    const sizeValues = {xsmall: 18, small: 18, medium: 22, large: 32}
    const progressSize = sizeValues[size] || 18

    return (
        <div style={{display: 'flex', placeItems: 'center', justifyContent: 'center', width: diameter, height: diameter}}>
            <CircularProgress
                variant='indeterminate'
                disableShrink
                sx={{
                    color: (theme) => (theme.palette.mode === 'light' ? color : color),
                    animationDuration: '550ms',
                    [`& .${circularProgressClasses.circle}`]: {
                        strokeLinecap: 'round'
                    }
                }}
                size={progressSize}
                thickness={5}
            />
        </div>
    )

}