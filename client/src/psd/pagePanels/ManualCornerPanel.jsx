import React, {useContext, useEffect, useRef} from 'react'
import {Paper} from '@mui/material'
import DataContext from '../../context/DataContext.jsx'
import UIContext from '../../context/UIContext.jsx'
import ManualCornerSelector from '../components/ManualCornerSelector.jsx'

export default function ManualCornerPanel() {

    const {
        manualSelectionId,
        manualSelectionUrl,
        handleManualCorners,
        cancelManual,
        settings,
        setSettings
    } = useContext(DataContext)

    const {isDesktop} = useContext(UIContext)

    const domRef = useRef(null)
    const scrolledRef = useRef(false)

    useEffect(() => {
        if (manualSelectionId && !scrolledRef.current) {
            scrolledRef.current = true
            domRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [manualSelectionId])

    return (
        <Paper sx={{p: isDesktop ? 2 : 1}} ref={domRef}>
            <ManualCornerSelector
                imageUrl={manualSelectionUrl}
                onCornersSelected={handleManualCorners}
                onCancel={cancelManual}
                templateSize={settings.templateSize}
                onTemplateSizeChange={(v) => setSettings(prev => ({...prev, templateSize: v}))}
            />
        </Paper>
    )
}
