import React from 'react'
import usePageTitle from '../../util/usePageTitle'
import SiteReportPage from './SiteReportPage.jsx'
import Tracker from '../../app/Tracker.jsx'

export default function SiteReportRoute() {
    usePageTitle('Site Report')

    return (
        <>
            <SiteReportPage/>

            <Tracker feature='SiteReport'/>
        </>
    )
}

