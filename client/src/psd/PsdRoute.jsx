import React from 'react'
import usePageTitle from '../util/usePageTitle'
import PsdPage from './PsdPage.jsx'

export default function PsdRoute() {
    usePageTitle('Grind Size (PSD)')
    console.log('Grind Size PSD Loading')

    return (
            <PsdPage />
    )
}
