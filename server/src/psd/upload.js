import {formidable} from '../util/formidable/src/index.js'
import parseForm from '../util/parseForm.js'

import {sendEmail} from '../util/sendEmail.js'
import {contentUploadRecipients, prodUser} from '../../keys/users.js'
import fs from 'fs'
import {logger} from '../logger/logger.js'
import archiver from 'archiver'

const prodEnvironment = prodUser === process.env.USER
const uploadDir = prodEnvironment
    ? `/home/${process.env.USER}/cg-uploads`
    : `/Users/${process.env.USER}/Downloads/coffee-grind/cg-uploads`


const maxFileSizeMB = prodEnvironment ? 15 : 15
const maxTotalFileSizeMB = 60
const _maxCombinedFileSize = 100 * 1024 * 1024

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {recursive: true})
}
let uploadSubDir

function handleError(res, message, error, status = 500) {
    logger.error(`handleError: ${message}`)

    if (uploadSubDir && fs.existsSync(uploadSubDir)) {
        try {
            fs.rmSync(uploadSubDir, {recursive: true, force: true})
            console.log('Upload directory removed after error:', uploadSubDir)
        } catch (err) {
            try {
                logger.error(`Error removing upload directory after error: ${err}`)
            } catch {
                console.error(`Error removing upload directory after error: ${err}`)

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

export default async function upload(req, res) {
    let subdirs
    let detailsJson

    const form = formidable({
        uploadDir: uploadDir,
        keepExtensions: true,
        createDirsFromUploads: true,
        maxFileSize: maxFileSizeMB * 1024 * 1024,
        maxTotalFileSize: maxTotalFileSizeMB * 1024 * 1024,
        filter: ({mimetype}) => mimetype && mimetype.includes('image'),
        filename(_name, _ext, part) {
            const {originalFilename} = part
            if (!originalFilename) {
                return 'invalid'
            }
            const originaFilenameParts = originalFilename.split('/')
            const filename = originaFilenameParts.pop()
            const filenameParts = filename.split('.')
            const fileExt = filenameParts.pop()
            const basename = slugify(filenameParts.join('.')) + '.' + slugify(fileExt)
            subdirs = originaFilenameParts.map((subdir) => {
                return slugify(subdir)
            }).join('/').replace(/\s+/g, '-')

            //logger.info('save location', `${subdirs}/${basename}`)
            return `${subdirs}/${basename}`
        }
    })

    const {fields, files} = await parseForm(res, req, form, handleError, maxFileSizeMB, maxTotalFileSizeMB)
    for (const fieldName in fields) {
        if (!Array.isArray(fields[fieldName])) {
            fields[fieldName] = [fields[fieldName]]
        }
    }

    const destination = `${uploadDir}/${subdirs}`.replace(/\s+/g, '-')
    const destinationFile = `${destination}.zip`
    detailsJson = JSON.stringify(fields, null, 2)


    try {
        await fs.writeFile(`${destination}/uploadData.json`, detailsJson, function (err) {
            if (err) {
                logger.error('writeFile error', err)
                handleError(res, 'JSON write error', err, 500)
                //res.status(500).send({status: 500, message: 'JSON write error'})
            }
        })
    } catch (error) {
        logger.error('writeFile error', error)
        handleError(res, 'JSON write error', error, 500)
    }

    const output = await fs.createWriteStream(destinationFile)
    const archive = archiver('zip', {
        zlib: {level: 9} // Sets the compression level.
    })

    const html = `<strong>Photos uploaded for ${fields.type} ${fields.brand} ${fields.model}</strong><br/><br/>`
    let fieldsHtml = html + '<table>'
    Object.keys(fields).map((key) => {
        fieldsHtml += `<tr><td>${key}</td><td>${fields[key]}</td></tr>`
    })
    fieldsHtml += '</table>'

    output.on('close', async function () {
        logger.info('Files zipped successfully: ' + archive.pointer() + ' total bytes')
        try {
            const email = await sendEmail({
                emailConfig: 'imageSubmit',
                to: contentUploadRecipients,
                subject: `Photos uploaded to coffee-grind for ${fields.type} ${fields.brand} ${fields.model}`,
                text: `Photos uploaded to coffee-grind for ${fields.type} ${fields.brand} ${fields.model} (text)`,
                html: fieldsHtml,
                attachments: {filename: `${subdirs}.zip`, path: destinationFile}
            })
            logger.info('Message sent: %s', email.messageId)
        } catch (error) {
            const errorMsg = 'An error occurred sending email'
            logger.error('An error occurred sending email', error)
            handleError(res, errorMsg, error, 500)
            return
        }

        try {
            fs.rmSync(`${destination}/`, {recursive: true, force: true})
            logger.info('Temp directory removed successfully')
        } catch (error) {
            logger.error('An error occurred deleteing temp directory', error.message)
        }
    })

    output.on('end', function () {
        logger.info('Data has been drained')
    })
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            logger.warn('archiver warning', err)
            handleError(res, 'File compression warning', err, 500)
        } else {
            throw err
        }
    })
    archive.on('error', function (err) {
        logger.error('archiver error', err)
        handleError(res, 'File compression error', err, 500)
    })
    archive.pipe(output)
    archive.directory(`${uploadDir}/${subdirs}/`, false)
    await archive.finalize()

    res.status(200).send('Files uploaded successfully')

}

function slugify(str) {
    str = str.replace(/^\s+|\s+$/g, '') // trim leading/trailing white space
    str = str.replace(/[^a-zA-Z0-9\-_+ ]/g, '') // remove any non-alphanumeric characters
        //.replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-') // remove consecutive hyphens
    return str
}
