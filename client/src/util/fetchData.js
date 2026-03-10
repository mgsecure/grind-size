export default async function fetchData(url) {
    let loading = true
    let data = null
    let error = false
    let errorMessage = null

    try {
        // If this still fails with 'Failed to fetch', it's most likely a CORS issue
        const response = await fetch(url, {cache: 'no-store'})
        if (!response.ok) {
            error = true
            errorMessage = `HTTP error! status: ${response.status}`
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        data = await response.json()
    } catch (err) {
        error = true
        errorMessage = err.message || err
        console.error('Error fetching demo data:', err.message || err)
        throw new Error(`Error fetching demo data: ${err.message || err}`)
    } finally {
        loading = false
    }

    return {data, loading, error, errorMessage}

}
