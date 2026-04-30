import React, {useCallback, useContext, useRef, useState} from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import {enqueueSnackbar} from 'notistack'
import DataContext from '../../context/DataContext.jsx'
import Button from '@mui/material/Button'
import UploadIcon from '@mui/icons-material/Upload'
import UIContext from '../../context/UIContext.jsx'
import {Link} from '@mui/material'
import LoadingDisplaySmall from '../../misc/LoadingDisplaySmall.jsx'
import loadImport from '../components/loadImport.jsx'
import {cleanCount} from '../../util/stringUtils.js'

export default function ImportButton({iconOnly = false, linkOnly = false}) {

    const {queue, setQueue, setActiveIdList} = useContext(DataContext)
    const {altButtonColor, setCustomSampleParams, breakpoint} = useContext(UIContext)

    const hiddenFileInput = useRef(null)
    const handleClick = useCallback(() => {
        hiddenFileInput.current.click()
    }, [])

    // TODO: more robust valid check

    function readFileAsync(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (event) => {
                resolve({
                    name: file.name,
                    content: event.target.result
                })
            }
            reader.onerror = (err) => {
                reject(err)
            }
            reader.readAsText(file)
        })
    }

    const [loading, setLoading] = useState(false)

    const handleChange = useCallback(async (event) => {
        setLoading(true)
        const files = event.target.files
        if (!files) return
        const promises = [...files].map(file => readFileAsync(file))

        try {
            const fileContents = await Promise.all(promises)
            //console.log('All files read:', fileContents)

            fileContents.forEach(file => {
                try {
                    const jsonData = JSON.parse(file.content.toString())
                    loadImport(jsonData, {queue, setQueue, setActiveIdList, setCustomSampleParams})
                } catch (err) {
                    console.error('Error parsing JSON:', err)
                    throw new Error(`Error parsing JSON in file ${file.name}: ${err.message || err}`)
                }
            })

            enqueueSnackbar(`${cleanCount(fileContents.length, 'import', false)} completed`, {
                variant: 'success',
                autoHideDuration: 2000
            })

        } catch (err) {
            enqueueSnackbar(`Error reading file: ${err}`, {variant: 'error'})
        } finally {
            hiddenFileInput.current.value = null
            setLoading(false)
        }
    }, [queue, setActiveIdList, setCustomSampleParams, setQueue])


    return (
        <React.Fragment>
            {iconOnly &&
                <Tooltip title='Import Data' arrow disableFocusListener>
                    <IconButton onClick={handleClick}>
                        <UploadIcon style={{color: altButtonColor}}/>
                    </IconButton>
                </Tooltip>
            }

            {linkOnly &&
                <Link onClick={handleClick}>import demo data</Link>
            }

            {!iconOnly && !linkOnly &&
                <Button
                    variant='text'
                    size='small'
                    onClick={handleClick}
                    startIcon={loading
                        ? <span style={{marginRight: 0}}><LoadingDisplaySmall size='xsmall'/></span>
                        : <UploadIcon style={{color: altButtonColor}}/>}
                    style={{color: altButtonColor}}>
                    {breakpoint === 'xl' ? 'Import JSON' : 'Import JSON Data'}
                </Button>
            }

            <input
                type='file'
                ref={hiddenFileInput}
                onChange={handleChange}
                style={{display: 'none'}}
                accept='.json'
                multiple={true}
            />
        </React.Fragment>
    )
}