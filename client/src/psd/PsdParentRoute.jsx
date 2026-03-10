import React from 'react'
import {Outlet} from 'react-router-dom'
import{MiniFilterProvider} from '../context/MiniFilterContext.jsx'
import DataProvider from './PsdDataProvider.jsx'
import UIProvider from './PsdUIProvider.jsx'

const EMPTY_FILTER_FIELDS = []

export default function PsdParentRoute() {
    return (
        <MiniFilterProvider filterFields={EMPTY_FILTER_FIELDS}>
            <DataProvider>
                <UIProvider>
                    <Outlet/>
                </UIProvider>
            </DataProvider>
        </MiniFilterProvider>
    )
}
