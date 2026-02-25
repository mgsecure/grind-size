import {useTheme} from '@mui/material/styles'
import useWindowSize from '../util/useWindowSize.jsx'
import UIContext from '../context/UIContext.jsx'
import React, {useCallback, useContext, useMemo, useState} from 'react'
import DataContext from '../context/DataContext.jsx'

const altButtonColor = '#6b92b8'

export default function PsdUIProvider({children}) {
    const theme = useTheme()
    const {isDesktop, isMobile} = useWindowSize()
    const {
        allItems, activeIdList
    } = useContext(DataContext)

    const validIdList = useMemo(() => allItems
        .filter(item => (item.status === 'done' && !item.id?.includes('aggregateResults')))
        .map(item => item.id), [allItems])

    const validActiveIdList = useMemo(() => validIdList.filter(id => activeIdList.includes(id)), [validIdList, activeIdList])

    const [reverseColors, setReverseColors] = useState(false)
    const swapColors = useCallback(() => setReverseColors(!reverseColors), [reverseColors])

    const allColors = useMemo(() => theme.palette.mode === 'dark'
            ? ['#a6cee3', '#1f78b4', '#e8c1a0', '#f47560', '#b2df8a', '#33a02c']
            : ['#a6cee3', '#1f78b4', '#e8c1a0', '#f47560', '#b2df8a', '#33a02c']
        , [theme.palette.mode])
    const swappedColors = useMemo(() => theme.palette.mode === 'dark'
            ? ['#1f78b4', '#a6cee3', '#f47560', '#e8c1a0', '#33a02c', '#b2df8a']
            : ['#1f78b4', '#a6cee3', '#f47560', '#e8c1a0', '#33a02c', '#b2df8a']
        , [theme.palette.mode])
    const currentColors = reverseColors ? swappedColors : allColors
    const aggregateColor = theme.palette.mode === 'dark' ? '#eeee33' : '#eeee33'

    const chartColors = useMemo(() => [...currentColors.slice(0, validActiveIdList.length), aggregateColor]
        ,[currentColors, validActiveIdList.length, aggregateColor])

    const value = useMemo(() => ({
        theme,
        isDesktop,
        isMobile,
        chartColors,
        swapColors,
        aggregateColor,
        altButtonColor
    }), [
        theme,
        isDesktop,
        isMobile,
        chartColors,
        swapColors,
        aggregateColor,
    ])

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    )
}
