import { Router } from 'express'
import lazyMount from './util/lazyMount.js'
import health from './testing/health.js'
import ready from './testing/ready.js'
import boom from './testing/boom.js'
import echo from './testing/echoMessage.js'

export function registerRoutes(app, { prefix = '/api' } = {}) {

    console.log(`Registering routes with prefix '${prefix}'`)

    const r = Router()

    r.use(health)
    r.use(ready)
    r.use(echo)
    r.use(boom)

    app.use(prefix, r)

    lazyMount(app, `${prefix}/psd`, () => import('./psd/psd.bundle.js'))
    lazyMount(app, `${prefix}/discord`, () => import('./sendToDiscord/discord.bundle.js'))

}