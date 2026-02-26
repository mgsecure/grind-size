import React from 'react'
import {Outlet} from 'react-router-dom'
import {FilterProvider} from '../context/FilterContext.jsx'
import DataProvider from './PsdDataProvider.jsx'
import UIProvider from './PsdUIProvider.jsx'

export default function PsdParentRoute() {

    console.log('Grind Size PSD Loading...')

    return (
        <FilterProvider filterFields={[]}>
            <DataProvider>
                <UIProvider>
                    <Outlet/>
                </UIProvider>
            </DataProvider>
        </FilterProvider>
    )
}
