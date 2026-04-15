import React, {useCallback, useContext} from 'react'
import LoginIcon from '@mui/icons-material/Login'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import AuthContext from '../app/AuthContext'
import Link from '@mui/material/Link'
import DBContext from '../app/DBContext.jsx'
import {enqueueSnackbar} from 'notistack'
import Button from '@mui/material/Button'

function SignInButton({onClick, linkText, style={}}) {
    const {authLoaded, isLoggedIn, login} = useContext(AuthContext)
    const {setDemo} = useContext(DBContext)

    const handleClick = useCallback(async () => {
        onClick && onClick()
        try {
            await login()
        } catch (error) {
            console.error('Error logging in:', error)
            enqueueSnackbar('There was a problem logging you in. Please try again later. ', {
                autoHideDuration: null,
                action: <Button color='secondary' onClick={() => window.location.reload()}>Refresh</Button>
            })
        } finally {
            setDemo(false)
        }
    }, [onClick, login, setDemo])

    if (!authLoaded || isLoggedIn) return null

    return (
        <React.Fragment>
            {linkText
                ? <Link onClick={handleClick} style={{
                    color: '#fff',
                    textAlign: 'center',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                }}>
                    {linkText}
                </Link>
                : <MenuItem onClick={handleClick} style={style}>
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', width: 176}}>
                        <ListItemIcon>
                            <LoginIcon fontSize='small'/>
                        </ListItemIcon>
                        <ListItemText>Sign In with Google</ListItemText>
                    </div>
                </MenuItem>
            }
        </React.Fragment>
    )
}

export default SignInButton
