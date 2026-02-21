export default function cleanObject(object, props) {

    const {ignore} = props || {}
    if (ignore?.includes(object)) return {}

    if (!object || typeof object !== 'object' || Array.isArray(object)) {
        return object || {}
    }

    return Object.fromEntries(
        Object.entries(object)
            .filter(([_key, value]) => value !== null && typeof value !== 'undefined' && value !== '')
            .filter(([key]) => !ignore?.includes(key))
            .map(([key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return [key, cleanObject(value)]
                }
                return [key, value]
            })
            .filter(([_key, value]) => {
                if (value === null || typeof value === 'undefined') {
                    return false
                }
                return !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)

            })
    )

}