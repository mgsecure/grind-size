import React from 'react'
import usePageTitle from '../../util/usePageTitle'
import PsdExamplesPage from './PsdExamplesPage.jsx'

export default function PsdRoute() {
    usePageTitle('PSD Examples')
    return (
            <PsdExamplesPage />
    )
}
