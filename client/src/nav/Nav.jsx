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
import {useTheme} from '@mui/material/styles'
import {Paper, Stack, Typography, useScrollTrigger} from '@mui/material'
import Slide from '@mui/material/Slide'
import PropTypes from 'prop-types'

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

    const {isDesktop, isMobile, width} = useWindowSize()
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

    function HideOnScroll({children}) {
        const trigger = useScrollTrigger()
        return (
            <Slide appear={false} direction='down' in={!trigger}>
                {children ?? <div/>}
            </Slide>
        )
    }

    return (
        <React.Fragment>
            <HideOnScroll>
                <AppBar position='fixed' sx={{boxShadow: 'none'}}>
                    <Toolbar style={{margin: '6px 0px', minHeight: 40, padding: '0px 12px'}}>
                        <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{width: '100%'}}>
                            <div style={{
                                fontSize: isDesktop ? '1.5rem' : '1.4rem',
                                fontWeight: 700,
                                lineHeight: '1.2em',
                                marginRight: 8
                            }}>
                                COFFEE GRINDS
                                {!isDesktop && <br/>}
                                <span style={{fontWeight: 300}}> PARTICLE SIZE DISTRIBUTION</span>
                            </div>
                            <VersionChecker/>
                            <MainMenu/>

                        </Stack>
                    </Toolbar>
                </AppBar>
            </HideOnScroll>
            {/* Dummy toolbar to help content place correctly below this */}
            <Toolbar style={{backgroundColor: 'transparent', marginTop: spacer}}/>

            <ScrollToTopButton/>
        </React.Fragment>
    )
}

export default Nav
