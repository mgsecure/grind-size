import IconButton from '@mui/material/IconButton'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import React, {useCallback, useContext} from 'react'
import html2canvas from 'html2canvas'
import DataContext from '../../context/DataContext.jsx'
import {useHotkeys} from 'react-hotkeys-hook'

export default function ScreenshotElementButton({domEl, filename, disabled}) {

    const {setShowTitleBar} = useContext(DataContext)

    const downloadImage = useCallback(async () => {
        if (!domEl.current) return
        const canvas = await html2canvas(domEl.current)
        const dataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `${filename.replace(/[^a-zA-Z0-9]/g, '_')}.png`
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }, [domEl, filename])

    const takeScreenshot = useCallback(async () => {
        if (!domEl.current) return
        setShowTitleBar(true)

        setTimeout(() => {
            downloadImage()
            setShowTitleBar(false)
        }, 100)

    }, [domEl, downloadImage, setShowTitleBar])

    useHotkeys('s', () => takeScreenshot())

    return (
        <IconButton size='small' onClick={takeScreenshot} disabled={disabled}>
            <CameraAltIcon/>
        </IconButton>
    )
}
