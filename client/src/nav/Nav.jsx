import React, {useCallback, useContext} from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import VersionChecker from '../app/VersionChecker'
import MainMenu from './MainMenu'
import ScrollToTopButton from './ScrollToTopButton'
import UserMenu from './UserMenu'
import useWindowSize from '../util/useWindowSize.jsx'
import FilterContext from '../context/FilterContext.jsx'
import menuConfig from './menuConfig.jsx'
import {useLocation, useNavigate} from 'react-router-dom'
import Link from '@mui/material/Link'
import {useTheme} from '@mui/material/styles'

function Nav({extras, extrasTwo, title, titleMobile}) {
    const {isFiltered, clearAdvancedFilterGroups} = useContext(FilterContext)
    const theme = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const menuItem = menuConfig.find(item => item.title === title)
    const isRootPath = location.pathname === menuItem?.path && ['', '?tab=White'].includes(location.search)

    const handleClickTitle = useCallback(() => {
        clearAdvancedFilterGroups()
        menuItem?.path && navigate(menuItem.path)
    }, [clearAdvancedFilterGroups, menuItem?.path, navigate])

    const {isMobile, width} = useWindowSize()
    const smallWidth = width <= 500
    const spacer = isMobile
        ? extrasTwo
            ? 20
            : 6
        : 0

    const flexStyle = !isMobile ? 'flex' : 'block'
    const linkSx = {
        color: theme.palette.text.primary, textDecoration: 'none', cursor: 'pointer', '&:hover': {
            textDecoration: 'underline'
        }
    }

    return (
        <React.Fragment>
            <AppBar position='fixed' sx={{boxShadow: 'none'}}>
                <Toolbar style={{marginTop: 6, minHeight: 40}}>
                    <div style={{display: flexStyle, width: '100%'}}>
                        <div style={{display: 'flex', flexGrow: 1, marginBottom: 8}}>
                            <MainMenu/>
                            <VersionChecker/>
                            <div style={{
                                flexGrow: 1,
                                fontWeight: 500,
                                fontSize: '1.5rem',
                                paddingLeft: 8,
                                paddingRight: 16,
                                marginTop: 6
                            }} role='heading' aria-label={title}>
                                {(!isFiltered || !smallWidth) &&
                                    <React.Fragment>
                                        {menuItem && !isRootPath
                                            ?
                                            <Link onClick={handleClickTitle} style={{color: theme.palette.text.primary, whiteSpace: 'nowrap'}} sx={linkSx}>
                                                {isMobile ? titleMobile : title}
                                            </Link>
                                            : <div style={{whiteSpace: 'nowrap'}}>{isMobile ? titleMobile : title}</div>
                                        }
                                    </React.Fragment>
                                }
                            </div>
                            {extras}

                            {!isMobile && extrasTwo &&
                                extrasTwo
                            }
                            <UserMenu/>
                        </div>
                        {isMobile && extrasTwo &&
                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                {extrasTwo}
                            </div>
                        }
                    </div>
                </Toolbar>
            </AppBar>

            {/* Dummy toolbar to help content place correctly below this */}
            <Toolbar style={{backgroundColor: 'transparent', marginTop: spacer}}/>

            <ScrollToTopButton/>
        </React.Fragment>
    )
}

export default Nav
