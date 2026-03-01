import queryString from 'query-string'
import React, {useCallback, useContext, useMemo} from 'react'
import {useLocation} from 'react-router-dom'
import FilterContext from '../../context/FilterContext.jsx'
import ImageGallery from './ImageGallery.jsx'

export default function QueueImageGallery({queueItems}) {
    const location = useLocation()
    const {filters, addFilter, removeFilters} = useContext(FilterContext)

    const handleOpenImage = useCallback(imageNum => {
        addFilter('sample', imageNum, true)
    }, [addFilter])

    const handleCloseImage = useCallback(() => {
        removeFilters(['sample'])
    }, [removeFilters])

    const handleBackButton = useCallback(() => {
        const {sample} = queryString.parse(location.search)
        return isValidImage(sample, queueItems)
    }, [queueItems, location])

    const openIndex = useMemo(() => {
        return filters.sample ? +filters.sample : -1
    }, [filters])

    const initiallyOpen = isValidImage(openIndex, queueItems)


    return (
        <ImageGallery
            media={group.media}
            allMedia={sortedMedia}
            openIndex={openIndex}
            initiallyOpen={initiallyOpen}
            onOpenImage={handleOpenImage}
            onCloseImage={handleCloseImage}
            onBackButton={handleBackButton}
        />
    )
}

const isValidImage = (image, queueItems) => /\d+/.test(image) && !!queueItems.media.find(m => m.sequenceId === image)