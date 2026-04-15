import React, {useContext} from 'react'
import {Outlet} from 'react-router-dom'
import DataProvider from './ReportsDataProvider.jsx'
import DBContext from '../app/DBContext.jsx'
import AuthContext from '../app/AuthContext.jsx'
import MustBeLoggedIn from '../auth/MustBeLoggedIn.jsx'
import Nav from '../nav/Nav.jsx'
import useWindowSize from '../util/useWindowSize.jsx'
import DontHavePermission from '../auth/DontHavePermission.jsx'

export default function ReportsParentRoute() {
    const {userProfile = {}, adminRole} = useContext(DBContext)
    const {authLoaded, isLoggedIn} = useContext(AuthContext)
    const {isDesktop} = useWindowSize()

    const extras = (
        <React.Fragment>
            {isDesktop && <div style={{flexGrow: 1, minWidth: '10px'}}/>}
        </React.Fragment>
    )

    return (
        <>
            <Nav title='Reports' titleMobile='Reports' extras={extras}/>

            {authLoaded && !isLoggedIn && <MustBeLoggedIn actionText={'view reports'}/>}

            {authLoaded && isLoggedIn && !adminRole && <DontHavePermission actionText={'view reports'}/>}

            {authLoaded && adminRole &&
                <DataProvider allEntries={[]} profile={userProfile}>
                    <Outlet/>
                </DataProvider>
            }
        </>
    )
}