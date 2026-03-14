import React from 'react'
import usePageTitle from '../util/usePageTitle'
import PrivacyPage from './PrivacyPage'

function PrivacyRoute() {
    usePageTitle('Privacy Policy')

    return (
        <React.Fragment>

            <PrivacyPage/>

        </React.Fragment>
    )
}

export default PrivacyRoute
