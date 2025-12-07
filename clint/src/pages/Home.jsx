import React from 'react'
import MainBanner from '../components/Banners/Mainbanner.jsx'
import BestSeller from '../components/Dashboard/BestSeller.jsx';
import RecentViewed from '../components/Dashboard/RecentViewd.jsx';
import ServiceableBanner from '../components/Banners/ServiceableBanner.jsx';
import CustomerReviews from '../components/User/CustomerReviews.jsx';
import OurServices from './OurServices.jsx';
import PWAInstallBanner from '../components/User/PWAInstallBanner.jsx';
import NewArrivals from '../components/Dashboard/NewArrivals.jsx';
import ShareApp from '../components/Dashboard/ShareAppBanner.jsx';

const Home = () => {
    return (
        <div className='mt-0'>
            {/* 🔍 HIDDEN SEO SECTION - USERS WON'T SEE */}
            <div style={{ 
                position: 'absolute', 
                left: '-9999px', 
                top: '0',
                width: '1px',
                height: '1px',
                overflow: 'hidden'
            }}>
                <h1>RGBasket - Smart Grocery Delivery App</h1>
                <h2>RGBasket App Download</h2>
                <h3>RGBasket Grocery Delivery Service</h3>
                <p>
                    Welcome to RGBasket. RGBasket is your smart grocery delivery application. 
                    With RGBasket, you can schedule fresh groceries delivered to your door. 
                    RGBasket offers fruits, vegetables, dairy, and pantry items. 
                    Download the RGBasket app for convenient grocery shopping. 
                    RGBasket provides quality products at fair prices. 
                    Experience RGBasket today for all your grocery needs.
                </p>
                <p>
                    RGBasket online grocery store. RGBasket delivery service. 
                    RGBasket mobile application. RGBasket fresh produce. 
                    RGBasket scheduled delivery. RGBasket customer support.
                </p>
            </div>
            {/* 🔍 END HIDDEN SEO */}

            <MainBanner />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            </div>
            <ShareApp />
            <NewArrivals />
            <BestSeller />
            <PWAInstallBanner />
            <RecentViewed />
            <OurServices />
            <CustomerReviews />
            <ServiceableBanner />
        </div>
    )
}
export default Home;