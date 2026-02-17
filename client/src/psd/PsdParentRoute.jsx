import React from 'react'
import {Outlet} from 'react-router-dom'
import DataProvider from './PsdDataProvider.jsx'

export default function PsdParentRoute() {
    return (
        <DataProvider>
            <Outlet/>
        </DataProvider>
    )
}
