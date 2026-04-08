import {useState, useEffect, useMemo} from 'react'
import {useTheme} from '@mui/material/styles'

export default function useWindowSize() {
    const theme = useTheme()
    const [width, setWidth] = useState(window.innerWidth)

    useEffect(() => {
        let timeoutId = null
        const delay = 250

        function handleResize() {
            setWidth(window.innerWidth)
        }

        function debouncedResize() {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(handleResize, delay)
        }

        window.addEventListener('resize', debouncedResize)

        return () => {
            window.removeEventListener('resize', debouncedResize)
            clearTimeout(timeoutId)
        }
    }, [])

    const isMobile = width < 650
    const isDesktop = width > 649

    const breakpointKeys = [...theme.breakpoints.keys].reverse()
    const breakpoint = breakpointKeys.find(key => width >= theme.breakpoints.values[key])

    return useMemo(() => ({
        width,
        breakpoint,
        isDesktop,
        isMobile,
        flexStyle: !isMobile ? 'flex' : 'block',
        columnStyle: !isMobile
            ? {display: 'flex', flexDirection: 'column'}
            : {display: 'flex', flexDirection: 'row'},
        rowStyle: !isMobile
            ? {display: 'flex', flexDirection: 'row'}
            : {display: 'flex', flexDirection: 'column'}
    }), [breakpoint, isDesktop, isMobile, width])
}