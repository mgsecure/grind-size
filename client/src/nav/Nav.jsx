/* eslint-disable */

import React, {useCallback, useContext} from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import VersionChecker from '../app/VersionChecker'
import MainMenu from './MainMenu'
import ScrollToTopButton from './ScrollToTopButton'
import useWindowSize from '../util/useWindowSize.jsx'
import FilterContext from '../context/FilterContext.jsx'
import menuConfig from './menuConfig.jsx'
import {useLocation, useNavigate} from 'react-router-dom'
import {useTheme} from '@mui/material/styles'
import {Box, Stack, useScrollTrigger} from '@mui/material'
import Slide from '@mui/material/Slide'
import ScreenshotElementButton from '../psd/components/ScreenshotElementButton.jsx'
import AuthContext from '../app/AuthContext.jsx'

function Nav({extras, extrasTwo, title, titleMobile, contentRef}) {
    const {isAdmin} = useContext(AuthContext)
    const {isFiltered, clearAdvancedFilterGroups} = useContext(FilterContext)
    const theme = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const menuItem = menuConfig.find(item => item.title === title)

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
        color: theme.palette.text.primary, textDecoration: 'none', cursor: 'pointer'
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
        <div style={{marginBottom: isDesktop ? 0 : 16}}>
            <HideOnScroll>
                <AppBar position='fixed' sx={{boxShadow: 'none'}}>
                    <Toolbar style={{margin: '6px 0px', minHeight: 40, padding: '0px 12px'}}>
                        <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{width: '100%'}}>
                            <Box onClick={() => navigate('/')} sx={linkSx}
                                 style={{
                                     fontSize: isDesktop ? '1.5rem' : '1.4rem',
                                     fontWeight: 700,
                                     lineHeight: '1.2em',
                                     marginRight: 8
                                 }}>
                                COFFEE GRINDS
                                {!isDesktop && <br/>}
                                <span style={{fontWeight: 300}}> PARTICLE SIZE DISTRIBUTION</span>
                            </Box>
                            <div style={{display: 'flex', marginLeft: 'auto'}}>
                                {isAdmin && <ScreenshotElementButton domEl={contentRef} filename={`screenshot`}/> }
                                <VersionChecker/>
                                <MainMenu/>
                            </div>
                        </Stack>
                    </Toolbar>
                </AppBar>
            </HideOnScroll>

            {/* Dummy toolbar to help content place correctly below this */}
            <Toolbar style={{backgroundColor: 'transparent', marginTop: spacer, minHeight: 52}}/>

            <ScrollToTopButton/>
        </div>
    )
}

export default Nav
