import React, {useCallback, useMemo} from 'react'
import {useLocalStorage} from 'usehooks-ts'
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

    const verbose = false

    const value = useMemo(() => ({
        adminEnabled,
        setAdminEnabled: handleSetAdmin,
        useTracker,
        setUseTracker: handleSetUseTracker,
        beta,
        setBeta: handleSetBeta,
        verbose
    }), [adminEnabled, handleSetAdmin, useTracker, handleSetUseTracker, beta, handleSetBeta, verbose])

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export default AppContext
