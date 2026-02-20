import IconButton from '@mui/material/IconButton'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import React, {useCallback} from 'react'
import html2canvas from 'html2canvas'

export default function ScreenshotElementButton({domEl, filename, disabled}) {

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

    return (
        <IconButton size='small' onClick={downloadImage} disabled={disabled}>
            <CameraAltIcon />
        </IconButton>
    )
}
