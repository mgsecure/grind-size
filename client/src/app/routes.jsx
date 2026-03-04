import React, {Suspense} from 'react'
import {Outlet, redirect, Navigate} from 'react-router-dom'

import ErrorBoundary from './ErrorBoundary'
import LoadingDisplay from '../misc/LoadingDisplay.jsx'
import EnvAppBar from '../misc/EnvAppBar.jsx'

const style = {
    maxWidth: 800,
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
}

const AppShell = () => (
    <React.Fragment>
        <EnvAppBar/>
        <div style={{...style, fontFamily: 'Roboto, system-ui, sans-serif'}}>
            <Outlet/>
        </div>
    </React.Fragment>

)

export default [{
    element: <AppShell/>,
    errorElement: <ErrorBoundary/>,
    //HydrateFallback: () => <LoadingDisplay/>,
    HydrateFallback: () => {
    },
    children: [
        {
            path: '/',
            element: <Navigate replace to="/psd" />,
        },
        {
            path: '/psd',
            name: 'particle size distribution',
            lazy: async () => {
                const {default: PsdParentRoute} = await import('../psd/PsdParentRoute.jsx')
                return {element: <Suspense fallback={<LoadingDisplay/>}><PsdParentRoute/></Suspense>}
            },
            children: [
                {
                    path: '/psd',
                    lazy: async () => {
                        const {default: PsdRoute} = await import('../psd/PsdRoute.jsx')
                        return {element: <Suspense fallback={<LoadingDisplay/>}><PsdRoute/></Suspense>}
                    },
                }
            ]
        },
        {
            path: '/homepage',
            name: 'homepage',
            lazy: async () => {
                const {default: HomepageRoute} = await import('../homepage/HomepageRoute.jsx')
                return {element: <Suspense fallback={<LoadingDisplay/>}><HomepageRoute/></Suspense>}
            }
        },
        {
            path: '/userinfo',
            name: 'userinfo',
            lazy: async () => {
                const {default: UserInfoRoute} = await import('../userInfo/UserInfoRoute.jsx')
                return {element: <Suspense><UserInfoRoute/></Suspense>}
            }
        },
        {
            path: '/privacy',
            name: 'privacy policy',
            lazy: async () => {
                const {default: PrivacyRoute} = await import('../privacy/PrivacyRoute')
                return {element: <Suspense><PrivacyRoute/></Suspense>}
            }
        },
        {
            path: '/theme',
            name: 'theme viewer',
            lazy: async () => {
                const {default: ThemeViewerRoute} = await import('../test/ThemeViewer.jsx')
                return {element: <Suspense fallback={<LoadingDisplay/>}><ThemeViewerRoute/></Suspense>}
            }
        },
        {
            path: '/settings',
            name: 'settings',
            lazy: async () => {
                const {default: SettingsRoute} = await import('../settings/SettingsRoute')
                return {element: <Suspense fallback={<LoadingDisplay/>}><SettingsRoute/></Suspense>}
            }
        },
        {
            path: '*',
            name: '404 not found',
            lazy: async () => {
                const {default: NotFound} = await import('./NotFound.jsx')
                return {element: <Suspense fallback={<LoadingDisplay/>}><NotFound/></Suspense>}
            }
        }
    ].map(route => ({...route, errorElement: <ErrorBoundary/>}))
}]