import React, {useContext} from 'react'
import {Outlet} from 'react-router-dom'
import DataProvider from './ReportsDataProvider.jsx'
import DBContext from '../app/DBContext.jsx'

export default function ReportsParentRoute() {
    const {userProfile = {}} = useContext(DBContext)

    return (
        <DataProvider allEntries={[]} profile={userProfile}>
            <Outlet/>
        </DataProvider>
    )
}