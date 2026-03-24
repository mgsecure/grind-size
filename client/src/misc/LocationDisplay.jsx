import React from 'react'

export default function LocationDisplay(location = []) {

    const locationData = location.filter(Boolean)
    return (
        locationData.map(
            (loc, i) => <span key={i}>{loc}{i < locationData.length - 1 ? ', ' : ''}</span>
        )
    )

}