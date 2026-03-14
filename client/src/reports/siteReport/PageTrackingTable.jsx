import React, {useCallback, useContext} from 'react'
import DataTableSort from '../../misc/DataTableSort.jsx'
import useWindowSize from '../../util/useWindowSize'
import {useTheme} from '@mui/material/styles'
import DataContext from '../../context/DataContext.jsx'
import dayjs from 'dayjs'
import {setDeepAdd} from '../../util/setDeep.js'

const PageTrackingTable = () => {
    const theme = useTheme()
    const {siteStats} = useContext(DataContext)
    const {last28days} = siteStats

    const totals = {}
    const sortedDays = Object.keys(last28days)
        .sort((a, b) => {
            return dayjs(b).valueOf() - dayjs(a).valueOf()
        })
        .reduce((acc, date) => {
            Object.keys(last28days[date].pageViews || {})
                .filter(x => x !== 'undefined')
                .forEach(page => {
                setDeepAdd(totals, [page], last28days[date].pageViews[page])
            })
            setDeepAdd(totals, ['visitors'], last28days[date].visitors)
            setDeepAdd(totals, ['views'], last28days[date].totalPageViews)

            acc.push(
                {dateString: date,
                visitors: (last28days[date].visitors || 0),
                views: (last28days[date].totalPageViews || 0),
                ...last28days[date].pageViews})
            return acc
        }, [])
        .map(day => (day))
    const pageColumns = Object.keys(totals)
        .filter(x => x && x !== 'views' && x !== 'visitors')
        .sort((a, b) => totals[b] - totals[a])
        .map(page => ({id: page, name: page, align: 'center'}))
    const columns = [
        {id: 'dateString', name: 'Date', align: 'right'},
        {id: 'visitors', name: 'Visitors', align: 'center'},
        {id: 'views', name: 'Views', align: 'center'},
        ...pageColumns
    ]

    const tableData = {columns: columns, rows: [...sortedDays], showTotals: true, sortable: true}

    const linkFunction = useCallback((_id, string) => {
        return string
    }, [])

    const {ismobile} = useWindowSize()
    const fontSize = ismobile ? '0.8rem' : '0.95rem'
    const tableWidth = 800

    return (
        <div style={{border: `0px solid ${theme.palette.divider}`, borderRadius: 6}}>
            <DataTableSort
                tableData={tableData}
                tableHeight={undefined}
                tableWidth={tableWidth}
                fontSize={fontSize}
                linkFunction={linkFunction}/>
        </div>
    )
}

export default PageTrackingTable
