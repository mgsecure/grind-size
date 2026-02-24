import React, {createContext, useMemo, useState} from 'react'
import {ThemeProvider, createTheme} from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import {lightOverrides} from './themeOverride'

const ColorModeContext = createContext({
    toggleColorMode: () => {
    }
})

export function ColorModeProvider({children}) {

    const baseTheme = createTheme({
        typography: {fontFamily: 'Roboto, sans-serif'},
        breakpoints: {
            values: {
                xs: 0,
                sm: 600,
                md: 800,
                lg: 1200,
                xl: 1536
            }
        },
        components: {
            MuiLink: {
                defaultProps: {
                    underline: 'none'
                },
                styleOverrides: {
                    root: {
                        cursor: 'pointer'
                    }
                }
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundImage: 'none'
                    }
                }
            }
        }
    })

    const darkTheme = createTheme({
        ...baseTheme,
        palette: {
            mode: 'dark',
            secondary: {
                main: '#2d49bc'
            },
            card: {
                main: '#563028',
                add: '#805046'
            },
            'background': {
                'default': '#291915',
                'paper': '#3a2018'
            }
        }
    })

    const lightTheme = createTheme({
        ...baseTheme,
        palette: {
            mode: 'light',
            card: {
                main: '#efc5c0',
                add: '#e3afa4'
            }
        }
    })

    const [mode, setMode] = useState('dark')
    const colorMode = useMemo(() => ({
            toggleColorMode: () => {
                console.log('toggleColorMode')
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
            }
        }),
        []
    )

    const theme = useMemo(() =>
            mode === 'light'
                ? lightTheme
                : darkTheme,
        [darkTheme, lightTheme, mode]
    )

    const style = getRootStyle(theme)

    const value = useMemo(() => ({
        colorMode,
        lightTheme,
        darkTheme,
        theme
    }), [colorMode, darkTheme, lightTheme, theme])

    return (
        <ColorModeContext.Provider value={value}>
            <ThemeProvider theme={theme}>
                <CssBaseline enableColorScheme/>
                <style>{style}</style>

                {children}

            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}

export default ColorModeContext

export const getRootStyle = styleTheme => {
    //const linkTextColor = styleTheme.palette.text.primary.icon
    const linkTextColor = styleTheme.palette.primary.dark
    const backgroundColor = styleTheme.palette.background.default

    return `
            body {
                background-color: ${backgroundColor};
                margin: 0;
                padding: 0;
            }
            
            a, .MuiLink-root {
                color: ${linkTextColor};
                text-decoration: none;
                cursor: pointer;
            }

            a:hover, .MuiLink-root:hover {
                color: ${linkTextColor};
                text-decoration: underline;
                cursor: pointer;
            }

            pre { 
                white-space: pre-wrap; 
                word-break: break-word;
            }
            
            :root {
              color-scheme: dark;
              overflow-y: scroll;
            }
        `
}
