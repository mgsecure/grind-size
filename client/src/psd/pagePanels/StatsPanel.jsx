import React, {useContext, useRef} from 'react'
import {alpha, Box, lighten, Paper, Table, TableBody, TableCell, TableContainer, TableRow} from '@mui/material'
import {useTheme} from '@mui/material/styles'
import Stack from '@mui/material/Stack'
import DataContext from '../../context/DataContext.jsx'

export default function StatsPanel() {
    const {activeItems, isDesktop} = useContext(DataContext)
    const domEl = useRef(null)
    const theme = useTheme()
    const disabledStyle = {opacity: 0.5, pointerEvents: 'none'}

    if (!activeItems.length || activeItems[0].status !== 'done') return (
        <Paper sx={{p: isDesktop ? 2 : 1, width: '100%'}}>
            <Stack direction='row' alignItems='flex-end' justifyContent='space-between'
                   sx={{fontSize: '1.1rem', fontWeight: 500}} style={disabledStyle}>
                STATISTICS
            </Stack>
            <Box color={alpha(theme.palette.text.secondary, 0.4)}
                 sx={{
                     display: 'flex',
                     placeContent: 'center',
                     padding: '10px 0px 16px 0px',
                     width: '100%',
                     height: 100
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
                    No data to display.
                </Box>
            </Box>
        </Paper>
    )
    const {stats = {}} = activeItems[0]
    const metric = stats.metric || 'diameter'
    const unit = metric === 'diameter' ? 'μm' : (metric === 'surface' ? 'μm²' : 'μm³')

    const metricData = [
        {key: 'template', label: 'Template', unit: ''},
        {key: 'particleCount', label: 'Particle Count', unit: ''},
        {key: 'D10', label: 'D10', unit: unit},
        {key: 'D50', label: 'D50 (Median)', unit: unit},
        {key: 'D90', label: 'D90', unit: unit},
        {key: 'mode', label: 'Mode', unit: unit},
        {key: 'mean', label: 'Mean', unit: unit},
        {key: 'stdDev', label: 'Std Dev', unit: unit},
        {key: 'min', label: 'Min', unit: unit},
        {key: 'max', label: 'Max', unit: unit},
        {key: 'avgShortAxis', label: 'Avg Short Axis', unit: 'μm'},
        {key: 'avgLongAxis', label: 'Avg Long Axis', unit: 'μm'},
        {key: 'avgRoundness', label: 'Avg Roundness', unit: ''},
        {key: 'efficiency', label: 'Efficiency', unit: '%'},
        {key: 'span', label: 'Span', unit: '%'},
        {key: 'pixelScale', label: 'Pixel Scale', unit: ''}
    ]

    const metricDataOne = [
        {key: 'template', label: 'Template', unit: ''},
        {key: 'particleCount', label: 'Particle Count', unit: ''},
        {key: 'D10', label: 'D10', unit: unit},
        {key: 'D50', label: 'D50 (Median)', unit: unit},
        {key: 'D90', label: 'D90', unit: unit},
        {key: 'mode', label: 'Mode', unit: unit},
        {key: 'mean', label: 'Mean', unit: unit},
        {key: 'stdDev', label: 'Std Dev', unit: unit}
    ]

    const metricDataTwo = [
        {key: 'min', label: 'Min', unit: unit},
        {key: 'max', label: 'Max', unit: unit},
        {key: 'avgShortAxis', label: 'Avg Short Axis', unit: 'μm'},
        {key: 'avgLongAxis', label: 'Avg Long Axis', unit: 'μm'},
        {key: 'avgRoundness', label: 'Avg Roundness', unit: ''},
        {key: 'efficiency', label: 'Efficiency', unit: '%'},
        {key: 'span', label: 'Span', unit: '%'},
        {key: 'pixelScale', label: 'Pixel Scale', unit: ''}
    ]

    const tableData = activeItems.reduce((acc, item) => {
        acc[item.id] = {
            sampleName: item.sampleName,
            template: item.scale.detectedTemplate
                ? `${item.scale.detectedTemplate}${item.scale.detectedTemplate === 'Multiple' ? '' : 'mm'}`
                : 'None',
            particleCount: item.stats.count?.toFixed(0),
            D10: item.stats.D10?.toFixed(0),
            D50: item.stats.D50?.toFixed(0),
            D90: item.stats.D90?.toFixed(0),
            mode: item.stats.mode?.toFixed(0),
            mean: item.stats.mean?.toFixed(0),
            stdDev: item.stats.stdDev?.toFixed(0),
            min: item.stats.min?.toFixed(0),
            max: item.stats.max?.toFixed(0),
            avgShortAxis: parseFloat(item.stats?.avgShortAxis).toFixed(0),
            avgLongAxis: item.stats.avgLongAxis?.toFixed(0),
            pixelScale: item.scale.detectedTemplate !== 'Multiple' ? `${parseFloat(item.scale.pxPerMm).toFixed(2)} px/mm` : 'N/A',
            avgRoundness: item.stats.avgRoundness?.toFixed(1),
            efficiency: item.stats.efficiency?.toFixed(2),
            span: item.stats.span?.toFixed(2)
        }
        return acc
    }, {})

    const breakTables = activeItems.length < 2 && isDesktop
    const dataOne = !breakTables ? metricData : metricDataOne

    return (
        <Paper sx={{p: isDesktop ? 2 : 1}} ref={domEl}>
            <Stack direction='row' alignItems='flex-end' justifyContent='space-between'
                   sx={{fontSize: '1.1rem', fontWeight: 500}}>
                STATISTICS
            </Stack>
            <Stack direction={breakTables ? 'row' : 'column'} spacing={3} sx={{my: 2}}>
                <TableContainer component={Paper} sx={{}}>
                    <Table size='small' sx={{borderTop: '1px solid', borderColor: theme.palette.divider}}>
                        <TableBody>

                            {!breakTables &&
                                <TableRow key={'sampleName'}>
                                    <TableCell sx={{
                                        p: '0px 12px 0px 0px', width: '180px',
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 10,
                                        backgroundColor: theme.palette.background.paper,
                                        borderRight: `1px solid ${theme.palette.divider}`,
                                    }} />
                                    {activeItems.map(item => {
                                        const data = tableData[item.id]?.sampleName
                                        return <TableCell sx={{p: '6px 8px', fontWeight: 'bold'}}
                                                          key={item.id}>{data !== undefined ? data : 'N/A'}</TableCell>
                                    })}
                                    <TableCell sx={{p: '6px 8px', width: 'auto'}}/>
                                </TableRow>
                            }
                            {dataOne.map(({key, label, unit}) => (
                                <TableRow key={key} sx={{
                                    '&:hover': {backgroundColor: theme.palette.action.hover}
                                }}
                                >
                                    <TableCell sx={{
                                        p: '0px 12px 0px 4px',
                                        width: '180px',
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 10,
                                        backgroundColor: theme.palette.background.paper,
                                        borderRight: `1px solid ${theme.palette.divider}`,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {label}
                                    </TableCell>

                                    {activeItems.map((item, index) => {
                                        return <TableCell sx={{p: '6px 8px'}} key={item.id} style={{whiteSpace: 'nowrap'}}>
                                            {tableData[item.id]?.[key] !== undefined ? tableData[item.id]?.[key] : 'N/A'} {(index === activeItems.length - 1 && unit) ? unit : ''}
                                        </TableCell>
                                    })}
                                    <TableCell sx={{p: '6px 8px', width: 'auto'}}/>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {breakTables &&
                    <Table size='small' sx={{borderTop: '1px solid', borderColor: theme.palette.divider}}>
                        <TableBody>
                            {!breakTables &&
                                <TableRow key={'sampleName'}>
                                    <TableCell sx={{
                                        p: '0px 12px 0px 0px', width: '180px',
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 10,
                                        backgroundColor: 'inherit', // Must have background to prevent overlap
                                        borderRight: '1px solid #e0e0e0'
                                    }}></TableCell>
                                    {activeItems.map(item => {
                                        const data = tableData[item.id]?.sampleName
                                        return <TableCell sx={{p: '6px 8px', fontWeight: 'bold'}}
                                                          key={item.id}>{data !== undefined ? data : 'N/A'}</TableCell>
                                    })}
                                    <TableCell sx={{p: '6px 8px', width: 'auto'}}/>
                                </TableRow>
                            }
                            {metricDataTwo.map(({key, label, unit}) => (
                                <TableRow key={key} sx={{
                                    '&:hover': {backgroundColor: theme.palette.action.hover}
                                }}
                                >
                                    <TableCell sx={{
                                        p: '0px 12px 0px 0px', width: '180px',
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 10,
                                        backgroundColor: 'inherit', // Must have background to prevent overlap
                                        borderRight: '1px solid #e0e0e0'
                                    }}>
                                        {label}</TableCell>
                                    {activeItems.map((item, index) => {
                                        return <TableCell sx={{p: '6px 8px'}} key={item.id}>
                                            {tableData[item.id]?.[key] !== undefined ? tableData[item.id]?.[key] : 'N/A'} {(index === activeItems.length - 1 && unit) ? unit : ''}
                                        </TableCell>
                                    })}
                                    <TableCell sx={{p: '6px 8px', width: 'auto'}}/>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                }
            </Stack>
        </Paper>
    )
}
