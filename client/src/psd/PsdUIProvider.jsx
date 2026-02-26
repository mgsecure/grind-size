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
        queue, activeIdList, aggregateQueueItem
    } = useContext(DataContext)

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
    const currentColors = useMemo(() => reverseColors
            ? [...swappedColors, ...swappedColors]
            : [...allColors, ...allColors]
        , [reverseColors, allColors, swappedColors])

    const aggregateColor = useMemo(() => theme.palette.mode === 'dark' ? '#eeee33' : '#eeee33'
        , [theme.palette.mode])

    const validIdList = useMemo(() => queue
        .filter(item => (item.status === 'done' && item.id !== aggregateQueueItem?.id))
        .map(item => item.id), [aggregateQueueItem?.id, queue])

    const chartColors = useMemo(() => {
            const sampleColors = validIdList.map((id, index) => {
                const color = currentColors[index]
                if (queue.find(item => item.id === id) && activeIdList.includes(id)) return color
            }).filter(c => c)
            return [...sampleColors, aggregateColor]
        }, [queue, activeIdList, aggregateColor, currentColors, validIdList])

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
        aggregateColor
    ])

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    )
}
