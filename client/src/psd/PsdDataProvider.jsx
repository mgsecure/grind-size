import React, {useCallback, useMemo, useState} from 'react'
import DataContext from '../context/DataContext.jsx'
import {useTheme} from '@mui/material/styles'

export function PsdDataProvider({children}) {
    const theme = useTheme()

    const allColors = useMemo(() => theme.palette.mode === 'dark'
        ? ['#a6cee3', '#1f78b4', '#e8c1a0', '#f47560', '#b2df8a', '#33a02c']
        : ['#a6cee3', '#1f78b4', '#e8c1a0', '#f47560', '#b2df8a', '#33a02c']
        , [theme.palette.mode])

    const swappedColors = useMemo(() => theme.palette.mode === 'dark'
        ? ['#1f78b4', '#a6cee3',  '#f47560', '#e8c1a0',   '#33a02c', '#b2df8a']
        : ['#1f78b4', '#a6cee3',  '#f47560', '#e8c1a0',   '#33a02c', '#b2df8a']
        , [theme.palette.mode])

    const aggregateColor = theme.palette.mode === 'dark' ? '#eeee33' : '#eeee33'

    const [reverseColors, setReverseColors] = useState(false)
    const swapColors = useCallback(() => setReverseColors(!reverseColors), [reverseColors])

    const value = useMemo(() => ({
        allColors,
        swappedColors,
        aggregateColor,
        reverseColors,
        swapColors
    }), [allColors, swappedColors, aggregateColor, reverseColors, swapColors])

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    )
}

export default PsdDataProvider
