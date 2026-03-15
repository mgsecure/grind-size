import React from 'react'
import HomeIcon from '@mui/icons-material/Home'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import FeedIcon from '@mui/icons-material/Feed'
import ConstructionIcon from '@mui/icons-material/Construction'
import CoffeeIcon from '@mui/icons-material/Coffee'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import TableChartIcon from '@mui/icons-material/TableChart'
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import DescriptionIcon from '@mui/icons-material/Description'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import InfoOutlineIcon from '@mui/icons-material/InfoOutline'
import LogoutIcon from '@mui/icons-material/Logout'
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
        title: 'Sign Out',
        icon: <LogoutIcon fontSize='small'/>,
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
    {
        title: 'Privacy Policy',
        icon: <InfoOutlineIcon fontSize='small'/>,
        path: '/privacy',
    },
]
