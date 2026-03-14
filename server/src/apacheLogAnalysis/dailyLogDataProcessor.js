#!/usr/bin/env node
// noinspection JSFileReferences

'use strict'

import fs from 'fs/promises'
import path from 'path'
import {exec} from 'child_process'
import { fileURLToPath }  from 'url'
import {setDeepAdd, setDeep} from '../util/setDeep.js'

// DAYJS SETUP
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import weekOfYear from 'dayjs/plugin/weekOfYear.js'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(weekOfYear)

// --- CONFIGURATION ---
const daysToReport = 777
const startDate = dayjs('2026-01-01')
const today = dayjs()
let endDate = today.subtract(1, 'day')
endDate = today

import {localUser, prodUser} from '../../keys/users.js'

const prodEnvironment = localUser !== process.env.USER
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.resolve(__dirname, 'dailyData')

import countryTZ from './country-timezones.json' with {type: 'json'}

const serverPath = prodEnvironment
    ? `/home/${prodUser}/coffee-grind.com/data`
    : `/Users/${localUser}/LOCAL/GitHubLocal/grind-size/client/public/data`

let siteStatsFull = {test: true}
const siteStatsFullJsonFile = path.join(serverPath, 'statsSiteFull.json')

// --- DATA AGGREGATION OBJECTS ---
let wip = {} // work-in-progress aggregates

wip.completedSearches = {}
wip.referrerViews = {}
wip.browsers = {}
wip.platforms = {}
wip.crawlerAgentRequests = {}
wip.requestsByLocalHour = {}
wip.requestsByServerHour = {}


if (process.argv[1] === fileURLToPath(import.meta.url)) {
    processDailyData().then()
}

export default async function processDailyData() {

// --- MAIN PROCESSING: Read daily data files and aggregate ---
    const allDataFiles = await fs.readdir(dataDir)
    const dataFiles = allDataFiles.filter(file => !['.', '..', '.DS_Store', 'New Folder With Items'].includes(file))
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

    for (const file of dataFiles) {
        const dateString = getDateStringFromFilename(file)
        if (!dateString) continue

        const requestDate = dayjs(dateString, 'YYYY-MM-DD')
        // Skip if out of range
        if (requestDate.isAfter(endDate) || requestDate.isBefore(startDate)) continue
        if (today.diff(requestDate, 'day') > daysToReport) continue

        const filePath = path.join(dataDir, file)
        let dayData = {}
        try {
            const content = await fs.readFile(filePath, 'utf8')
            dayData = JSON.parse(content)
        } catch (err) {
            console.error('Error reading or parsing', filePath, err)
            continue
        }

        // Determine the week key using the week number and first day of the week
        const firstDay = dayjs(requestDate).startOf('week').format('YYYY-MM-DD')

        setDeepAdd(wip, ['totals', 'numDays'], 1)
        setDeepAdd(wip, ['weeks', firstDay, 'numDays'], 1)

        // TODO: calculate this from log files using requests separated by X time?
        // setDeep(wip, ['last28days', dateString, 'visits'], dayData.visits)
        // setDeepAdd(wip, ['weeks', firstDay, 'visits'], dayData.visits)
        // setDeepAdd(wip, ['totals', 'visits'], dayData.visits)

        setDeep(wip, ['last28days', dateString, 'visitors'], dayData.visitors)
        setDeepAdd(wip, ['weeks', firstDay, 'visitors'], dayData.visitors)
        setDeepAdd(wip, ['totals', 'visitors'], dayData.visitors)

        if (dayData.pageViews) {
            for (const key in dayData.pageViews) {
                if (key !== 'undefined') {
                    setDeepAdd(wip, ['last28days', dateString, 'pageViews', key], dayData.pageViews[key])
                    setDeepAdd(wip, ['last28days', dateString, 'totalPageViews'], dayData.pageViews[key])
                }
                setDeepAdd(wip, ['totals', 'pageViews'], dayData.pageViews[key])
            }
        }
        if (dayData.errorPages) {
            for (const key in dayData.errorPages) {
                setDeepAdd(wip, ['errorPages', key], dayData.errorPages[key])
                setDeepAdd(wip, ['totals', 'errors'], dayData.pageViews[key])
            }
        }
        if (dayData.pageViewsByContinent) {
            for (const key in dayData.pageViewsByContinent) {
                setDeepAdd(wip, ['pageViewsByContinent', key], dayData.pageViewsByContinent[key])
            }
        }
        if (dayData.pageViewsByCountry) {
            for (const key in dayData.pageViewsByCountry) {
                setDeepAdd(wip, ['pageViewsByCountry', key], dayData.pageViewsByCountry[key])
                if (!wip.firstVisit?.[key] || requestDate.isBefore(dayjs(wip.firstVisit?.[key], 'YYYY-MM-DD'))) {
                    setDeep(wip, ['firstVisit', key], dateString)
                }
            }
        }
        if (dayData.visitorsByCountry) {
            for (const key in dayData.visitorsByCountry) {
                setDeepAdd(wip, ['visitorsByCountry', key], dayData.visitorsByCountry[key])
            }
        }
        if (dayData.pageViewsByState) {
            for (const key in dayData.pageViewsByState) {
                setDeepAdd(wip, ['pageViewsByState', key], dayData.pageViewsByState[key])
            }
        }
        if (dayData.pageViewsBySearchTerm) {
            for (const page in dayData.pageViewsBySearchTerm) {
                for (const term in dayData.pageViewsBySearchTerm[page]) {
                    setDeepAdd(wip, ['pageViewsBySearchTerm', page, term], dayData.pageViewsBySearchTerm[page][term])
                    setDeepAdd(wip, ['pageViewsBySearchTerm', 'total', term], dayData.pageViewsBySearchTerm[page][term])
                }
            }
        }
        if (dayData.pageViewsByWidth) {
            wip.lockViewsByWidth = wip.lockViewsByWidth || {}
            for (const key in dayData.pageViewsByWidth) {
                setDeepAdd(wip, ['pageViewsByWidth', key], dayData.pageViewsByWidth[key])
            }
        }
        if (dayData.referrerViews) {
            for (const key in dayData.referrerViews) {
                setDeepAdd(wip, ['referrerViews', key], dayData.referrerViews[key])
            }
        }
        if (dayData.browsers) {
            for (const key in dayData.browsers) {
                setDeepAdd(wip, ['browsers', key], dayData.browsers[key])
            }
        }
        if (dayData.platforms) {
            for (const key in dayData.platforms) {
                setDeepAdd(wip, ['platforms', key], dayData.platforms[key])
            }
        }
        if (dayData.crawlerAgentRequests) {
            for (const key in dayData.crawlerAgentRequests) {
                setDeepAdd(wip, ['crawlerAgentRequests', key], dayData.crawlerAgentRequests[key])
            }
        }
        if (dayData.requestsByLocalHour) {
            for (const key in dayData.requestsByLocalHour) {
                setDeepAdd(wip, ['requestsByLocalHour', key], dayData.requestsByLocalHour[key])
            }
        }
        if (dayData.requestsByServerHour) {
            for (const key in dayData.requestsByServerHour) {
                setDeepAdd(wip, ['requestsByServerHour', key], dayData.requestsByServerHour[key])
            }
        }
        setDeepAdd(wip, ['totals', 'logEntries'], dayData.logEntries)

    }


    //console.log(JSON.stringify(wip, null, 2))


    // --- EXECUTE REPORT BUILDING FUNCTIONS ---
    trafficByDate()
    trafficByWeek()
    popularCountries()
    lockViewsByBelt()
    pageTracking()
    platformBrowser()
    hourlyRequests()
    searchTerms()
    screenWidths()
    outputSiteFullJson()

    if (!prodEnvironment) {
        console.log(`Data Process Runtime: ${String(dayjs().diff(today, 'minute')).padStart(2, '0')}:${String(dayjs().diff(today, 'second')).padStart(2, '0')}.${String(dayjs().diff(today, 'millisecond')).substring(0, 2)}`)
        exec('say \'done\'')
    }

}

function getDateStringFromFilename(filename) {
    const match = filename.match(/(\d{4}-\d{2}-\d{2})/)
    return match ? match[1] : null
}

// --- FUNCTIONS FOR BUILDING REPORTS ---


// 5. trafficByDate – Daily traffic metrics (last 28 days)
function trafficByDate() {
    const daysToReportFiltered = 28
    let jsonData = {}
    let columnsArray = []
    let dataArray = []
    jsonData.title = ''
    const columns = [
        ['weekend', 'Weekend', 'hidden'],
        ['date', 'Date', 'left'],
        ['dateString', 'Date', 'left'],
        ['visitors', 'Visitors', 'center'],
        ['visits', 'Visits', 'center'],
        ['lockViews', 'Views', 'center']
    ]
    for (const col of columns) {
        columnsArray.push({id: col[0], name: col[1], align: col[2]})
    }
    jsonData.columns = columnsArray


    let totalVisitorsDate = 0, totalVisitsDate = 0, totalViewsDate = 0
    for (const date in wip.days) {
        totalVisitorsDate += wip.days[date].visitors || 0
        totalVisitsDate += wip.days[date].visits || 0
        totalViewsDate += wip.days[date].totalLockViews || 0
        const thisDate = dayjs(date, 'YYYY-MM-DD')
        if (thisDate.isBefore(endDate.subtract(daysToReportFiltered - 1, 'day'))) continue
        const weekend = (thisDate.day() === 0 || thisDate.day() === 6) ? 1 : 0
        dataArray.push({
            weekend: weekend,
            date: date,
            dateString: thisDate.format('MM/DD'),
            visitors: wip.days[date].visitors || 0,
            visits: wip.days[date].visits || 0,
            lockViews: wip.days[date].totalLockViews || 0
        })
    }
    jsonData.data = dataArray
    siteStatsFull.traffic28days = jsonData

    // Daily averages over the period
    const aveVisitors = Math.round(totalVisitorsDate / daysToReportFiltered)
    const aveVisits = Math.round(totalVisitsDate / daysToReportFiltered)
    const aveLockViews = Math.round(totalViewsDate / daysToReportFiltered)
    let jsonDailyAverages = {description: 'Daily Averages'}
    jsonDailyAverages.data = [
        {label: 'Visitors', value: aveVisitors},
        {label: 'Visits', value: aveVisits},
        {label: 'Lock Views', value: aveLockViews}
    ]
    siteStatsFull.dailyAverages = jsonDailyAverages

    // Totals since launch
    let jsonTotals = {description: 'Since Launch'}
    jsonTotals.data = [
        {label: 'Lock Views', value: wip.totals.totalLockViews},
        {label: 'Site Vists', value: wip.totals.visits},
        {label: 'Countries', value: Object.keys(wip.pageViewsByCountry).length}
    ]
    siteStatsFull.totals = jsonTotals
}


// 6. trafficByWeek
function trafficByWeek() {
    let jsonLockViewPoints = []
    for (const weekKey of Object.keys(wip.weeks).sort()) {
        // Skip partial weeks by comparing the difference with endDate
        const diff = dayjs(endDate.format('YYYY-MM-DD')).diff(dayjs(weekKey, 'YYYY-MM-DD'), 'day')
        if (diff > 5) {
            jsonLockViewPoints.push({x: weekKey, y: wip.weeks[weekKey].totalLockViews || 0})
        }
    }
    jsonLockViewPoints
        .filter(item => dayjs(item.x, 'YYYY-MM-DD').isAfter(dayjs('2024-02-20')))
        .sort((a, b) => dayjs(a.x, 'YYYY-MM-DD').valueOf() - dayjs(b.x, 'YYYY-MM-DD').valueOf())
    siteStatsFull.lockViews = [{id: 'Lock Views', data: jsonLockViewPoints}]
}

// 7. popularCountries – builds JSON data for popular countries, European countries, and US states
function popularCountries() {
    let countryAreas = []
    let europeanCountryAreas = []
    for (const key of Object.keys(wip.pageViewsByCountry).sort((a, b) => {
        // Descending order by visits
        return (wip.pageViewsByCountry[b] || 0) - (wip.pageViewsByCountry[a] || 0) || a.localeCompare(b)
    })) {
        if (key === 'Europe') continue
        countryAreas.push({area: key, visits: wip.pageViewsByCountry[key]})
        // If countryTZ mapping for this country indicates Europe
        if (countryTZ[key] && countryTZ[key][1] === 'Europe') {
            europeanCountryAreas.push({area: key, visits: wip.pageViewsByCountry[key]})
        }
    }
    let popularAreasJson = {}
    popularAreasJson.popularCountries = {description: 'Popular Countries', data: countryAreas}
    popularAreasJson.popularEuropeanCountries = {description: 'Popular European Countries', data: europeanCountryAreas}

    let stateAreas = []
    for (const key of Object.keys(wip.pageViewsByState).sort((a, b) => (wip.pageViewsByState[b] || 0) - (wip.pageViewsByState[a] || 0) || a.localeCompare(b))) {
        stateAreas.push({area: key, pageViews: wip.pageViewsByState[key]})
    }
    popularAreasJson.popularStates = {description: 'Popular US States', data: stateAreas}

    siteStatsFull.popularAreas = popularAreasJson
}

// 8. lockViewsByBelt – aggregates lock views by belt ranking
function lockViewsByBelt() {
    const beltRanks = {
        White: 1,
        Yellow: 2,
        Orange: 3,
        Green: 4,
        Blue: 5,
        Purple: 6,
        Brown: 7,
        Red: 8,
        Black: 9,
        Unranked: 10
    }
    let jsonLockViewsByBelt = {description: 'Lock Views By Belt'}
    let dataArray = []
    if (wip.lockViewsByBelt) {
        // Sort keys by defined beltRanks
        const sortedBelts = Object.keys(wip.lockViewsByBelt).sort((a, b) => (beltRanks[a] || 100) - (beltRanks[b] || 100))
        for (const belt of sortedBelts) {
            if (belt === '') continue
            const percentViews = ((wip.lockViewsByBelt[belt] / (wip.totals.totalLockViews || 1)) * 100).toFixed(1)
            dataArray.push({id: belt, label: belt, value: percentViews / 100})
        }
    }
    jsonLockViewsByBelt.data = dataArray
    siteStatsFull.lockViewsByBelt = jsonLockViewsByBelt
}

// 9. pageTracking – aggregates daily page tracking for selected pages (last 14 days)
function pageTracking() {
    const daysToReportFiltered = 14
    let jsonData = {}
    let columnsArray = []
    let dataArray = []
    //const reportPages = ['glossary', 'leaderboard', 'stats', 'profile', 'editprofile', 'about', 'admin', 'dials', 'other']
    const pageList = {
        total: 'total',
        profile: 'profile',
        error: 'error',
        dials: 'dials',
        dial: 'dial',
        leaderboard: 'leaderboard',
        scorecard: 'scorecard',
        editprofile: 'edit profile',
        beltRequirements: 'belt requirements',
        compact: 'compact',
        dans: 'dans',
        glossary: 'glossary',
        projects: 'projects',
        stats: 'stats',
        about: 'about',
        viewprofileredirect: 'profile redirect',
        admin: 'admin',
        upgrades: 'upgrades',
        viewscorecardredirect: 'scorecard redirect',
        award: 'award',
        'scorecard-howto': 'howto',
        'scorecard-info': 'info',
        importPreview: 'import preview',
        potListViews: 'rafl pot List',
        raflCharities: 'rafl charities',
        raflEnterAbout: 'rafl enter',
        raflForm: 'rafl form',
        raflStats: 'rafl stats'
    }

    // First column for date
    columnsArray.push({id: 'date', name: 'Date', align: 'left'})
    // Determine additional pages from the data
    let pages = new Set()
    for (const date in wip.days) {
        const dateObj = dayjs(date, 'YYYY-MM-DD')
        if (dateObj.isBefore(endDate.subtract(daysToReportFiltered, 'day'))) continue
        if (wip.days[date].pageViews) {
            for (const page in wip.days[date].pageViews) {
                if (page && !pages.has(page)) {
                    pages.add(page)
                }
            }
        }
    }
    pages = Array.from(pages)
    for (const page of pages) {
        columnsArray.push({id: page, name: pageList[page] || page, align: 'center'})
    }
    jsonData.title = ''
    jsonData.columns = columnsArray

    let filteredTotals = {}
    for (const date in wip.days) {
        const dateObj = dayjs(date, 'YYYY-MM-DD')
        if (dateObj.isBefore(endDate.subtract(daysToReportFiltered, 'day'))) continue
        let pagesDayData = {date: dateObj.format('MM/DD/YY')}
        if (wip.days[date].pageViews) {
            for (const page in wip.days[date].pageViews) {
                pagesDayData[page] = wip.days[date].pageViews[page] || 0
                filteredTotals[page] = (filteredTotals[page] || 0) + (wip.days[date].pageViews[page] || 0)
            }
        }
        dataArray.push(pagesDayData)
    }
    // Add a total row
    let pagesTotalData = {date: 'total'}
    for (const page of pages) {
        pagesTotalData[page] = filteredTotals[page] || 0
    }
    dataArray.push(pagesTotalData)
    jsonData.data = dataArray
    siteStatsFull.pageTracking = jsonData
}

// 10. platformBrowser – aggregates platform and browser data
function platformBrowser() {
    // Platforms
    const mainPlatforms = ['Android', 'Win10.0', 'iOS', 'Mac OS X', 'Linux']
    let platformData = []
    let otherPlatforms = 0
    for (const key of Object.keys(wip.platforms).sort((a, b) => (wip.platforms[b] || 0) - (wip.platforms[a] || 0))) {
        if (mainPlatforms.includes(key)) {
            platformData.push({id: key, label: key, value: wip.platforms[key]})
        } else {
            otherPlatforms += wip.platforms[key]
        }
    }
    platformData.push({id: 'Other', label: 'Other', value: otherPlatforms})

    // Browsers
    const mainBrowsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Samsung', 'Opera', 'Facebook']
    let browserData = []
    let otherBrowsers = 0
    for (const key of Object.keys(wip.browsers).sort((a, b) => (wip.browsers[b] || 0) - (wip.browsers[a] || 0))) {
        if (mainBrowsers.includes(key)) {
            browserData.push({id: key, label: key, value: wip.browsers[key]})
        } else {
            otherBrowsers += wip.browsers[key]
        }
    }
    browserData.push({id: 'Other', label: 'Other', value: otherBrowsers})

    siteStatsFull.trafficTotals = {platform: platformData, browser: browserData}
}

// 11. hourlyRequests – aggregates request counts by hour (using descriptive names)
function hourlyRequests() {
    const hourNames = [
        'midnight', '1 am', '2 am', '3 am', '4 am', '5 am', '6 am',
        '7 am', '8 am', '9 am', '10 am', '11 am', 'noon', '1 pm', '2 pm',
        '3 pm', '4 pm', '5 pm', '6 pm', '7 pm', '8 pm', '9 pm', '10 pm', '11 pm'
    ]
    let serverData = []
    let userData = []

    for (const hour in wip.requestsByLocalHour) {
        const hourNum = Number(hour)
        if (isNaN(hourNum) || hour === '') continue
        serverData.push({x: hourNames[hourNum], y: wip.requestsByServerHour[hour] || 0})
        userData.push({x: hourNames[hourNum], y: wip.requestsByLocalHour[hour] || 0})
    }
    serverData.sort((a, b) => hourNames.indexOf(a.x) - hourNames.indexOf(b.x))
    userData.sort((a, b) => hourNames.indexOf(a.x) - hourNames.indexOf(b.x))

    siteStatsFull.hourlyRequests = [
        {id: 'User Time', data: userData},
        {id: 'Server Time', data: serverData}
    ]
}

// 12. searchTerms – aggregates lock views by search term
function searchTerms() {
    let jsonData = {}
    jsonData.columns = [
        {id: 'term', name: 'Search Term', align: 'left'},
        {id: 'completedSearches', name: 'Searches', align: 'center'},
        {id: 'lockViews', name: 'Lock Views', align: 'center'}
    ]
    let dataArray = []
    for (const term of Object.keys(wip.completedSearches).sort((a, b) => (wip.completedSearches[b] || 0) - (wip.completedSearches[a] || 0))) {
        if (term) {
            dataArray.push({
                term: term,
                completedSearches: wip.completedSearches[term],
                lockViews: wip.lockViewsBySearch[term]
            })
        }
    }
    jsonData.data = dataArray
    jsonData.title = ''
    siteStatsFull.searchTerms = jsonData
}

// 13. screenWidths – aggregates lock views by screen width
function screenWidths() {
    let jsonData = {}
    jsonData.columns = [
        {id: 'width', name: 'Screen Width', align: 'left'},
        {id: 'lockViews', name: 'Lock Views', align: 'center'}
    ]
    let dataArray = []
    for (const width of Object.keys(wip.lockViewsByWidth).sort((a, b) => (wip.lockViewsByWidth[b] || 0) - (wip.lockViewsByWidth[a] || 0))) {
        if (width) {
            dataArray.push({width: Number(width), lockViews: wip.lockViewsByWidth[width]})
        }
    }
    jsonData.data = dataArray
    jsonData.title = ''
    siteStatsFull.screenWidths = jsonData
}

// 14. outputSiteFullJson – write final JSON with metadata
function outputSiteFullJson() {
    const dt = dayjs().tz('America/Los_Angeles')
    wip.metadata = {
        updatedDateTime: dt.format(),
        timezone: dt.format('z')
    }
    //fs.writeFile(siteStatsFullJsonFile, JSON.stringify(siteStatsFull, null, 2), 'utf8')
    //fs.writeFile('./statsSiteFull.json', JSON.stringify(wip, null, 2), 'utf8').then()
    fs.writeFile(siteStatsFullJsonFile, JSON.stringify(wip, null, 2), 'utf8').then()

}

