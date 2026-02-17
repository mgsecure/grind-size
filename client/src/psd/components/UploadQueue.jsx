import React, {useCallback, useContext, useEffect} from 'react'
import {
    List,
    Paper,
    Typography,
    Stack,
    ListItem,
    alpha,
    lighten
} from '@mui/material'
import Box from '@mui/material/Box'
import DeleteIcon from '@mui/icons-material/Delete'
import IconButton from '@mui/material/IconButton'
import {useTheme} from '@mui/material/styles'
import {getFileNameWithoutExtension} from '../../util/stringUtils.js'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import Button from '@mui/material/Button'
import Dropzone from '../../formUtils/Dropzone.jsx'
import DataContext from '../../context/DataContext.jsx'

export default function UploadQueue() {
    const theme = useTheme()

    const {
        chartColors,
        droppedFiles,
        onFiles: handleDroppedFiles,
        allItems,
        handleQueueRemove,
        activeIdList,
        setActiveIdList
    } = useContext(DataContext)

    console.log('q', {activeIdList, allItems})

    const selectEnabled = allItems.length > 1 || activeIdList.length === 0

    const handleSelect = useCallback((id) => {
        if (!selectEnabled) return
        const newList = activeIdList.includes(id)
            ? activeIdList.filter(i => i !== id)
            : [...activeIdList, id]
        const allItemIds = allItems.map(item => item.id)
        setActiveIdList(newList.sort((a, b) => allItemIds.indexOf(a) - allItemIds.indexOf(b)))
    }, [activeIdList, allItems, selectEnabled, setActiveIdList])

    useEffect(() => {
        if (allItems.length > 0
            && activeIdList.length === 0
            && allItems[0]?.id !== 'aggregateResults') {
            console.log('no active items, selecting first item')
            handleSelect(allItems[0]?.id)
        } else if (allItems.length === 1 && activeIdList.includes('aggregateResults')) {
            console.log('only one active item, clearing aggregateResults')
            setActiveIdList(prev => prev.filter(i => i !== 'aggregateResults'))
        } else if (allItems.length === 0 && activeIdList.length > 0) {
            console.log('no active items, clearing selection')
            setActiveIdList([])
        }
    }, [activeIdList, handleSelect, allItems, setActiveIdList])


    const handleDelete = (id) => {
        handleQueueRemove(id)
        const newActiveIdList = activeIdList.filter(i => (i !== id && allItems.find(q => q.id === i)))
        setActiveIdList(newActiveIdList)
    }

    return (
        <Paper sx={{p: 2, width: '100%'}} width={'100%'}>
            <Typography style={{fontSize: '1.1rem', fontWeight: 500}}>IMAGES</Typography>
            <Stack direction={{xs: 'column', md: 'row'}} spacing={1} sx={{width: '100%'}}>
                <Box sx={{display: 'flex', padding: '10px 8px 16px 0px'}}>
                    <Dropzone
                        files={droppedFiles}
                        handleDroppedFiles={handleDroppedFiles}
                        accept={{'image/*': []}}
                        multiple
                        maxFiles={15}
                        maxMBperFile={15}
                        label='Drop grind photos here (max 6)'
                        zoneStyle={{fontSize: '0.9rem', height: '100%', borderRadius: 5}}
                        messgageStyle={{fontSize: '0.9rem', height: '100%', margin: '8px 0px'}}
                    />
                </Box>
                {allItems.length > 0 &&
                    <List dense sx={{}} style={{width: '100%'}}>
                        {allItems.map(item => (
                            <ListItem
                                key={item.id} selected={activeIdList.includes(item.id)}
                                style={{cursor: selectEnabled ? 'pointer' : 'default', padding: 10}}
                                sx={{
                                    backgroundColor: activeIdList.includes(item.id) ? theme.palette.divider : 'inherit',
                                    '&:hover': selectEnabled ? {backgroundColor: theme.palette.action.hover} : {}
                                }}
                                onClick={() => handleSelect(item.id)}
                                secondaryAction={
                                    item.id !== 'aggregateResults' &&
                                    <IconButton edge='end' aria-label='delete' size='small'
                                                onClick={() => handleDelete(item.id)}>
                                        <DeleteIcon fontSize='small'/>
                                    </IconButton>
                                }>
                                {activeIdList.includes(item.id)
                                    ? <CheckBoxIcon fontSize='small'
                                                    style={{
                                                        marginRight: 12,
                                                        color: chartColors?.[activeIdList.indexOf(item.id)]
                                                    }}/>
                                    : <CheckBoxOutlineBlankIcon fontSize='small'
                                                                style={{
                                                                    marginRight: 12,
                                                                    color: theme.palette.divider
                                                                }}/>
                                }
                                {getFileNameWithoutExtension(item.filename)}

                                <Box style={{
                                    color: item.status === 'error' ? theme.palette.error.main : theme.palette.text.primary,
                                    fontWeight: item.status === 'done' ? 500 : 400
                                }}>
                                </Box>
                                <span style={{
                                    color: item.status === 'error' ? theme.palette.error.main : theme.palette.text.secondary,
                                    fontSize: '0.9rem', marginLeft: 8
                                }}>
                            ({item.status === 'error' ? item.error : item.status})
                        </span>
                            </ListItem>
                        ))}

                    </List>
                }
                {!allItems.length && (
                    <Box color={alpha(theme.palette.text.secondary, 0.4)}
                         sx={{
                             display: 'flex',
                             placeContent: 'center',
                             padding: '10px 0px 16px 0px',
                             width: '100%'
                         }}>
                        <Box style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%', height: '100%',
                            fontSize: '0.9rem',
                            backgroundColor: lighten(theme.palette.background.paper, 0.1),
                            borderRadius: 5
                        }}>
                            Add photos to begin analysis
                        </Box>
                    </Box>
                )}

            </Stack>

            {allItems.length > 2 &&
                <div style={{textAlign: 'right', marginRight: 10}}>
                    <Button onClick={() => handleDelete('all')}>Remove All</Button>
                </div>
            }

        </Paper>
    )
}
