import React, {useCallback, useContext, useEffect, useMemo} from 'react'
import {
    List,
    Paper,
    Typography,
    Stack,
    ListItem
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
import RefreshSingleButton from '../components/RefreshSingleButton.jsx'
import ItemInformationButton from '../components/ItemInformationButton.jsx'
import ExportButton from '../components/ExportButton.jsx'
import ImportButton from '../components/ImportButton.jsx'
import UIContext from '../../context/UIContext.jsx'

export default function UploadQueuePanel() {
    const theme = useTheme()

    const {
        droppedFiles,
        onFiles: handleDroppedFiles,
        queue,
        aggregateQueueItem = {},
        handleQueueRemove,
        activeIdList, setActiveIdList,
        processMultipleSettings
    } = useContext(DataContext)

    const {currentColors, aggregateColor, isDesktop} = useContext(UIContext)

    const selectEnabled = queue.length > 1 || activeIdList.length === 0

    const fullQueue = useMemo(() => {
        return aggregateQueueItem?.result ? [...queue, aggregateQueueItem] : queue
    }, [queue, aggregateQueueItem])

    const validIdList = useMemo(() => {
        return fullQueue
            .filter(item => (item.status === 'done'))
            .map(item => item.id)
    }, [fullQueue])

    const noErrorIdList = useMemo(() => {
        return fullQueue
            .filter(item => (item.status === 'done'))
            .map(item => item.id)
    }, [fullQueue])

    const validActiveIdList = activeIdList.filter(id => validIdList.includes(id))

    const handleSelect = useCallback((id) => {
        if (!selectEnabled) return
        const newList = activeIdList.includes(id)
            ? activeIdList.filter(i => i !== id)
            : [...activeIdList, id]
        const allItemIds = fullQueue.map(item => item.id)
        setActiveIdList(newList.sort((a, b) => allItemIds.indexOf(a) - allItemIds.indexOf(b)))
    }, [activeIdList, fullQueue, selectEnabled, setActiveIdList])

    useEffect(() => {
        if (queue.length === 1 && activeIdList.includes(aggregateQueueItem?.id)) {
            console.log('only one active item, clearing CurrentAggregateResults')
            setActiveIdList(prev => prev.filter(i => i !== aggregateQueueItem?.id))
        } else if (queue.length === 0 && activeIdList.length > 0) {
            console.log('no active items, clearing selection')
            setActiveIdList([])
        }
    }, [activeIdList, aggregateQueueItem, handleSelect, queue, setActiveIdList])

    const handleDelete = useCallback((id) => {
        handleQueueRemove(id)
        const newActiveIdList = activeIdList.filter(i => (i !== id && queue.find(q => q.id === i)))
        setActiveIdList(newActiveIdList)
    }, [activeIdList, handleQueueRemove, queue, setActiveIdList])

    return (
        <Paper sx={{p: isDesktop ? 2 : 1, width: '100%'}}>
            <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{width: '100%'}}>
                <Typography style={{fontSize: '1.1rem', fontWeight: 500}}>IMAGE QUEUE</Typography>
                <ImportButton text={true}/>
            </Stack>
            <Stack direction='column' spacing={1} sx={{width: '100%'}}>
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
                    {fullQueue.length > 0 &&
                        <Stack direction='column' spacing={1} sx={{width: '100%'}}>

                            <List dense sx={{}} style={{width: '100%'}}>
                                {fullQueue.map((item) => (
                                    <ListItem
                                        key={item.id}
                                        selected={activeIdList.includes(item.id)}
                                        style={{
                                            cursor: selectEnabled ? 'pointer' : 'default',
                                            padding: '4px 8px',
                                            minHeight: 44
                                        }}
                                        sx={{
                                            backgroundColor: activeIdList.includes(item.id) ? theme.palette.divider : 'inherit',
                                            '&:hover': selectEnabled ? {backgroundColor: theme.palette.action.hover} : {}
                                        }}
                                        onClick={() => (item.status === 'done') && handleSelect(item.id)}
                                        secondaryAction={
                                            item.id === 'CurrentAggregateResults' &&
                                            <Button onClick={() => handleDelete('all')}>Remove All</Button>
                                        }>

                                        <Stack direction='row' alignItems='center' justifyContent='space-between'
                                               sx={{width: '100%'}}>
                                            <Stack direction='row' alignItems='center'
                                                   sx={{flexGrow: 1, width: '100%'}}>
                                                {activeIdList.includes(item.id)
                                                    ? <CheckBoxIcon
                                                        fontSize='small'
                                                        style={{
                                                            marginRight: 8,
                                                            color: (item.id !== aggregateQueueItem?.id
                                                                    ? currentColors[noErrorIdList.indexOf(item.id)]
                                                                    : aggregateColor)
                                                                || theme.palette.primary.main
                                                        }}/>
                                                    : <CheckBoxOutlineBlankIcon
                                                        fontSize='small'
                                                        style={{marginRight: 8, color: theme.palette.divider}}/>
                                                }

                                                <Stack direction={isDesktop ? 'row' : 'column'}
                                                       alignItems={isDesktop ? 'center' : 'column'}
                                                       justifyContent='left' justifyItems='left'
                                                       sx={{flexGrow: 1, width: '100%'}}>

                                                    <div style={{
                                                        color: item.status === 'done' ? theme.palette.text.primary : theme.palette.text.secondary,
                                                        fontWeight: item.status === 'done' ? 600 : 400,
                                                        fontSize: '0.9rem', marginLeft: 8,
                                                        textAlign: 'left'
                                                    }}>
                                                        {item.sampleName || item.file?.name || 'Unnamed Sample'}
                                                    </div>

                                                    <div style={{
                                                        color: item.status === 'error' ? theme.palette.error.main : theme.palette.text.secondary,
                                                        fontSize: '0.9rem', marginLeft: 8
                                                    }}>
                                                        {item.id !== 'CurrentAggregateResults' &&
                                                            <>{item.status === 'done' ? item.result?.settings?.name : item.status}</>
                                                        }
                                                        {item.id !== 'CurrentAggregateResults' &&
                                                            <>{item.source && item.source !== 'upload' && ` (${item.source})`}</>
                                                        }
                                                    </div>
                                                </Stack>
                                            </Stack>

                                            {!item.id.includes('CurrentAggregateResults') &&
                                                <Stack direction='row' alignItems='center'
                                                       sx={{marginLeft: 1, flexGrow: 0}}>
                                                    {!Object.keys(PSD_PRESETS).some(s => item.filename?.includes(`-${s}`)) &&
                                                        item.status === 'done' &&
                                                        item.source !== 'import' &&
                                                        <IconButton
                                                            onClick={() => processMultipleSettings(item.id)}
                                                            disabled={!validActiveIdList.includes(item.id)}
                                                        >
                                                            <TroubleshootIcon fontSize='small'
                                                                              style={{
                                                                                  color: theme.palette.text.secondary,
                                                                                  opacity: item.status === 'done'
                                                                                      ? 1.0
                                                                                      : 0.5,
                                                                                  marginRight: 0
                                                                              }}/>
                                                        </IconButton>
                                                    }
                                                    {!Object.keys(PSD_PRESETS).some(s => item.filename?.includes(`-${s}`)) &&
                                                        item.status === 'done' &&
                                                        item.source !== 'import' &&
                                                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                            <RefreshSingleButton id={item.id}/>
                                                        </Box>
                                                    }

                                                    {['done', 'error'].includes(item.status) &&
                                                        <ItemInformationButton item={item}/>
                                                    }
                                                    <IconButton edge='end' aria-label='delete' size='small'
                                                                onClick={() => handleDelete(item.id)}>
                                                        <DeleteIcon fontSize='small'/>
                                                    </IconButton>
                                                </Stack>
                                            }
                                        </Stack>
                                    </ListItem>
                                ))}
                            </List>

                            <Stack direction='row' alignItems='center' justifyContent='space-between'
                                   sx={{width: '100%', pl: 4}} style={{marginTop: 0.5}}>
                                <ExportButton text={true}/>
                            </Stack>
                        </Stack>
                    }
                </Stack>
            </Stack>


        </Paper>
    )
}
