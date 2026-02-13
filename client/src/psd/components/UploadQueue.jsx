import React from 'react'
import {List, ListItemButton, ListItemText, Paper, Typography, Chip, Stack} from '@mui/material'

export default function UploadQueue({items, activeId, onSelect}) {
    return (
        <Paper sx={{p: 2}}>
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{mb: 1}}>
                <Typography variant='h6'>Queue</Typography>
                <Chip size='small' label={`${items.length} file${items.length === 1 ? '' : 's'}`}/>
            </Stack>
            <List dense>
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
