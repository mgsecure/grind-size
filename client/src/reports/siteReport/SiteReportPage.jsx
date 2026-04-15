import React, {useContext} from 'react'
import DataContext from '../../context/DataContext.jsx'
import LoadingDisplay from '../../misc/LoadingDisplay.jsx'
import dayjs from 'dayjs'
import FirstVisitsLastSevenTable from './FirstVisitsLastSevenTable.jsx'
import PageTrackingTable from './PageTrackingTable.jsx'
import SiteTraffic28DaysLine from './SiteTraffic28DaysLine.jsx'

export default function SiteReportPage() {
    const {siteStats = {}, loading, error} = useContext(DataContext)
    const firstVisitCount = Object.entries(siteStats?.firstVisit || {}).filter(([_key, value]) => dayjs(value).isAfter(dayjs().subtract(7, 'day')))?.length

    const updateTime = loading ? '--'
        : '(updated: ' + dayjs(siteStats?.metadata?.updatedDateTime).format('MM/DD/YY hh:mm') + ')'

    const firstHeaderStyle = {
        margin: '26px 0px 8px 0px',
        width: '100%',
        textAlign: 'center',
        fontSize: '1.3rem',
        fontWeight: 700
    }
    const headerStyle = {
        margin: '46px 0px 18px 0px',
        width: '100%',
        textAlign: 'center',
        color: '#fff',
        fontSize: '1.3rem',
        fontWeight: 700
    }

    if (loading) return <LoadingDisplay/>
    else if (error) return null

    return (
        <React.Fragment>

            <div style={{fontSize: '1.7rem', fontWeight: 700, marginTop: 10}}>Site Report</div>
            <span style={{fontSize: '0.8rem', marginTop: 0}}>{updateTime}</span>

            {firstVisitCount > 0 &&
                <div style={{marginBottom: 16}}>
                    <div style={firstHeaderStyle}>First Visits (Last Seven Days)</div>
                    <FirstVisitsLastSevenTable/>
                </div>
            }

            <div style={firstHeaderStyle}>Traffic Summary</div>
            <SiteTraffic28DaysLine/>

            <div style={headerStyle}>Page Tracking</div>
            <PageTrackingTable/>

        </React.Fragment>
    )
}