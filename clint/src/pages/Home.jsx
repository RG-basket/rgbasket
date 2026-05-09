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
import SEO from '../components/SEO/SEO.jsx';
import TwentyRupeeStore from '../components/Dashboard/TwentyRupeeStore.jsx';

const Home = () => {
    return (
        <div className='mt-0'>
            <SEO
                title="Best Online Grocery Delivery in Cuttack | Fresh & Fast"
                description="Order fresh vegetables, fruits, dairy, and daily essentials from RGBasket. The #1 smart grocery delivery service in Cuttack with scheduled delivery slots."
                keywords="RGBasket, RG Basket, grocery delivery Cuttack, online grocery Cuttack, fresh vegetables Cuttack"
            />


            <MainBanner />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            </div>
            <ShareApp />
            <TwentyRupeeStore />
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