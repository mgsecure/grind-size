import fs from 'fs'
import {parse} from 'csv-parse/sync'
import {
    equipmentSchema, sampleSetSchema
} from './importSchemas.js'
import fetch from 'node-fetch'
import validate from './importValidate.js'
import {DATA_SHEET_ID} from '../../keys/importKeys.js'

// Helper to load and validate a file
const importValidate = async (tab, schema) => {
    console.log(`Importing ${tab}...`)

    // Download file
    const safeTab = encodeURI(tab)

    const url = `https://docs.google.com/spreadsheets/d/${DATA_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${safeTab}&headers=1`
    const csvData = await (await fetch(url)).text()

    // Parse CSV into JSON
    const data = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    })

    // Validate data before merging in
    validate(data, schema)

    return data
}

const sampleSetData = await importValidate('SampleSets', sampleSetSchema)
const equipmentData = await importValidate('Equipment', equipmentSchema)


// Load previous JSON for recently updated checks
//const originalData = JSON.parse(fs.readFileSync('./src/data/data.json', 'utf8'))

// Transform fields into internal JSON format
console.log('Processing main data...')
const sampleSets = sampleSetData
    .map(datum => {
        const value = {...datum, adminOnly: datum.adminOnly === 'TRUE'}
        Object.keys(value).forEach(key => {
            if (typeof value[key] === 'string' && value[key] === '') value[key] = undefined
            else if (Array.isArray(value[key]) && value[key].length === 0) value[key] = undefined
        })
        return value
    })
console.log('Writing sampleSets.json...')
fs.writeFileSync('../src/data/sampleSets.json', JSON.stringify(sampleSets, null, 2))

console.log('Processing equipment data...')
const equipment = equipmentData
    .map(datum => {
        const model = datum['Model']
        const value = {
            id: datum.ID,
            type: datum.Type,
            brand: datum.Brand,
            model: model,
            fullName: (datum.Brand && model)
                ? `${datum.Brand} ${model}`
                : `${datum.Brand || ''}${model || ''}` || '',
        }

        // Clean up empty values to reduce payload size
        Object.keys(value).forEach(key => {
            if (typeof value[key] === 'string' && value[key] === '') value[key] = undefined
            else if (Array.isArray(value[key]) && value[key].length === 0) value[key] = undefined
        })
        return value
    })
    .sort((a, b) => {
        return a.fullName?.localeCompare(b.fullName)
    })

console.log('Writing equipment.json...')
fs.writeFileSync('../src/data/equipment.json', JSON.stringify(equipment, null, 2))

console.log('Complete.')