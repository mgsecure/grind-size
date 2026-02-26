import * as React from 'react'
const SvgComponent = (props) => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' {...props}>
        <path
            d='M3.7 33.6S6.5 4.3 18 4.3s14.3 29.3 14.3 29.3'
            style={{
                fill: 'none',
                stroke: '#fff',
                strokeMiterlimit: 10,
                strokeWidth: 5,
            }}
        />
    </svg>
)
export default SvgComponent
