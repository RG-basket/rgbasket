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
                <h1>RGBasket - Best Online Grocery Store in Cuttack & Bhubaneswar</h1>
                <h2>Order Fresh Vegetables and Fruits Online</h2>
                <h3>Scheduled Grocery Delivery Slot System</h3>
                <p>
                    Experience the smartest way to shop with RGBasket (RG Basket). We deliver fresh, chemical-free groceries, organic vegetables, and farm-fresh fruits directly to your home in Cuttack and Bhubaneswar, Odisha.
                    Our unique "no frozen, no stale" policy guarantees quality. Select from our morning, afternoon, or evening delivery slots to suit your schedule.
                    Join the RGBasket community for the best prices and support local farmers today.
                </p>
                <p>
                    RG Basket team provides reliable customer support and fast doorstep delivery. Shop pantry essentials, dairy products, and snacks on the RBasket mobile app.
                    Trusted by thousands in Cuttack. High-quality produce sourced daily. Smart automated slot selection for easy checkout.
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