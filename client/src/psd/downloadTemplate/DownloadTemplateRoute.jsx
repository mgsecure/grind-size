import React from 'react'
import usePageTitle from '../../util/usePageTitle'
import DownloadTemplatePage from './DownloadTemplatePage.jsx'

export default function DownloadTemplateRoute() {
    usePageTitle('Download Template')
    return (
            <DownloadTemplatePage />
    )
}
