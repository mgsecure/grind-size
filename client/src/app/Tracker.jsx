import React, {useContext} from 'react'
import querystring from 'query-string'
import AppContext from './AppContext'

function Tracker({feature, ...extraParams}) {
    const {adminEnabled} = useContext(AppContext)

    // disable for testing/reporting
    if (import.meta.env.DEV) return null
    //if (adminEnabled) return null

    //const pageParam = extraParams?.page?.replace(/[^\w\s]/, '-').replace(/\s/g, '_')
    const randomStuff = (Math.random()).toString(36).substring(2, 10)
    const file = files[feature] || 'psd.gif'
    const ref = document.referrer || 'none'
    const page = extraParams?.page || window.location.href.replace(/.*\/#\/(\w+)\?*.*/,'$1')
    const query = querystring.stringify({trk: feature, r: randomStuff, w: screen.width, ref, ...extraParams, page})
    const url = `https://coffee-grind.com/i/${file}?${query}`

    // <Tracker feature='search' search={search}/>
    // <Tracker feature='lock' id={entry.id} search={search}/>

    return <img alt='coffee-grind' src={url} width={0} height={0}/>
}

const files = {
    locks: 'psd.gif',
}

export default React.memo(Tracker)
