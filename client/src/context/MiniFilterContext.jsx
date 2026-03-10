import React, {useCallback, useMemo} from 'react'
import {useSearchParams} from 'react-router-dom'

const MiniFilterContext = React.createContext({})

export function MiniFilterProvider({children, filterFields = []}) {
    const [searchParams, setSearchParams] = useSearchParams()
    const filters = useMemo(() => {
        const keys = Array.from(searchParams.keys())
        return keys.reduce((acc, key) => {
            const value = searchParams.getAll(key)
            acc[key] = value.length === 1 ? value[0] : value
            return acc
        }, {})
    }, [searchParams])

    const setFilters = useCallback(newFilters => {
        Object.keys(newFilters)
            .forEach(key => {
                if (!newFilters[key]) {
                    delete newFilters[key]
                }
            })
        setSearchParams(newFilters, {replace: true})
    }, [setSearchParams])

    const addFilters = useCallback((keyValues, replace) => {
        keyValues.forEach(({key, value}) => {
            if (!value && replace) {
                searchParams.delete(key)
            } else if (value) {
                if (replace) {
                    if (Array.isArray(value)) {
                        searchParams.delete(key)
                        value.forEach(v => searchParams.append(key, v))
                    } else {
                        searchParams.set(key, value)
                    }
                } else {
                    if (searchParams.has(key)) {
                        searchParams.append(key, value)
                    } else {
                        searchParams.set(key, value)
                    }
                }
            } else if (!value) {
                searchParams.delete(key)
            }
        })
        setSearchParams(searchParams, {replace: true})
    }, [searchParams, setSearchParams])

    const addFilter = useCallback((keyToAdd, valueToAdd, replace) => {
        return addFilters([{key: keyToAdd, value: valueToAdd}], replace)
    }, [addFilters])

    const removeFilters = useCallback(keysToDelete => {
        keysToDelete.forEach(key => searchParams.delete(key))
        setSearchParams(searchParams, {replace: true})
    }, [searchParams, setSearchParams])

    const removeFilter = useCallback((keyToDelete, valueToDelete) => {
        const currentValue = searchParams.getAll(keyToDelete)

        searchParams.delete(keyToDelete)
        if (Array.isArray(currentValue) && currentValue.length > 1) {
            const newValue = currentValue.filter(value => value !== valueToDelete)
            newValue.forEach(v => searchParams.append(keyToDelete, v))
        }
        setSearchParams(searchParams, {replace: true})
    }, [searchParams, setSearchParams])

    const clearFilters = useCallback(() => {
        const {tab, sort} = filters
        setFilters({tab, sort})
    }, [filters, setFilters])

    const nonFilters = useMemo(() => [
        'id',
        'name',
        'search',
        'tab',
        'sort',
        'image',
        'locks',
        'debug',
        'preview',
        'single',
        'expandAll',
        'dataset',
        'scorecardId',
        'cId',
        'dsId',
        'addNew'
    ], [])

    const filterCount = useMemo(() => {
        const keys = Array.from(searchParams.keys())
        return keys.filter(key => !nonFilters.includes(key)).length
    }, [nonFilters, searchParams])

    const isSearch = !!filters?.search
    const isFiltered = (!!filters?.search || !!filters?.sort || filterCount > 0)

    const value = useMemo(() => ({
        filters,
        filterCount,
        addFilter,
        addFilters,
        removeFilter,
        removeFilters,
        setFilters,
        clearFilters,
        filterFields,
        filterFieldsByFieldName: filterFields.reduce((acc, value) => ({
            ...acc,
            [value.fieldName]: value
        }), {id: {label: 'ID'}}),
        isSearch,
        isFiltered,
        sort: filters.sort,
        nonFilters,
    }), [
        addFilter,
        addFilters,
        clearFilters,
        filterCount,
        filters,
        removeFilter,
        removeFilters,
        setFilters,
        filterFields,
        isSearch,
        isFiltered,
        nonFilters,
    ])

    return (
        <MiniFilterContext.Provider value={value}>
            {children}
        </MiniFilterContext.Provider>
    )
}


export default MiniFilterContext
