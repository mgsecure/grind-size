import React from 'react'
import useWindowSize from '../../util/useWindowSize'
import SiteTraffic28DaysLine from './SiteTraffic28DaysLine.jsx'

function SiteTrafficSummary() {


    const {isMobile} = useWindowSize()
    const divStyle = {
        width: '100%', padding: '0px', marginBottom: 12, alignItems: 'center',
        marginLeft: 'auto', marginRight: 'auto'
    }
    const divFlexStyle = !isMobile ? {display: 'flex'} : {}
    const combinedDivStyle = {
        ...divStyle,
        ...divFlexStyle
    }

    const height = isMobile ? 300 : 450

    return (
        <React.Fragment>
            <div style={{textAlign: 'center'}}>
                <div style={combinedDivStyle}>
                    <SiteTraffic28DaysLine height={height}/>
                </div>
            </div>
        </React.Fragment>
    )
}

export default SiteTrafficSummary
