import React from 'react'
import MainBanner from '../components/Banners/Mainbanner.jsx'
import BestSeller from '../components/Dashboard/BestSeller.jsx';
import RecentViewed from '../components/Dashboard/RecentViewd.jsx';
import ServiceableBanner from '../components/Banners/ServiceableBanner.jsx';
import CustomerReviews from '../components/User/CustomerReviews.jsx';
import OurServices from './OurServices.jsx';



const Home = () => {
return (
<div className='mt-0'>
<MainBanner />
<BestSeller />
<RecentViewed />
<OurServices />
<CustomerReviews/>
<ServiceableBanner/>
</div>
)
}
export default Home;