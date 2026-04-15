import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {useInterval, useLocalStorage} from 'usehooks-ts'
import dayjs from 'dayjs'

const AppContext = React.createContext({})

export function AppProvider({children}) {

    const [adminEnabled, setAdminEnabled] = useLocalStorage('adminEnabled', false)
    const [useTracker, setUseTracker] = useLocalStorage('useTracker', false)
    const [beta, setBeta] = useLocalStorage('beta', false)

    const handleSetAdmin = useCallback(value => {
        setAdminEnabled(value)
    }, [setAdminEnabled])

    const handleSetUseTracker = useCallback(value => {
        setUseTracker(value)
    }, [setUseTracker])

    const handleSetBeta = useCallback(value => {
        setBeta(value)
    }, [setBeta])

    const [initial, setInitial] = useState()
    const [version, setVersion] = useState()
    const [initalMinVersion, setInitialMinVersion] = useState()
    const [updateRequired, setUpdateRequired] = useState(false)
    const [error, setError] = useState(false)
    const updateAvailable = !!(initial && version && initial !== version)

    const checkVersion = async first => {
        try {
            const response = await fetch('/version.json', {cache: 'no-cache'})
            const {version: newVersion, minVersion} = (await response.json())

            if (first) {
                setInitial(newVersion)
                setInitialMinVersion(minVersion)
            } else if (version !== newVersion || minVersion !== initalMinVersion) {
                setVersion(newVersion)
                setInitialMinVersion(minVersion)
            }
        } catch (e) {
            console.error('Unable to check version.', e)
            setError(true)
        }
    }

    useEffect(() => {
        checkVersion(true).then()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const multiplier = 60 // set to 1 for testing, 60 for production
    useInterval(checkVersion, 10 * multiplier * 1000) // 10 * 60 * 1000 = 10 minutes

    if (!error
        && (initial && version && initalMinVersion
            && dayjs(initial) < dayjs(version)
            && dayjs(initial) < dayjs(initalMinVersion))
    ) {
        setTimeout(() => {
            setUpdateRequired(true)
        }, multiplier * 1000) // 60 * 1000 = 1 min
    }

    const verbose = false

    const value = useMemo(() => ({
        adminEnabled,
        setAdminEnabled: handleSetAdmin,
        useTracker,
        setUseTracker: handleSetUseTracker,
        beta,
        setBeta: handleSetBeta,
        version: initial,
        updateRequired,
        updateAvailable,
        verbose
    }), [adminEnabled, handleSetAdmin, useTracker, handleSetUseTracker, beta, handleSetBeta, initial, updateRequired, updateAvailable, verbose])

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export default AppContext
