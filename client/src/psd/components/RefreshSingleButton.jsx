import IconButton from '@mui/material/IconButton'
import React, {useCallback, useContext} from 'react'
import SyncIcon from '@mui/icons-material/Sync'
import DataContext from '../../context/DataContext.jsx'
import isDeepEqual from '../../util/isDeepEqual.js'
import cleanObject from '../../util/cleanObject.js'

export default function RefreshSingleButton({id}) {
    const {
        queue,
        setQueue,
        settings,
        debugLevel
    } = useContext(DataContext)

    const item = queue.find(item => item.id === id)
    if (!item) return null

    const debugError = debugLevel > 0 && item.status === 'error'
    //if (item.status !== 'done' && !debugError) return null

    const ignore = ['name', 'bins', 'binSpacing', 'sampleName']

    const cleanSettings = cleanObject(settings, {ignore})
    const cleanItemSettings = cleanObject(item.result?.settings, {ignore})
    const needsRefresh = (item.status === 'done' && !isDeepEqual(cleanSettings, cleanItemSettings))

    const refreshSingle = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        if (!needsRefresh && !debugError) return
        const newItems = [...queue].map(item => item.id === id ? {...item, status: 'queued', error: null} : item)
        setQueue(newItems)
    }, [debugError, id, needsRefresh, queue, setQueue])


    return (
        <IconButton
            size='small'
            disabled={item.status !== 'done' && !debugError}
            onClick={(e) => refreshSingle(e)}>
            <SyncIcon
                color={needsRefresh ? 'info' : 'disabled'}
                fontSize='small'/>
        </IconButton>
    )
}
