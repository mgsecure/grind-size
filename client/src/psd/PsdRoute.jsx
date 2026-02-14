import React, {useMemo, useState} from 'react'
import usePageTitle from '../util/usePageTitle'
import PsdPage from './PsdPage.jsx'
import {PSD_DEFAULTS} from '@starter/shared'

export default function PsdRoute() {
    usePageTitle('Grind Size (PSD)')

    const [settings, setSettings] = useState({
        templateSize: 100,
        ...PSD_DEFAULTS,
        maxAreaMm2: 10,
        splitOverlaps: false,
        splitSensitivity: 0.5
    })

    const value = useMemo(() => ({settings, setSettings}), [settings])

    return (
        <PsdPage settings={value.settings} setSettings={value.setSettings}/>
    )
}
