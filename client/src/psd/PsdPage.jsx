import React, {useContext} from 'react'
import {Stack, Paper, Typography, Alert, AlertTitle} from '@mui/material'
import UploadQueue from './components/UploadQueue.jsx'
import ImageViewer from './components/ImageViewer.jsx'
import ExportPanel from './components/ExportPanel.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import HistogramPanel from './components/HistogramPanel.jsx'
import ManualCornerSelector from './components/ManualCornerSelector.jsx'
import StatsTable from './components/StatsTable.jsx'
import DataContext from '../context/DataContext.jsx'

export default function PsdPage() {
    const {
        queue,
        settings, setSettings,
        droppedFiles,
        activeId, setActiveId,
        activeIdList, setActiveIdList,
        viewMode, setViewMode,
        xAxis, setXAxis,
        yAxis, setYAxis,
        binSpacing, setBinSpacing,
        resetToggle, setResetToggle,
        isAnalyzing,
        manualSelectionId,
        manualSelectionUrl,
        overlayOptions, setOverlayOptions,
        aggregateItem,
        allItems,
        activeItems,
        processedActive,
        globalMaxY,
        onFiles,
        handleManualCorners,
        cancelManual,
        handleQueueRemove
    } = useContext(DataContext)

    return (
        <Stack spacing={1} sx={{width: '100%'}}>
            {manualSelectionId && (
                <Paper sx={{p: 2}}>
                    <ManualCornerSelector
                        imageUrl={manualSelectionUrl}
                        onCornersSelected={handleManualCorners}
                        onCancel={cancelManual}
                    />
                </Paper>
            )}
            <Paper sx={{p: 2, width: '100%'}}>
                <Typography variant='h5'>Particle Size Distribution (PSD)</Typography>
                <Typography variant='body2' color='text.secondary'>
                    Upload up to 6 images.
                </Typography>
            </Paper>

            <UploadQueue
                droppedFiles={droppedFiles}
                handleDroppedFiles={onFiles}
                queueItems={allItems}
                handleQueueRemove={handleQueueRemove}
                activeId={activeId}
                activeIdList={activeIdList}
                setActiveIdList={setActiveIdList}
                onSelect={setActiveId}
                viewMode={viewMode}
                setViewMode={setViewMode}
                aggregateItem={aggregateItem}
            />

            <SettingsPanel
                queue={queue}
                settings={settings}
                setSettings={setSettings}
                resetToggle={resetToggle}
                setResetToggle={setResetToggle}/>

            <HistogramPanel
                activeItems={activeItems}
                xAxis={xAxis}
                setXAxis={setXAxis}
                yAxis={yAxis}
                setYAxis={setYAxis}
                settings={settings}
                setSettings={setSettings}
                binSpacing={binSpacing}
                setBinSpacing={setBinSpacing}
                maxY={binSpacing === 'log' ? globalMaxY.logMax : globalMaxY.linearMax}
            />

            {processedActive?.warnings?.length > 0 && (
                <Stack spacing={1} sx={{mb: 2}}>
                    {processedActive.warnings.map((w, i) => (
                        <Alert key={i} severity='warning'>
                            <AlertTitle>Analysis Warning</AlertTitle>
                            {w}
                        </Alert>
                    ))}
                </Stack>
            )}

            <Stack direction={{xs: 'column', md: 'row'}} spacing={2} sx={{width: '100%'}}>
                <Stack spacing={1} sx={{flex: 2}}>
                    {viewMode === 'aggregate' && (
                        <Paper sx={{p: 2}}>
                            <Typography variant='h6'>Aggregate Analysis</Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Displaying pooled statistics from
                                all {queue.filter(q => q.status === 'done').length} analyzed images.
                            </Typography>
                        </Paper>
                    )}

                    <StatsTable activeItems={activeItems}/>

                    <Stack direction={{xs: 'column', md: 'row'}} spacing={1} sx={{width: '100%'}}>
                        <ImageViewer result={processedActive} overlayOptions={overlayOptions}
                                     setOverlayOptions={setOverlayOptions}/>
                        <ExportPanel result={processedActive} binSpacing={binSpacing}/>
                    </Stack>
                </Stack>
            </Stack>

            <div style={{height: 100}}/>
        </Stack>
    )
}
