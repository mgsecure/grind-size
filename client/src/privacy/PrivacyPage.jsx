import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeExternalLinks from 'rehype-external-links'
import privacyPolicyMd from '../resources/privacyPolicy.md?raw'
import remarkGfm from 'remark-gfm'
import Nav from '../nav/Nav'
import usePageTitle from '../util/usePageTitle.jsx'
import Tracker from '../app/Tracker.jsx'

function PrivacyPage() {
    usePageTitle('Privacy Policy')

    return (
        <React.Fragment>
            <Nav />

            <Card style={{
                maxWidth: 800,
                marginLeft: 'auto',
                marginRight: 'auto',
                marginTop: 8,
                marginBottom: 16
            }}>
                <CardContent>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeExternalLinks, {
                        target: '_blank',
                        rel: ['nofollow', 'noopener', 'noreferrer']
                    }]]}>
                        {String(privacyPolicyMd)}
                    </ReactMarkdown>
                </CardContent>
            </Card>

            <Tracker feature='Privacy'/>

        </React.Fragment>
    )
}

export default PrivacyPage
