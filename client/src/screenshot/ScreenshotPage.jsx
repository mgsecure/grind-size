import React from 'react'
import usePageTitle from '../util/usePageTitle.jsx'
import Tracker from '../app/Tracker.jsx'
import {Image} from 'mui-image'

export default function ScreenshotPage() {
    usePageTitle('Screenshot')

    return (
        <React.Fragment>

            <Image src='/i/screenshotFull.png' alt='coffee-grind.com screenshot' sx={{maxWidth: 1061}}/>

            <Tracker feature='Screenshot'/>

        </React.Fragment>
    )
}
