import IconButton from '@mui/material/IconButton'
import React, {useCallback, useContext, useMemo, useState} from 'react'
import DataContext from '../../context/DataContext.jsx'
import {useTheme, alpha} from '@mui/material/styles'
import InfoOutlineIcon from '@mui/icons-material/InfoOutline'
import EditIcon from '@mui/icons-material/Edit'
import Stack from '@mui/material/Stack'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import {Table, TableBody, TableCell, TableRow} from '@mui/material'
import Dialog from '@mui/material/Dialog'
import SaveIcon from '@mui/icons-material/Save'
import TextField from '@mui/material/TextField'
import Collapse from '@mui/material/Collapse'
import ErrorIcon from '@mui/icons-material/Error'

export default function ItemInformationButton({item, imageViewer = false, noButton = false, openOverride = false, onClose}) {
    if (!item) return null

    console.log('item', {item, noButton, openOverride})

    const {filename = 'sample', scale = {}, stats = {}, settings = {}} = item

    const theme = useTheme()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(item.filename)
    const [editOpen, setEditOpen] = useState(false)

    const {queue, setQueue, isDesktop} = useContext(DataContext)
    const queueItemNames = queue.map(item => item.filename)
    const queueItem = queue.find(q => q.id === item.id)

    const canSave = useMemo(() => {
        return (name.length > 1 && name !== filename && !queueItemNames.includes(name))
    }, [name, filename, queueItemNames])

    const openDrawer = useCallback(() => {
        setOpen(true)
        // Clear current focus to prevent weird issues on mobile
        document.activeElement.blur()
    }, [])
    const closeDrawer = useCallback(() => {
        setOpen(false)
        onClose && onClose()
    }, [onClose])

    const saveName = useCallback(() => {
        const newItem = {...queueItem, filename: name}
        setQueue(oldQueue => oldQueue.map(i => i.id === item.id ? newItem : i))
        setEditOpen(false)
    }, [item, name, queueItem, setQueue])

    const rows = [
        ['Settings', settings.name],
        ['Particle Count', stats.count],
        ['Template', scale.detectedTemplate],
        ['', ''],
        ['Background Sigma', settings.bgSigma],
        ['Adaptive Block Size', settings.adaptiveBlockSize],
        ['Adaptive C', settings.adaptiveC],
        ['', ''],
        ['Min Area (px)', settings.minAreaPx],
        ['Max Surface (mm²)', settings.maxAreaMm2],
        ['', ''],
        ['Split Overlaps', settings.splitOverlaps ? 'Enabled' : 'Disabled'],
        ['Split Sensitivity', settings.splitSensitivity],
        ['', ''],
        ['Test Pipeline', settings.testPipeline ? 'Enabled' : 'Disabled'],
        ['correctPerspective', settings.correctPerspective ? 'Enabled' : 'Disabled'],
        ['useMorphology', settings.useMorphology ? 'Enabled' : 'Disabled']
    ]

    const settingsTable = (
        <Stack direction='column' style={{minWidth: 250, margin: 20}}>

            {filename &&
                <>
                    <Stack direction='row' alignItems='center' style={{marginBottom: 12, fontWeight: 600}}>
                        <div style={{marginRight: 8}}>{filename}</div>
                        {!imageViewer &&
                            <>
                                <IconButton onClick={() => setEditOpen(!editOpen)} disabled={item.status !== 'done'}
                                            style={{height: 36, width: 36}}>
                                    <EditIcon fontSize='small'/>
                                </IconButton>
                            </>
                        }
                    </Stack>
                    <Collapse in={editOpen}>
                        <Stack direction='row' alignItems='center' style={{marginBottom: 12, fontWeight: 600}}>
                            <TextField type='text' name='name' fullWidth style={{minWidth: 300}}
                                       size='small'
                                       onChange={e => setName(e.target.value)} value={name}
                                       color='info'/>

                            <IconButton disabled={!canSave} onClick={saveName} style={{height: 36, width: 36}}>
                                <SaveIcon fontSize='small'
                                          style={{color: canSave ? theme.palette.success.main : alpha(theme.palette.text.primary, 0.5)}}/>
                            </IconButton>
                        </Stack>
                    </Collapse>
                </>
            }

            {item.status === 'error'
                ? <Stack direction='row' alignItems='center' sx={{mt: 1}}>
                    <ErrorIcon fontSize='small' sx={{mr: 1, color: theme.palette.error.main, width: 20, height: 20}}/>
                    <span style={{color: theme.palette.error.main, fontSize: '0.9rem'}}>
                        ERROR:<br/>
                        {item.error}</span>
                </Stack>
                : <Table size='small' sx={{borderTop: '1px solid', borderColor: theme.palette.divider}}>
                    <TableBody>
                        {rows.map((row, idx) => {
                            const [label, data] = row
                            return (
                                <TableRow key={idx}>
                                    <>
                                        <TableCell sx={{p: '8px 8px', fontWeight: 500}}>{label}</TableCell>
                                        <TableCell sx={{p: '8px 8px'}}>{data}</TableCell>
                                    </>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            }
        </Stack>
    )

    return (
        <>
            {!noButton &&
                <IconButton onClick={openDrawer} disabled={!['done', 'error'].includes(item.status)}
                            style={{height: 36, width: 36}}>
                    <InfoOutlineIcon fontSize='small'
                                     style={{color: item.error ? theme.palette.error.main : theme.palette.text.primary}}/>
                </IconButton>
            }
            {imageViewer
                ? <Dialog
                    anchor='left'
                    open={open || openOverride}
                    onOpen={openDrawer}
                    onClose={closeDrawer}
                >
                    {settingsTable}
                </Dialog>
                : <SwipeableDrawer
                    anchor='left'
                    open={open || openOverride}
                    onOpen={openDrawer}
                    onClose={closeDrawer}
                    slotProps={{
                        paper: {sx: {maxWidth: isDesktop ? '600px' : '90vw'}},
                        transition: {
                            direction: 'right'
                        }
                    }}

                >
                    {settingsTable}
                </SwipeableDrawer>
            }
        </>
    )
}
