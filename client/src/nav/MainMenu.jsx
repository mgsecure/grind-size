import React, {useCallback, useContext, useState} from 'react'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import Tooltip from '@mui/material/Tooltip'
import AppContext from '../app/AppContext'
import DBContext from '../app/DBContext'
import MainMenuItem from './MainMenuItem'
import menuConfig from './menuConfig.jsx'
import AuthContext from '../app/AuthContext.jsx'
import CloseIcon from '@mui/icons-material/Close'

function MainMenu() {
    const {beta} = useContext(AppContext)
    const {adminRole} = useContext(DBContext)
    const {userClaims} = useContext(AuthContext)
    const [open, setOpen] = useState(false)

    const openDrawer = useCallback(() => {
        setOpen(true)
        // Clear current focus to prevent weird issues on mobile
        document.activeElement.blur()
    }, [])
    const closeDrawer = useCallback(() => {
        document.activeElement.blur()
        document.body.focus()
        setOpen(false)
    }, [])

    return (
        <React.Fragment>
            <Tooltip title='Main Menu' arrow disableFocusListener>
                <IconButton onClick={openDrawer}
                            style={{
                                marginLeft: '0px',
                                marginTop: 0
                            }}
                >
                    <MenuIcon style={{color: '#bbb'}}/>
                </IconButton>
            </Tooltip>

            <SwipeableDrawer
                anchor='right'
                open={open}
                onOpen={openDrawer}
                onClose={closeDrawer}
                disableRestoreFocus
            >
                <Stack direction='column' style={{minWidth: 250}}>
                    <MenuItem onClick={closeDrawer} style={{
                        justifyContent: 'right',
                        padding: '6px 12px'
                    }}>
                        <IconButton onClick={openDrawer}
                                    style={{
                                        marginLeft: '0px',
                                        marginTop: 0
                                    }}
                        >
                            <CloseIcon style={{color: '#bbb'}}/>
                        </IconButton>
                    </MenuItem>
                    <Divider style={{margin: 0}}/>

                    {menuConfig
                        .filter(menuItem => beta || !menuItem.beta)
                        .filter(menuItem => adminRole || !menuItem.admin)
                        .filter(menuItem => !menuItem.hidden)
                        .filter(menuItem =>
                            !(menuItem.userClaims && !menuItem.userClaims?.some(claim => userClaims?.includes(claim)))
                        )
                        .map((menuItem, index) =>
                            <React.Fragment key={index}>
                                <MainMenuItem
                                    menuItem={menuItem}
                                    onClose={closeDrawer}
                                />
                                <Divider style={{margin: 0}}/>
                            </React.Fragment>
                        )}
                </Stack>
            </SwipeableDrawer>
        </React.Fragment>
    )
}

export default MainMenu
