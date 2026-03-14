import React, {useCallback, useContext} from 'react'
import useWindowSize from '../../util/useWindowSize'
import dayjs from 'dayjs'
import DataTableSort from '../../misc/DataTableSort.jsx'
import DataContext from '../../context/DataContext.jsx'
import {useTheme} from '@mui/material/styles'

const SiteTraffic28DaysTable = ({height}) => {
    const theme = useTheme()
    const {siteStats} = useContext(DataContext)
    const {last28days} = siteStats

    const trafficLast28days = Object.keys(last28days).map((date) => {
        const thisDate = dayjs(date, 'YYYY-MM-DD')
        const weekend = (thisDate.day() === 0 || thisDate.day() === 6) ? 1 : 0
        return {
            weekend: weekend,
            date: date,
            dateString: thisDate.format('MM/DD'),
            visitors: last28days[date].visitors || 0,
            pageViews: last28days[date].pageViews?.total || 0
        }
    })

    const tableData = {title: ''}
    const columns = [
        //['weekend', 'Weekend', 'hidden'],
        ['date', 'Date', 'left'],
        ['dateString', 'Date', 'left'],
        ['visitors', 'Visitors', 'center'],
        ['pageViews', 'Views', 'center']
    ]
    tableData.columns = columns.map(col => ({id: col[0], name: col[1], align: col[2]}))
    tableData.rows = trafficLast28days

    const linkFunction = useCallback((_id, string) => {
        return string
    }, [])

    const {ismobile} = useWindowSize()
    const fontSize = ismobile ? '0.8rem' : '0.95rem'
    const tableWidth = 265

    return (
        <div style={{border: `0px solid ${theme.palette.divider}`, borderRadius: 6}}>
            <DataTableSort
                tableData={tableData}
                tableHeight={height}
                tableWidth={tableWidth}
                fontSize={fontSize}
                linkFunction={linkFunction}/>
        </div>
    )
}

export default SiteTraffic28DaysTable
