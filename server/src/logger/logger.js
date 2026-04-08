// logger.js
import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

// custom timestamp string in the JSON itself (works for files)
const timestamp = () => {
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const ts =
        now.getFullYear() + '/' +
        pad(now.getMonth() + 1) + '/' +
        pad(now.getDate()) + ' ' +
        pad(now.getHours()) + ':' +
        pad(now.getMinutes()) + ':' +
        pad(now.getSeconds()) + '.' +
        String(now.getMilliseconds()).padStart(3, '0')
    return `,"time":"${ts}"`
}

let logging
if (isDev) {
    // DEV: pretty console with translateTime (console-only)
    logging = pino({
        level: process.env.LOG_LEVEL || 'debug',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'yyyy/MM/dd HH:mm:ss'
            }
        }
    })
} else {
    // PROD: write JSON to file with formatted "time"
    const fileTransport = pino.transport({
        target: 'pino/file',
        options: {
            destination: '/home/coffee_tracker/coffee-grind-node/logs/nodeserver.log', // ensure the directory exists & is writable
            mkdir: true               // pino v9: creates parent dirs if missing
        }
    })

    logging = pino(
        {
            level: process.env.LOG_LEVEL || 'info',
            timestamp,
            base: { hostname: undefined }
        },
        fileTransport
    )
}

export const logger = logging
