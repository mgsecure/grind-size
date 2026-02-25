import React, {useCallback, useContext, useEffect} from 'react'
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
        allItems,
        handleQueueRemove,
        activeIdList, setActiveIdList,
        processMultipleSettings,
    } = useContext(DataContext)

    const {chartColors, isDesktop} = useContext(UIContext)

    const selectEnabled = allItems.length > 1 || activeIdList.length === 0

    const validIdList = allItems
        .filter(item => (item.status === 'done' && !item.filename?.includes('aggregateResults')))
        .map(item => item.id)
    const validActiveIdList = activeIdList.filter(id => validIdList.includes(id))

    const handleSelect = useCallback((id) => {
        if (!selectEnabled) return
        const newList = activeIdList.includes(id)
            ? activeIdList.filter(i => i !== id)
            : [...activeIdList, id]
        const allItemIds = allItems.map(item => item.id)
        setActiveIdList(newList.sort((a, b) => allItemIds.indexOf(a) - allItemIds.indexOf(b)))
    }, [activeIdList, allItems, selectEnabled, setActiveIdList])

    useEffect(() => {
        if (activeIdList.length === 0 && validIdList.length > 0) {
            console.log('no active items, selecting first item')
            //validIdList[0] && handleSelect(validIdList[0])
        } else if (allItems.length === 1 && activeIdList.includes('aggregateResults')) {
            console.log('only one active item, clearing aggregateResults')
            setActiveIdList(prev => prev.filter(i => i !== 'aggregateResults'))
        } else if (allItems.length === 0 && activeIdList.length > 0) {
            console.log('no active items, clearing selection')
            setActiveIdList([])
        }
    }, [activeIdList, handleSelect, allItems, setActiveIdList, validIdList])

    const handleDelete = (id) => {
        handleQueueRemove(id)
        const newActiveIdList = activeIdList.filter(i => (i !== id && allItems.find(q => q.id === i)))
        setActiveIdList(newActiveIdList)
    }


    return (
        <Paper sx={{p: isDesktop ? 2 : 1, width: '100%'}}>

            <Stack direction='row' alignItems='center' justifyContent='space-between'
                   sx={{width: '100%'}}>

                <Typography style={{fontSize: '1.1rem', fontWeight: 500}}>IMAGES</Typography>
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
                    {allItems.length > 0 &&
                        <Stack direction='column' spacing={1} sx={{width: '100%'}}>

                            <List dense sx={{}} style={{width: '100%'}}>
                                {allItems.map(item => (
                                    <ListItem
                                        key={item.id}
                                        selected={activeIdList.includes(item.id)}
                                        style={{cursor: selectEnabled ? 'pointer' : 'default', padding: 10}}
                                        sx={{
                                            backgroundColor: activeIdList.includes(item.id) ? theme.palette.divider : 'inherit',
                                            '&:hover': selectEnabled ? {backgroundColor: theme.palette.action.hover} : {}
                                        }}
                                        onClick={() => (item.status === 'done') && handleSelect(item.id)}
                                        secondaryAction={
                                            item.id !== 'aggregateResults'
                                                ? <>
                                                    <Stack direction='row' alignItems='center' sx={{marginLeft: 10}}>
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
                                                                                      marginRight: 10
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

                                                        <ItemInformationButton item={item}/>

                                                        <IconButton edge='end' aria-label='delete' size='small'
                                                                    onClick={() => handleDelete(item.id)}>
                                                            <DeleteIcon fontSize='small'/>
                                                        </IconButton>
                                                    </Stack>
                                                </>
                                                : <Button onClick={() => handleDelete('all')}>Remove All</Button>

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
                                                fontWeight: item.status === 'done' ? 600 : 400,
                                                fontSize: '0.9rem', marginLeft: 8
                                            }}>
                                            {item.filename}
                                        </span>

                                            <span style={{
                                                color: item.status === 'error' ? theme.palette.error.main : theme.palette.text.secondary,
                                                fontSize: '0.9rem', marginLeft: 8
                                            }}>
                                                {item.id !== 'aggregateResults' &&
                                                    <>{item.status === 'done' ? item.settings?.name : item.status}</>
                                                }
                                                {item.id !== 'aggregateResults' &&
                                                    <>{item.source !== 'upload' && ` (${item.source})`}</>
                                                }
                                             </span>
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
