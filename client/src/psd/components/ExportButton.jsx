import FileDownloadIcon from '@mui/icons-material/FileDownload'
import ListIcon from '@mui/icons-material/List'
import CodeIcon from '@mui/icons-material/Code'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import {enqueueSnackbar} from 'notistack'
import React, {useCallback, useContext, useState} from 'react'
import DataContext from '../../context/DataContext.jsx'
import download from '../../util/download'
import Button from '@mui/material/Button'
import {convertHistogramToCsv, convertParticlesToCsv, convertStatsToCsv, downloadFile} from '../analysis/exportCsv.js'
import UIContext from '../../context/UIContext.jsx'
import genHexString from '../../util/genHexString.js'
import {useTheme} from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import {sanitizeFileName} from '../../util/sanitizeValues.js'

const defaultAggregateExportName = 'Multiple Samples - Aggregate'

export default function ExportButton({text}) {
    const theme = useTheme()

    const {
        queue,
        activeItems,
        activeIdList,
        processingComplete,
        binSpacing,
        aggregateQueueItem
    } = useContext(DataContext)

    const {altButtonColor} = useContext(UIContext)
    const [aggregateExportName, setAggregateExportName] = useState(defaultAggregateExportName)

    const cleanQueueItems = useCallback((items) => {
        if (!items) return []
        return items
            .filter(item => item?.result?.particles?.length > 0)
            .filter(item => activeIdList.includes(item.id))
            .map(item => {
                const newResult = {...item.result}
                newResult.previews = {}
                newResult.particles = newResult.particles?.map(p => ({...p, contour: []}))
                newResult.histograms = activeItems?.find(i => i.id === item.id).histograms
                newResult.sampleName = activeItems?.find(i => i.id === item.id).sampleName
                let newItem = {
                    ...item, result: newResult, source: 'export', file: {}, id: `${item.id}-${genHexString(8)}`
                }

                if (item.id === aggregateQueueItem?.id) {
                    console.log('aggregateQueueItem', aggregateExportName, aggregateQueueItem)
                    newItem.sampleName = aggregateExportName
                    newItem.result.filename = aggregateExportName
                    newItem.result.sampleName = aggregateExportName
                    newItem.file.name = aggregateExportName
                }

                return newItem
            })
    }, [activeIdList, activeItems, aggregateExportName, aggregateQueueItem])

    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), [])
    const handleClose = useCallback(() => setAnchorEl(null), [])

    const handleExportCsvFiles = useCallback((result) => {
        const histogram = binSpacing === 'log' ? result.histograms?.log : result.histograms?.linear
        if (histogram) {
            downloadFile(`${result.sampleName || result.filename}_histogram.csv`, convertHistogramToCsv(result.histograms))
        }
        downloadFile(`${result.sampleName || result.filename}_stats.csv`, convertStatsToCsv(result.stats))
        downloadFile(`${result.sampleName || result.filename}_particles.csv`, convertParticlesToCsv(result.particles, result.scale.pxPerMm))
    }, [binSpacing])

    const handleExportJson = useCallback(() => {
        const object = cleanQueueItems([...queue, aggregateQueueItem])
        const exportName = object.length > 1
            ? 'multiple-samples'
            : object[0]?.sampleName || object[0]?.filename || 'psd'
        const data = JSON.stringify(object)
        download(`${sanitizeFileName(exportName)}-export.json`, data)
        enqueueSnackbar(`Current list downloaded as ${exportName}.json`)
        handleClose()
    }, [aggregateQueueItem, cleanQueueItems, handleClose, queue])

    const exportAllCsv = useCallback(() => {
        cleanQueueItems(queue).forEach(item => handleExportCsvFiles(item.result))
        handleClose()
    }, [cleanQueueItems, handleClose, handleExportCsvFiles, queue])

    const [dialogOpen, setDialogOpen] = useState(false)
    const handleDialogOpen = useCallback(() => {
        if (!aggregateExportName) setAggregateExportName(defaultAggregateExportName)
        setDialogOpen(true)
        handleClose()
    }, [aggregateExportName, handleClose])

    const handleDialogClose = useCallback(() => {
        document.activeElement.blur()
        setDialogOpen(false)
    }, [])
    const handleDialogCancel = useCallback(() => {
        document.activeElement.blur()
        handleDialogClose()
        handleClose()
        setAggregateExportName(defaultAggregateExportName)
    }, [handleClose, handleDialogClose])

    const handleSubmit = useCallback((event) => {
        event.preventDefault()
        handleExportJson()
        handleDialogClose()
        handleClose()
    }, [handleClose, handleDialogClose, handleExportJson])

    const handlePreflight = useCallback((event) => {
        event.preventDefault()
        if (activeIdList.includes(aggregateQueueItem?.id)) {
            handleDialogOpen()
        } else {
            handleExportJson()
        }
    }, [activeIdList, aggregateQueueItem?.id, handleDialogOpen, handleExportJson])

    const menuItemStyle = {padding: '10px 16px'}

    const disabled = !activeIdList.length || !processingComplete

    return (
        <React.Fragment>
            {text
                ? <Button variant='text' size='small' onClick={handleOpen}
                          disabled={disabled}
                          startIcon={<FileDownloadIcon
                              style={{color: !disabled ? altButtonColor : theme.palette.action.disabled}}/>}
                          style={{color: !disabled ? altButtonColor : theme.palette.action.disabled}}>
                    Export Selected
                </Button>
                : <Tooltip title='Export' arrow disableFocusListener>
                    <IconButton onClick={handleOpen} disabled={disabled}>
                        <FileDownloadIcon style={{color: !disabled ? altButtonColor : theme.palette.action.disabled}}/>
                    </IconButton>
                </Tooltip>
            }
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {!text &&
                    <MenuItem disabled>
                        <ListItemIcon>
                            <FileDownloadIcon fontSize='small'/>
                        </ListItemIcon>
                        <ListItemText>Export Selected</ListItemText>
                    </MenuItem>
                }
                <MenuItem style={menuItemStyle} onClick={(event) => handlePreflight(event)}>
                    <ListItemIcon>
                        <CodeIcon fontSize='small'/>
                    </ListItemIcon>
                    <ListItemText>Full Import/Export (JSON)</ListItemText>
                </MenuItem>
                <MenuItem style={menuItemStyle} onClick={exportAllCsv}>
                    <ListItemIcon>
                        <ListIcon fontSize='small'/>
                    </ListItemIcon>
                    <ListItemText>Analysis Data (3x CSV)</ListItemText>
                </MenuItem>
                <MenuItem style={menuItemStyle} onClick={handleDialogOpen} disabled>
                    <ListItemIcon>
                        <CodeIcon fontSize='small'/>
                    </ListItemIcon>
                    <ListItemText>Analysis Data (JSON)</ListItemText>
                </MenuItem>
            </Menu>
            <Dialog open={dialogOpen} onClose={handleDialogClose}>
                <DialogTitle>Aggregate Series Name:</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                    </DialogContentText>
                    <TextField
                        autoFocus
                        type='text'
                        margin='dense'
                        id='exportName'
                        name='exportName'
                        style={{marginLeft: 8, width: 250}}
                        size='small'
                        onChange={(e) => setAggregateExportName(e.target.value || '')}
                        value={aggregateExportName}
                        color='info'
                        variant='standard'
                        slotProps={{
                            input: {
                                sx: {
                                    '& input': {
                                        paddingLeft: 1
                                    }
                                }
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogCancel}>Cancel</Button>
                    <Button onClick={handleSubmit}>Export</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
}