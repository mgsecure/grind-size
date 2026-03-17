import React, {useContext} from 'react'
import ToggleColorMode from '../misc/ToggleColorMode.jsx'
import AppContext from '../app/AppContext.jsx'
import DBContext from '../app/DBContext.jsx'
import Switch from '@mui/material/Switch'
import usePageTitle from '../util/usePageTitle.jsx'


export default function SettingsPage() {
    usePageTitle('Toggle Flags')

    const {admin, setAdmin, beta, setBeta, useTracker, setUseTracker} = useContext(AppContext)
    const {demo, setDemo} = useContext(DBContext)

    return (
        <React.Fragment>
            <div style={{padding: 44}}>
                <h1>Toggle!</h1>

                <table style={{borderCollapse: 'collapse', maxWidth: '100%'}}>
                    <thead>
                    <tr>
                        <th style={{textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #ccc'}}>Setting</th>
                        <th style={{textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #ccc'}}>Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td style={{padding: '8px 12px'}}>Admin Mode</td>
                        <td style={{padding: '8px 12px'}}>
                            <Switch
                                checked={admin}
                                onChange={(e) => setAdmin(e.target.checked)}
                                name='adminMode'
                                color='primary'
                            />
                        </td>
                    </tr>
                    <tr>
                        <td style={{padding: '8px 12px'}}>Use Tracker</td>
                        <td style={{padding: '8px 12px'}}>
                            <Switch
                                checked={useTracker}
                                onChange={(e) => setUseTracker(e.target.checked)}
                                name='useTracker'
                                color='primary'
                            />
                        </td>
                    </tr>
                    <tr>
                        <td style={{padding: '8px 12px'}}>Beta Mode</td>
                        <td style={{padding: '8px 12px'}}>
                            <Switch
                                checked={beta}
                                onChange={(e) => setBeta(e.target.checked)}
                                name='betaMode'
                                color='primary'
                            />
                        </td>
                    </tr>
                    <tr>
                        <td style={{padding: '8px 12px'}}>Demo Mode</td>
                        <td style={{padding: '8px 12px'}}>
                            <Switch
                                checked={demo}
                                onChange={(e) => setDemo(e.target.checked)}
                                name='demoMode'
                                color='primary'
                            />
                        </td>
                    </tr>
                    </tbody>
                </table>

            </div>

            <ToggleColorMode/>
        </React.Fragment>
    )
}
