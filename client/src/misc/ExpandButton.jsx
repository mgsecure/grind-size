import {styled} from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import React, {useCallback} from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Tooltip from '@mui/material/Tooltip'

export default function ExpandButton({expanded, onChange, label = 'Details'}) {

    const tooltipText = expanded ? `Hide ${label}` : `Show ${label}`

    const handleChange = useCallback(() => {
        onChange(!expanded)
    }, [expanded, onChange])

    const ExpandMore = styled((props) => {
        const {expand, ...other} = props
        return <Tooltip title={tooltipText} arrow disableFocusListener><IconButton {...other} /></Tooltip>
    })(({theme, expand}) => ({
        transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
        marginLeft: 'auto',
        transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest
        })
    }))

    return (
            <ExpandMore style={{height: 36, width: 36}} onClick={handleChange} expand={expanded}>
                <ExpandMoreIcon fontSize='large'/>
            </ExpandMore>
    )
}