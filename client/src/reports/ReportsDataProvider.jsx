import React, {useMemo} from 'react'
import DataContext from '../context/DataContext.jsx'
import dayjs from 'dayjs'
import minMax from 'dayjs/plugin/minMax'
import useData from '../util/useData.jsx'
import {countryCodeCountries} from '../data/countryCodeCountries'

dayjs.extend(minMax)

export function ReportsDataProvider({children, profile}) {

    const {data: siteStats, loading, error} = useData({url: '/data/statsSiteFull.json'})

    const grinderList = useMemo(() => {
        return (profile.equipment?.filter(e => e.type === 'Grinder') || [])
            .sort((a, b) => a.fullName.localeCompare(b.fullName))
    }, [profile.equipment])

    const value = useMemo(() => ({
        grinderList,
        siteStats,
        loading,
        error,
        countryCodeCountries
    }), [grinderList, siteStats, loading, error])

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    )
}

export default ReportsDataProvider

function _getUniqueObjectsByKey(arr, key) {
    const uniqueIds = new Set()
    return arr.filter(item => {
        if (!uniqueIds.has(item[key])) {
            uniqueIds.add(item[key])
            return true
        }
        return false
    })
}
