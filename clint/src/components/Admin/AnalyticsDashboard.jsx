import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = async (tab = activeTab) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use relative paths with Vite proxy
      const endpoints = {
        overview: `/api/admin/analytics/overview`,
        users: `/api/admin/analytics/users`,
        sales: `/api/admin/analytics/sales?period=${timeRange}`,
        products: `/api/admin/analytics/products`
      };

      console.log('Fetching from:', endpoints[tab]);

      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      const response = await fetch(endpoints[tab], {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
        // No credentials needed with proxy
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
      // Fallback to demo data
      setAnalyticsData(getDemoData(activeTab));
    } finally {
      setIsLoading(false);
    }
  };

  // Demo data for testing
  const getDemoData = (tab) => {
    const demoData = {
      overview: {
        totalUsers: 12542,
        totalOrders: 8943,
        totalRevenue: 452136,
        totalProducts: 234,
        userGrowth: 12.5,
        orderGrowth: 8.3,
        revenueGrowth: 15.2,
        productGrowth: 3.1,
        newUsers: 324,
        activeOrders: 156,
        completedOrders: 8787
      },
      users: {
        total: 12542,
        newUsers: 324,
        activeUsers: 8432,
        returningUsers: 4110,
        demographics: {
          age: [
            { range: '18-24', percentage: 25 },
            { range: '25-34', percentage: 45 },
            { range: '35-44', percentage: 20 },
            { range: '45+', percentage: 10 }
          ],
          gender: [
            { type: 'Male', percentage: 55 },
            { type: 'Female', percentage: 43 },
            { type: 'Other', percentage: 2 }
          ]
        }
      },
      sales: {
        dailyRevenue: [1200, 1900, 3000, 5000, 2000, 3000, 4500],
        monthlyRevenue: [45000, 52000, 48000, 61000, 58000, 72000],
        topProducts: [
          { name: 'Organic Bananas', sales: 2345, revenue: 12560 },
          { name: 'Fresh Milk', sales: 1890, revenue: 9450 },
          { name: 'Eggs', sales: 1678, revenue: 8390 }
        ]
      },
      products: {
        total: 234,
        categories: [
          { name: 'Fruits & Vegetables', count: 45, percentage: 19 },
          { name: 'Dairy & Eggs', count: 32, percentage: 14 },
          { name: 'Meat & Poultry', count: 28, percentage: 12 }
        ],
        lowStock: [
          { name: 'Organic Avocados', stock: 5, threshold: 20 },
          { name: 'Greek Yogurt', stock: 8, threshold: 25 }
        ]
      }
    };
    return { [tab]: demoData[tab] };
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeTab, timeRange]);

  const StatCard = ({ title, value, growth, icon: Icon, color = 'blue' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className={`flex items-center space-x-1 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="text-sm font-semibold">{Math.abs(growth || 0)}%</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">
        {isLoading ? '...' : (value || 0).toLocaleString()}
      </h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </motion.div>
  );

  if (isLoading && !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time insights into your business</p>
            {error && (
              <div className="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                <strong>Note:</strong> Using demo data - {error}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchAnalyticsData}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white rounded-2xl p-2 shadow-lg border border-gray-200 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'sales', label: 'Sales', icon: DollarSign },
            { id: 'products', label: 'Products', icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analyticsData?.overview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={analyticsData.overview.totalUsers}
                growth={analyticsData.overview.userGrowth}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Total Orders"
                value={analyticsData.overview.totalOrders}
                growth={analyticsData.overview.orderGrowth}
                icon={ShoppingCart}
                color="green"
              />
              <StatCard
                title="Total Revenue"
                value={analyticsData.overview.totalRevenue}
                growth={analyticsData.overview.revenueGrowth}
                icon={DollarSign}
                color="purple"
              />
              <StatCard
                title="Total Products"
                value={analyticsData.overview.totalProducts}
                growth={analyticsData.overview.productGrowth}
                icon={Package}
                color="orange"
              />
            </div>
          </motion.div>
        )}

        {/* Add similar sections for other tabs */}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;