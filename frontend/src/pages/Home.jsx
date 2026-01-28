import React from 'react'
import Hero from '../components/Hero'
import About from '../components/About'
import Properties from '../components/Properties'
import ConsultantsSection from '../components/ConsultantsSection'
import TestimonialsSection from '../components/TestimonialsSection'
import Blogs from '../components/Blogs'


const Home = () => {
    return (
        <main>
            <Hero />
            <About />
            {/* Divider Line */}
            <div className="w-full border-t border-gray-300"></div>
            <Properties />
            {/* Divider Line */}
            <div className="w-full border-t border-gray-300"></div>
            <ConsultantsSection />
            <TestimonialsSection autoScroll />
            <Blogs limit={4} showMore />
        </main>
    )
}

export default Home
