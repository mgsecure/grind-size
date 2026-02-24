import React from 'react'
import {Outlet} from 'react-router-dom'
import DataProvider from './PsdDataProvider.jsx'
import {FilterProvider} from '../context/FilterContext.jsx'

export default function PsdParentRoute() {


    return (
        <FilterProvider filterFields={[]}>
            <DataProvider>
                <Outlet/>
            </DataProvider>
        </FilterProvider>
    )
}
