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
<MainBanner />
<ShareApp/>
<NewArrivals/>
<BestSeller />
<RecentViewed />
<OurServices />
<PWAInstallBanner/>
<CustomerReviews/>
<ServiceableBanner/>
</div>
)
}
export default Home;