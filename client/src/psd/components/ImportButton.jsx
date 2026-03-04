import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import {enqueueSnackbar} from 'notistack'
import React, {useCallback, useContext, useRef, useState} from 'react'
import DataContext from '../../context/DataContext.jsx'
import Button from '@mui/material/Button'
import UploadIcon from '@mui/icons-material/Upload'
import {cleanCount} from '../../util/stringUtils.js'
import UIContext from '../../context/UIContext.jsx'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import ListItemText from '@mui/material/ListItemText'
import CodeIcon from '@mui/icons-material/Code'
import Menu from '@mui/material/Menu'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import {Link} from '@mui/material'
import LoadingDisplaySmall from '../../misc/LoadingDisplaySmall.jsx'

const demoDataURL = 'https://grind.mygiantsquid.com/data/M47-POB-demo-export.json'

export default function ImportButton({iconOnly = false, linkOnly = false}) {

    const {queue, setQueue, setActiveIdList} = useContext(DataContext)
    const {altButtonColor} = useContext(UIContext)

    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), [])
    const handleClose = useCallback(() => {
        document.activeElement.blur()
        setAnchorEl(null)
    }, [])

    const hiddenFileInput = useRef(null)
    const handleClick = useCallback(() => {
        hiddenFileInput.current.click()
    }, [])

    // TODO: more robust valid check

    const loadJson = useCallback((jsonData) => {
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

        enqueueSnackbar(`${cleanCount(importQueueClean.length, 'sample', false)} imported`, {
            variant: 'success',
            autoHideDuration: 1500
        })
        console.log(
            `Imported ${cleanCount(importQueueClean.length, 'sample', false)}: ${importQueueClean
                .map(item => item.id)
                .join(', ')}`
        )
    }, [queue, setActiveIdList, setQueue])

    const handleChange = useCallback((event) => {
        const files = event.target.files
        const reader = new FileReader()
        try {
            reader.onload = (event) => {
                const jsonData = JSON.parse(event.target.result.toString())
                loadJson(jsonData)
            }
            reader.readAsText(files[0])
        } catch (err) {
            enqueueSnackbar(`Error reading file: ${err}`, {variant: 'error'})
        } finally {
            hiddenFileInput.current.value = null
            handleClose()
        }
    }, [handleClose, loadJson])

    const [loading, setLoading] = useState(false)
    const [data, setData] = useState(null)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const loadDemoData = useCallback(() => {

        async function fetchData(url) {
            setLoading(true)
            try {
                // If this still fails with 'Failed to fetch', it's most likely a CORS issue
                const response = await fetch(url, {cache: 'no-store'})
                if (!response.ok) {
                    setError(true)
                    setErrorMessage(`HTTP error! status: ${response.status}`)
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const jsonData = await response.json()
                setData(jsonData)
                loadJson(jsonData)
                return {data, loading, error, errorMessage}
            } catch (err) {
                setErrorMessage(err.message || err)
                console.error('Error fetching demo data:', err)
                enqueueSnackbar(`Error reading demo data: ${err.message || err}`, {variant: 'error'})
            } finally {
                setLoading(false)
            }
        }

        fetchData(demoDataURL).then(handleClose)

    }, [data, error, errorMessage, handleClose, loadJson, loading])

    const menuItemStyle = {padding: '10px 16px'}

    return (
        <React.Fragment>
            {iconOnly &&
                <Tooltip title='Import Data' arrow disableFocusListener>
                    <IconButton onClick={handleOpen}>
                        <UploadIcon style={{color: altButtonColor}}/>
                    </IconButton>
                </Tooltip>
            }

            {linkOnly &&
                <Link onClick={handleOpen}>import demo data</Link>
            }

            {!iconOnly && !linkOnly &&
                <Button
                    variant='text'
                    size='small'
                    onClick={handleOpen}
                    startIcon={loading
                        ? <span style={{marginRight: 0}}><LoadingDisplaySmall size='xsmall'/></span>
                        : <UploadIcon style={{color: altButtonColor}}/>}
                    style={{color: altButtonColor}}>
                    Import Data
                </Button>
            }

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {iconOnly &&
                    <MenuItem disabled>
                        <ListItemIcon>
                            <FileDownloadIcon fontSize='small'/>
                        </ListItemIcon>
                        <ListItemText>Import Data</ListItemText>
                    </MenuItem>
                }

                {!linkOnly &&
                    <MenuItem style={menuItemStyle} onClick={handleClick}>
                        <ListItemIcon>
                            <CodeIcon fontSize='small'/>
                        </ListItemIcon>
                        <ListItemText>Import Data from JSON file</ListItemText>
                    </MenuItem>
                }
                <MenuItem style={menuItemStyle} onClick={loadDemoData}>
                    <ListItemIcon>
                        <CloudDownloadIcon fontSize='small'/>
                    </ListItemIcon>
                    <ListItemText>Load Demo Data</ListItemText>
                </MenuItem>
            </Menu>

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