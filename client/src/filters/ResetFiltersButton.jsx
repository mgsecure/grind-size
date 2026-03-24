import CancelIcon from '@mui/icons-material/Cancel'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import React, {useCallback, useContext} from 'react'
import Button from '@mui/material/Button'
import useWindowSize from '../util/useWindowSize'
import FilterContext from '../context/FilterContext'
import {useTheme} from '@mui/material/styles'

export default function ResetFiltersButton({
                                               forceText,
                                               forceIcon,
                                               closeDrawer,
                                               alwaysShow,
                                               drawer = false,
                                               nav = false
                                           }) {
    const {isMobile} = useWindowSize()
    const {filterCount, clearFilters, clearAdvancedFilterGroups, setShowAdvancedSearch} = useContext(FilterContext)

    const handleReset = useCallback(() => {
        setShowAdvancedSearch(false)
        !clearAdvancedFilterGroups && clearFilters()
        clearAdvancedFilterGroups && clearAdvancedFilterGroups()
        closeDrawer && closeDrawer()
        window.scrollTo({top: 0, behavior: 'smooth'})
    }, [clearAdvancedFilterGroups, clearFilters, closeDrawer, setShowAdvancedSearch])

    const buttonVariant = drawer
        ? 'text'
        : nav
            ? 'text'
            : 'outlined'

    const buttonStyle = nav
        ? {marginLeft: 2}
        : {height: 28, padding: '0px 12px', minWidth: 80, marginLeft: 8}

    const ariaLabel = nav ? 'Reset All Filters' : 'Reset Filters'

    const theme = useTheme()
    let buttonColor = theme.palette.warning.main
    if (nav && theme.palette.mode === 'light') buttonColor = '#fc923c'

    if (filterCount === 0 && !alwaysShow) return null
    if ((isMobile && !forceText) || forceIcon) {
        return (
            <Tooltip title='Reset All' arrow disableFocusListener>
                <IconButton onClick={handleReset} style={{padding: 0, color: buttonColor}}>
                    <CancelIcon/>
                </IconButton>
            </Tooltip>
        )
    } else {
        return (
            <Button variant={buttonVariant} color='warning' onClick={handleReset}
                    style={{...buttonStyle, color: buttonColor}} aria-label={ariaLabel}>
                Reset
            </Button>
        )
    }
}