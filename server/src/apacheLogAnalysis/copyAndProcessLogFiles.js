import copyLogFiles from './copyLogFiles.js'
import analyzeLogs from './apacheLogAnalyzer.js'
import processDailyData from './dailyLogDataProcessor.js'

try {
    await copyLogFiles()
    await analyzeLogs()
    await processDailyData()
} catch (e) {
    console.error(e)
}