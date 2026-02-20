import {useState, useEffect, useMemo} from 'react'

export default function useWindowSize() {
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

    return useMemo(() => ({
        width,
        isDesktop,
        isMobile,
        flexStyle: !isMobile ? 'flex' : 'block',
        columnStyle: !isMobile
            ? {display: 'flex', flexDirection: 'column'}
            : {display: 'flex', flexDirection: 'row'},
        rowStyle: !isMobile
            ? {display: 'flex', flexDirection: 'row'}
            : {display: 'flex', flexDirection: 'column'}
    }), [isDesktop, isMobile, width])
}