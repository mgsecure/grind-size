import SortTextButton from './SortTextButton.jsx'
import AdvancedFilterDrawerButton from './AdvancedFilterDrawerButton.jsx'
import React, {useContext} from 'react'
import useWindowSize from '../util/useWindowSize.jsx'
import FilterContext from '../context/FilterContext.jsx'
import Box from '@mui/material/Box'
import ResetFiltersButton from './ResetFiltersButton.jsx'

function ViewFilterButtons({
                               sortValues,
                               extraFilters = [],
                               compactMode,
                               resetAll = false,
                               expandAll = false,
                               style,
                               advancedEnabled = false,
                               entryType
                           }) {

    const {filters, filterCount, isFiltered} = useContext(FilterContext)
    const {sort} = filters

    const reset = sort || filterCount > 0 || (isFiltered && resetAll)

    const {width} = useWindowSize()
    const smallWidth = width <= 500

    const buttonPaddingTop = !smallWidth ? 0 : 3
    const buttonMarginBottom = !smallWidth ? 0 : 2
    const buttonWidth = !smallWidth ? 60 : 40

    return (
        <Box style={{
            display: 'flex',
            paddingTop: buttonPaddingTop,
            marginBottom: buttonMarginBottom,
            marginLeft: 0,
            justifyContent: 'center',
            ...style
        }}
             sx={{
                 '.MuiBadge-anchorOriginTopRightRectangular': {
                     marginTop: '5px'
                 },
                 '.MuiButton-root': {
                     minWidth: buttonWidth
                 }
             }}
        >
            <SortTextButton sortValues={sortValues} compactMode={compactMode} expandAll={expandAll}/>
            <AdvancedFilterDrawerButton extraFilters={extraFilters} entryType={entryType}
                                        advancedEnabled={advancedEnabled}/>
            {!!reset &&
                <ResetFiltersButton advanced nav/>}
        </Box>
    )
}

export default ViewFilterButtons