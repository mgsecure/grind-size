import Tooltip from '@mui/material/Tooltip'
import React, {useCallback, useContext} from 'react'
import IconButton from '@mui/material/IconButton'
import AppContext from '../app/AppContext'
import CampaignIcon from '@mui/icons-material/Campaign'

function UseTrackerButton() {
    const {useTracker, setUseTracker} = useContext(AppContext)

    const handleClick = useCallback(() => {
        setUseTracker(!useTracker)
    }, [useTracker, setUseTracker])

    const color = useTracker ? '#b30505' : '#3b3b3b'
    return (
        <Tooltip title={`Toggle Tracker ${useTracker ? 'Off' : 'On'}`} arrow disableFocusListener>
            <IconButton onClick={handleClick}>
                <CampaignIcon fontSize='medium' style={{color:color}}/>
            </IconButton>
        </Tooltip>
    )
}

export default UseTrackerButton
