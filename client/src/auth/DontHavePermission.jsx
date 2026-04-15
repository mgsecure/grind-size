import React, {useContext} from 'react'
import AuthContext from '../app/AuthContext.jsx'
import Paper from '@mui/material/Paper'

export default function DontHavePermission({actionText = 'view this page', style}) {
    const {authLoaded} = useContext(AuthContext)

    if (!authLoaded) return null

    return (
        <Paper
            style={{
                display: 'flex', flexDirection: 'column',
                margin: 20,
                placeContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 500,
                textAlign: 'center',
                padding: 40,
                borderRadius: 5,
                minWidth: 350,
                ...style
            }}>
            <div>
                We&#39;re sorry,<br/>
                you don&#39;t have permission to<br/>
                {actionText}.
            </div>

        </Paper>
    )
}
