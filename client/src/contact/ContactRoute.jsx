import React from 'react'
import Footer from '../nav/Footer'
import Nav from '../nav/Nav'
import usePageTitle from '../util/usePageTitle'
import ContactPage from './ContactPage.jsx'

function ContactRoute() {
    usePageTitle('Privacy Policy')

    return (
        <React.Fragment>
            <Nav title='Privacy Policy'/>

            <ContactPage/>

            <Footer/>
        </React.Fragment>
    )
}

export default ContactRoute
