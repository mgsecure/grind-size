import React, {useCallback, useContext, useEffect} from 'react'
import {
    List,
    Paper,
    Typography,
    Stack,
    ListItem,
} from '@mui/material'
import Box from '@mui/material/Box'
import DeleteIcon from '@mui/icons-material/Delete'
import IconButton from '@mui/material/IconButton'
import {useTheme} from '@mui/material/styles'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import Button from '@mui/material/Button'
import Dropzone from '../../formUtils/Dropzone.jsx'
import DataContext from '../../context/DataContext.jsx'
import TroubleshootIcon from '@mui/icons-material/Troubleshoot'
import {PSD_PRESETS} from '@starter/shared'

export default function UploadQueue() {
    const theme = useTheme()

    const {
        chartColors,
        droppedFiles,
        onFiles: handleDroppedFiles,
        allItems,
        handleQueueRemove,
        activeIdList,
        setActiveIdList,
        processMultipleSettings,
        isDesktop
    } = useContext(DataContext)

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
            <Stack direction={isDesktop ? 'row' : 'column'} spacing={1} sx={{width: '100%'}}>
                <Box sx={{display: 'flex', flexGrow: 1, padding: isDesktop ? '10px 8px 16px 0px' : '10px 0px 0px'}}>
                    <Dropzone
                        files={droppedFiles}
                        handleDroppedFiles={handleDroppedFiles}
                        accept={{'image/*': []}}
                        multiple
                        maxFiles={15}
                        maxMBperFile={15}
                        label='Drop grind photos here (max 6)'
                        zoneStyle={{
                            fontSize: '0.9rem', height: '100%', width: '100%',
                            borderRadius: 5,
                            padding: isDesktop ? '20px' : '5px'
                        }}
                        messgageStyle={{fontSize: '0.9rem', height: '100%', margin: '4px 0px'}}
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
                                    <>

                                        {!Object.keys(PSD_PRESETS).some(s => item.filename.includes(`-${s}`)) &&
                                            <IconButton onClick={() => processMultipleSettings(item.id)}>
                                                <TroubleshootIcon fontSize='small'
                                                                  style={{color: theme.palette.text.secondary}}/>
                                            </IconButton>
                                        }
                                        <IconButton edge='end' aria-label='delete' size='small'
                                                    onClick={() => handleDelete(item.id)}>
                                            <DeleteIcon fontSize='small'/>
                                        </IconButton>
                                    </>
                                }>

                                <Stack direction='row' alignItems='center'>
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

                                    <span style={{
                                        color: item.status === 'done' ? theme.palette.text.primary : theme.palette.text.secondary,
                                        fontSize: '0.9rem', marginLeft: 8
                                    }}>
                                            {item.filename}
                                        </span>

                                    <span style={{
                                        color: item.status === 'error' ? theme.palette.error.main : theme.palette.text.secondary,
                                        fontSize: '0.9rem', marginLeft: 8
                                    }}>
                                            ({item.status === 'error' ? item.error : item.status})
                                        </span>
                                </Stack>

                            </ListItem>
                        ))}

                    </List>
                }
            </Stack>

            {allItems.length > 2 &&
                <div style={{textAlign: 'right', marginRight: 10}}>
                    <Button onClick={() => handleDelete('all')}>Remove All</Button>
                </div>
            }

        </Paper>
    )
}
