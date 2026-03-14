import {enqueueSnackbar} from 'notistack'

export default function loadImport(jsonData, {queue=[], setQueue, setActiveIdList}) {

    const validImportItems = jsonData.filter(item => item.id && item.result?.particles?.length > 0)
    const nonDuplicateIds =
        [...new Set(jsonData.map(item => item.id))].filter(id => !queue.find(q => q.id === id))

    if (validImportItems.length === 0) {
        enqueueSnackbar('Import error: no valid samples found in file', {variant: 'error'})
        return
    } else if (validImportItems && nonDuplicateIds.length === 0) {
        enqueueSnackbar('Import error: all samples already imported', {variant: 'error'})
        return
    }
    const importQueueClean = jsonData
        .filter(item => nonDuplicateIds.includes(item.id))
        .map(item => ({...item, source: item.source === 'export' ? 'import' : item.source}))
    setQueue(prev => [...prev, ...importQueueClean])
    setActiveIdList(prev => [...prev, ...nonDuplicateIds])

   // console.log(`Imported ${cleanCount(importQueueClean.length, 'sample', false)}: ${importQueueClean.map(item => item.id).join(', ')}`)
}
