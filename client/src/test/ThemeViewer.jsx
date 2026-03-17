import React, {useEffect, useRef} from 'react'
import ToggleColorMode from '../misc/ToggleColorMode.jsx'

import {
    Box, Stack, Paper, Typography, Button, ButtonGroup, IconButton,
    TextField, FormControl, InputLabel, Select, MenuItem, FormGroup, FormControlLabel,
    Checkbox, Radio, RadioGroup, Switch, Slider, Rating, Chip, Avatar, Badge, List,
    ListItem, ListItemAvatar, ListItemText, Divider, Tabs, Tab, Accordion, AccordionSummary,
    AccordionDetails, Alert, Snackbar, LinearProgress, CircularProgress, Skeleton,
    Breadcrumbs, Link, Pagination, Stepper, Step, StepLabel, Card, CardHeader, CardContent,
    CardActions, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Popover, Menu,
    Drawer, Dialog, DialogTitle, DialogContent, DialogActions, Grid, alpha
} from '@mui/material'
import {useTheme, ThemeProvider, createTheme} from '@mui/material/styles'
import usePageTitle from '../util/usePageTitle.jsx'

function Section({title, children}) {
    return (
        <Paper variant='outlined' sx={{p: 3}}>
            <Typography variant='h5' sx={{mb: 2}}>{title}</Typography>
            <Box sx={{display: 'grid', gap: 2}}>{children}</Box>
        </Paper>
    )
}

function Swatch({label, color, sublabel}) {
    return (
        <Box sx={{display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1, alignItems: 'center'}}>
            <Typography variant='body2' sx={{color: 'text.secondary'}}>{label}</Typography>
            <Paper
                variant='outlined'
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    bgcolor: color,
                    color: theme => theme.palette.getContrastText(color)
                }}
            >
                <Typography variant='body2'>{color}</Typography>
                {sublabel ? <Typography variant='caption' sx={{opacity: 0.8}}>{sublabel}</Typography> : null}
            </Paper>
        </Box>
    )
}

function TokenPill({label, value}) {
    return (
        <Box sx={{border: '1px solid', borderColor: 'divider', px: 1, py: 0.5, borderRadius: 1}}>
            <Typography variant='caption' sx={{whiteSpace: 'nowrap'}}>{label}: {value}</Typography>
        </Box>
    )
}

/**
 * Helpers to export/copy a palette override JSON
 */

const STORAGE_KEY = 'themePaletteOverridesV1'

const defaultColors = mode => ({
    primary: '#1976d2',
    secondary: '#9c27b0',
    success: '#2e7d32',
    info: '#0288d1',
    warning: '#ed6c02',
    error: '#d32f2f',
    bgDefault: mode === 'dark' ? '#121212' : '#ffffff',
    bgPaper: mode === 'dark' ? '#1e1e1e' : '#ffffff'
})

const makePaletteJSON = colors => {
    const data = {
        palette: {
            primary: {main: colors.primary},
            secondary: {main: colors.secondary},
            success: {main: colors.success},
            info: {main: colors.info},
            warning: {main: colors.warning},
            error: {main: colors.error},
            background: {
                default: colors.bgDefault,
                paper: colors.bgPaper
            }
        }
    }
    return JSON.stringify(data, null, 2)
}

// Validate a 3/6/8-digit hex color (#RGB, #RRGGBB, #RRGGBBAA)
const isHex = v => typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)

// Safely pull palette values from a JSON object and map to editor color keys
const parsePaletteJSONToEditorColors = (json, current, mode = 'light') => {
    // Accept either a raw palette object or { palette: { ... } }
    const palette = json?.palette ?? json
    if (!palette || typeof palette !== 'object') return null

    const pick = (obj, path, fallback) => {
        const val = path.split('.').reduce((a, k) => (a && a[k] !== null ? a[k] : undefined), obj)
        return isHex(val) ? val : fallback
    }

    return {
        primary: pick(palette, 'primary.main', current.primary),
        secondary: pick(palette, 'secondary.main', current.secondary),
        success: pick(palette, 'success.main', current.success),
        info: pick(palette, 'info.main', current.info),
        warning: pick(palette, 'warning.main', current.warning),
        error: pick(palette, 'error.main', current.error),
        bgDefault: pick(
            palette,
            'background.default',
            current.bgDefault ?? (mode === 'dark' ? '#121212' : '#ffffff')
        ),
        bgPaper: pick(
            palette,
            'background.paper',
            current.bgPaper ?? (mode === 'dark' ? '#1e1e1e' : '#ffffff')
        )
    }
}

// Build a JS code snippet that you can drop into a theme file
const makePaletteCode = colors => {
    const json = makePaletteJSON(colors) // already pretty-printed
    return `import { createTheme } from '@mui/material/styles'
const overrides = ${json}
const theme = createTheme(overrides)
export default theme
`
}

const downloadCode = (code, filename = 'theme-palette.js') => {
    const blob = new Blob([code], {type: 'text/javascript'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}


const downloadJSON = (json, filename = 'theme-palette.json') => {
    const blob = new Blob([json], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

const copyJSON = async json => {
    try {
        await navigator.clipboard.writeText(json)
        return true
    } catch {
        return false
    }
}

function PasteJSONDialog({open, onClose, onSubmit, initial = ''}) {
    const [text, setText] = React.useState(initial)
    const [err, setErr] = React.useState('')

    React.useEffect(() => {
        if (open) {
            setText(initial)
            setErr('')
        }
    }, [open, initial])

    const handleSubmit = () => {
        try {
            const obj = JSON.parse(text)
            onSubmit(obj)
        } catch (_e) {
            setErr('Invalid JSON')
        }
    }

    const codeSnippet = '{ "primary": { "main": "#1976d2" }, "background": { "default": "#fff" } }'
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
            <DialogTitle>Paste Palette JSON</DialogTitle>
            <DialogContent sx={{pt: 2}}>
                <Typography variant='body2' sx={{mb: 1, color: 'text.secondary'}}>
                    Accepts either a raw <code>palette</code> object or <code>{codeSnippet}</code>
                </Typography>
                <TextField
                    autoFocus
                    multiline
                    minRows={10}
                    fullWidth
                    placeholder='{"palette":{"primary":{"main":"#1976d2"},"background":{"default":"#fff"}}}'
                    value={text}
                    onChange={e => setText(e.target.value)}
                    error={!!err}
                    helperText={err || ' '}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant='contained' onClick={handleSubmit}>Apply</Button>
            </DialogActions>
        </Dialog>
    )
}


function PaletteEditor({
                           value,
                           onChange,
                           onReset,
                           onResetDefaults,
                           onExportJSON,
                           onCopyJSON,
                           onExportCode,
                           onCopyCode,
                           onImportJSON,
                           onOpenPasteJSON,
                           onClearSaved,
                           overrideBackground,
                           onToggleOverrideBackground
                       }) {
    const fileRef = useRef(null)

    const openFile = () => fileRef.current?.click()

    const onFileChange = async e => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const text = await file.text()
            const obj = JSON.parse(text)
            onImportJSON?.(obj)
        } catch (err) {
            onImportJSON?.(null, err)
        } finally {
            // allow re-selecting the same file
            e.target.value = ''
        }
    }

    const fields = [
        {key: 'primary', label: 'primary.main'},
        {key: 'secondary', label: 'secondary.main'},
        {key: 'success', label: 'success.main'},
        {key: 'info', label: 'info.main'},
        {key: 'warning', label: 'warning.main'},
        {key: 'error', label: 'error.main'},
        {key: 'bgDefault', label: 'background.default'},
        {key: 'bgPaper', label: 'background.paper'}
    ]

    return (
        <Section title='Palette editor'>
            <input
                ref={fileRef}
                type='file'
                accept='application/json,.json'
                hidden
                onChange={onFileChange}
            />

            <Grid container spacing={2}>
                {fields.map(f => (
                    <Grid size={{xs: 12, sm: 6}} key={f.key}>
                        <Stack spacing={1}>
                            <Typography variant='caption' sx={{color: 'text.secondary'}}>{f.label}</Typography>
                            <TextField
                                type='color'
                                size='small'
                                value={value[f.key]}
                                onChange={e => onChange({...value, [f.key]: e.target.value})}
                            />
                            <Swatch label={f.label} color={value[f.key]}/>
                        </Stack>
                    </Grid>
                ))}
            </Grid>

            <Stack direction={{xs: 'column', sm: 'row'}} spacing={1} sx={{mt: 2, flexWrap: 'wrap'}}>
                <Button variant='outlined' onClick={onReset}>Reset to theme</Button>
                <Button variant='outlined' color='secondary' onClick={onResetDefaults}>Reset to defaults</Button>
                <Button variant='text' onClick={onCopyJSON}>Copy JSON</Button>
                <Button variant='outlined' onClick={onOpenPasteJSON}>Paste JSON</Button>

            </Stack>
            <Stack direction={{xs: 'column', sm: 'row'}} spacing={1} sx={{mt: 1, flexWrap: 'wrap'}}>
                <Button variant='contained' onClick={onExportJSON}>Export JSON</Button>
                <Button variant='contained' onClick={openFile}>Import JSON</Button>
                <Button variant='contained' onClick={onExportCode}>Export Code</Button>
                <Button variant='text' onClick={onCopyCode}>Copy Code</Button>
            </Stack>
            <Stack direction={{xs: 'column', sm: 'row'}} spacing={1} sx={{mt: 1, flexWrap: 'wrap'}}>
                <Button variant='text' color='error' onClick={onClearSaved}>Clear saved</Button> {/* 👈 NEW */}

                <FormControlLabel
                    control={
                        <Switch
                            checked={!!overrideBackground}
                            onChange={e => onToggleOverrideBackground?.(e.target.checked)}
                        />
                    }
                    label='Override background colors'
                /> </Stack>
        </Section>
    )
}


/**
 * Live Theme Inspector (uses your ToggleColorMode component)
 */
function ThemeInspector({mode, palettePreview}) {
    usePageTitle('Theme Viewer')

    const theme = useTheme()
    const {palette, typography, breakpoints, spacing, shape, shadows} = theme
    const colorOf = (obj, key, fallback) => obj?.[key] ?? fallback

    return (
        <Stack sx={{mb: 3}} spacing={2}>
            <Stack direction={{xs: 'column', sm: 'row'}} alignItems='center' justifyContent='space-between'
                   sx={{mb: 2}}>
                <Typography variant='h5'>Live Theme Inspector</Typography>
                <Stack direction='row' spacing={1} alignItems='center'>
                    <ToggleColorMode/>
                    <Typography variant='body2' sx={{color: 'text.secondary'}}>mode: {mode}</Typography>
                </Stack>
            </Stack>

            <Section title='Palette'>
                <Grid container spacing={2}>
                    <Grid size={{xs: 12, md: 6}}>
                        <Stack spacing={1.5}>
                            <Swatch label='primary.main' color={colorOf(palette.primary, 'main', '#000000')}/>
                            <Swatch label='primary.light'
                                    color={colorOf(palette.primary, 'light', palette.primary.main)}/>
                            <Swatch label='primary.dark'
                                    color={colorOf(palette.primary, 'dark', palette.primary.main)}/>
                            <Swatch label='secondary.main' color={colorOf(palette.secondary, 'main', '#888888')}/>
                            <Swatch label='success.main' color={colorOf(palette.success, 'main', '#2e7d32')}/>
                            <Swatch label='info.main' color={colorOf(palette.info, 'main', '#0288d1')}/>
                            <Swatch label='warning.main' color={colorOf(palette.warning, 'main', '#ed6c02')}/>
                            <Swatch label='error.main' color={colorOf(palette.error, 'main', '#d32f2f')}/>
                        </Stack>
                    </Grid>
                    <Grid size={{xs: 12, md: 6}}>
                        <Stack spacing={1.5}>
                            <Swatch label='background.default' color={palette.background?.default ?? '#ffffff'}/>
                            <Swatch label='background.paper' color={palette.background?.paper ?? '#ffffff'}/>
                            <Swatch label='text.primary' color={palette.text?.primary ?? '#000000'}
                                    sublabel='contrast example'/>
                            <Swatch label='text.secondary' color={palette.text?.secondary ?? '#666666'}
                                    sublabel='contrast example'/>
                            <Swatch label='divider' color={palette.divider ?? 'rgba(0,0,0,0.12)'}/>
                        </Stack>
                    </Grid>
                </Grid>
            </Section>

            <Section title='Typography scale'>
                <Stack spacing={1}>
                    <Typography variant='h1'>H1 Heading</Typography>
                    <Typography variant='h2'>H2 Heading</Typography>
                    <Typography variant='h3'>H3 Heading</Typography>
                    <Typography variant='h4'>H4 Heading</Typography>
                    <Typography variant='h5'>H5 Heading</Typography>
                    <Typography variant='h6'>H6 Heading</Typography>
                    <Typography variant='subtitle1'>Subtitle1 text line</Typography>
                    <Typography variant='subtitle2'>Subtitle2 text line</Typography>
                    <Typography variant='body1'>Body1 example paragraph text shows default line-height</Typography>
                    <Typography variant='body2'>Body2 smaller text sample with current color</Typography>
                    <Typography variant='button'>BUTTON LABEL</Typography>
                    <Typography variant='caption'>Caption text</Typography>
                    <Typography variant='overline'>OVERLINE TEXT</Typography>
                </Stack>
                <Stack direction='row' spacing={1} sx={{mt: 2, flexWrap: 'wrap'}}>
                    <TokenPill label='fontFamily' value={typography.fontFamily}/>
                    <TokenPill label='htmlFontSize' value={typography.htmlFontSize ?? 16}/>
                    <TokenPill label='fontSize' value={typography.fontSize ?? 14}/>
                </Stack>
            </Section>

            <Section title='System tokens'>
                <Stack spacing={2}>
                    <Stack direction='row' spacing={1} sx={{flexWrap: 'wrap'}}>
                        {Object.entries(breakpoints.values).map(([k, v]) => (
                            <TokenPill key={k} label={`bp.${k}`} value={`${v}px`}/>
                        ))}
                    </Stack>
                    <Stack direction='row' spacing={1} sx={{flexWrap: 'wrap'}}>
                        {[0.5, 1, 2, 3, 4, 6, 8].map(s => (
                            <Box key={s} sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <Box sx={{
                                    width: spacing(s),
                                    height: spacing(s),
                                    bgcolor: 'primary.main',
                                    opacity: 0.2
                                }}/>
                                <TokenPill label={`spacing(${s})`} value={String(spacing(s))}/>
                            </Box>
                        ))}
                    </Stack>
                    <Stack direction='row' spacing={1} sx={{flexWrap: 'wrap'}}>
                        <TokenPill label='shape.borderRadius' value={shape.borderRadius}/>
                        <TokenPill label='shadows' value={`${shadows.length} levels`}/>
                    </Stack>
                </Stack>
            </Section>

            {/* Inline palette editor (live-applies below via nested ThemeProvider) */}
            {palettePreview}
        </Stack>
    )
}

export default function ThemeKitchenSink() {
    const baseTheme = useTheme()
    const mode = baseTheme.palette.mode ?? 'light'
    const lastModeRef = React.useRef(mode)
    const [overrideBg, setOverrideBg] = React.useState(false)

    React.useEffect(() => {
        if (!overrideBg) {
            lastModeRef.current = mode
            return
        }
        if (mode !== lastModeRef.current) {
            const prevDefaults = defaultColors(lastModeRef.current)
            const nextDefaults = defaultColors(mode)

            // If the user hadn't customized bg colors (still at previous defaults),
            // move them to the new mode's defaults; otherwise preserve the custom color.
            setColors(c => ({
                ...c,
                bgDefault: c.bgDefault === prevDefaults.bgDefault ? nextDefaults.bgDefault : c.bgDefault,
                bgPaper: c.bgPaper === prevDefaults.bgPaper ? nextDefaults.bgPaper : c.bgPaper
            }))

            lastModeRef.current = mode
        }
    }, [mode, overrideBg])

    const init = React.useMemo(() => ({
        primary: baseTheme.palette.primary?.main ?? '#1976d2',
        secondary: baseTheme.palette.secondary?.main ?? '#9c27b0',
        success: baseTheme.palette.success?.main ?? '#2e7d32',
        info: baseTheme.palette.info?.main ?? '#0288d1',
        warning: baseTheme.palette.warning?.main ?? '#ed6c02',
        error: baseTheme.palette.error?.main ?? '#d32f2f',
        bgDefault: baseTheme.palette.background?.default ?? (mode === 'dark' ? '#121212' : '#ffffff'),
        bgPaper: baseTheme.palette.background?.paper ?? (mode === 'dark' ? '#1e1e1e' : '#ffffff')
    }), [baseTheme, mode])

    const [colors, setColors] = React.useState(init)
    const resetDefaults = () => setColors(defaultColors(mode))
// load saved palette once (if present & valid)
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return
            const obj = JSON.parse(raw)
            const next = parsePaletteJSONToEditorColors(obj, init, mode)
            if (next) setColors(next)
        } catch {
            // ignore corrupted storage
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // run once

    useEffect(() => {
        try {
            const json = makePaletteJSON(colors)  // pretty-printed string you already generate
            localStorage.setItem(STORAGE_KEY, json)
        } catch {
            // ignore storage failures (e.g., quota)
        }
    }, [colors])

    const [snackOpen, setSnackOpen] = React.useState(false)
    const [snackMsg, setSnackMsg] = React.useState('Palette JSON ready')
    const [pasteOpen, setPasteOpen] = React.useState(false)

// open/close
    const openPaste = () => setPasteOpen(true)
    const closePaste = () => setPasteOpen(false)

// when user clicks "Apply" in the dialog
    const handlePasteSubmit = obj => {
        const next = parsePaletteJSONToEditorColors(obj, colors, mode)
        if (!next) {
            setSnackMsg('Paste failed: missing or invalid "palette"')
            setSnackOpen(true)
            return
        }
        setColors(next)
        setSnackMsg('Palette pasted')
        setSnackOpen(true)
        setPasteOpen(false)
    }

    const handleImportJSON = (obj, err) => {
        if (err) {
            setSnackMsg('Import failed: invalid JSON')
            setSnackOpen(true)
            return
        }
        const next = parsePaletteJSONToEditorColors(obj, colors, mode)
        if (!next) {
            setSnackMsg('Import failed: missing "palette"')
            setSnackOpen(true)
            return
        }
        setColors(next)
        setSnackMsg('Palette imported')
        setSnackOpen(true)
    }

    const resetColors = () => setColors(init)

    const handleExportJSON = () => {
        const json = makePaletteJSON(colors)
        downloadJSON(json, 'theme-palette.json')
        setSnackOpen(true)
    }

    const handleCopyJSON = async () => {
        const ok = await copyJSON(makePaletteJSON(colors))
        setSnackOpen(true)
        return ok
    }

    const handleExportCode = () => {
        const code = makePaletteCode(colors)
        downloadCode(code, 'theme-palette.js')
        setSnackOpen(true)
    }

    const handleCopyCode = async () => {
        const ok = await copyJSON(makePaletteCode(colors))
        setSnackOpen(true)
        return ok
    }

    const clearSaved = () => {
        localStorage.removeItem(STORAGE_KEY)
        setSnackMsg('Saved palette cleared')
        setSnackOpen(true)
    }


    const previewTheme = React.useMemo(() => {
        return createTheme(baseTheme, {
            palette: {
                mode, // 👈 ensure nested theme knows which mode we're in
                primary: {...baseTheme.palette.primary, main: colors.primary},
                secondary: {...baseTheme.palette.secondary, main: colors.secondary},
                success: {...baseTheme.palette.success, main: colors.success},
                info: {...baseTheme.palette.info, main: colors.info},
                warning: {...baseTheme.palette.warning, main: colors.warning},
                error: {...baseTheme.palette.error, main: colors.error},
                ...(overrideBg
                    ? {
                        background: {
                            ...baseTheme.palette.background,
                            default: colors.bgDefault,
                            paper: colors.bgPaper
                        }
                    }
                    : {})
            }
        })
    }, [baseTheme, mode, colors, overrideBg])


    // UI state from the kitchen sink
    const [tab, setTab] = React.useState(0)
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [drawerOpen, setDrawerOpen] = React.useState(false)
    const [popoverAnchor, setPopoverAnchor] = React.useState(null)
    const [menuAnchor, setMenuAnchor] = React.useState(null)
    const [rating, setRating] = React.useState(3)
    const [selectVal, setSelectVal] = React.useState('alpha')
    const [radioVal, setRadioVal] = React.useState('a')
    const [sliderVal, setSliderVal] = React.useState(30)

    const popoverOpen = Boolean(popoverAnchor)
    const menuOpen = Boolean(menuAnchor)

    const bgcolor = alpha(previewTheme.palette.text.primary, 0.06)

    return (
        <Box sx={{minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary'}}>
            <Button color='inherit' onClick={() => setSnackOpen(true)}>Snack</Button>

            <Box sx={{p: {xs: 2, md: 4}}}>
                {/* Inspector + Palette Editor */}
                <ThemeInspector
                    mode={mode}
                    palettePreview={
                        <PaletteEditor
                            value={colors}
                            onChange={setColors}
                            onReset={resetColors}
                            onResetDefaults={resetDefaults}
                            onExportJSON={handleExportJSON}
                            onCopyJSON={handleCopyJSON}
                            onExportCode={handleExportCode}
                            onCopyCode={handleCopyCode}
                            onImportJSON={handleImportJSON}
                            onOpenPasteJSON={openPaste}
                            onClearSaved={clearSaved}
                            overrideBackground={overrideBg}
                            onToggleOverrideBackground={setOverrideBg}
                        />
                    }
                />

                {/* Everything below uses the preview theme */}
                <ThemeProvider theme={previewTheme}>
                    <Grid container spacing={3}>

                        {/* Text */}
                        <Grid size={6}>
                            <Section title='Text'>
                                <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                                    <Box sx={{backgroundColor: bgcolor, padding: 2}}>
                                        <Typography variant='body1' gutterBottom>
                                            This is an example of body1 text. It uses the default font size and color
                                            from
                                            the theme. <Link>Link text.</Link> There&#39;s more text here that follows.
                                        </Typography>
                                    </Box>
                                    <Box sx={{padding: 2}}>
                                        <Typography variant='body1' gutterBottom>
                                            This is an example of body1 text. It uses the default font size and color
                                            from
                                            the theme. <Link>Link text.</Link> There&#39;s more text here that follows.
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Section>
                        </Grid>


                    </Grid>
                </ThemeProvider>
                <ThemeProvider theme={previewTheme}>
                    <Grid container spacing={3}>


                    {/* Buttons */}
                        <Grid size={12}>
                            <Section title='Buttons'>
                                <Stack direction='row' spacing={2}>
                                    <Button variant='contained'>Contained</Button>
                                    <Button variant='outlined'>Outlined</Button>
                                    <Button variant='text'>Text</Button>
                                </Stack>
                                <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                                    <Stack direction='row' spacing={2}>
                                        <Button variant='contained' color='secondary'>Secondary</Button>
                                        <Button variant='contained' color='success'>Success</Button>
                                    </Stack>
                                    <Stack direction='row' spacing={2}>
                                        <Button variant='contained' color='error'>Error</Button>
                                        <Button variant='contained' disabled>Disabled</Button>
                                    </Stack>
                                </Stack>
                                <ButtonGroup>
                                    <Button>One</Button>
                                    <Button>Two</Button>
                                    <Button>Three</Button>
                                </ButtonGroup>
                                <Stack direction='row' spacing={2}>
                                    <Tooltip title='Icon button'>
                                        <IconButton color='primary'
                                                    onClick={e => setMenuAnchor(e.currentTarget)}>★</IconButton>
                                    </Tooltip>
                                    <Menu anchorEl={menuAnchor} open={menuOpen} onClose={() => setMenuAnchor(null)}>
                                        <MenuItem onClick={() => setMenuAnchor(null)}>Action A</MenuItem>
                                        <MenuItem onClick={() => setMenuAnchor(null)}>Action B</MenuItem>
                                    </Menu>
                                    <Button variant='contained'
                                            onClick={e => setPopoverAnchor(e.currentTarget)}>Popover</Button>
                                    <Popover
                                        open={popoverOpen}
                                        anchorEl={popoverAnchor}
                                        onClose={() => setPopoverAnchor(null)}
                                        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                                    >
                                        <Box sx={{p: 2}}>
                                            <Typography variant='body2'>Hello from Popover</Typography>
                                        </Box>
                                    </Popover>
                                </Stack>
                            </Section>
                        </Grid>

                        {/* Inputs */}
                        <Grid>
                            <Section title='Inputs'>
                                <Stack direction='row' spacing={2}>
                                    <TextField label='Standard' variant='standard'/>
                                    <TextField label='Filled' variant='filled'/>
                                    <TextField label='Outlined' variant='outlined'/>
                                </Stack>
                                <Stack direction='row' spacing={2} sx={{mt: 2}}>
                                    <FormControl sx={{minWidth: 200}}>
                                        <InputLabel id='select-label'>Select</InputLabel>
                                        <Select
                                            labelId='select-label'
                                            label='Select'
                                            value={selectVal}
                                            onChange={e => setSelectVal(e.target.value)}
                                            variant='outlined'
                                        >
                                            <MenuItem value='alpha'>Alpha</MenuItem>
                                            <MenuItem value='beta'>Beta</MenuItem>
                                            <MenuItem value='gamma'>Gamma</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl sx={{minWidth: 200}}>
                                        <InputLabel id='select-label'>Select</InputLabel>
                                        <Select
                                            labelId='select-label'
                                            label='Select'
                                            value={selectVal}
                                            onChange={e => setSelectVal(e.target.value)}
                                            variant='filled'
                                        >
                                            <MenuItem value='alpha'>Alpha</MenuItem>
                                            <MenuItem value='beta'>Beta</MenuItem>
                                            <MenuItem value='gamma'>Gamma</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                                <FormGroup row>
                                    <FormControlLabel control={<Checkbox defaultChecked/>} label='Checkbox'/>
                                    <FormControlLabel control={<Switch defaultChecked/>} label='Switch'/>
                                </FormGroup>
                                <FormControl>
                                    <RadioGroup row value={radioVal} onChange={e => setRadioVal(e.target.value)}>
                                        <FormControlLabel value='a' control={<Radio/>} label='A'/>
                                        <FormControlLabel value='b' control={<Radio/>} label='B'/>
                                        <FormControlLabel value='c' control={<Radio/>} label='C'/>
                                    </RadioGroup>
                                </FormControl>
                                <Stack direction='row' spacing={2} alignItems='center'>
                                    <Slider value={sliderVal} onChange={(_, v) => setSliderVal(v)} sx={{width: 200}}/>
                                    <Typography
                                        variant='body2'>{Array.isArray(sliderVal) ? sliderVal.join('–') : sliderVal}</Typography>
                                    <Rating value={rating} onChange={(_, v) => setRating(v)}/>
                                </Stack>
                            </Section>
                        </Grid>

                        {/* Typography & Chips */}
                        <Grid size={{xs: 12, md: 12}}>
                            <Section title='Typography & Chips'>
                                <Typography variant='h1'>H1 Heading</Typography>
                                <Typography variant='h4'>H4 Heading</Typography>
                                <Typography variant='body1'>Body 1 text shows default font, size and color</Typography>
                                <Typography variant='caption'>Caption text</Typography>
                                <Stack direction='row' spacing={1} sx={{mt: 1, flexWrap: 'wrap'}}>
                                    <Chip label='Default'/>
                                    <Chip label='Primary' color='primary'/>
                                    <Chip label='Success' color='success'/>
                                    <Chip label='Outlined' variant='outlined'/>
                                    <Chip label='Avatar' avatar={<Avatar>A</Avatar>}/>
                                </Stack>
                            </Section>
                        </Grid>

                        {/* Lists & Badges */}
                        <Grid size={{xs: 12, md: 6}}>
                            <Section title='Lists, Avatars & Badges'>
                                <Stack direction='row' spacing={3} alignItems='center'>
                                    <Badge color='secondary' badgeContent={4}>
                                        <Avatar>NB</Avatar>
                                    </Badge>
                                    <Badge color='error' variant='dot'>
                                        <Avatar/>
                                    </Badge>
                                </Stack>
                                <Paper variant='outlined'>
                                    <List>
                                        <ListItem>
                                            <ListItemAvatar><Avatar>R</Avatar></ListItemAvatar>
                                            <ListItemText primary='Raven' secondary='secondary text'/>
                                        </ListItem>
                                        <Divider component='li'/>
                                        <ListItem>
                                            <ListItemAvatar><Avatar>H</Avatar></ListItemAvatar>
                                            <ListItemText primary='Hawk' secondary='something else'/>
                                        </ListItem>
                                    </List>
                                </Paper>
                            </Section>
                        </Grid>

                        {/* Tabs, Accordion, Navigation */}
                        <Grid size={{xs: 12, md: 6}}>
                            <Section title='Tabs & Accordions'>
                                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                                    <Tab label='One'/>
                                    <Tab label='Two'/>
                                    <Tab label='Three'/>
                                </Tabs>
                                <Typography variant='body2'>Active tab: {tab + 1}</Typography>

                                <Accordion>
                                    <AccordionSummary>
                                        <Typography>Accordion A</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography>Content inside accordion A</Typography>
                                    </AccordionDetails>
                                </Accordion>
                                <Accordion>
                                    <AccordionSummary>
                                        <Typography>Accordion B</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography>More content inside accordion B</Typography>
                                    </AccordionDetails>
                                </Accordion>

                                <Breadcrumbs>
                                    <Link underline='hover' color='inherit' href='#'>Home</Link>
                                    <Link underline='hover' color='inherit' href='#'>Library</Link>
                                    <Typography color='text.primary'>Data</Typography>
                                </Breadcrumbs>
                                <Pagination count={10} defaultPage={3}/>
                            </Section>
                        </Grid>

                        {/* Feedback & Progress */}
                        <Grid size={12}>
                            <Section title='Feedback & Progress'>
                                <Stack direction='row' spacing={2} alignItems='center'>
                                    <Alert severity='info'>Informational alert</Alert>
                                    <Alert severity='success' variant='outlined'>Success outlined</Alert>
                                </Stack>
                                <LinearProgress/>
                                <Stack direction='row' spacing={2} alignItems='center'>
                                    <CircularProgress size={28}/>
                                    <Skeleton variant='rectangular' width={120} height={28}/>
                                    <Skeleton variant='text' width={180}/>
                                </Stack>
                            </Section>
                        </Grid>

                        {/* Cards & Table */}
                        <Grid size={{xs: 12, md: 6}}>
                            <Section title='Cards & Table'>
                                <Card>
                                    <CardHeader title='Card Title' subheader='Subheader'/>
                                    <CardContent>
                                        <Typography variant='body2'>
                                            Cards show your surfaces, radius, and typography decisions
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button size='small'>Action</Button>
                                        <Button size='small' variant='outlined'>Secondary</Button>
                                    </CardActions>
                                </Card>

                                <Table size='small'>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell align='right'>Calories</TableCell>
                                            <TableCell align='right'>Protein (g)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[
                                            {n: 'Frozen yogurt', c: 159, p: 6},
                                            {n: 'Ice cream', c: 237, p: 4.3},
                                            {n: 'Eclair', c: 262, p: 3.7}
                                        ].map(row => (
                                            <TableRow key={row.n}>
                                                <TableCell>{row.n}</TableCell>
                                                <TableCell align='right'>{row.c}</TableCell>
                                                <TableCell align='right'>{row.p}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Section>
                        </Grid>

                        {/* Overlays */}
                        <Grid size={{xs: 12, md: 6}}>
                            <Section title='Overlays: Dialog & Drawer'>
                                <Stack direction='row' spacing={2}>
                                    <Button variant='contained' onClick={() => setDialogOpen(true)}>Open Dialog</Button>
                                    <Button variant='outlined' onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
                                </Stack>

                                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                                    <DialogTitle>Dialog Title</DialogTitle>
                                    <DialogContent>
                                        <Typography>This is dialog content</Typography>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={() => setDialogOpen(false)}>Close</Button>
                                    </DialogActions>
                                </Dialog>

                                <Drawer anchor='right' open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                                    <Box sx={{width: 280, p: 2}}>
                                        <Typography variant='h6'>Drawer</Typography>
                                        <Typography variant='body2'>
                                            Drawers highlight elevation, surface, and typography scale
                                        </Typography>
                                    </Box>
                                </Drawer>
                            </Section>
                        </Grid>

                        {/* Steppers */}
                        <Grid size={{xs: 12, md: 6}}>
                            <Section title='Stepper'>
                                <Stepper activeStep={1} alternativeLabel>
                                    {['Select', 'Review', 'Pay'].map(label => (
                                        <Step key={label}>
                                            <StepLabel>{label}</StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                            </Section>
                        </Grid>
                    </Grid>

                    {/* Small confirmation after export/copy */}
                    <Snackbar
                        open={snackOpen}
                        autoHideDuration={1600}
                        onClose={() => setSnackOpen(false)}
                        message={snackMsg}
                    />
                    <PasteJSONDialog
                        open={pasteOpen}
                        onClose={closePaste}
                        onSubmit={handlePasteSubmit}
                    />
                </ThemeProvider>
            </Box>
        </Box>
    )
}
