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
        settings
    } = useContext(DataContext)

    const item = queue.find(item => item.id === id)
    if (!item) return null

    const ignore = ['name', 'bins', 'binSpacing']

    const cleanSettings = cleanObject(settings, {ignore})
    const cleanItemSettings = cleanObject(item.result?.settings, {ignore})
    const needsRefresh = !isDeepEqual(cleanSettings, cleanItemSettings)

    const refreshSingle = useCallback((e) => {
        e.stopPropagation()
        e.preventDefault()
        if (!needsRefresh || item.status !== 'done') return
        const newItems = [...queue].map(item => item.id === id ? {...item, status: 'queued', error: null} : item)
        setQueue(newItems)
    }, [id, item.status, needsRefresh, queue, setQueue])


    return (
        <IconButton size='small' onClick={(e) => refreshSingle(e)}>
            <SyncIcon
                color={(needsRefresh && item.status === 'done') ? 'info' : 'disabled'}
                fontSize='small'/>
        </IconButton>
    )
}
