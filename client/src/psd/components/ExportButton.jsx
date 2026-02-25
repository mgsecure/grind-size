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

export default function ExportButton({text}) {

    const {queue, activeIdList, processingComplete, binSpacing, isDesktop} = useContext(DataContext)
    const {altButtonColor} = useContext(UIContext)

    const cleanedQueue = queue
        .filter(item => activeIdList.includes(item.id)
            && item.result?.particles?.length > 0
            && item.id !== 'aggregateResult')
        .map(item => {
            const newResult = {...item.result}
            newResult.previews = {}
            newResult.particles = newResult.particles?.map(p => ({...p, contour: []}))
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
            downloadFile(`${result.filename}_histogram.csv`, convertHistogramToCsv(histogram))
        }
        downloadFile(`${result.filename}_stats.csv`, convertStatsToCsv(result.stats))
        downloadFile(`${result.filename}_particles.csv`, convertParticlesToCsv(result.particles, result.scale.pxPerMm))
    }, [binSpacing])

    const handleExportJson = useCallback((object, filename = 'json-export') => {
        if (isDesktop) {
            const data = JSON.stringify(object)
            download(`${filename}.json`, data)
            enqueueSnackbar(`Current list downloaded as ${filename}.json`)
        } else {
            enqueueSnackbar('Exports only available on desktop at this time.', {variant: 'warning'})
        }
        handleClose()
    }, [handleClose, isDesktop])

    const exportAllCsv = useCallback(() => {
        if (isDesktop) {
            cleanedQueue.forEach(item => handleExportCsvFiles(item.result))
        } else {
            enqueueSnackbar('Exports only available on desktop at this time.', {variant: 'warning'})
        }
        handleClose()
    }, [cleanedQueue, handleClose, handleExportCsvFiles, isDesktop])

    const menuItemStyle = {padding: '10px 16px'}

    return (
        <React.Fragment>
            {text
                ? <Button variant='text' size='small' onClick={handleOpen}
                          disabled={!activeIdList.length || !processingComplete}
                          startIcon={<FileDownloadIcon style={{color: altButtonColor}}/>}
                          style={{color: altButtonColor}}>
                    Export Selected
                </Button>
                : <Tooltip title='Export' arrow disableFocusListener>
                    <IconButton onClick={handleOpen} disabled={!activeIdList.length || !processingComplete}>
                        <FileDownloadIcon style={{color: altButtonColor}}/>
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