import React from 'react'
import {FilterProvider} from '../context/FilterContext.jsx'
import usePageTitle from '../util/usePageTitle'

export default function ViewProfileRoute() {

    usePageTitle('My Setup')
    return (
        <FilterProvider filterFields={[]}>
                <span>View Profile</span>
        </FilterProvider>
    )
}