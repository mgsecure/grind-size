import React, {useCallback, useContext, useState} from 'react'
import ToggleColorMode from '../misc/ToggleColorMode.jsx'
import AppContext from '../app/AppContext.jsx'
import {AppBar, Button, IconButton, Stack, Toolbar, Typography} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'
import routes from '../app/routes.jsx'
import Tooltip from '@mui/material/Tooltip'
import Fab from '@mui/material/Fab'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import Slide from '@mui/material/Slide'
import {useNavigate} from 'react-router-dom'

export default function EnvAppBar() {
    const {admin} = useContext(AppContext)
    const navigate = useNavigate()

    const [showFull, setShowFull] = useState(false)

    const isLocal = window.location.hostname === 'localhost'
    const isDev = process.env.NODE_ENV !== 'production'
    const envText = isLocal
        ? 'LOCAL'
        : isDev ? 'DEV' : ''

    const bgcolor = isLocal
        ? '#c46363'
        : isDev ? '#638ac4' : '#aaa'

    const [anchorEl, setAnchorEl] = React.useState(null)
    const handleMenu = useCallback((event) => {
        setAnchorEl(event.currentTarget)
    }, [])
    const handleClose = useCallback(() => {
        setAnchorEl(null)
    }, [])
    const handleClick = useCallback(url => () => {
        handleClose()
        setShowFull(false)
        navigate(url)
    }, [handleClose, navigate])

    const menuItems = routes[0].children.map(route => (
        <MenuItem key={route.path} onClick={handleClick(route.path)}>{route.name || route.path}</MenuItem>
    ))

    return (
        <React.Fragment>
            {(isDev || admin) &&
                <React.Fragment>

                    {!showFull
                        ? <Tooltip title='Show Toolbar' arrow disableFocusListener>
                            <Fab
                                size='small'
                                sx={{
                                    backgroundColor: bgcolor,
                                    position: 'fixed',
                                    height: '36px',
                                    boxShadow: 0,
                                    right: 0,
                                    top: 0,
                                    borderRadius: 0,
                                    zIndex: 1000,
                                    '&:hover': {
                                        backgroundColor: '#aaa'
                                    }
                                }}
                                onClick={() => {
                                    setShowFull(!showFull)
                                }}
                            >
                                <PlayArrowIcon sx={{color: '#fff', transform: showFull ? '' : 'rotate(180deg)'}}/>
                            </Fab>
                        </Tooltip>

                        : <Slide direction='left' in={showFull}>
                            <AppBar position='sticky' enableColorOnDark elevation={0}
                                    sx={{
                                        backgroundColor: bgcolor,
                                        '.MuiToolbar-root': {
                                            minHeight: 2
                                        }
                                    }}>
                                <Toolbar variant='dense' disableGutters>
                                    <Typography sx={{flexGrow: 1, color: '#fff'}}>
                                        <span style={{fontWeight: 700}}>{envText}</span> - Coffee Tracker
                                    </Typography>
                                    <Stack direction='row' spacing={0}>
                                        <div style={{marginRight: 0}}>
                                            <ToggleColorMode/>
                                        </div>
                                        <div style={{marginRight: 15}}>
                                            <IconButton
                                                size='small'
                                                aria-label='account of current user'
                                                aria-controls='menu-appbar'
                                                aria-haspopup='true'
                                                onClick={handleMenu}
                                                color='inherit'
                                            >
                                                <MenuIcon sx={{color: '#fff'}}/>
                                            </IconButton>
                                            <Menu
                                                id='menu-appbar'
                                                anchorEl={anchorEl}
                                                anchorOrigin={{
                                                    vertical: 'top',
                                                    horizontal: 'right'
                                                }}
                                                keepMounted
                                                transformOrigin={{
                                                    vertical: 'top',
                                                    horizontal: 'right'
                                                }}
                                                open={Boolean(anchorEl)}
                                                onClose={handleClose}
                                            >
                                                {menuItems}
                                            </Menu>
                                        </div>
                                        <Tooltip title='Hide Toolbar' arrow disableFocusListener>
                                            <Button
                                                size='small'
                                                sx={{
                                                    backgroundColor: bgcolor,
                                                    height: '36px',
                                                    width: '36px',
                                                    minWidth: '36px',
                                                    boxShadow: 0,
                                                    borderRadius: 0,
                                                    zIndex: 1000,
                                                    '&:hover': {
                                                        backgroundColor: '#aaa'
                                                    }
                                                }}
                                                onClick={() => {
                                                    setShowFull(!showFull)
                                                }}
                                            >
                                                <PlayArrowIcon
                                                    sx={{color: '#fff', transform: !showFull ? 'rotate(180deg)' : ''}}/>
                                            </Button>
                                        </Tooltip>

                                    </Stack>
                                </Toolbar>
                            </AppBar>
                        </Slide>
                    }
                </React.Fragment>
            }
        </React.Fragment>
    )
}
