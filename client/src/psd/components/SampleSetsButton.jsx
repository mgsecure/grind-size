import React, {useCallback, useContext, useRef, useState} from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import {enqueueSnackbar} from 'notistack'
import DataContext from '../../context/DataContext.jsx'
import Button from '@mui/material/Button'
import UIContext from '../../context/UIContext.jsx'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import {Box, Link} from '@mui/material'
import fetchData from '../../util/fetchData.js'
import loadImport from '../components/loadImport.jsx'
import {cleanCount} from '../../util/stringUtils.js'


export default function SampleSetsButton({iconOnly = false, linkOnly = false}) {

    const {setQueue, setActiveIdList, sampleSets, setSampleSet, setSettings} = useContext(DataContext)
    const {altButtonColor} = useContext(UIContext)

    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), [])
    const handleClose = useCallback(() => {
        document.activeElement.blur()
        setAnchorEl(null)
    }, [])

    const domRef = useRef(null)

    const handleClick = useCallback((sampleSetId) => {
        domRef.current?.scrollIntoView({ behavior: 'smooth' })
        handleClose()
        const sampleSet = sampleSets.find(s => s.id === sampleSetId)
        if (!sampleSet) return
        fetchData(sampleSet.dataUrl).then(r => {
            if (r.data) {
                setQueue([])
                loadImport(r.data, {queue: [], setQueue, setActiveIdList})
                setSettings(prev => ({...prev, bins: sampleSet.binCount}))
                setSampleSet(sampleSet)
            }
            enqueueSnackbar(`${cleanCount(sampleSet.sampleCount, 'sample', false)} loaded from the ${sampleSet.name} dataset.`, {
                variant: 'success',
                autoHideDuration: 2000
            })
        }).catch(e => {
            console.error('error loading dataset', e)
            enqueueSnackbar(`Error loading dataset: ${e.message || e}`, {variant: 'error'})
        })
    }, [handleClose, sampleSets, setActiveIdList, setQueue, setSampleSet, setSettings])

    const menuItemStyle = {padding: '10px 16px'}

    return (
        <Box ref={domRef}>
            {linkOnly &&
                <Link onClick={handleOpen}>Choose Dataset...</Link>
            }

            {iconOnly &&
                <Tooltip title='Import Data' arrow disableFocusListener>
                    <IconButton onClick={handleOpen}>
                        <CloudDownloadIcon style={{color: altButtonColor}}/>
                    </IconButton>
                </Tooltip>
            }

            {!iconOnly && !linkOnly &&
                <Button
                    variant='text'
                    size='small'
                    onClick={handleOpen}
                    startIcon={<CloudDownloadIcon style={{color: altButtonColor}}/>}
                    style={{color: altButtonColor}}>
                    Choose Dataset...
                </Button>
            }

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {iconOnly &&
                    <MenuItem disabled>
                        <ListItemIcon>
                            <FileDownloadIcon fontSize='small'/>
                        </ListItemIcon>
                        <ListItemText>Choose Dataset...</ListItemText>
                    </MenuItem>
                }

                {sampleSets.map((set, idx) => (
                    <MenuItem key={idx} style={menuItemStyle} onClick={() => handleClick(set.id)}>
                        <ListItemText>{set.name}</ListItemText>
                    </MenuItem>
                ))}

            </Menu>
        </Box>
    )
}