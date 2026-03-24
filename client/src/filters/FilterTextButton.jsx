import React, {useCallback, useContext, useState} from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Tooltip from '@mui/material/Tooltip'
import Badge from '@mui/material/Badge'
import AuthContext from '../app/AuthContext'
import FilterContext from '../context/FilterContext'
import FilterByField from './FilterByField'
import Stack from '@mui/material/Stack'
import ClearFiltersButton from './ClearFiltersButton'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import AppContext from '../app/AppContext'
import {useHotkeys} from 'react-hotkeys-hook'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import useWindowSize from '../util/useWindowSize.jsx'

function FilterTextButton({onFiltersChanged}) {

    const {isLoggedIn} = useContext(AuthContext)
    const {beta} = useContext(AppContext)
    const {filterCount, addFilters, filterFields} = useContext(FilterContext)

    const [open, setOpen] = useState(false)
    const handleHotkey = useCallback(() => setOpen(!open), [open])
    useHotkeys('f', handleHotkey)

    const handleAddFilter = useCallback((keyToAdd, valueToAdd) => {
        addFilters([
            {key: keyToAdd, value: valueToAdd},
            {key: 'id', value: undefined},
            {key: 'name', value: undefined}
        ], true)
        onFiltersChanged && onFiltersChanged()
    }, [addFilters, onFiltersChanged])

    const openDrawer = useCallback(() => setOpen(true), [])
    const closeDrawer = useCallback(() => setOpen(false), [])


    const {width} = useWindowSize()
    const smallWidth = width <= 500

    return (
        <React.Fragment>
            <Tooltip title='Filter' arrow disableFocusListener>
                <Button color='inherit' onClick={openDrawer} style={{color: '#ddd'}}>
                    <Badge
                        variant='dot'
                        badgeContent={filterCount}
                        color='secondary'
                        anchorOrigin={{vertical: 'top', horizontal: 'right'}}
                    >
                        {!smallWidth ? 'FILTER' : <FilterAltIcon/>}
                    </Badge>
                </Button>
            </Tooltip>

            {open &&
                <Drawer
                    anchor='right'
                    open={open}
                    onClose={closeDrawer}
                >
                    <Toolbar variant='dense' onClick={closeDrawer} style={{padding: '8px 0px 0px 8px'}}>
                        <div style={{fontSize: '1.3rem', fontWeight: 700}}>Filters</div>
                    </Toolbar>

                    <Box margin={1}>
                        <Stack direction='column' style={{minWidth: 250}}>
                            {filterFields
                                .filter(field => {
                                    return (!field.beta || beta) && (!field.userBased || isLoggedIn)
                                })
                                .map((field, index) =>
                                    <FilterByField
                                        key={index}
                                        {...field}
                                        onFilter={handleAddFilter}
                                    />
                                )}
                        </Stack>
                    </Box>
                    <div style={{padding: 8}}>
                        <ClearFiltersButton forceText/>
                        <Button
                            variant='outlined'
                            color='inherit'
                            onClick={closeDrawer}
                        >
                            Done
                        </Button>
                    </div>
                </Drawer>
            }
        </React.Fragment>
    )
}

export default FilterTextButton

