export function spaceJoin(str1, str2) {
    return str1 && str2 ? `${str1} ${str2}` : str1 || str2
}

export function commaJoin(str1, str2) {
    return str1 && str2 ? `${str1}, ${str2}` : str1 || str2
}

export function capitalizeFirstLetter(string) {
    if (typeof string !== 'string' || string.length === 0) {
        return string
    }
    return string.charAt(0).toUpperCase() + string.slice(1)
}

export function getFileNameWithoutExtension(filename) {
    const lastDotIndex = filename.lastIndexOf('.')
    // Check if a dot was found and it's not the very first character
    if (lastDotIndex !== -1 && lastDotIndex !== 0) {
        return filename.substring(0, lastDotIndex)
    }
    return filename
}

export function cleanCount(num, string, lowerCase = true) {
    const numberStrings = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const numString = numberStrings[num] || parseInt(num).toString()
    return (lowerCase ? numString.toLowerCase() : numString) + ' ' + string + (num > 1 ? 's' : '')
}


export function isValidRegex(pattern) {
    try {
        new RegExp(pattern)
        return true
    } catch (e) {
        if (e instanceof SyntaxError) {
            return false
        }
        throw e
    }
}
