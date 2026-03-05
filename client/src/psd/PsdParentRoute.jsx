import React from 'react'
import {Outlet} from 'react-router-dom'
import {FilterProvider} from '../context/FilterContext.jsx'
import DataProvider from './PsdDataProvider.jsx'
import UIProvider from './PsdUIProvider.jsx'

const EMPTY_FILTER_FIELDS = []

export default function PsdParentRoute() {
    return (
        <FilterProvider filterFields={EMPTY_FILTER_FIELDS}>
            <DataProvider>
                <UIProvider>
                    <Outlet/>
                </UIProvider>
            </DataProvider>
        </FilterProvider>
    )
}
