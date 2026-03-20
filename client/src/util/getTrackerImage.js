import querystring from 'query-string'

export default async function getTrackerImage({feature, ...extraParams}) {

    // disable for testing/reporting
    //if (import.meta.env.DEV) return null

    const randomStuff = (Math.random()).toString(36).substring(2, 10)
    const file = files[feature] || 'analysis.gif'
    const query = querystring.stringify({trk: feature, r: randomStuff, ...extraParams})
    const url = `https://coffee-grind.com/i/${file}?${query}`
    await fetch(url, {cache: 'no-store'})

}

const files = {
    analysis: 'analysis.gif',
}

