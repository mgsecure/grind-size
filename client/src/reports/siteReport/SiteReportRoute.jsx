import React from 'react'
import usePageTitle from '../../util/usePageTitle'
import SiteReportPage from './SiteReportPage.jsx'
import useWindowSize from '../../util/useWindowSize.jsx'
import Nav from '../../nav/Nav.jsx'
import Tracker from '../../app/Tracker.jsx'
import Footer from '../../nav/Footer.jsx'

export default function SiteReportRoute() {
    usePageTitle('Site Report')
    const {isMobile} = useWindowSize()

    const extras = (
        <React.Fragment>
            {!isMobile && <div style={{flexGrow: 1, minWidth: '10px'}}/>}
        </React.Fragment>
    )

    const footerBefore = (
        <></>
    )

    return (
        <>
            <Nav title='Reports' titleMobile='Reports' extras={extras}/>

            <SiteReportPage/>

            <Tracker feature='reports'/>
            <Footer before={footerBefore}/>
        </>
    )
}

