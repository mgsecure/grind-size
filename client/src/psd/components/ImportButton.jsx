import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import {enqueueSnackbar} from 'notistack'
import React, {useCallback, useContext, useRef} from 'react'
import DataContext from '../../context/DataContext.jsx'
import Button from '@mui/material/Button'
import UploadIcon from '@mui/icons-material/Upload'
import {cleanCount} from '../../util/stringUtils.js'
import UIContext from '../../context/UIContext.jsx'

export default function ImportButton({text}) {

    const {queue, setQueue, setActiveIdList} = useContext(DataContext)
    const {altButtonColor} = useContext(UIContext)

    const hiddenFileInput = useRef(null)
    const handleClick = useCallback(() => {
        hiddenFileInput.current.click()
    }, [])

    // TODO: more robust valid check

    const handleChange = useCallback((event) => {
        const files = event.target.files
        const reader = new FileReader()
        try {
            reader.onload = (event) => {
                const jsonData = JSON.parse(event.target.result)
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
                    .map(item => ({...item, source: 'import'}))
                setQueue(prev => [...prev, ...importQueueClean])
                setActiveIdList(prev => [...prev, ...nonDuplicateIds])

                enqueueSnackbar(`${cleanCount(importQueueClean.length, 'sample', false)} imported`)
            }
            reader.readAsText(files[0])
        } catch (err) {
            enqueueSnackbar(`Error reading file: ${err}`, {variant: 'error'})
        }
    }, [queue, setActiveIdList, setQueue])

    return (
        <React.Fragment>
            {text
                ? <Button
                    variant='text'
                    size='small'
                    onClick={handleClick}
                    startIcon={<UploadIcon style={{color: altButtonColor}}/>}
                style={{color: altButtonColor}}>
                    Import Data
                </Button>
                : <Tooltip title='Import Data' arrow disableFocusListener>
                    <IconButton onClick={handleClick}>
                        <UploadIcon style={{color: altButtonColor}}/>
                    </IconButton>
                </Tooltip>
            }
            <input
                type='file'
                ref={hiddenFileInput}
                onChange={handleChange}
                style={{display: 'none'}}
                accept='.json'
            />
        </React.Fragment>
    )
}