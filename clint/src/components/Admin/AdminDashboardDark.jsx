import React, { useState, useEffect } from 'react';
import {
    TrendingUp, ShoppingBag, Users, DollarSign,
    Package, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import AdminLayoutDark from './AdminLayoutDark';
import StatsCardDark from './SharedDark/StatsCardDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import { tw, tokyoNight } from '../../config/tokyoNightTheme';

const AdminDashboardDark = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                window.location.href = '/admin/login';
                return;
            }

            try {
                const dashRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!dashRes.ok) {
                    if (dashRes.status === 401) {
                        localStorage.removeItem('adminToken');
                        window.location.href = '/admin/login';
                        return;
                    }
                    throw new Error('Failed to fetch dashboard data');
                }

                const dashData = await dashRes.json();
                setDashboardData(dashData);

                const statsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/products/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData.data);
                }
            } catch (err) {
                console.error('Dashboard error:', err);
                if (err.message.includes('Failed to fetch') || err.message.includes('Network Error')) {
                    setError('Backend server is not running. Please start the server on port 5000.');
                } else {
                    setError('Failed to load dashboard data');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <AdminLayoutDark>
                <div className="flex items-center justify-center min-h-[80vh]"> {/* Changed to min-h */}
                    <div className="w-12 h-12 border-4 border-[#7aa2f7] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AdminLayoutDark>
        );
    }

    if (error) {
        return (
            <AdminLayoutDark>
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-[#f7768e]"> {/* Changed to min-h */}
                    <AlertCircle className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">{error}</p>
                    <AdminButtonDark
                        variant="primary"
                        className="mt-4"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </AdminButtonDark>
                </div>
            </AdminLayoutDark>
        );
    }

    // Prepare chart data
    const revenueData = dashboardData?.revenueChart?.map(item => ({
        name: item._id,
        amount: item.totalAmount
    })) || [];

    const orderStatusData = [
        { name: 'Pending', value: dashboardData?.orders?.pending || 0, color: '#e0af68' },
        { name: 'Processing', value: dashboardData?.orders?.processing || 0, color: '#7aa2f7' },
        { name: 'Shipped', value: dashboardData?.orders?.shipped || 0, color: '#bb9af7' },
        { name: 'Delivered', value: dashboardData?.orders?.delivered || 0, color: '#9ece6a' },
        { name: 'Cancelled', value: dashboardData?.orders?.cancelled || 0, color: '#f7768e' },
    ];

    return (
        <AdminLayoutDark>
            {/* Added min-h-screen and removed fixed heights */}
            <div className="min-h-screen bg-[#1a1b26] p-6"> {/* Ensure full height background */}
                <div className="space-y-6 max-w-7xl mx-auto"> {/* Added max-width container */}
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Dashboard</h1>
                            <p className={`text-sm ${tw.textSecondary}`}>Overview of your store's performance</p>
                        </div>
                        <div className="flex gap-3">
                            <AdminButtonDark variant="secondary" icon={Clock}>Last 7 Days</AdminButtonDark>
                            <AdminButtonDark variant="primary" icon={TrendingUp}>View Reports</AdminButtonDark>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCardDark
                            title="Total Revenue"
                            value={`₹${dashboardData?.totalRevenue?.toLocaleString() || '0'}`}
                            icon={DollarSign}
                            trend="up"
                            trendValue="+12.5%"
                            color="green"
                        />
                        <StatsCardDark
                            title="Total Orders"
                            value={dashboardData?.totalOrders || '0'}
                            icon={ShoppingBag}
                            trend="up"
                            trendValue="+8.2%"
                            color="blue"
                        />
                        <StatsCardDark
                            title="Total Products"
                            value={dashboardData?.totalProducts || '0'}
                            icon={Package}
                            trend="up"
                            trendValue="+2.4%"
                            color="purple"
                        />
                        <StatsCardDark
                            title="Total Users"
                            value={dashboardData?.totalUsers || '0'}
                            icon={Users}
                            trend="up"
                            trendValue="+5.1%"
                            color="orange"
                        />
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Chart */}
                        <div className={`${tw.bgSecondary} p-6 rounded-xl border ${tw.borderPrimary} shadow-lg`}>
                            <h3 className={`text-lg font-bold ${tw.textPrimary} mb-6`}>Revenue Overview</h3>
                            <div className="h-80"> {/* Fixed height for charts */}
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#7aa2f7" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#7aa2f7" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#414868" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#9aa5ce"
                                            tick={{ fill: '#9aa5ce' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="#9aa5ce"
                                            tick={{ fill: '#9aa5ce' }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(value) => `₹${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#565f89', color: '#c0caf5' }}
                                            itemStyle={{ color: '#7aa2f7' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#7aa2f7"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Order Status Chart */}
                        <div className={`${tw.bgSecondary} p-6 rounded-xl border ${tw.borderPrimary} shadow-lg`}>
                            <h3 className={`text-lg font-bold ${tw.textPrimary} mb-6`}>Order Status</h3>
                            <div className="h-80"> {/* Fixed height for charts */}
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={orderStatusData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#414868" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#9aa5ce"
                                            tick={{ fill: '#9aa5ce' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="#9aa5ce"
                                            tick={{ fill: '#9aa5ce' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#414868', opacity: 0.2 }}
                                            contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#565f89', color: '#c0caf5' }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {orderStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders Table */}
                    <div className={`${tw.bgSecondary} rounded-xl border ${tw.borderPrimary} shadow-lg overflow-hidden mb-6`}> {/* Added margin bottom */}
                        <div className={`p-6 border-b ${tw.borderPrimary} flex items-center justify-between`}>
                            <h3 className={`text-lg font-bold ${tw.textPrimary}`}>Recent Orders</h3>
                            <AdminButtonDark variant="ghost" size="sm">View All</AdminButtonDark>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={tw.bgInput}>
                                    <tr>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Order ID</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Customer</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Status</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Amount</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Date</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${tw.borderSecondary}`}>
                                    {dashboardData?.recentOrders?.map((order) => (
                                        <tr key={order._id} className={`hover:bg-[#414868]/30 transition-colors`}>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${tw.textPrimary}`}>#{order._id.slice(-6)}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${tw.textSecondary}`}>{order.user?.name || 'Guest'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.status === 'Delivered' ? 'bg-[#9ece6a]/20 text-[#9ece6a]' :
                                                        order.status === 'Processing' ? 'bg-[#7aa2f7]/20 text-[#7aa2f7]' :
                                                            order.status === 'Cancelled' ? 'bg-[#f7768e]/20 text-[#f7768e]' :
                                                                'bg-[#e0af68]/20 text-[#e0af68]'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${tw.textPrimary}`}>₹{order.totalAmount}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${tw.textSecondary}`}>
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayoutDark>
    );
};

export default AdminDashboardDark;