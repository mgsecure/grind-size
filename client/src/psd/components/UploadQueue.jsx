import React from 'react'
import {List, ListItemButton, ListItemText, Paper, Typography, Chip, Stack} from '@mui/material'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'

export default function UploadQueue({items, activeId, onSelect, viewMode, setViewMode}) {
    const doneCount = items.filter(i => i.status === 'done').length

    return (
        <Paper sx={{p: 2}}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{mb: 1}}>
                <Typography variant='h6'>Queue</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <ToggleButtonGroup
                        size="small"
                        value={viewMode}
                        exclusive
                        onChange={(e, v) => v && setViewMode(v)}
                    >
                        <ToggleButton value="single">Single</ToggleButton>
                        <ToggleButton value="aggregate" disabled={doneCount < 2}>Aggregate</ToggleButton>
                    </ToggleButtonGroup>
                    <Chip size='small' label={`${items.length} file${items.length === 1 ? '' : 's'}`}/>
                </Stack>
            </Stack>
            <List dense sx={{opacity: viewMode === 'aggregate' ? 0.5 : 1, pointerEvents: viewMode === 'aggregate' ? 'none' : 'auto'}}>
                {items.map(item => (
                    <ListItemButton
                        key={item.id}
                        selected={item.id === activeId}
                        onClick={() => onSelect(item.id)}
                    >
                        <ListItemText
                            primary={item.file.name}
                            secondary={item.status === 'error' ? item.error : item.status}
                        />
                    </ListItemButton>
                ))}
                {!items.length && (
                    <Typography variant='body2' color='text.secondary'>
                        No files yet
                    </Typography>
                )}
            </List>
        </Paper>
    )
}
