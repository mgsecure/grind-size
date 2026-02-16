import React, {useEffect, useState} from 'react'
import {List, ListItemButton, ListItemText, Paper, Typography, Chip, Stack, ListItem} from '@mui/material'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Box from '@mui/material/Box'
import DeleteIcon from '@mui/icons-material/Delete'
import IconButton from '@mui/material/IconButton'
import {useTheme} from '@mui/material/styles'
import {getFileNameWithoutExtension} from '../../util/stringUtils.js'

export default function UploadQueue({queue, setQueue, handleQueueRemove, activeId, onSelect, activeIdList, setActiveIdList, viewMode, setViewMode}) {
    const theme = useTheme()

    const doneCount = queue.filter(i => i.status === 'done').length
    const [selected, setSelected] = useState(activeId || queue[0]?.id)

    console.log('activeIdList', activeIdList)
    useEffect(() => {
        const validActiveId = queue.find(i => i.id === activeId)?.id
        setSelected(validActiveId || queue[0]?.id)
        onSelect(validActiveId || queue[0]?.id)
    }, [activeId, queue])

    const handleSelect = (id) => {
        if (id === 'aggregate') {
            setSelected(id)
            setViewMode('aggregate')
        } else {
            setSelected(id)
            setActiveIdList(activeIdList.includes(id) ? activeIdList.filter(i => i !== id) : [...activeIdList, id])
            setViewMode('single')
            onSelect(id)
        }
    }

    const handleDelete = (id) => {
        setSelected(null)
        handleQueueRemove(id)
        setActiveIdList(activeIdList.filter(i => i !== id))
        setViewMode('single')
    }

    return (
        <Paper sx={{p: 2, width:'100%'}} width={'100%'}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{mb: 1}}>
                <Typography variant='h6'>Images</Typography>
            </Stack>
            <List dense sx={{
            }}>
                {queue.map(item => (
                    <ListItem
                        key={item.id} selected={item.id === selected}
                        style={{cursor: 'pointer', padding: 10}}
                        sx={{
                            backgroundColor: item.id === selected ? theme.palette.divider : 'inherit',
                            '&:hover': {backgroundColor: theme.palette.action.hover}
                        }}
                        onClick={() => handleSelect(item.id)}
                        secondaryAction={
                            <IconButton edge='end' aria-label='delete' size='small'
                                        onClick={() => handleDelete(item.id)}>
                                <DeleteIcon/>
                            </IconButton>
                        }>
                        <Box style={{
                            color: item.status === 'error' ? theme.palette.error.main : theme.palette.text.primary,
                            fontWeight: item.status === 'done' ? 500 : 400
                        }}>
                            {getFileNameWithoutExtension(item.file.name)}
                        </Box>
                        <span style={{
                            color: item.status === 'error' ? theme.palette.error.main : theme.palette.text.secondary,
                            fontSize: '0.9rem', marginLeft: 8
                        }}>
                            ({item.status === 'error' ? item.error : item.status})
                        </span>
                    </ListItem>
                ))}

                {(doneCount > 1 && doneCount === queue.length) &&
                <ListItem
                    key='aggregate'
                    selected={viewMode === 'aggregate'}
                    style={{cursor: 'pointer', padding: 10}}
                    sx={{
                        backgroundColor: viewMode === 'aggregate' ? theme.palette.divider : 'inherit',
                        '&:hover': {backgroundColor: theme.palette.action.hover}
                    }}
                    onClick={() => handleSelect('aggregate')}
                    disabled={doneCount < 2 || doneCount < queue.length}
                >
                    <Box style={{}}>
                        Aggregate View
                    </Box>
                </ListItem>
                }
                {!queue.length && (
                    <Typography variant='body2' color='text.secondary'>
                        No files yet
                    </Typography>
                )}
            </List>
        </Paper>
    )
}
