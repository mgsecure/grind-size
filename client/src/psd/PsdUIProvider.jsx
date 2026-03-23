import {useTheme} from '@mui/material/styles'
import useWindowSize from '../util/useWindowSize.jsx'
import UIContext from '../context/UIContext.jsx'
import React, {useCallback, useContext, useMemo, useState} from 'react'
import DataContext from '../context/DataContext.jsx'
import {useLocalStorage} from 'usehooks-ts'

const altButtonColor = '#6b92b8'
const defaultImageViewMode = 'mask'

export default function PsdUIProvider({children}) {
    const theme = useTheme()
    const {isDesktop, isMobile} = useWindowSize()
    const {
        queue, activeIdList, aggregateQueueItem
    } = useContext(DataContext)

    const [isScreenshot, setIsScreenshot] = useState(false)
    const [imageViewMode, setImageViewMode] = useState(defaultImageViewMode) // original | mask | overlay | diagnostic
    const [chartTitle, setChartTitle] = useState(undefined)

    const [colorSwatches, setColorSwatches] = useLocalStorage('psd-colors', ['#bd1fff', '#00b', '#b00', '#0b0'])

    const [reverseColors, setReverseColors] = useState(false)
    const swapColors = useCallback(() => setReverseColors(prev => !prev), [])

    const allColors = useMemo(() => theme.palette.mode === 'dark'
            ? ['#a6cee3', '#038be6', '#f7a65f', '#ff3916',
                '#b2df8a', '#33a02c']
            : ['#5eb9e3', '#038be6', '#ffb670', '#ff3916',
                '#8ad743', '#0fad04']
        , [theme.palette.mode])
    const swappedColors = useMemo(() => theme.palette.mode === 'dark'
            ? ['#038be6', '#a6cee3', '#ff3916', '#f7a65f',
                '#33a02c', '#b2df8a']
            : ['#038be6', '#5eb9e3', '#ff3916', '#ffb670',
                '#0fad04', '#8ad743']
        , [theme.palette.mode])
    const currentColors = useMemo(() => reverseColors
            ? [...swappedColors, ...swappedColors]
            : [...allColors, ...allColors]
        , [reverseColors, allColors, swappedColors])

    const aggregateColor = useMemo(() => theme.palette.mode === 'dark' ? '#eeee33' : '#eeee33'
        , [theme.palette.mode])

    const notErrorIdList = useMemo(() => queue
        .filter(item => (item.status !== 'error' && item.id !== aggregateQueueItem?.id))
        .map(item => item.id), [aggregateQueueItem?.id, queue])

    const chartColors = useMemo(() => {
        const sampleColors = notErrorIdList.map((id, index) => {
            const color = currentColors[index]
            if (queue.find(item => item.id === id) && activeIdList.includes(id)) return color
        }).filter(c => c)
        return [...sampleColors, aggregateColor]
    }, [notErrorIdList, aggregateColor, currentColors, queue, activeIdList])

    const [customSampleParams, setCustomSampleParams] = useState({})

    const resetUIContext = useCallback(() => {
        setCustomSampleParams({})
        setImageViewMode(defaultImageViewMode)
        setIsScreenshot(false)
        setChartTitle(undefined)
        setReverseColors(false)
    }, [])

    const value = useMemo(() => ({
        resetUIContext,
        theme,
        isDesktop,
        isMobile,
        currentColors,
        chartColors,
        swapColors,
        aggregateColor,
        altButtonColor,
        notErrorIdList,
        isScreenshot, setIsScreenshot,
        imageViewMode, setImageViewMode,
        customSampleParams, setCustomSampleParams,
        colorSwatches, setColorSwatches,
        chartTitle, setChartTitle
    }), [
        resetUIContext,
        theme,
        isDesktop,
        isMobile,
        currentColors,
        chartColors,
        swapColors,
        aggregateColor,
        notErrorIdList,
        isScreenshot, setIsScreenshot,
        imageViewMode, setImageViewMode,
        customSampleParams, setCustomSampleParams,
        colorSwatches, setColorSwatches,
        chartTitle, setChartTitle
    ])

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    )
}
