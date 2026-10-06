import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, ShoppingBag, Users, DollarSign,
    Package, Clock, CheckCircle, XCircle, AlertCircle,
    Award, Trophy, Star, Phone, Mail, ChevronRight, Eye,
    Sparkles, ArrowUpRight, BarChart3, RefreshCw, Layers,
    Flame, Search
} from 'lucide-react';
import { FaGift } from 'react-icons/fa';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import AdminLayoutDark from './AdminLayoutDark';
import StatsCardDark from './SharedDark/StatsCardDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import { tw } from '../../config/tokyoNightTheme';
import { useAppContext } from '../../context/AppContext.jsx';

// Helper to compute top customers & top selling products from orders if backend didn't provide them
const computeAnalyticsFromOrders = (ordersList) => {
    if (!Array.isArray(ordersList) || ordersList.length === 0) {
        return { topSellingProducts: [], topCustomers: [], slotBreakdown: [] };
    }

    const validOrders = ordersList.filter(o => o.status !== 'cancelled' && o.status !== 'Cancelled');

    // 1. Top Selling Products
    const itemMap = new Map();
    validOrders.forEach(o => {
        (o.items || []).forEach(item => {
            const key = item.name || item.productId || 'Unknown Item';
            if (!itemMap.has(key)) {
                itemMap.set(key, {
                    _id: key,
                    name: item.name || 'Product',
                    productId: item.productId,
                    image: item.image || '',
                    weight: item.weight || '',
                    unit: item.unit || '',
                    totalQuantity: 0,
                    totalRevenue: 0,
                    orderCount: 0
                });
            }
            const existing = itemMap.get(key);
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            existing.totalQuantity += qty;
            existing.totalRevenue += qty * price;
            existing.orderCount += 1;
        });
    });

    const topSellingProducts = Array.from(itemMap.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 20);

    // 2. Top Customers (Who order most - up to 100)
    const customerMap = new Map();
    validOrders.forEach(o => {
        const userKey = o.user || o.userInfo?.phone || o.userInfo?.email || 'guest';
        if (!customerMap.has(userKey)) {
            customerMap.set(userKey, {
                _id: userKey,
                name: o.userInfo?.name || o.shippingAddress?.fullName || 'Customer',
                email: o.userInfo?.email || 'N/A',
                phone: o.userInfo?.phone || o.shippingAddress?.phoneNumber || 'N/A',
                photo: o.userInfo?.photo || '',
                totalOrders: 0,
                totalSpent: 0,
                lastOrderDate: o.createdAt
            });
        }
        const c = customerMap.get(userKey);
        c.totalOrders += 1;
        c.totalSpent += Number(o.totalAmount) || 0;
        if (new Date(o.createdAt) > new Date(c.lastOrderDate)) {
            c.lastOrderDate = o.createdAt;
        }
    });

    const topCustomers = Array.from(customerMap.values())
        .sort((a, b) => b.totalOrders - a.totalOrders || b.totalSpent - a.totalSpent)
        .slice(0, 100);

    // 3. Slot Breakdown
    const slotMap = new Map();
    validOrders.forEach(o => {
        const slot = o.timeSlot || 'Standard Delivery';
        if (!slotMap.has(slot)) {
            slotMap.set(slot, { _id: slot, count: 0, revenue: 0 });
        }
        const s = slotMap.get(slot);
        s.count += 1;
        s.revenue += Number(o.totalAmount) || 0;
    });

    const slotBreakdown = Array.from(slotMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    return { topSellingProducts, topCustomers, slotBreakdown };
};

const AdminDashboardDark = () => {
    const navigate = useNavigate();
    const { logout } = useAppContext();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [productSortMode, setProductSortMode] = useState('quantity'); // 'quantity' | 'revenue'
    const [customerSortMode, setCustomerSortMode] = useState('orders'); // 'orders' | 'spent'
    const [customerSearch, setCustomerSearch] = useState('');

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            logout('/admin/login');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const dashRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!dashRes.ok) {
                if (dashRes.status === 401) {
                    logout('/admin/login');
                    return;
                }
                throw new Error('Failed to fetch dashboard data');
            }

            const dashData = await dashRes.json();

            // Check if topSellingProducts or topCustomers need client fallback
            let enrichedData = { ...dashData };
            const needsClientFallback = !Array.isArray(dashData.topSellingProducts) || dashData.topSellingProducts.length === 0;

            if (needsClientFallback) {
                try {
                    const ordersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/admin/orders?limit=300`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (ordersRes.ok) {
                        const ordersJson = await ordersRes.json();
                        if (ordersJson.success && Array.isArray(ordersJson.orders)) {
                            const fallback = computeAnalyticsFromOrders(ordersJson.orders);
                            enrichedData = {
                                ...enrichedData,
                                topSellingProducts: fallback.topSellingProducts,
                                topCustomers: fallback.topCustomers,
                                slotBreakdown: fallback.slotBreakdown
                            };
                        }
                    }
                } catch (fallbackErr) {
                    console.warn('Fallback analytics fetch failed:', fallbackErr);
                }
            }

            setDashboardData(enrichedData);
        } catch (err) {
            console.error('Dashboard error:', err);
            if (err.message.includes('Failed to fetch') || err.message.includes('Network Error')) {
                setError('Backend server is not reachable. Please check your network connection.');
            } else {
                setError(err.message || 'Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Revenue Chart Data
    const revenueData = useMemo(() => {
        return dashboardData?.revenueChart?.map(item => ({
            name: item._id,
            amount: Math.round(item.totalAmount || 0)
        })) || [];
    }, [dashboardData]);

    // Order Status Data
    const orderStatusData = useMemo(() => {
        return [
            { name: 'Pending', value: dashboardData?.orders?.pending || 0, color: '#e0af68' },
            { name: 'Processing', value: dashboardData?.orders?.processing || 0, color: '#7aa2f7' },
            { name: 'Shipped', value: dashboardData?.orders?.shipped || 0, color: '#bb9af7' },
            { name: 'Delivered', value: dashboardData?.orders?.delivered || 0, color: '#9ece6a' },
            { name: 'Cancelled', value: dashboardData?.orders?.cancelled || 0, color: '#f7768e' },
        ];
    }, [dashboardData]);

    // Top Selling Products Sorted
    const sortedProducts = useMemo(() => {
        const list = Array.isArray(dashboardData?.topSellingProducts) ? [...dashboardData.topSellingProducts] : [];
        if (productSortMode === 'revenue') {
            return list.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
        }
        return list.sort((a, b) => (b.totalQuantity || 0) - (a.totalQuantity || 0));
    }, [dashboardData, productSortMode]);

    // Top Customers Sorted (Up to 100)
    const sortedCustomers = useMemo(() => {
        const list = Array.isArray(dashboardData?.topCustomers) ? [...dashboardData.topCustomers] : [];
        if (customerSortMode === 'spent') {
            return list.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)).slice(0, 100);
        }
        return list.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0)).slice(0, 100);
    }, [dashboardData, customerSortMode]);

    // Filtered Top Customers by search query
    const filteredTopCustomers = useMemo(() => {
        if (!customerSearch.trim()) return sortedCustomers;
        const q = customerSearch.toLowerCase();
        return sortedCustomers.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.phone || '').includes(q) ||
            (c.email || '').toLowerCase().includes(q)
        );
    }, [sortedCustomers, customerSearch]);

    // Top Customers Graph Data (Top 8 for visual clarity)
    const customerGraphData = useMemo(() => {
        return sortedCustomers.slice(0, 8).map(c => ({
            name: (c.name || 'Customer').split(' ')[0],
            fullName: c.name || 'Customer',
            orders: c.totalOrders || 0,
            spent: Math.round(c.totalSpent || 0)
        }));
    }, [sortedCustomers]);

    // Top Products Graph Data (Top 8 for visual clarity)
    const productGraphData = useMemo(() => {
        return sortedProducts.slice(0, 8).map(p => ({
            name: (p._id || p.name || 'Item').length > 12 ? (p._id || p.name).slice(0, 12) + '…' : (p._id || p.name),
            fullName: p._id || p.name,
            quantity: p.totalQuantity || 0,
            revenue: Math.round(p.totalRevenue || 0)
        }));
    }, [sortedProducts]);

    if (loading) {
        return (
            <AdminLayoutDark>
                <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
                    <div className="w-12 h-12 border-4 border-[#7aa2f7] border-t-transparent rounded-full animate-spin"></div>
                    <p className={`text-sm ${tw.textSecondary}`}>Loading dashboard visualizations...</p>
                </div>
            </AdminLayoutDark>
        );
    }

    if (error) {
        return (
            <AdminLayoutDark>
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-[#f7768e] p-6 text-center">
                    <AlertCircle className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium mb-1">Failed to Load Dashboard</p>
                    <p className={`text-sm ${tw.textSecondary} max-w-md mb-6`}>{error}</p>
                    <AdminButtonDark
                        variant="primary"
                        onClick={fetchDashboardData}
                    >
                        Retry
                    </AdminButtonDark>
                </div>
            </AdminLayoutDark>
        );
    }

    return (
        <AdminLayoutDark>
            <div className="min-h-screen bg-[#1a1b26] p-4 sm:p-6 lg:p-8">
                <div className="space-y-8 max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className={`text-2xl sm:text-3xl font-extrabold ${tw.textPrimary} tracking-tight`}>Store Dashboard</h1>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#7aa2f7]/15 text-[#7aa2f7] border border-[#7aa2f7]/30">
                                    Analytics & Graphs
                                </span>
                            </div>
                            <p className={`text-xs sm:text-sm ${tw.textSecondary} mt-1`}>
                                Customer purchasing patterns, best-selling item graphs, and store performance
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <AdminButtonDark
                                variant="secondary"
                                icon={RefreshCw}
                                size="sm"
                                onClick={fetchDashboardData}
                            >
                                Refresh
                            </AdminButtonDark>
                            <AdminButtonDark
                                variant="secondary"
                                icon={ShoppingBag}
                                size="sm"
                                onClick={() => navigate('/portal-dashboard/orders')}
                            >
                                Orders
                            </AdminButtonDark>
                            <AdminButtonDark
                                variant="primary"
                                icon={FaGift}
                                size="sm"
                                onClick={() => navigate('/portal-dashboard/offers')}
                            >
                                Offers
                            </AdminButtonDark>
                        </div>
                    </div>

                    {/* Top Stats Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <StatsCardDark
                            title="Total Revenue"
                            value={`₹${(dashboardData?.totalRevenue || 0).toLocaleString('en-IN')}`}
                            icon={DollarSign}
                            trend="up"
                            trendValue="All Time"
                            color="green"
                        />
                        <StatsCardDark
                            title="Total Orders"
                            value={dashboardData?.totalOrders || '0'}
                            icon={ShoppingBag}
                            trend="up"
                            trendValue={`${dashboardData?.orders?.delivered || 0} Delivered`}
                            color="blue"
                        />
                        <StatsCardDark
                            title="Total Products"
                            value={dashboardData?.totalProducts || '0'}
                            icon={Package}
                            trend="up"
                            trendValue="Catalog"
                            color="purple"
                        />
                        <StatsCardDark
                            title="Total Customers"
                            value={dashboardData?.totalUsers || '0'}
                            icon={Users}
                            trend="up"
                            trendValue="Registered"
                            color="orange"
                        />
                    </div>

                    {/* SECTION 1: TOP 100 USERS WHO ORDER (COMPACT SPACE WITH GRAPH) */}
                    <div className={`${tw.bgSecondary} p-5 sm:p-6 rounded-2xl border ${tw.borderPrimary} shadow-xl relative`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                        <Trophy className="w-4 h-4" />
                                    </div>
                                    <h2 className={`text-lg sm:text-xl font-bold ${tw.textPrimary}`}>
                                        Top 100 Customers (Most Orders)
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7aa2f7]/20 text-[#7aa2f7] border border-[#7aa2f7]/30">
                                        Top 100
                                    </span>
                                </div>
                                <p className={`text-xs ${tw.textSecondary} mt-1 ml-10.5`}>
                                    High-frequency repeat buyers ranked by order volume and spending
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Search input inside the compact card */}
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search top 100..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[#13141f] border border-[#2f3549] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#7aa2f7] w-36 sm:w-44 transition-all"
                                    />
                                    {customerSearch && (
                                        <button
                                            onClick={() => setCustomerSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 bg-[#13141f] p-1 rounded-xl border border-[#2f3549]">
                                    <button
                                        onClick={() => setCustomerSortMode('orders')}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${customerSortMode === 'orders'
                                            ? 'bg-[#7aa2f7] text-[#1a1b26]'
                                            : `${tw.textSecondary} hover:text-white`
                                            }`}
                                    >
                                        Orders
                                    </button>
                                    <button
                                        onClick={() => setCustomerSortMode('spent')}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${customerSortMode === 'spent'
                                            ? 'bg-[#7aa2f7] text-[#1a1b26]'
                                            : `${tw.textSecondary} hover:text-white`
                                            }`}
                                    >
                                        Spending
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Top Customers: Graph (Left) + Compact Scrollable Top 100 List (Right) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                            {/* Visual Graph for Top Orderers */}
                            <div className="lg:col-span-5 bg-[#13141f]/80 p-4 rounded-xl border border-[#24283b] flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className={`text-xs font-bold uppercase tracking-wider ${tw.textSecondary} flex items-center gap-1.5`}>
                                        <BarChart3 className="w-3.5 h-3.5 text-[#7aa2f7]" /> Order Volume Distribution
                                    </h4>
                                    <span className="text-[10px] text-amber-400 font-bold">Top Champions</span>
                                </div>
                                <div className="h-64 sm:h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={customerGraphData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#24283b" horizontal={false} />
                                            <XAxis type="number" stroke="#565f89" tick={{ fill: '#7982a9', fontSize: 11 }} />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                stroke="#565f89"
                                                tick={{ fill: '#c0caf5', fontSize: 11, fontWeight: 600 }}
                                                width={75}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#414868', opacity: 0.2 }}
                                                contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#414868', borderRadius: '8px', color: '#c0caf5' }}
                                                formatter={(value, name, item) => [
                                                    `${value} Orders (₹${item.payload.spent.toLocaleString('en-IN')})`,
                                                    item.payload.fullName
                                                ]}
                                            />
                                            <Bar dataKey="orders" radius={[0, 6, 6, 0]}>
                                                {customerGraphData.map((_, idx) => (
                                                    <Cell
                                                        key={`cust-bar-${idx}`}
                                                        fill={idx === 0 ? '#e0af68' : idx === 1 ? '#7aa2f7' : idx === 2 ? '#bb9af7' : '#9ece6a'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 px-1 pt-2 border-t border-[#24283b]">
                                    <span>Top buyer: <strong className="text-white">{sortedCustomers[0]?.name || 'N/A'}</strong></span>
                                    <span className="text-emerald-400 font-bold">{sortedCustomers[0]?.totalOrders || 0} Orders</span>
                                </div>
                            </div>

                            {/* COMPACT SCROLLABLE TOP 100 LIST */}
                            <div className="lg:col-span-7 bg-[#13141f]/80 p-3 rounded-xl border border-[#24283b] flex flex-col">
                                <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-[#24283b] text-[11px] font-bold text-gray-400 uppercase">
                                    <span className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-[#7aa2f7]" />
                                        Customer Ranking ({filteredTopCustomers.length} shown)
                                    </span>
                                    <span>Orders & Spending</span>
                                </div>

                                {/* Fixed height compact scroll container */}
                                <div className="h-[290px] sm:h-[310px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#414868] scrollbar-track-transparent pr-1 space-y-1.5">
                                    {filteredTopCustomers.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-xs text-gray-400">
                                            No customers matching "{customerSearch}"
                                        </div>
                                    ) : (
                                        filteredTopCustomers.map((cust, idx) => {
                                            const rankNum = idx + 1;
                                            const isTop3 = rankNum <= 3;
                                            const rankBadge =
                                                rankNum === 1 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                                    rankNum === 2 ? 'bg-slate-400/20 text-slate-200 border-slate-400/40' :
                                                        rankNum === 3 ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                                                            'bg-[#24283b] text-gray-400 border-[#2f3549]';

                                            return (
                                                <div
                                                    key={cust._id || idx}
                                                    onClick={() => navigate(`/portal-dashboard/orders?search=${encodeURIComponent(cust.name || cust.phone || '')}`)}
                                                    className="px-2.5 py-2 rounded-lg bg-[#1a1b26]/70 hover:bg-[#24283b] border border-[#24283b] hover:border-[#414868] transition-all flex items-center justify-between gap-2.5 cursor-pointer group"
                                                    title={`Click to view all orders placed by ${cust.name || 'Customer'}`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className={`w-7 h-5 rounded flex items-center justify-center text-[10px] font-black border ${rankBadge} shrink-0`}>
                                                            {rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : `#${rankNum}`}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className={`text-xs font-bold ${tw.textPrimary} truncate group-hover:text-[#7aa2f7] transition-colors`}>
                                                                    {cust.name || 'Customer'}
                                                                </p>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 font-mono truncate">
                                                                {cust.phone && cust.phone !== 'N/A' ? cust.phone : (cust.email || 'N/A')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <div className="text-right">
                                                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                                                {cust.totalOrders} {cust.totalOrders === 1 ? 'order' : 'orders'}
                                                            </span>
                                                            <p className="text-[10px] font-bold text-gray-300 mt-0.5">
                                                                ₹{(cust.totalSpent || 0).toLocaleString('en-IN')}
                                                            </p>
                                                        </div>
                                                        <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: TOP SELLING PRODUCTS GRAPH & TABLE */}
                    <div className={`${tw.bgSecondary} p-5 sm:p-6 rounded-2xl border ${tw.borderPrimary} shadow-xl relative`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                        <Flame className="w-4 h-4" />
                                    </div>
                                    <h2 className={`text-lg sm:text-xl font-bold ${tw.textPrimary}`}>
                                        Top Selling Items (Best Sellers Graph)
                                    </h2>
                                </div>
                                <p className={`text-xs ${tw.textSecondary} mt-1 ml-10.5`}>
                                    Product demand curves ranked by units sold and revenue contribution
                                </p>
                            </div>

                            <div className="flex items-center gap-2 bg-[#13141f] p-1 rounded-xl border border-[#2f3549]">
                                <button
                                    onClick={() => setProductSortMode('quantity')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${productSortMode === 'quantity'
                                        ? 'bg-[#9ece6a] text-[#1a1b26]'
                                        : `${tw.textSecondary} hover:text-white`
                                        }`}
                                >
                                    By Quantity Sold
                                </button>
                                <button
                                    onClick={() => setProductSortMode('revenue')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${productSortMode === 'revenue'
                                        ? 'bg-[#9ece6a] text-[#1a1b26]'
                                        : `${tw.textSecondary} hover:text-white`
                                        }`}
                                >
                                    By Revenue (₹)
                                </button>
                            </div>
                        </div>

                        {/* Top Products Graph */}
                        <div className="bg-[#13141f]/80 p-4 rounded-xl border border-[#24283b] mb-5">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className={`text-xs font-bold uppercase tracking-wider ${tw.textSecondary} flex items-center gap-1.5`}>
                                    <BarChart3 className="w-3.5 h-3.5 text-[#9ece6a]" /> Top 8 Products ({productSortMode === 'quantity' ? 'Units Sold' : 'Revenue Generated'})
                                </h4>
                                <span className="text-[10px] text-[#9ece6a] font-semibold">Live Sales Velocity</span>
                            </div>
                            <div className="h-64 sm:h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={productGraphData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#24283b" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#565f89"
                                            tick={{ fill: '#c0caf5', fontSize: 11, fontWeight: 500 }}
                                            interval={0}
                                            angle={-15}
                                            textAnchor="end"
                                        />
                                        <YAxis
                                            stroke="#565f89"
                                            tick={{ fill: '#7982a9', fontSize: 11 }}
                                            tickFormatter={(val) => productSortMode === 'revenue' ? `₹${val}` : val}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#414868', opacity: 0.2 }}
                                            contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#414868', borderRadius: '8px', color: '#c0caf5' }}
                                            formatter={(value, name, item) => [
                                                productSortMode === 'revenue'
                                                    ? `₹${Number(value).toLocaleString('en-IN')} (${item.payload.quantity} sold)`
                                                    : `${value} units (₹${item.payload.revenue.toLocaleString('en-IN')})`,
                                                item.payload.fullName
                                            ]}
                                        />
                                        <Bar
                                            dataKey={productSortMode === 'revenue' ? 'revenue' : 'quantity'}
                                            radius={[6, 6, 0, 0]}
                                        >
                                            {productGraphData.map((_, idx) => (
                                                <Cell
                                                    key={`prod-bar-${idx}`}
                                                    fill={idx === 0 ? '#9ece6a' : idx === 1 ? '#7aa2f7' : idx === 2 ? '#bb9af7' : '#7dcfff'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Products Table */}
                        <div className="overflow-x-auto rounded-xl border border-[#24283b] bg-[#13141f]/40">
                            <table className="w-full text-left">
                                <thead className="bg-[#1f2335]/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#24283b]">
                                    <tr>
                                        <th className="px-4 py-3">Rank</th>
                                        <th className="px-4 py-3">Product Name</th>
                                        <th className="px-4 py-3">Weight / Unit</th>
                                        <th className="px-4 py-3 text-right">Units Sold</th>
                                        <th className="px-4 py-3 text-right">Revenue (₹)</th>
                                        <th className="px-4 py-3 text-right">Orders</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#24283b] text-xs">
                                    {sortedProducts.slice(0, 8).map((prod, idx) => (
                                        <tr key={prod._id || idx} className="hover:bg-[#1a1b26] transition-colors">
                                            <td className="px-4 py-3 font-mono font-bold text-gray-400">
                                                {idx === 0 ? <span className="text-amber-400 font-black">🥇 #1</span> :
                                                    idx === 1 ? <span className="text-slate-300 font-black">🥈 #2</span> :
                                                        idx === 2 ? <span className="text-orange-400 font-black">🥉 #3</span> :
                                                            `#${idx + 1}`}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {prod.image ? (
                                                        <img
                                                            src={prod.image}
                                                            alt={prod._id || prod.name}
                                                            className="w-8 h-8 rounded-lg object-cover border border-[#414868]"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-[#24283b] flex items-center justify-center text-gray-400">
                                                            <Package className="w-3.5 h-3.5" />
                                                        </div>
                                                    )}
                                                    <span className={`font-bold ${tw.textPrimary}`}>
                                                        {prod._id || prod.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {prod.weight ? `${prod.weight} ${prod.unit || ''}` : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-[#7aa2f7]">
                                                {prod.totalQuantity} units
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-emerald-400">
                                                ₹{(prod.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-400">
                                                {prod.orderCount || 1} orders
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION 3: REVENUE TRAJECTORY & ORDER STATUS CHARTS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Overview Chart */}
                        <div className={`${tw.bgSecondary} p-5 sm:p-6 rounded-2xl border ${tw.borderPrimary} shadow-xl`}>
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className={`text-lg font-bold ${tw.textPrimary}`}>Revenue Trajectory</h3>
                                    <p className={`text-xs ${tw.textSecondary}`}>Daily earnings graph</p>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#7aa2f7]/15 text-[#7aa2f7]">
                                    Last 7 Days
                                </span>
                            </div>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRevenueDark2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#7aa2f7" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#7aa2f7" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#24283b" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#565f89"
                                            tick={{ fill: '#9aa5ce', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="#565f89"
                                            tick={{ fill: '#9aa5ce', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(value) => `₹${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#414868', borderRadius: '8px', color: '#c0caf5' }}
                                            itemStyle={{ color: '#7aa2f7' }}
                                            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#7aa2f7"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenueDark2)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Order Status Distribution */}
                        <div className={`${tw.bgSecondary} p-5 sm:p-6 rounded-2xl border ${tw.borderPrimary} shadow-xl`}>
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className={`text-lg font-bold ${tw.textPrimary}`}>Order Status Breakdown</h3>
                                    <p className={`text-xs ${tw.textSecondary}`}>Delivery pipeline distribution</p>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#9ece6a]/15 text-[#9ece6a]">
                                    All Orders
                                </span>
                            </div>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={orderStatusData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#24283b" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#565f89"
                                            tick={{ fill: '#9aa5ce', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="#565f89"
                                            tick={{ fill: '#9aa5ce', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#414868', opacity: 0.2 }}
                                            contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#414868', borderRadius: '8px', color: '#c0caf5' }}
                                            formatter={(val, name) => [`${val} Orders`, name]}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {orderStatusData.map((entry, index) => (
                                                <Cell key={`status-cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: PEAK DELIVERY TIME SLOTS */}
                    {Array.isArray(dashboardData?.slotBreakdown) && dashboardData.slotBreakdown.length > 0 && (
                        <div className={`${tw.bgSecondary} p-5 sm:p-6 rounded-2xl border ${tw.borderPrimary} shadow-xl`}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${tw.textPrimary}`}>Peak Delivery Slots & Demand</h3>
                                    <p className={`text-xs ${tw.textSecondary}`}>Order concentration across scheduled delivery hours</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {dashboardData.slotBreakdown.map((slot, idx) => (
                                    <div
                                        key={slot._id || idx}
                                        className="p-4 rounded-xl border border-[#24283b] bg-[#13141f]/60 flex items-center justify-between"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className={`font-bold text-sm ${tw.textPrimary} truncate`}>
                                                {slot._id || 'Standard Slot'}
                                            </p>
                                            <p className="text-xs text-[#7aa2f7] font-semibold mt-0.5">
                                                ₹{(slot.revenue || 0).toLocaleString('en-IN')} revenue
                                            </p>
                                        </div>
                                        <div className="px-2.5 py-1 rounded-lg bg-[#7aa2f7]/15 border border-[#7aa2f7]/30 text-[#7aa2f7] font-black text-xs shrink-0">
                                            {slot.count} {slot.count === 1 ? 'order' : 'orders'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION 5: RECENT ORDERS TABLE */}
                    <div className={`${tw.bgSecondary} rounded-2xl border ${tw.borderPrimary} shadow-xl overflow-hidden`}>
                        <div className={`p-5 sm:p-6 border-b ${tw.borderPrimary} flex items-center justify-between`}>
                            <div>
                                <h3 className={`text-lg font-bold ${tw.textPrimary}`}>Recent Orders</h3>
                                <p className={`text-xs ${tw.textSecondary}`}>Latest store transactions</p>
                            </div>
                            <AdminButtonDark
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/portal-dashboard/orders')}
                            >
                                View All Orders <ChevronRight className="w-4 h-4 ml-1" />
                            </AdminButtonDark>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#1f2335]/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#24283b]">
                                    <tr>
                                        <th className="px-6 py-3.5">Order ID</th>
                                        <th className="px-6 py-3.5">Customer</th>
                                        <th className="px-6 py-3.5">Items</th>
                                        <th className="px-6 py-3.5">Status</th>
                                        <th className="px-6 py-3.5">Amount</th>
                                        <th className="px-6 py-3.5">Date</th>
                                        <th className="px-6 py-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#24283b] text-xs">
                                    {(dashboardData?.recentOrders || []).map((order) => {
                                        const customerName = order.userInfo?.name || order.shippingAddress?.fullName || 'Customer';
                                        const statusLower = (order.status || '').toLowerCase();
                                        const statusColor =
                                            statusLower === 'delivered' ? 'bg-[#9ece6a]/20 text-[#9ece6a] border-[#9ece6a]/30' :
                                                statusLower === 'processing' ? 'bg-[#7aa2f7]/20 text-[#7aa2f7] border-[#7aa2f7]/30' :
                                                    statusLower === 'shipped' ? 'bg-[#bb9af7]/20 text-[#bb9af7] border-[#bb9af7]/30' :
                                                        statusLower === 'cancelled' ? 'bg-[#f7768e]/20 text-[#f7768e] border-[#f7768e]/30' :
                                                            'bg-[#e0af68]/20 text-[#e0af68] border-[#e0af68]/30';

                                        return (
                                            <tr key={order._id} className="hover:bg-[#1f2335]/40 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-gray-300">
                                                    #{order._id?.slice(-8)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className={`font-bold ${tw.textPrimary}`}>{customerName}</p>
                                                    <p className="text-[11px] text-gray-400">{order.userInfo?.phone || order.userInfo?.email || 'N/A'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">
                                                    {order.items?.length || 0} items
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-full border ${statusColor}`}>
                                                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-emerald-400 text-sm">
                                                    ₹{order.totalAmount || 0}
                                                </td>
                                                <td className="px-6 py-4 text-gray-400">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <AdminButtonDark
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate('/portal-dashboard/orders')}
                                                    >
                                                        Details
                                                    </AdminButtonDark>
                                                </td>
                                            </tr>
                                        );
                                    })}
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