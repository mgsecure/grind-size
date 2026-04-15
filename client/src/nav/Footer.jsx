import React from 'react'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import {openInNewTab} from '../util/openInNewTab'
import {useNavigate} from 'react-router-dom'
import {useTheme} from '@mui/material/styles'

function Footer({extras, before}) {
    const navigate = useNavigate()
    const theme = useTheme()
    const linkSx = {
        color: theme.palette.text.secondary, textDecoration: 'none', cursor: 'pointer', fontSize: '0.9rem'
    }

    return (

        <Typography align='center' component='div' style={{marginTop: 60, marginBottom: 80}} sx={linkSx}>

            {before}

            <div style={{margin: '20px 0px'}}/>

            <Link onClick={() => openInNewTab('https://www.reddit.com/r/pourover')} style={{color: theme.palette.text.secondary}}>
                r/Pourover
            </Link>
            &nbsp;&nbsp;•&nbsp;&nbsp;
            <Link onClick={() => openInNewTab('https://www.reddit.com/r/espresso')} style={{color: theme.palette.text.secondary}}>
                r/Espresso
            </Link>
            &nbsp;&nbsp;•&nbsp;&nbsp;
            <Link onClick={() => navigate('/privacy')} style={{color: theme.palette.text.secondary}}>
                Privacy Policy
            </Link>

            {extras}
        </Typography>
    )
}

export default Footer
