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
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import download from '../../util/download'
import Button from '@mui/material/Button'
import {convertHistogramToCsv, convertParticlesToCsv, convertStatsToCsv, downloadFile} from '../analysis/exportCsv.js'
import {Switch} from '@mui/material'
import Divider from '@mui/material/Divider'
import UIContext from '../../context/UIContext.jsx'
import {setDeep} from '../../util/setDeep.js'
import genHexString from '../../util/genHexString.js'
import {useTheme} from '@mui/material/styles'

export default function ExportButton({text}) {
    const theme = useTheme()

    const {queue, activeItems, activeIdList, processingComplete, binSpacing, aggregateQueueItem} = useContext(DataContext)
    const {altButtonColor, isDesktop} = useContext(UIContext)

    const cleanedQueue = queue
        .filter(item => activeIdList.includes(item.id))
        .map(item => {
            const newResult = {...item.result}
            newResult.previews = {}
            newResult.particles = newResult.particles?.map(p => ({...p, contour: []}))
            newResult.histograms = activeItems?.find(i => i.id === item.id).histograms
            newResult.sampleName = activeItems?.find(i => i.id === item.id).sampleName
            return {...item, result: newResult, source: 'export', file: {}}
        })

    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), [])
    const handleClose = useCallback(() => setAnchorEl(null), [])

    const [archive, setArchive] = useState(true)

    const handleExportCsvFiles = useCallback((result) => {
        const histogram = binSpacing === 'log' ? result.histograms?.log : result.histograms?.linear
        if (histogram) {
            downloadFile(`${result.sampleName || result.filename}_histogram.csv`, convertHistogramToCsv(result.histograms))
        }
        downloadFile(`${result.sampleName || result.filename}_stats.csv`, convertStatsToCsv(result.stats))
        downloadFile(`${result.sampleName || result.filename}_particles.csv`, convertParticlesToCsv(result.particles, result.scale.pxPerMm))
    }, [binSpacing])

    const handleExportJson = useCallback((object, filename) => {
        if (isDesktop) {
            const exportName = object.length > 1
                ? 'multiple-samples'
                : filename || object[0]?.sampleName || object[0]?.filename || 'psd'
            const data = JSON.stringify(object)
            download(`${exportName}-export.json`, data)
            enqueueSnackbar(`Current list downloaded as ${exportName}.json`)
        } else {
            enqueueSnackbar('Exports only available on desktop at this time.', {variant: 'warning'})
        }
        handleClose()
    }, [handleClose, isDesktop])

    const handleExportAggregate = useCallback(() => {

        if (!isDesktop) {
            enqueueSnackbar('Exports only available on desktop at this time.', {variant: 'warning'})
            handleClose()
            return
        }

        const aggregateExport = {...aggregateQueueItem}
        setDeep(aggregateExport, ['id'], `aggregateExport_${genHexString(8)}`)
        setDeep(aggregateExport, ['file', 'name'], 'Aggregate Results Export')
        setDeep(aggregateExport, ['result', 'filename'], 'Aggregate Results Export')
        setDeep(aggregateExport, ['sampleName'], 'Aggregate Results Export')

        handleExportJson([aggregateExport], 'aggregate-export')

        handleClose()
    }, [aggregateQueueItem, handleClose, handleExportJson, isDesktop])

    const exportAllCsv = useCallback(() => {
        if (isDesktop) {
            cleanedQueue.forEach(item => handleExportCsvFiles(item.result))
        } else {
            enqueueSnackbar('Exports only available on desktop at this time.', {variant: 'warning'})
        }
        handleClose()
    }, [cleanedQueue, handleClose, handleExportCsvFiles, isDesktop])

    const menuItemStyle = {padding: '10px 16px'}

    const disabled = !activeIdList.length || !processingComplete

    return (
        <React.Fragment>
            {text
                ? <Button variant='text' size='small' onClick={handleOpen}
                          disabled={disabled}
                          startIcon={<FileDownloadIcon style={{color: !disabled ? altButtonColor : theme.palette.action.disabled}}/>}
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

                <MenuItem style={menuItemStyle} onClick={() => handleExportJson(cleanedQueue)}>
                    <ListItemIcon>
                        <CodeIcon fontSize='small'/>
                    </ListItemIcon>
                    <ListItemText>Full Import/Export (JSON)</ListItemText>
                </MenuItem>

                <MenuItem style={menuItemStyle} onClick={handleExportAggregate}>
                    <ListItemIcon>
                        <CodeIcon fontSize='small'/>
                    </ListItemIcon>
                    <ListItemText>Aggregate Sample (JSON)</ListItemText>
                </MenuItem>

                <MenuItem style={menuItemStyle} onClick={exportAllCsv}>
                    <ListItemIcon>
                        <ListIcon fontSize='small'/>
                    </ListItemIcon>
                    <ListItemText>Analysis Data (3x CSV)</ListItemText>
                </MenuItem>

                <MenuItem style={menuItemStyle} onClick={() => {
                }} disabled>
                    <ListItemIcon>
                        <CodeIcon fontSize='small'/>
                    </ListItemIcon>
                    <ListItemText>Analysis Data (JSON)</ListItemText>
                </MenuItem>

                <MenuItem style={menuItemStyle} onClick={() => {
                }} disabled>
                    <ListItemIcon>
                        <ContentCopyIcon fontSize='small'/>
                    </ListItemIcon>
                    <ListItemText>Clipboard??</ListItemText>
                </MenuItem>

                <MenuItem style={menuItemStyle} onClick={() => {
                }} disabled>
                    <ListItemIcon>
                        <ContentCopyIcon fontSize='small'/>
                    </ListItemIcon>
                    <ListItemText>Image??</ListItemText>
                </MenuItem>

                <Divider/>
                <MenuItem onClick={() => setArchive(!archive)}>
                    <ListItemText style={{textAlign: 'left'}}>
                        Export as archive
                        <Switch checked={archive} onChange={(e) => setArchive(e.target.checked)}/>
                    </ListItemText>
                </MenuItem>


            </Menu>
        </React.Fragment>
    )
}