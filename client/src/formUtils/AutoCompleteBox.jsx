import Backdrop from '@mui/material/Backdrop'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import useWindowSize from '../util/useWindowSize.jsx'
import Button from '@mui/material/Button'

function AutoCompleteBox({
                             name,
                             changeHandler,
                             inputValue,
                             setInputValue,
                             options,
                             style,
                             disabled = false,
                             reset,
                             placeholder = 'Search...',
                             noOptionsMessage,
                             noOptionsHandler,
                             inputValueHandler,
                             inputValueOverride,
                             size = 'small'
                         }) {
    const inputEl = useRef(null)
    const [open, setOpen] = useState(false)
    const handleBlur = useCallback(() => setOpen(false), [])
    const {isMobile} = useWindowSize()
    //const [inputValue, setInputValue] = useState('')

    const noOptionsText = noOptionsMessage && !!noOptionsHandler
        ? <Button onClick={noOptionsHandler} variant='contained' color='info'>
            {noOptionsMessage}
        </Button>
        : null

    const handleChange = useCallback((_event, value) => {
        if (options.includes(value)) {
            changeHandler({target: {name: name, value: value}})
        } else {
            changeHandler({target: {name: name, value: undefined}})
        }
    }, [options, changeHandler, name])

    const handleInputChange = (_event, newInputValue) => {
        !!inputValueHandler && inputValueHandler(_event)
        setInputValue(newInputValue) // Update input value
    }

    useEffect(() => {
        if (inputValue && inputValue.length > 0) setInputValue('')
    }, [inputValueOverride, setInputValue]) //eslint-disable-line

    return (
        <React.Fragment>
            <Autocomplete
                disabled={disabled}
                key={reset || disabled}
                selectOnFocus
                clearOnEscape
                clearOnBlur={false}
                handleHomeEndKeys
                autoHighlight
                fullWidth
                style={style}
                size={size}
                options={options}
                name={name}
                onChange={handleChange}
                inputValue={inputValue || ''}
                onInputChange={handleInputChange}
                renderInput={(params) =>
                    <TextField
                        {...params}
                        placeholder={placeholder}
                        variant='outlined'
                        color='info'
                        inputRef={inputEl}
                        slotprops={{
                            input: {
                                ...params.InputProps,
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SearchIcon/>
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                }
                noOptionsText={noOptionsText}
            />
            <Backdrop
                invisible
                open={open && isMobile}
                onClick={handleBlur}
            />
        </React.Fragment>
    )
}

export default AutoCompleteBox
