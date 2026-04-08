import React from 'react'
import usePageTitle from '../util/usePageTitle'
import PsdUploadPage from './PsdUploadPage.jsx'

export default function PsdRoute() {
    usePageTitle('Upload Images')
    return (
            <PsdUploadPage />
    )
}
