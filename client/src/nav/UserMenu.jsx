import React, {useCallback, useContext, useState} from 'react'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import PersonIcon from '@mui/icons-material/Person'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import EditIcon from '@mui/icons-material/Edit'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import SignInButton from '../auth/SignInButton'
import AuthContext from '../app/AuthContext'
import DBContext from '../app/DBContext'
import AppContext from '../app/AppContext'
import {useNavigate} from 'react-router-dom'

function UserMenu() {
    const navigate = useNavigate()
    const {isLoggedIn, user, logout, isAdmin} = useContext(AuthContext)
    const {userProfile = {}} = useContext(DBContext)
    const {adminEnabled, setAdminEnabled} = useContext(AppContext)
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), [])
    const handleClose = useCallback(() => setAnchorEl(null), [])
    const safeName = userProfile.username
        ? userProfile.username.replace(/\s/g, '_')
        : 'anonymous'

    const displayName = userProfile.username
        ? userProfile.username
        : 'Your Account'

    const handleClick = useCallback(url => () => {
        handleClose()
        navigate(url)
    }, [handleClose, navigate])

    const handleToggleAdmin = useCallback(() => {
        setAdminEnabled(!adminEnabled)
    }, [adminEnabled, setAdminEnabled])

    const handleLogout = useCallback(() => {
        handleClose()
        logout()
    }, [handleClose, logout])

    return (
        <React.Fragment>
            <Tooltip title={isLoggedIn ? displayName : 'Account'} arrow disableFocusListener>
                <IconButton color='inherit' onClick={handleOpen} edge='end'>
                    {
                        isLoggedIn
                            ? <Avatar
                                alt={displayName}
                                src={user.photoURL}
                                sx={{width: 32, height: 32}}
                            />
                            : <AccountCircleIcon sx={{width: 32, height: 32}}/>
                    }
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                sx={{
                    '.MuiMenuItem-root': {
                        minHeight: '36px', minWidth: '190px'
                    }
                }}
            >
                {
                    isLoggedIn &&
                    <div>
                        <MenuItem disabled>
                            <ListItemIcon>
                                <PersonIcon fontSize='small'/>
                            </ListItemIcon>
                            <ListItemText>{safeName}</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleClick('/profile')}>
                            <ListItemIcon>
                                <EditIcon/>
                            </ListItemIcon>
                            <ListItemText>My Profile</ListItemText>
                        </MenuItem>
                        {isAdmin &&
                            <MenuItem onClick={handleToggleAdmin}>
                                <ListItemIcon>
                                    <AdminPanelSettingsIcon color={adminEnabled ? 'success' : 'default'}/>
                                </ListItemIcon>
                                {adminEnabled
                                    ? <ListItemText>Disable Admin</ListItemText>
                                    : <ListItemText>Enable Admin</ListItemText>
                                }
                            </MenuItem>
                        }

                        <Divider/>

                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize='small'/>
                            </ListItemIcon>
                            <ListItemText>Sign Out</ListItemText>
                        </MenuItem>
                    </div>
                }
                {
                    !isLoggedIn &&
                    <div>
                        <MenuItem disabled>
                            <ListItemIcon>
                                <LibraryBooksIcon fontSize='small'/>
                            </ListItemIcon>
                            <ListItemText>Profile</ListItemText>
                        </MenuItem>
                        <Divider/>

                        <SignInButton onClick={handleClose}/>
                    </div>
                }
            </Menu>
        </React.Fragment>
    )
}

export default UserMenu
