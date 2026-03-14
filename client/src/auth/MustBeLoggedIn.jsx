import React, {useContext} from 'react'
import SignInButton from '../auth/SignInButton.jsx'
import AuthContext from '../app/AuthContext.jsx'
import Paper from '@mui/material/Paper'

export default function MustBeLoggedIn({actionText = 'track your coffees', style}) {
    const {authLoaded, isLoggedIn} = useContext(AuthContext)

    if (!authLoaded || isLoggedIn) return null

    return (
        <Paper
            style={{
                display: 'flex', flexDirection: 'column',
                marginBottom: 20,
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
            You must be logged in to<br/>
            {actionText}.
            </div>

            <div style={{marginTop:30, placeContent: 'center', display: 'flex'}}>
                <SignInButton/>
            </div>

        </Paper>
    )
}
