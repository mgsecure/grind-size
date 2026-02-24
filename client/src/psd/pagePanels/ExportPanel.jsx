import React, {useCallback, useContext, useMemo, useState} from 'react'
import {Stack, Paper, Typography, Button} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import {convertHistogramToCsv, convertParticlesToCsv, convertStatsToCsv, downloadFile} from '../analysis/exportCsv.js'
import DataContext from '../../context/DataContext.jsx'
import Collapse from '@mui/material/Collapse'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import SaveIcon from '@mui/icons-material/Save'
import {alpha, useTheme} from '@mui/material/styles'
import SelectBox from '../../formUtils/SelectBox.jsx'

export default function ExportPanel({result}) {
    const theme = useTheme()

    const {queue, binSpacing, isDesktop} = useContext(DataContext)
    //const queue = useMemo( () => allDone ? getQueue() : [], [allDone, getQueue])
    const queueItemNames = queue.map(item => item.filename)

    const [name, setName] = useState('')
    const [form] = useState({})
    const [editOpen] = useState(false)


    const canSave = useMemo(() => {
        const filename = result?.filename || 'sample'
        return (name.length > 1 && name !== filename && !queueItemNames.includes(name))
    }, [name, queueItemNames, result?.filename])

    const saveName = useCallback(() => {
    }, [])

    const handleExportParticles = () => {
        downloadFile(`${result.filename}_particles.csv`, convertParticlesToCsv(result.particles, result.scale.pxPerMm))
    }

    const handleExportStats = () => {
        downloadFile(`${result.filename}_stats.csv`, convertStatsToCsv(result.stats))
    }

    const handleExportHistogram = () => {
        const histogram = binSpacing === 'log' ? result.histograms?.log : result.histograms?.linear
        if (histogram) {
            downloadFile(`${result.filename}_histogram.csv`, convertHistogramToCsv(histogram))
        }
    }

    const exportAllCsv = () => {
        if (isDesktop) handleExportParticles()
        if (isDesktop) handleExportStats()
        if (isDesktop) handleExportHistogram()
    }

    return (
        <Stack direction='row' spacing={1} sx={{width: '100%'}}>


            <Paper sx={{p: 2, width: '100%'}}>
                <Typography style={{fontSize: '1.1rem', fontWeight: 500}}>EXPORT/IMPORT SAMPLES</Typography>

                <Stack direction='row' alignItems='center' justifyContent='space-between'
                       style={{marginBottom: 12, fontWeight: 500}}>
                    <Stack style={{marginTop: 0, width: '100%'}}>
                        <Stack style={{
                            fontSize: '1.0rem',
                            marginBottom: 8,
                            paddingBottom: 2
                        }}>
                            Full Sample Data
                        </Stack>
                        <SelectBox changeHandler={saveName}
                                   form={form}
                                   name='roastLevel'
                                   optionsList={['a', 'b']}
                                   multiple={false} defaultValue={''}
                                   size='small' width={150}/>
                    </Stack>
                </Stack>

                <Stack direction='row' spacing={1} sx={{mt: 2}}>
                    <Button
                        variant='outlined'
                        size='small'
                        startIcon={<DownloadIcon/>}
                        onClick={exportAllCsv}
                    >
                        All CSV Data Files
                    </Button>
                </Stack>

                <Collapse in={editOpen}>
                    <Stack direction='row' alignItems='center' style={{marginBottom: 12, fontWeight: 600}}>
                        <TextField type='text' name='name' fullWidth style={{minWidth: 300}}
                                   size='small'
                                   onChange={e => setName(e.target.value)} value={name}
                                   color='info'/>

                        <IconButton disabled={!canSave} onClick={saveName} style={{height: 36, width: 36}}>
                            <SaveIcon fontSize='small'
                                      style={{color: canSave ? theme.palette.success.main : alpha(theme.palette.text.primary, 0.5)}}/>
                        </IconButton>
                    </Stack>
                </Collapse>
            </Paper>

            <Paper sx={{p: 2, width: '100%'}}>
                <Typography style={{fontSize: '1.1rem', fontWeight: 500}}>SAVE CSV DATA</Typography>

                <Stack direction='row' alignItems='center' justifyContent='space-between'
                       style={{marginBottom: 12, fontWeight: 500}}>
                    <Stack style={{marginTop: 0, width: '100%'}}>
                        <Stack style={{
                            fontSize: '1.0rem',
                            marginBottom: 8,
                            paddingBottom: 2
                        }}>
                            Full Sample Data
                        </Stack>
                        <SelectBox changeHandler={saveName}
                                   form={form}
                                   name='roastLevel'
                                   optionsList={['a', 'b']}
                                   multiple={false} defaultValue={''}
                                   size='small' width={150}/>
                    </Stack>
                </Stack>

                <Stack direction='row' spacing={1} sx={{mt: 2}}>
                    <Button
                        variant='outlined'
                        size='small'
                        startIcon={<DownloadIcon/>}
                        onClick={exportAllCsv}
                    >
                        All CSV Data Files
                    </Button>
                </Stack>

                <Collapse in={editOpen}>
                    <Stack direction='row' alignItems='center' style={{marginBottom: 12, fontWeight: 600}}>
                        <TextField type='text' name='name' fullWidth style={{minWidth: 300}}
                                   size='small'
                                   onChange={e => setName(e.target.value)} value={name}
                                   color='info'/>

                        <IconButton disabled={!canSave} onClick={saveName} style={{height: 36, width: 36}}>
                            <SaveIcon fontSize='small'
                                      style={{color: canSave ? theme.palette.success.main : alpha(theme.palette.text.primary, 0.5)}}/>
                        </IconButton>
                    </Stack>
                </Collapse>
            </Paper>
        </Stack>
    )
}
