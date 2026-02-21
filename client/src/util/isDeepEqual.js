import cleanObject from './cleanObject.js'

export default function isDeepEqual(rawX, rawY, props) {

    const {ignore} = props || []
    const debug = false

    const x = cleanObject(rawX, {ignore})
    const y = cleanObject(rawY, {ignore})

    if (x === y) return true

    else if ((typeof x === 'object' && x !== null) && (typeof y === 'object' && y !== null)) {

        if (Object.keys(x).length !== Object.keys(y).length) {
            debug && console.log('not deep equal: different length', x, y)
            return false
        }
        for (const prop in x) {
            if (y[prop] !== undefined) {
                if (! isDeepEqual(x[prop], y[prop])) {
                    debug && console.log('not deep equal', prop)
                    return false
                }
            } else return false
        }
        return true
    }
    else return false
}
