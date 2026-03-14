import React, {useContext} from 'react'
import {ResponsiveLine} from '@nivo/line'
import {primaryTheme} from '../../data/ChartDefaults'
import useWindowSize from '../../util/useWindowSize'
import DataContext from '../../context/DataContext.jsx'
import {setDeepPush} from '../../util/setDeep'

const SiteTraffic28DaysLine = () => {
    const {siteStats} = useContext(DataContext)
    const {last28days} = siteStats

    const lineData = Object.keys(last28days || {}).reduce((acc, date) => {
        setDeepPush(acc, ['visitors'], {x: `${date} 23:59:59`, y: last28days[date].visitors || 0})
        const pageViews = Object.keys(last28days[date].pageViews || {}).reduce((acc2, page) => {
            acc2 = (acc2 || 0) + last28days[date].pageViews[page] || 0
            return acc2
        }, 0)
        setDeepPush(acc, ['pageViews'], {x: `${date} 23:59:59`, y: pageViews || 0})

        return acc
    }, [])

    const fullLineData = [
        {id: 'visitors', data: lineData.visitors},
        {id: 'page views', data: lineData.pageViews}
    ]

    const {isMobile} = useWindowSize()
    const chartHeight = isMobile ? 300 : 450
    const chartWidth = isMobile ? 350 : 800
    const chartMargin = !isMobile
        ? {top: 25, right: 20, bottom: 75, left: 50}
        : {top: 10, right: 20, bottom: 50, left: 50}

    return (
        <div style={{height: chartHeight - 100, width: chartWidth}}>
            <ResponsiveLine
                theme={primaryTheme}
                data={fullLineData}
                enableGridX={false}
                enableGridY={false}
                colors={['#5265ed', '#082fd1', '#4fa720']}
                lineWidth={3}
                margin={chartMargin}
                height={chartHeight - 100}
                curve='basis'
                yScale={{
                    type: 'linear',
                    min: 0,
                    max: 'auto',
                    stacked: false,
                    reverse: false
                }}
                yFormat=' >-.0f'
                axisLeft={{
                    tickValues: 5,
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    format: ','
                }}
                xScale={{
                    type: 'time',
                    format: '%Y-%m-%d %H:%M:%S'
                }}
                xFormat='time:%m/%d/%y'
                axisBottom={{
                    format: '%b %d',
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    direction: 'row',
                    legendOffset: -12,
                    tickValues: 'every day'
                }}
                legends={[
                    {
                        anchor: 'bottom',
                        itemTextColor: '#b4b4b4',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 70,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 20,
                        symbolSize: 13,
                        symbolShape: 'circle'
                    }
                ]}
                enablePoints={false}
                useMesh={true}
                isInteractive={true}
            />
        </div>
    )
}

export default SiteTraffic28DaysLine
