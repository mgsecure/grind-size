import React, {useCallback, useContext, useEffect, useRef, useState} from 'react'
import ScopedDialog from './ScopedDialog.jsx'
import {isSubmitAllowed, markSubmitted as markSubmittedUtil, formatCountdown} from '../util/submitCooldown.js'
import AppContext from '../app/AppContext.jsx'

/**
 * CooldownCheck component
 * - Encapsulates submit cooldown logic and dialog UI.
 * - Exposes an imperative API via onInit: { check, markSubmitted }.
 *
 * Props:
 * - id: string (required) — unique key for the action/form (e.g., 'discord').
 * - windowMs?: number — cooldown window in ms (default 60_000).
 * - onInit?: (api: { check: () => boolean, markSubmitted: () => void }) => void
 */
export default function CooldownCheck({id, windowMs = 60_000, onInit}) {
    const [open, setOpen] = useState(false)
    const cooldownDurationSeconds = Math.floor(windowMs / 1000)
    const [msLeft, setMsLeft] = useState(0)
    const intervalRef = useRef(null)

    const {beta} = useContext(AppContext)


    const stopTimer = useCallback(() => {
        try {
            if (intervalRef.current) clearInterval(intervalRef.current)
        } catch (e) {
            console.error('Error stopping timer:', e)
        }
        intervalRef.current = null
    }, [])

    const startCooldown = useCallback((remainingMs) => {
        stopTimer()
        setMsLeft(remainingMs)
        setOpen(true)
        const target = Date.now() + remainingMs
        intervalRef.current = setInterval(() => {
            const ms = Math.max(0, target - Date.now())
            setMsLeft(ms)
            if (ms <= 0) {
                stopTimer()
                setOpen(false)
            }
        }, 250)
    }, [stopTimer])

    const handleClose = useCallback(() => {
        setOpen(false)
        stopTimer()
    }, [stopTimer])

    // Expose API to parent via onInit
    useEffect(() => {
        if (!onInit) return
        const api = {
            check: () => {
                const res = isSubmitAllowed(id, windowMs, beta)
                if (!res.allowed) {
                    startCooldown(res.remainingMs)
                    return false
                }
                return true
            },
            markSubmitted: () => markSubmittedUtil(id)
        }
        onInit(api)
        // No cleanup necessary; parent should drop references as needed.
    }, [id, windowMs, onInit, startCooldown, beta])

    useEffect(() => () => stopTimer(), [stopTimer])

    return (
        <ScopedDialog
            open={open}
            dialogContent={(
                <div style={{padding: '24px 20px', maxWidth: 420}}>
                    <div style={{fontWeight: 700, fontSize: '1.05rem', marginBottom: 8, width: 250}}>
                        Please wait before sending another message.
                    </div>
                    <div style={{opacity: 0.85}}>
                        You can submit this form once every {cooldownDurationSeconds} seconds.
                    </div>
                    <div style={{marginTop: 12, fontSize: '1.4rem', fontWeight: 700, textAlign: 'right'}}>
                        {formatCountdown(msLeft)}
                    </div>
                </div>
            )}
            handleClose={handleClose}
            position={{top: 80}}
            centerX={true}
        />
    )
}
