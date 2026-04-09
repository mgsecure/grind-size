import React from 'react'
import HomeIcon from '@mui/icons-material/Home'
import FeedIcon from '@mui/icons-material/Feed'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import InfoOutlineIcon from '@mui/icons-material/InfoOutline'
import AssessmentIcon from '@mui/icons-material/Assessment'

export default [
    {
        title: 'Home',
        icon: <HomeIcon fontSize='small'/>,
        path: '/',
    },
    {
        title: 'Help',
        icon: <KeyboardArrowRightIcon fontSize='small'/>,
        path: '/info',
        disabled: true,
    },
    {
        title: 'Analysis Examples',
        icon: <KeyboardArrowRightIcon fontSize='small'/>,
        path: '/info',
        disabled: true,
    },
    {
        title: 'Sample Grind Images',
        icon: <KeyboardArrowRightIcon fontSize='small'/>,
        path: '/info',
        disabled: true,
    },
    {
        title: 'Download Templates',
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
        title: 'My Account',
        icon: <AccountCircleIcon fontSize='small'/>,
        path: '/info',
        disabled: true,
    },
    {
        title: 'My Samples',
        icon: <FeedIcon fontSize='small'/>,
        path: '/info',
        disabled: true,
        params: {
            search: undefined,
            id: undefined,
            name: undefined
        },
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
    {
        title: 'Privacy Policy',
        icon: <InfoOutlineIcon fontSize='small'/>,
        path: '/privacy',
    },
]
