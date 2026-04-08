import fs from 'fs'

export default function handleError(res, message, error, status = 500) {
    logger.error(`handleError: ${message}`)

    if (uploadSubDir && fs.existsSync(uploadSubDir)) {
        try {
            fs.rmSync(uploadSubDir, {recursive: true, force: true})
            console.log('Upload directory removed after error:', uploadSubDir)
        } catch (err) {
            try {
                logger.error(`Error removing upload directory after error: ${err}`)
            } catch {
            }
        }
    }

    if (res.headersSent) {
        console.warn('handleError called but headers already sent')
        return
    }

    const isDev = process.env.NODE_ENV !== 'production'
    const payload = {
        status: 'error',
        statusText: message || 'An unexpected error occurred.',
        error: {
            message: typeof message === 'string' ? message : (error?.message || 'Error'),
            code: error?.code,
            type: error?.name,
            details: error && typeof error === 'object' ? {
                formidableCode: error.code,
                errno: error.errno,
                syscall: error.syscall
            } : undefined,
            stack: isDev && typeof error?.stack === 'string' ? error.stack : undefined
        }
    }

    res.status(status).json(payload)
    res.end()
}