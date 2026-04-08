import React, {useCallback, useContext, useMemo, useState} from 'react'
import {
    Box,
    Typography,
    Stack,
    Grid
} from '@mui/material'
import {useTheme} from '@mui/material/styles'
import Button from '@mui/material/Button'
import DataContext from '../../context/DataContext.jsx'
import UIContext from '../../context/UIContext.jsx'
import LoadingDisplaySmall from '../../misc/LoadingDisplaySmall.jsx'
import GrinderForm from '../components/GrinderForm.jsx'
import TextField from '@mui/material/TextField'
import ExpandButton from '../../misc/ExpandButton.jsx'
import dayjs from 'dayjs'
import {nodeServerUrl} from '../../data/dataUrls.js'
import {postData} from '../../formUtils/postData.jsx'
import Dialog from '@mui/material/Dialog'
import LoadingDisplay from '../../misc/LoadingDisplay.jsx'

export default function UploadPanel({showDetails, setShowDetails, queueRef}) {
    const theme = useTheme()

    const {
        queue,
        activeIdList
    } = useContext(DataContext)
    const {isDesktop} = useContext(UIContext)

    const fileQueue = useMemo(() => {
        return queue
            .filter(item => (item.file.path && (item.status === 'done' || item.status === 'error')))
    }, [queue])

    const toggleShowDetails = useCallback(() => {
        setShowDetails(!showDetails)
        queueRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [queueRef, setShowDetails, showDetails])

    const [form, setForm] = useState({type: 'Grinder', fileNotes: {}})
    const [formChanged, setFormChanged] = useState(false)
    const [response, setResponse] = useState(undefined)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState(undefined)

    const handleFormChange = useCallback((event) => {
        const {name, value} = event.target
        setForm({...form, [name]: value})
        setFormChanged(true)
    }, [form, setForm])

    const saveEnabled = useMemo(() => {
        return formChanged && form.type && (form.brand || form.newBrand) && !uploading
    }, [form.brand, form.newBrand, form.type, formChanged, uploading])

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault()
        setUploading(true)
        const brand = form.brand || form.newBrand
        const model = form.model || form.newModel
        const fullName = (brand && model)
            ? `${brand} ${model}`
            : `${brand || ''}${model || ''}`

        const fileNotesJson = JSON.stringify(form.fileNotes)

        const fileNotesArray = Object.keys(form.fileNotes).map(key => ({[key]: form.fileNotes[key]}))
        const formCopy = {
            ...form,
            brand,
            model,
            fullName,
            fileNotesJson,
            fileNotesArray
        }
        delete formCopy.newBrand
        delete formCopy.newModel
        delete formCopy.fileNotes

        const formData = new FormData()
        Object.keys(formCopy).forEach(key => {
            formData.append(key, formCopy[key])
        })

        const prefix = formCopy?.brand ? `${formCopy.brand}-`.replace('/', '+') : ''
        const suffix = formCopy?.model ? `${formCopy.model}-`.replace('/', '+') : ''
        const uploadsDir = `${prefix}${suffix}${dayjs().format('YYYYMMDD-HHmmss')}`.toLowerCase()

        queue.forEach((q) => {
            const {base, ext} = separateBasename(q.file.name)
            formData.append('files', q.file, `${uploadsDir}/${q.file.sampleName || base}.${ext}`.toLowerCase())
        })

        const url = `${nodeServerUrl}/psd`

        try {
            const results = await postData({url, formData, snackBars: false, timeoutDuration: 45000})
            console.log('results', results)
            setResponse(results)
            //handleComplete()
        } catch (error) {
            setUploadError(error)
        } finally {
            setUploading(false)
            setTimeout(() => {
                window.scrollTo({
                    left: 0,
                    top: 0,
                    behavior: 'smooth'
                })
            }, 100)
        }
    }, [form, queue])

    const _handleComplete = useCallback(() => {
        console.log('handle complete')
    }, [])

    const handleClose = useCallback(() => {
        setResponse(undefined)
        setUploading(false)
        setUploadError(undefined)
    }, [])

    const handleReload = useCallback(() => {
        handleClose()
        setShowDetails(false)
    }, [handleClose, setShowDetails])

    const handleFileNotesChange = useCallback((event) => {
        const {name, value} = event.target
        const newNotes = {...form.fileNotes}
        newNotes[name] = value
        setForm({...form, fileNotes: newNotes})
        //setFormChanged(true)
    }, [form, setForm])

    const thumb = {
        display: 'inline-flex',
        borderRadius: 2,
        border: '0px solid #333',
        marginBottom: 12,
        marginRight: 8,
        //width: 100,
        height: 140,
        padding: 4,
        boxSizing: 'border-box'
    }

    const thumbInner = {
        display: 'flex',
        minWidth: 0,
        overflow: 'hidden',
        alignItems: 'start'
    }

    const img = {
        display: 'block',
        width: 'auto',
        height: '100%'
    }

    return (
        <Box style={{marginTop: 16}}>
            <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{width: '100%'}}>
                <Typography style={{fontSize: '1.1rem', fontWeight: 500}}>SUBMIT IMAGES</Typography>
                <ExpandButton expanded={showDetails} onChange={toggleShowDetails}/>
            </Stack>

            <GrinderForm form={form} setForm={setForm} handleFormChange={handleFormChange}/>

            <Stack direction={isDesktop ? 'row' : 'column'} spacing={1} sx={{width: '100%'}}>
                {fileQueue.length > 0 &&
                    <Stack direction='column' spacing={1} sx={{width: '100%'}}>
                        <Grid container alignItems='center' justifyContent='space-between' spacing={1}
                              sx={{width: '100%', mb: 1}}>
                            {fileQueue.map((item) => (
                                <Grid
                                    key={item.id}
                                    selected={activeIdList.includes(item.id)}
                                    style={{
                                        padding: '4px 8px',
                                        minHeight: 44
                                    }}
                                    sx={{backgroundColor: theme.palette.divider}}
                                    size={{xs: 12, md: 6, xl: 12}}
                                >

                                    <Stack direction='row' alignItems='center'
                                           justifyContent='space-between'
                                           sx={{width: '100%'}}>
                                        <Stack direction='row' alignItems='center'
                                               sx={{flexGrow: 1, width: '100%'}}>

                                            <div style={thumb}>
                                                <div style={thumbInner}>
                                                    <img
                                                        src={item.file.preview}
                                                        style={img}
                                                        alt='image preview'
                                                        // Revoke data uri after image is loaded
                                                        onLoad={() => {
                                                            //URL.revokeObjectURL(item.file.preview)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <Stack direction='column'
                                                   justifyContent='left' justifyItems='left'
                                                   sx={{flexGrow: 1, width: '100%'}}>

                                                <div style={{
                                                    color: item.status === 'done' ? theme.palette.text.primary : theme.palette.text.secondary,
                                                    fontWeight: item.status === 'done' ? 600 : 400,
                                                    fontSize: '0.9rem', marginLeft: 0, marginBottom: 4,
                                                    textAlign: 'left'
                                                }}>
                                                    {item.sampleName || item.file?.name || 'Unnamed Sample'}
                                                </div>
                                                <TextField type='text' name={item.file.relativePath}
                                                           multiline
                                                           fullWidth
                                                           rows={3}
                                                           placeholder='Image notes'
                                                           id={item.file.relativePath}
                                                           value={form.fileNotes[item.file.relativePath] || ''}
                                                           onChange={handleFileNotesChange}
                                                           color='info'
                                                           style={{padding: 0}}
                                                           slotProps={{
                                                               htmlInput: {
                                                                   maxLength: 1000,
                                                                   style: {
                                                                       fontSize: '0.9rem',
                                                                       lineHeight: '1.3rem'
                                                                   }
                                                               },
                                                               input: {
                                                                   style: {padding: 10}
                                                               }
                                                           }}
                                                />

                                            </Stack>
                                        </Stack>
                                    </Stack>
                                </Grid>
                            ))}
                        </Grid>
                    </Stack>
                }
            </Stack>

            <div style={{marginTop: 16}}>
                <div style={{
                    fontSize: '1.0rem',
                    lineHeight: '1.3rem',
                    fontWeight: 400,
                    marginBottom: 3
                }}>
                    Overall notes <span
                    style={{color: theme.palette.text.secondary}}>(optional)</span>
                </div>
                <TextField type='text' name='notes' multiline fullWidth rows={3}
                           color='info'
                           style={{}} value={form.notes || ''}
                           id='notes' onChange={handleFormChange}
                           slotProps={{
                               htmlInput: {
                                   maxLength: 1000
                               }
                           }}
                />
            </div>

            <div style={{
                margin: '30px 0px 20px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Button onClick={handleReload} variant='outlined' color='info'
                        style={{marginRight: 16}}
                        disabled={uploading}>
                    CANCEL
                </Button>
                <Button onClick={handleSubmit} variant='contained' color='info'
                        disabled={!saveEnabled} style={{boxShadow: 'none'}}>
                    {uploading
                        ? <LoadingDisplaySmall size={'small'}/>
                        : 'UPLOAD'
                    }
                </Button>
            </div>

            <Dialog open={uploading} slotProps={{backdrop: {sx: {backgroundColor: 'rgba(0, 0, 0, 0.7)'}}}}>
                <div style={{width: 320, textAlign: 'center', padding: 30}}>
                    <LoadingDisplay/>
                </div>
            </Dialog>

            <Dialog open={!!response && !uploadError}
                    slotProps={{backdrop: {sx: {backgroundColor: 'rgba(0, 0, 0, 0.7)'}}}}>
                <div style={{display: 'flex'}}>
                    <div style={{backgroundColor: '#444', marginLeft: 'auto', marginRight: 'auto', padding: 40}}>
                        <div style={{
                            fontSize: '1.7rem',
                            fontWeight: 500,
                            marginBottom: 60,
                            textAlign: 'center'
                        }}>Grind images uploaded successfully!
                        </div>
                        <div style={{width: '100%', textAlign: 'center'}}>
                            <Button onClick={handleReload} variant='contained' color='info'
                                    style={{marginLeft: 'auto', marginRight: 'auto'}}>
                                OK
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog open={!!uploadError} slotProps={{backdrop: {sx: {backgroundColor: 'rgba(0, 0, 0, 0.7)'}}}}>
                <div style={{display: 'flex'}}>
                    <div style={{backgroundColor: '#444', marginLeft: 'auto', marginRight: 'auto', padding: 40}}>
                        <div style={{fontSize: '1.7rem', fontWeight: 500, marginBottom: 20, textAlign: 'center'}}>
                            Something went wrong.<br/>
                            Please try again later.<br/>
                        </div>
                        <div style={{fontSize: '0.95rem', fontWeight: 400, marginBottom: 20, textAlign: 'center'}}>
                            {uploadError?.message.toString()}<br/>
                            { uploadError?.status && `(Error code ${uploadError?.status?.toString()})` }
                        </div>

                        <div style={{width: '100%', textAlign: 'center'}}>
                            <Button onClick={handleClose} variant='contained' color='error'
                                    style={{marginLeft: 'auto', marginRight: 'auto'}}>
                                OK
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>

        </Box>
    )
}

function separateBasename(file) {
    const lastDotIndex = file.lastIndexOf('.')
    if (lastDotIndex === -1) {
        return {base: file, ext: ''}
    }
    return {base: file.substring(0, lastDotIndex), ext: file.substring(lastDotIndex)}
}
