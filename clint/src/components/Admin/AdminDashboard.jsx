import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, Eye, Plus, Search } from 'lucide-react'; 
const MiniCard = ({ icon, title, desc, onClick }) => (
  <button
    onClick={onClick}
    className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 text-left group"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-sm">{desc}</p>
  </button>
);

const ActionRow = ({ actions }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
    {actions.map((a) => (
      <MiniCard key={a.key} {...a} />
    ))}
  </div>
);

// Add these inside your AdminDashboard component, after the existing handlers:

const handleCreateCategory = () => {
  // Navigate to category creation page
  window.location.href = '/admin/categories/new';
};

const handleCreateProduct = () => {
  // Navigate to product creation page
  window.location.href = '/admin/products/new';
};

const handleViewOrders = () => {
  // Navigate to orders page
  window.location.href = '/admin/orders';
};

const handleManageUsers = () => {
  // Navigate to users management page
  window.location.href = '/admin/users';
};

const handleViewAnalytics = () => {
  // Navigate to analytics page
  window.location.href = '/admin/analytics';
};

const handleViewProducts = () => {
  // Navigate to products page
  window.location.href = '/admin/products';
};

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) return void (window.location.href = '/admin-login');

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          localStorage.removeItem('adminToken');
          return void (window.location.href = '/admin-login');
        }
        setDashboardData(await res.json());
      } catch {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleNav = (path) => (window.location.href = path);
  const actions = [
    {
      key: 'cat',
      title: 'New Category',
      desc: 'Create new product categories',
      icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>,
      onClick: () => handleNav('/admin/categories/new'),
    },

{
  key: 'manage-products',
  title: 'Manage Products',
  desc: 'View, edit and manage all products',
  icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  onClick: () => handleNav('/admin/products'),
},
    {
      key: 'prod',
      title: 'New Product',
      desc: 'Add new products to store',
      icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>,
      onClick: () => handleNav('/admin/products/new'),
    },
    {
      key: 'orders',
      title: 'View Orders',
      desc: 'Manage customer orders',
      icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>,
      onClick: () => handleNav('/admin/orders'),
    },
    {
      key: 'users',
      title: 'Manage Users',
      desc: 'User management system',
      icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z"/></svg>,
      onClick: () => handleNav('/admin/users'),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 flex items-center justify-center">
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-700/50 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-3 rounded-xl">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
      <header className="relative bg-gray-800/60 backdrop-blur-xl border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-blue-400/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0"/></svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Welcome back, <span className="font-semibold text-gray-300">{dashboardData?.adminId}</span></p>
              </div>
            </div>
            <button onClick={() => { localStorage.removeItem('adminToken'); window.location.href = '/admin-login'; }} className="group bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl text-sm font-semibold">Logout</button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <ActionRow actions={actions} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700/50 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-700/50 to-gray-800/50 border-b border-gray-700/50">
              <h3 className="text-xl font-bold text-white flex items-center">System Information</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
                  <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Admin Role</dt>
                    <dd className="text-lg font-semibold text-white">{dashboardData?.role}</dd>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
                  <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3"/></svg>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-400">Last Updated</dt>
                    <dd className="text-lg font-semibold text-white">{new Date(dashboardData?.timestamp).toLocaleString()}</dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700/50 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-700/50 to-gray-800/50 border-b border-gray-700/50">
              <h3 className="text-xl font-bold text-white">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => handleNav('/admin/analytics')} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
                  <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5"/></svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-white">View Analytics</h4>
                    <p className="text-sm text-gray-400">Sales and performance data</p>
                  </div>
                </button>

               
<button
  onClick={() => handleNav('/admin/products')}
  className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30 hover:bg-gray-600/40 transition-colors"
>
  <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
    </svg>
  </div>
  <div className="text-left">
    <h4 className="font-semibold text-white">Manage Products</h4>
    <p className="text-sm text-gray-400">Edit products and prices</p>
  </div>
</button>

                <button onClick={() => handleNav('/admin/inventory')} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
                  <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4"/></svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-white">Inventory</h4>
                    <p className="text-sm text-gray-400">Stock and product management</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">System is running smoothly • Last checked: Just now</p>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;