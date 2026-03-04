import React from 'react'
import {useNavigate} from 'react-router-dom'
import Link from '@mui/material/Link'
import rehypeExternalLinks from 'rehype-external-links'
import remarkGfm from 'remark-gfm'
import ReactMarkdown from 'react-markdown'

export default function IntroCopy({introCopy, link, maxWidth = '100%', style={}} = {}) {
    const navigate = useNavigate()

    const {title, markdown} = introCopy || {}
    const {url, linkText} = link || {}

    if (markdown) {
        return (
            <div style={{
                maxWidth: maxWidth,
                marginLeft: 'auto',
                marginRight: 'auto',
                fontSize: '1rem',
                lineHeight: '1.35rem',
                ...style
            }}>
                {title &&
                    <div style={{fontSize: '1.2rem', fontWeight: 600}}>{title}</div>
                }
                <ReactMarkdown rehypePlugins={[[rehypeExternalLinks, {
                    target: '_blank',
                    rel: ['nofollow', 'noopener', 'noreferrer']
                }]]} remarkPlugins={[remarkGfm]}>
                    {markdown}
                </ReactMarkdown>
                {url && linkText &&
                    <React.Fragment>
                        &nbsp;<Link onClick={() => {
                        navigate(url)
                    }} style={{color: '#aaa', cursor: 'pointer'}}>{linkText}</Link>
                    </React.Fragment>
                }
            </div>
        )
    }
}