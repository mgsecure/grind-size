import React from 'react'
import usePageTitle from '../../util/usePageTitle'
import SampleImagesPage from './SampleImagesPage.jsx'

export default function SampleImagesRoute() {
    usePageTitle('Sample Images')
    return (
            <SampleImagesPage />
    )
}
