import * as React from 'react'
const SvgComponent = (props) => (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' {...props}>
        <path
            d='M4.3 33.8 18 5.8l13.7 28'
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
