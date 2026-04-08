import React, {useCallback, useMemo, useState} from 'react'
import Checkbox from '@mui/material/Checkbox'
import Collapse from '@mui/material/Collapse'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import AutoCompleteBox from '../../formUtils/AutoCompleteBox.jsx'
import useWindowSize from '../../util/useWindowSize.jsx'
import {useTheme} from '@mui/material/styles'
import {setDeepUnique} from '../../util/setDeep'
import psdGrinders from '../../data/psdGrinders.json'

export default function EquipmentForm({form, setForm, handleFormChange}) {
    const theme = useTheme()
    const {flexStyle, isMobile} = useWindowSize()

    const [brandReset, setBrandReset] = useState(false)
    const [modelReset, setModelReset] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [inputValueOverride, _setInputValueOverride] = useState(false)

    const [inputModelValue, setInputModelValue] = useState('')
    const [inputModelValueOverride, _setInputModelValueOverride] = useState(false)

    const machineTypeBrandModels = useMemo(() => {
        return psdGrinders.reduce((acc, machine) => {
            setDeepUnique(acc, [machine.type, machine.brand], machine.model)
            return acc
        }, {})
    }, [])

    const typeBrands = useMemo(() => {
        return Object.keys(machineTypeBrandModels[form.type] || {}).filter(x => x) || []
    }, [form.type, machineTypeBrandModels])

    const brandModels = useMemo(() => {
        return (machineTypeBrandModels[form.type]?.[form.brand] || []).filter(x => x)
    }, [form.brand, form.type, machineTypeBrandModels])

    const handleAltBrandToggle = useCallback(() => {
        setBrandReset(!brandReset)
        const formCopy = {...form}
        formCopy.altBrand = !formCopy.altBrand
        if (formCopy.altBrand) {
            formCopy.newBrand = inputValue
            delete formCopy['brand']
        } else {
            delete formCopy.newBrand
        }
        setTimeout(() => setForm(formCopy), 10)
        setTimeout(() => {
            if (formCopy.altBrand) {
                document.getElementById('newBrand').focus()
                document.getElementById('newBrand').select()
            }
        }, 100)
    }, [brandReset, form, inputValue, setForm])

    const handleAltModelToggle = useCallback(() => {
        setModelReset(!modelReset)
        const formCopy = {...form}
        formCopy.altModel = !formCopy.altModel
        if (formCopy.altModel) {
            formCopy.newModel = inputModelValue
            delete formCopy['model']
        } else {
            delete formCopy.newModel
        }
        setTimeout(() => {
            setForm(formCopy)
        }, 10)
        setTimeout(() => {
            if (formCopy.altBrand) {
                document.getElementById('newModel').focus()
                document.getElementById('newModel').select()
            }
        }, 100)
    }, [form, inputModelValue, modelReset, setForm])

    const brandBoxOpacity = form.altBrand > 0 ? 0.5 : 1
    const modelBoxOpacity = form.altModel > 0 ? 0.5 : 1

    return (
        <div>

            <div style={{marginRight: 5, display: flexStyle, marginBottom: 0}} id={'drawer'}>

                <form action={null} encType='multipart/form-data' method='post'>

                    <div style={{display: flexStyle, marginRight: 0, marginBottom: 10}}>
                        <div style={{marginTop: 10}}>
                            <Collapse in={!form.altBrand}>
                                <div style={{marginRight: 10}}>
                                    <div style={{
                                        fontSize: '0.95rem',
                                        lineHeight: '1.3rem',
                                        fontWeight: 500,
                                        marginBottom: 3
                                    }}>
                                        Grinder Brand (Required)
                                    </div>
                                    <AutoCompleteBox changeHandler={handleFormChange}
                                                     options={typeBrands || []}
                                                     name={'brand'}
                                                     inputValue={inputValue}
                                                     setInputValue={setInputValue}
                                                     style={{
                                                         opacity: brandBoxOpacity,
                                                         minWidth: isMobile ? 150 : 200
                                                     }}
                                                     reset={brandReset}
                                                     disabled={form.altBrand}
                                                     inputValueOverride={inputValueOverride}
                                                     inputValueHandler={setInputValue}
                                                     noOptionsMessage={'Add a brand'}
                                                     noOptionsHandler={handleAltBrandToggle}/>
                                </div>
                            </Collapse>
                            <Collapse in={form.altBrand}>
                                <div style={{marginRight: 10}}>
                                    <div style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 500,
                                        marginBottom: 0,
                                        color: theme.palette.info.main
                                    }}>
                                        Enter New Brand
                                    </div>
                                    <TextField type='text' id='newBrand' name='newBrand'
                                               value={form.newBrand || ''}
                                               style={{marginBottom: 0, width: '100%'}}
                                               onChange={handleFormChange}
                                               color='info' size='small'/>
                                </div>
                            </Collapse>
                            <div style={{marginTop: 4}}>
                                <Checkbox onChange={handleAltBrandToggle} id='altBrand'
                                          name='altBrand'
                                          checked={form.altBrand || false} color='info'
                                          size='small'/>
                                <Link onClick={handleAltBrandToggle}
                                      style={{color: theme.palette.info.main}}>
                                    Add a new brand
                                </Link>
                            </div>
                        </div>

                        <div style={{marginRight: 15, marginTop: 10}}>
                            <Collapse in={!form.altModel}>
                                <div style={{marginRight: 10}}>
                                    <div style={{
                                        fontSize: '0.95rem',
                                        lineHeight: '1.3rem',
                                        fontWeight: 400,
                                        marginBottom: 3
                                    }}>
                                        Choose Model
                                    </div>
                                    <AutoCompleteBox changeHandler={handleFormChange}
                                                     options={brandModels || []}
                                                     name={'model'}
                                                     inputValue={inputModelValue}
                                                     setInputValue={setInputModelValue}
                                                     style={{
                                                         opacity: modelBoxOpacity,
                                                         minWidth: isMobile ? 150 : 200
                                                     }}
                                                     reset={brandReset}
                                                     disabled={form.altBrand}
                                                     inputValueOverride={inputModelValueOverride}
                                                     inputValueHandler={setInputModelValue}
                                                     noOptionsMessage={'Add a model'}
                                                     noOptionsHandler={handleAltModelToggle}/>
                                </div>
                            </Collapse>
                            <Collapse in={form.altModel}>
                                <div style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 500,
                                    marginBottom: 0,
                                    color: theme.palette.info.main
                                }}>
                                    Enter New Model
                                </div>
                                <TextField type='text' id='newModel' name='newModel'
                                           value={form.newModel || ''}
                                           style={{marginBottom: 0, width: '100%'}}
                                           onChange={handleFormChange}
                                           color='info' size='small'/>
                            </Collapse>
                            <div style={{marginTop: 4}}>
                                <Checkbox onChange={handleAltModelToggle} id='altModel'
                                          name='altModel'
                                          checked={form.altModel || false} color='info'
                                          size='small'/>
                                <Link onClick={handleAltModelToggle}
                                      style={{color: theme.palette.info.main}}>
                                    Add a new model
                                </Link>
                            </div>
                        </div>

                        <div style={{marginRight: 15, marginTop: 10}}>
                            <div style={{
                                fontSize: '0.95rem',
                                lineHeight: '1.3rem',
                                fontWeight: 400,
                                marginBottom: 3
                            }}>
                                Grinder Setting
                            </div>
                            <TextField type='text' name='setting'
                                       color='info' size='small'
                                       style={{width: 150}} value={form.setting || ''}
                                       id='setting' onChange={handleFormChange}
                                       slotProps={{
                                           htmlInput: {
                                               maxLength: 40
                                           }
                                       }}
                            />

                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}