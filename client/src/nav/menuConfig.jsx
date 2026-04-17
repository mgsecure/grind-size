import React from 'react'
import HomeIcon from '@mui/icons-material/Home'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import AssessmentIcon from '@mui/icons-material/Assessment'
import QueryStatsIcon from '@mui/icons-material/QueryStats'
import TargetIcon from '../resources/targetIcon.jsx'

export default [
    {
        title: 'Home',
        icon: <HomeIcon fontSize='small'/>,
        path: '/',
    },
    {
        title: 'Download Templates',
        icon: <TargetIcon fontSize='small'/>,
        path: '/psd/template',
    },
    {
        title: 'Analysis Examples',
        icon: <QueryStatsIcon fontSize='small'/>,
        path: '/psd/examples',
    },
    {
        title: 'Sample Grind Images',
        icon: <KeyboardArrowRightIcon fontSize='small'/>,
        path: '/info',
        disabled: true,
    },
    {
        title: 'Help',
        icon: <KeyboardArrowRightIcon fontSize='small'/>,
        path: '/info',
        disabled: true,
    },
    {
        title: 'Other Resources',
        icon: <KeyboardArrowRightIcon fontSize='small'/>,
        path: '/info',
        disabled: true,
    },
    {
        title: 'Reports',
        icon: <AssessmentIcon fontSize='small'/>,
        path: '/reports',
        admin: true,
        userClaims: ['admin'],
        children: [
            {
                admin: true,
                userClaims: ['admin'],
                title: 'Site Report',
                path: '/reports'
            },
        ]
    },
]
