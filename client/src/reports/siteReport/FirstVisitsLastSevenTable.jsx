import React, {useCallback, useContext} from 'react'
import useWindowSize from '../../util/useWindowSize'
import DataTableSort from '../../misc/DataTableSort.jsx'
import dayjs from 'dayjs'
import DataContext from '../../context/DataContext.jsx'

const FirstVisitsLastSevenTable = () => {
    const {siteStats, countryCodeCountries} = useContext(DataContext)
    const {firstVisit} = siteStats

    let _countryCount = 0
    const firstVistsLastSevenDays = Object.keys(firstVisit).map((country) => {
        if (dayjs(firstVisit[country]).isAfter(dayjs().subtract(7, 'day'))) {
            _countryCount++
            return {
                country: countryCodeCountries[country].name,
                firstVisit: firstVisit[country],
                visitors: siteStats.visitorsByCountry[country]
            }
        }
    })
        .sort((a, b) => {
            return dayjs(a.firstVisit).valueOf() - dayjs(b.firstVisit).valueOf()
                || a.country.localeCompare(b.country)
        })
        .filter(x => x)

    const tableData = {title: ''}
    const columns = [
        ['country', 'Country', 'left'],
        ['firstVisit', 'First Visit', 'center'],
        ['visitors', 'Visitors', 'center']
    ]
    tableData.columns = columns.map(col => ({id: col[0], name: col[1], align: col[2]}))
    tableData.rows = firstVistsLastSevenDays

    const linkFunction = useCallback((_id, string) => {
        return string
    }, [])

    const {ismobile} = useWindowSize()
    const fontSize = ismobile ? '0.8rem' : '0.95rem'
    const tableWidth = 500

    return (
        <DataTableSort
            tableData={tableData}
            tableWidth={tableWidth}
            fontSize={fontSize}
            linkFunction={linkFunction}/>
    )
}

export default FirstVisitsLastSevenTable
