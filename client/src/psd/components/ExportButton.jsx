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
import {setDeep} from '../../util/setDeep.js'
import genHexString from '../../util/genHexString.js'
import {useTheme} from '@mui/material/styles'

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

    const cleanQueueItems = useCallback((items) => {
            return items
                .filter(item => item?.result?.particles?.length > 0)
                .filter(item => activeIdList.includes(item.id))
                .map(item => {
                    const newResult = {...item.result}
                    newResult.previews = {}
                    newResult.particles = newResult.particles?.map(p => ({...p, contour: []}))
                    newResult.histograms = activeItems?.find(i => i.id === item.id).histograms
                    newResult.sampleName = activeItems?.find(i => i.id === item.id).sampleName
                    return {
                        ...item, result: newResult, source: 'export', file: {}, id: item.id + '-export'
                    }
                })
        }, [activeIdList, activeItems])

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
        download(`${exportName}-export.json`, data)
        enqueueSnackbar(`Current list downloaded as ${exportName}.json`)
        handleClose()
    }, [aggregateQueueItem, cleanQueueItems, handleClose, queue])

    const _handleExportAggregate = useCallback(() => {
        const aggregateExport = {...aggregateQueueItem}
        setDeep(aggregateExport, ['id'], `aggregateExport_${genHexString(8)}`)
        setDeep(aggregateExport, ['file', 'name'], 'Aggregate Results Export')
        setDeep(aggregateExport, ['result', 'filename'], 'Aggregate Results Export')
        setDeep(aggregateExport, ['sampleName'], 'Aggregate Results Export')
        //handleExportJson([aggregateExport], 'aggregate-export')
        handleClose()
    }, [aggregateQueueItem, handleClose])

    const exportAllCsv = useCallback(() => {
        cleanQueueItems(queue).forEach(item => handleExportCsvFiles(item.result))
        handleClose()
    }, [cleanQueueItems, handleClose, handleExportCsvFiles, queue])

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

                <MenuItem style={menuItemStyle} onClick={handleExportJson}>
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

                <MenuItem style={menuItemStyle} onClick={() => {
                }} disabled>
                    <ListItemIcon>
                        <CodeIcon fontSize='small'/>
                    </ListItemIcon>
                    <ListItemText>Analysis Data (JSON)</ListItemText>
                </MenuItem>

            </Menu>
        </React.Fragment>
    )
}