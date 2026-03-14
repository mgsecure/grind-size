#!/usr/bin/env node
// noinspection JSFileReferences

'use strict'

// REQUIRED MODULES
import fs from 'fs/promises'
import {useragent} from 'express-useragent'
import {exec} from 'child_process'
import geoip from 'geoip-lite'
import {countries} from './tzCountryList.js'
import {localUser} from '../../keys/users.js'
import {setDeep, setDeepAdd, setDeepUnique} from '../util/setDeep.js'

import path from 'path'
import {fileURLToPath} from 'url'

// CONFIGURATION

const domainName = 'coffee-grind' // no TLD
const mainImage = 'psd' // no extension, assumes .gif

// DIRECTORIES

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const componentsDir = path.resolve(__dirname)
const logsPath = path.resolve(__dirname, 'logs')
const dataDir = path.resolve(__dirname, 'dailyData')

// PROCESS IF CALLED DIRECTLY //
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    analyzeLogs().then()
}
/////////////////////////////////

const prodEnvironment = localUser !== process.env.USER

// DAYJS SETUP WITH PLUGINS
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

// CONFIGURATION
const filterInternal = false
const daysToReport = 9999

// Date configuration (using YYYYMMDD format)
const startDate = dayjs('2026-01-01')
const today = dayjs()
let endDate = today.subtract(1, 'day')
endDate = today

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ignoreFiles = ['.', '..', '.DS_Store', 'New Folder With Items']

// GLOBAL VARIABLES
let logLines = 0
let stats = {}
let temp = {}
let crawlerAgents = []
let crawlerAgentNames = {}
let dataFiles = []

export default async function analyzeLogs() {

    let allLogFiles = await fs.readdir(logsPath)
    let logFiles = allLogFiles
        .filter(file => file.match(/^access/i))
        .filter(file => !ignoreFiles.includes(file))
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

    getCrawlerUserAgents(path.join(componentsDir, 'crawler-user-agents.json')).then()
    getCrawlerUserAgents(path.join(componentsDir, 'crawler-user-agents-local.json')).then()

    // DELETE any json files fom today
    const dateString = dayjs().format('YYYY-MM-DD')
    let allDailyFiles = await fs.readdir(dataDir)
    let todaysDailyFiles = allDailyFiles
        .filter(file => file.includes(dateString) && file.match(/\.json$/i))
    for (const file of todaysDailyFiles) {
        deleteFile(path.join(dataDir, file)).then()
    }
    //console.log(`Deleting ${todaysDailyFiles.length} daily files from ${dateString}`, todaysDailyFiles)

    // READ DATA FILE NAMES from dataDir (we only need the date portion from filenames)
    let allDataFiles = await fs.readdir(dataDir)
    allDataFiles.forEach(file => {
        if (ignoreFiles.includes(file)) return
        let parts = file.split('_')
        if (parts.length > 0) {
            dataFiles.push(parts[0])
        }
    })

    for (const logFileName of logFiles) {
        await processLogFile(logFileName)
    }

    writeDailyFiles().then()

    if (!prodEnvironment) {
        console.log(`Data Process Runtime: ${String(dayjs().diff(today, 'minute')).padStart(2, '0')}:${String(dayjs().diff(today, 'second')).padStart(2, '0')}.${String(dayjs().diff(today, 'millisecond')).substring(0, 2)}`)
        console.log(`Processed ${logLines} log entries`)
        exec('say \'analysis complete\'')
    }


}

async function processLogFile(logFileName) {
    const fullLogPath = path.join(logsPath, logFileName)
    const logContent = await fs.readFile(fullLogPath, 'utf8')
    const lines = logContent.split('\n')

    lines.forEach(line => {
        if (!line.trim()) return
        logLines++
        line = line.replace(/\s+/g, ' ')

        // 45.48.2.162 - - [25/Jan/2026:17:04:29 -0800] "GET /i/bean.gif?page=https%3A%2F%2Fcoffee-tracker.com%2Freports&r=c3gfutbe&ref=https%3A%2F%2Fcoffee-tracker.com%2F&trk=reports&w=1512 HTTP/2.0" 200 92 "https://coffee-tracker.com/reports" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
        // Regex: clientAddress rfc1413 username [localTime] "httpRequest" statusCode bytesSent "referer" "clientSoftware"
        const logRegex = /^(\S+) (\S+) (\S+) \[(.+?)\] "(.+?)" (\S+) (\S+) "(.*?)" "(.*?)"/
        const match = logRegex.exec(line)
        if (!match) return

        let [
            _,
            clientAddress,
            _rfc1413,
            _username,
            localTime,
            httpRequest,
            _statusCode,
            _bytesSentToClient,
            referer,
            clientSoftware
        ] = match

        // Filter out specific referers
        // if (referer === 'http://localhost:3000/') return

        if (filterInternal) {
            if (referer === 'https://github.com/NiXXeD/lpu-belt-explorer/blob/main/src/data/data.json' ||
                referer === 'https://github.com/Lockpickers-United/lpu-belt-explorer/blob/main/src/data/data.json' ||
                referer === 'https://images.lpubelts.com/lpubelts-images-by-lock.html' ||
                ['71.105.242.55', '71.247.6.65', '100.37.88.15', '45.48.21.72', '75.168.138.35'].includes(clientAddress)
            ) {
                return
            }
        }

        // Split httpRequest into parts
        const httpParts = httpRequest.split(' ')
        if (httpParts.length < 2) return
        const fileRequested = httpParts[1]

        if (!fileRequested.match(/\/i\//i)) return

        // DATE PROCESSING
        const [datePart, ...timeParts] = localTime.split(':')
        const [requestDay, requestMonth, requestYear] = datePart.split('/')
        const timeString = timeParts.slice(0, 3).join(':')
        const requestDateTimeFull = dayjs(`${requestDay} ${requestMonth} ${requestYear} ${timeString}`, 'DD MMM YYYY HH:mm:ss')
        const requestDateText = `${requestYear}-${('0' + (months.indexOf(requestMonth) + 1)).slice(-2)}-${('0' + requestDay).slice(-2)}`
        const requestDate = dayjs(requestDateText, 'YYYY-MM-DD')

        if (requestDate.isBefore(startDate) || requestDate.isAfter(endDate)) return
        if (today.diff(requestDate, 'day') > daysToReport) return
        if (dataFiles.includes(requestDateText) && requestDateText !== dayjs().format('YYYY-MM-DD')) return

        // Update min and max times
        if (!temp[requestDateText]?.minTime || requestDateTimeFull.isBefore(temp[requestDateText].minTime))
            setDeep(temp, [requestDateText, 'minTime'], requestDateTimeFull)

        if (!temp[requestDateText].maxTime || requestDateTimeFull.isAfter(temp[requestDateText].maxTime))
            setDeep(temp, [requestDateText, 'maxTime'], requestDateTimeFull)

        // Process crawler agents based on clientSoftware
        if (clientSoftware.match(/google/i) || clientSoftware.match(/ahrefs/i) || clientSoftware.match(/facebookexternalhit/i)) {
            setDeepAdd(stats, [requestDateText, 'crawlerAgentRequests', crawlerAgentNames[clientSoftware]], 1)
            return
        }
        if (crawlerAgentNames[clientSoftware]) {
            setDeepAdd(stats, [requestDateText, 'crawlerAgentRequests', crawlerAgentNames[clientSoftware]], 1)
            return
        }

        // Increment IP counter
        setDeepUnique(temp, [requestDateText, 'ipAddresses'], clientAddress)

        const geo = geoip.lookup(clientAddress)
        const requestCountry = geo ? geo.country : 'Unknown'
        const requestState = geo && geo.region ? geo.region : undefined
        setDeepUnique(temp, [requestDateText, 'ipsByCountry', requestCountry], clientAddress)


        // https://gist.github.com/pamelafox/986163
        const tzCountry = countries.find(c => c.timezones.includes(geo?.timezone)) || {}
        const requestContinent = tzCountry.continent

        const serverTZ = 'America/Los_Angeles'
        const serverOffset = dayjs().tz(serverTZ).utcOffset() // in minutes
        if (geo?.timezone) {
            let dt = requestDateTimeFull.tz(geo?.timezone)
            let localOffset = dayjs().tz(geo?.timezone).utcOffset()
            let hourOffset = (localOffset - serverOffset) / 60
            let adjustedDT = dt.add(hourOffset, 'hour')
            let localHour = adjustedDT.format('HH')
            setDeepAdd(stats, [requestDateText, 'requestsByLocalHour', localHour], 1)
            setDeepAdd(stats, [requestDateText, 'requestsByServerHour', requestDateTimeFull.format('HH')], 1)
        }

        // PARSE BEACON REQUESTS

        let baseUrl = `https://${domainName}.com`
        const url = new URL(fileRequested, baseUrl)

        const trkString = url.searchParams.get('trk')?.trim()
        const pageString = url.searchParams.get('page')?.trim()
        const screenWidthString = url.searchParams.get('w')?.trim()
        const refString = url.searchParams.get('ref')?.trim()
        const searchTerm = url.searchParams.get('search')?.trim().toLowerCase()

        const refStringRe = new RegExp(`(https://${domainName}.com/).*/`)
        const pageStringRe = new RegExp(`(https:\/\/${domainName}\.com\/(\w+).*/).*/`)

        let cleanReferrerString = refString ? refString.replace(refStringRe, '$1').trim() : undefined
        const cleanPage = pageString?.replace(pageStringRe, '$1') || 'unknown'

        if (cleanReferrerString) {
            setDeepAdd(stats, [requestDateText, 'referrerViews', cleanReferrerString], 1)
        }

        const mainImageRe = new RegExp(`/i/${mainImage}.gif`, 'i')

       // if (fileRequested.match(/\/i\/bean\.gif/i)) {
        if (fileRequested.match(mainImageRe)) {
            setDeepAdd(stats, [requestDateText, 'beacons'], 1)
            setDeepAdd(stats, [requestDateText, 'pageViews', trkString], 1)

            setDeepAdd(stats, [requestDateText, 'pageViewsByCountry', requestCountry], 1)
            setDeepAdd(stats, [requestDateText, 'pageViewsByContinent', requestContinent], 1)
            if (requestState && requestCountry === 'US') {
                setDeepAdd(stats, [requestDateText, 'pageViewsByState', requestState], 1)
            }

            if (screenWidthString) {
                setDeepAdd(stats, [requestDateText, 'pageViewsByWidth', screenWidthString], 1)
            }

            if (searchTerm) {
                setDeepAdd(stats, [requestDateText, 'pageViewsBySearchTerm', cleanPage, searchTerm], 1)
            }

            if (trkString === 'error') {
                setDeepAdd(stats, [requestDateText, 'errorPages', cleanPage], 1)
            }

        }

        // USER AGENT PROCESSING
        let uaResult = useragent.parse(clientSoftware)
        let uaPlatform = uaResult.os || 'Other'
        let uaBrowser = uaResult.browser || 'Other'
        setDeepAdd(stats, [requestDateText, 'platforms', uaPlatform], 1)
        setDeepAdd(stats, [requestDateText, 'browsers', uaBrowser], 1)
    })
}


async function writeDailyFiles() {

    Object.keys(temp).forEach(requestDateText => {
        stats[requestDateText].minTime = temp[requestDateText].minTime.format()
        stats[requestDateText].maxTime = temp[requestDateText].maxTime.format()
        stats[requestDateText].visitors = temp[requestDateText].ipAddresses
            ? Object.keys(temp[requestDateText].ipAddresses).length
            : 0
        //         setDeepUnique(temp, [requestDateText, 'ipsByCountry', requestCountry], clientAddress)
        stats[requestDateText].visitorsByCountry = temp[requestDateText].ipsByCountry
            ? Object.keys(temp[requestDateText].ipsByCountry)
                .reduce((acc, requestCountry) => {
                    setDeep(acc, [requestCountry], temp[requestDateText].ipsByCountry[requestCountry].length)
                    return acc
                }, {})
            : {}
    })

    // WRITE JSON OUTPUT FILES per date
    Object.keys(temp).forEach(requestDateText => {
        let minTimeStr = temp[requestDateText].minTime.format('HHmm')
        let maxTimeStr = temp[requestDateText].maxTime.format('HHmm')
        let filename = `${requestDateText}_${minTimeStr}-${maxTimeStr}.json`
        let outputPath = path.join(dataDir, filename)
        fs.writeFile(outputPath, JSON.stringify(stats[requestDateText], null, 2), 'utf8').then()
    })
}

async function getCrawlerUserAgents(jsonPath) {
    try {
        const data = JSON.parse(await fs.readFile(jsonPath, 'utf8'))
        data.forEach(crawler => {
            crawler.instances.forEach(agent => {
                crawlerAgents.push(agent)
                crawlerAgentNames[agent] = crawler.pattern
            })
        })
    } catch (err) {
        console.error('Error reading crawler user agents from', jsonPath, err)
    }
}

async function deleteFile(filePath) {
    try {
        await fs.unlink(filePath)
        console.log(`File deleted successfully: ${filePath}`)
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('File does not exist')
        } else {
            console.error('Error deleting file:', err)
        }
    }
}
