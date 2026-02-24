import React, {useCallback, useContext, useEffect, useRef, useState} from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Stack from '@mui/material/Stack'
import rehypeExternalLinks from 'rehype-external-links'
import FieldValue from '../misc/FieldValue'
import ReactMarkdown from 'react-markdown'
import FilterChip from '../filters/FilterChip'
import CopyLinkToEntryButton from '../entries/CopyLinkToEntryButton'
import AccordionActions from '@mui/material/AccordionActions'
import Button from '@mui/material/Button'
import CopyEntryTextButton from '../entries/CopyEntryTextButton.jsx'
import queryString from 'query-string'
import CopyEntryIdButton from '../entries/CopyEntryIdButton.jsx'
import OpenLinkToEntryButton from '../entries/OpenLinkToEntryButton.jsx'
import DataContext from '../context/DataContext.jsx'
import LogEntryButton from '../entries/LogEntryButton.jsx'
import useWindowSize from '../util/useWindowSize.jsx'
import FilterContext from '../context/FilterContext.jsx'
import entryName from '../misc/entryName'
import EntryRatingDisplay from '../entries/EntryRatingDisplay.jsx'
import isValidUrl from '../util/isValidUrl'
import Link from '@mui/material/Link'
import AppContext from '../app/AppContext.jsx'
import EntryImageGallery from '../psd/components/EntryImageGallery.jsx'

function BeanEntry({entry, expanded, onExpand}) {
    const {beta} = useContext(AppContext)
    const {expandAll} = useContext(DataContext)
    const {filters} = useContext(FilterContext)
    const [scrolled, setScrolled] = useState(false)
    const style = {width: '100%', maxWidth: 800, marginLeft: 'auto', marginRight: 'auto'}
    const ref = useRef(null)
    const {search, sort} = filters
    const lockName = entryName(entry, 'short', {includeVersion: true})

    const handleChange = useCallback((_, isExpanded) => {
        onExpand && onExpand(isExpanded ? entry.id : false)
    }, [entry, onExpand])

    const openInNewTab = useCallback((url) => {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null
    }, [])

    const {isMobile} = useWindowSize()

    useEffect(() => {
        if (expanded && ref && !scrolled && !expandAll) {
            const offset = isMobile ? 70 : 74
            const {id} = queryString.parse(location.search)
            const isIdFiltered = id === entry.id

            setScrolled(true)

            setTimeout(() => {
                window.scrollTo({
                    left: 0,
                    top: ref?.current?.offsetTop - offset,
                    behavior: isIdFiltered ? 'auto' : 'smooth'
                })
            }, isIdFiltered ? 0 : 100)
        } else if (!expanded) {
            setScrolled(false)
        }
    }, [expanded, entry, scrolled, expandAll, isMobile])

    const linkSx = {
        color: '#aaa', textDecoration: 'none', cursor: 'pointer',
        '&:hover': {color: '#fff'}
    }
    const locationSep = (!!entry.roasterCity && entry.roasterCountry) ? ', ' : ''
    const beanUrl = isValidUrl(entry.url) ? entry.url : undefined
    const beanLink = beanUrl ? <Link sx={linkSx} onClick={() => openInNewTab(entry.url)}>{entry.url}</Link> : entry.url

    const summaryContent = !['priceLb', 'price100g'].includes(sort)
        ? <EntryRatingDisplay entry={entry}/>
        : sort === 'price100g'
            ? <div>
                {entry.price100g && <div><strong>${parseFloat(entry.usd100g).toFixed(2)} USD</strong></div>}
                {entry.alt100gPrice &&
                    <div style={{fontSize: '0.8rem', textAlign: 'right'}}>({entry.alt100gPrice})</div>}
            </div>
            : <div>
                {entry.pricePound && <div style={{fontSize: '0.95rem', marginBottom: 4}}>
                    <strong>${parseFloat(entry.usdPound).toFixed(2)} USD</strong></div>}
                {entry.altPoundPrice &&
                    <div style={{fontSize: '0.8rem', textAlign: 'right'}}>({entry.altPoundPrice})</div>}
            </div>


    const makeModelWidth = isMobile ? '55%' : '65%'

    // TODO - don't bring in FilterChip, just render here. Fix add filter for new style.

    return (
        <Accordion expanded={expanded} onChange={handleChange} style={style} ref={ref} role='listitem'
                   aria-label={lockName}>
            <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                <div style={{
                    margin: '6px 0px 8px 6px',
                    width: makeModelWidth,
                    flexShrink: 0,
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>

                    <div style={{fontSize: '0.9rem', marginBottom: 4}}>
                        {entry.roaster}
                    </div>
                    <div style={{fontSize: '1.0rem'}}>
                        <span style={{fontWeight: 600}}>{entry.name}</span>
                    </div>

                </div>
                <div style={{
                    margin: '0px 16px 0px 0px',
                    width: '40%',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                }}>
                    {summaryContent}
                </div>

            </AccordionSummary>
            {
                expanded &&
                <React.Fragment>
                    <AccordionDetails sx={{padding: '0px 16px 0px 16px'}}>
                        <Stack direction='row' spacing={0} style={{flexWrap: 'wrap', marginBottom: 8}}>
                            <FieldValue name='Date' value={entry.dateAdded} style={{marginRight: 24}}/>
                            <FieldValue name='Rating' value={entry.rating} suffix={'/10'} style={{marginRight: 24}}/>
                            <FieldValue name='Tasting Notes' value={entry.tastingNotes} style={{marginRight: 24}}/>
                            <FieldValue name='Reddit Username' value={entry.usernameReddit} style={{marginRight: 24}}/>
                        </Stack>
                        <Stack direction='row' spacing={0} style={{flexWrap: 'wrap', marginBottom: 8}}>
                            <FieldValue name='Origin' value={entry.origin} style={{marginRight: 24}}/>
                            <FieldValue name='Caffeine' value={entry.caffeine} style={{marginRight: 24}}/>
                            <FieldValue name='Roasted In'
                                        value={<span>{entry.roasterCity}{locationSep}{entry.roasterCountry}</span>}
                                        style={{marginRight: 24}}/>
                            <FieldValue name='Roast Level' value={entry.roastLevel} style={{marginRight: 24}}/>
                            <FieldValue name='Roast Date' value={entry.roastDate} style={{marginRight: 24}}/>
                            <FieldValue name='Rested Days' value={entry.restedDays} style={{marginRight: 24}}/>
                        </Stack>
                        <Stack direction='row' spacing={0} style={{flexWrap: 'wrap', marginBottom: 8}}>
                            <FieldValue name='Machine' value={entry.machineFullName} style={{marginRight: 24}}/>
                            <FieldValue name='Grinder' value={entry.grinderFullName} style={{marginRight: 24}}/>
                            <FieldValue name='BurrSet' value={entry.burrSet} style={{marginRight: 24}}/>
                            <FieldValue name='Grind Setting' value={entry.grindSetting} style={{marginRight: 24}}/>
                            <FieldValue name='Basket' value={entry.basket} style={{marginRight: 24}}/>

                        </Stack>
                        <Stack direction='row' spacing={0} style={{flexWrap: 'wrap', marginBottom: 8}}>
                            <FieldValue name='Dose' value={entry.doseGrams} suffix={'g'} style={{marginRight: 24}}/>
                            <FieldValue name='Yield' value={entry.yieldGrams} suffix={'g'} style={{marginRight: 24}}/>
                            <FieldValue name='Brew Ratio' value={entry.brewRatio} style={{marginRight: 24}}/>
                            <FieldValue name='Shot Time' value={entry.shotTimeSeconds} suffix={' sec'}
                                        style={{marginRight: 24}}/>
                            <FieldValue name='Temperature' value={entry.temperatureCelsius} suffix={'°C'}
                                        style={{marginRight: 24}}/>
                        </Stack>
                        <Stack direction='row' spacing={0} style={{flexWrap: 'wrap', marginBottom: 8}}>
                            <FieldValue name='Profile' value={entry.profile} style={{marginRight: 24}}/>
                            <FieldValue name='Additional Workflow' value={entry.additionalWorkflow}
                                        style={{marginRight: 24}}/>
                        </Stack>
                        <Stack direction='row' spacing={0} style={{flexWrap: 'wrap', marginBottom: 8}}>
                            <FieldValue name='Weight' value={entry.weight} suffix={'g'} style={{marginRight: 24}}/>
                            <FieldValue name='Price' value={entry.price} prefix={entry.currencySymbol}
                                        style={{marginRight: 24}}/>
                            <FieldValue name='Price per 100g' value={entry.price100g} prefix={entry.currencySymbol}
                                        suffix={'/100g'} style={{marginRight: 24}}/>
                            <FieldValue name='Price per Pound' value={entry.pricePound} prefix={entry.currencySymbol}
                                        suffix={'/lb'} style={{marginRight: 24}}/>
                        </Stack>
                        <Stack direction='row' spacing={0} style={{flexWrap: 'wrap', marginBottom: 8}}>
                            <FieldValue name='Link' value={beanLink} style={{marginRight: 24}}/>
                        </Stack>
                        {!!entry.features?.length &&
                            <FieldValue name='Features' value={
                                <Stack direction='row' spacing={0} sx={{flexWrap: 'wrap'}}>
                                    {entry.features.map((feature, index) =>
                                        <FilterChip
                                            key={index}
                                            value={feature}
                                            field='features'
                                        />
                                    )}
                                </Stack>
                            }/>
                        }
                        {!!entry.description &&
                            <div style={{margin: 8}}>
                                <ReactMarkdown rehypePlugins={[[rehypeExternalLinks, {
                                    target: '_blank',
                                    rel: ['nofollow', 'noopener', 'noreferrer']
                                }]]}>
                                    {entry.description}
                                </ReactMarkdown>
                            </div>
                        }

                        {
                            !!entry.media?.length &&
                            <FieldValue value={
                                <EntryImageGallery entry={entry}/>
                            }/>
                        }

                        <div style={{display: 'flex'}}>
                            {
                                !!entry.links?.length &&
                                <FieldValue name='Links' value={
                                    <Stack direction='row' spacing={1} sx={{flexWrap: 'wrap'}}>
                                        {entry.links.map(({title, url}, index) =>
                                            <Button
                                                key={index}
                                                href={url}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                color='secondary'
                                                variant='outlined'
                                                sx={{textTransform: 'none'}}
                                                style={{margin: 4}}
                                            >
                                                {title}
                                            </Button>
                                        )}
                                    </Stack>
                                }/>
                            }
                        </div>
                    </AccordionDetails>
                    <AccordionActions disableSpacing>
                        <div style={{display: 'flex', width: '100%'}}>
                            <div style={{flexGrow: 1, justifyItems: 'left'}}>
                                {beta &&
                                    <>
                                        <CopyEntryIdButton entry={entry}/>
                                        <OpenLinkToEntryButton entry={entry}/>
                                        <LogEntryButton entry={entry}/>
                                    </>
                                }
                            </div>
                            <div style={{display: 'flex'}}>
                                <CopyEntryTextButton entryName={entry.fullName}/>
                                <CopyLinkToEntryButton entry={entry}/>
                            </div>
                        </div>

                    </AccordionActions>
                </React.Fragment>
            }
        </Accordion>
    )
}

export default React.memo(BeanEntry, (prevProps, nextProps) => {
    return prevProps.entry.id === nextProps.entry.id &&
        prevProps.expanded === nextProps.expanded &&
        prevProps.onExpand === nextProps.onExpand
})
