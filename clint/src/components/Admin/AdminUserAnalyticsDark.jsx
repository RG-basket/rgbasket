import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, UserCheck, UserX, ShoppingBag, ArrowLeft, RefreshCcw, 
    FileDown, Search, Filter, Phone, Mail, Calendar, Shield, 
    TrendingUp, ExternalLink, MessageCircle, Clock, MapPin, Eye,
    Sparkles, CheckCircle2, AlertCircle, Award, DollarSign, SlidersHorizontal
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminTableDark from './SharedDark/AdminTableDark';
import StatsCardDark from './SharedDark/StatsCardDark';
import AdminModalDark from './SharedDark/AdminModalDark';
import { tw } from '../../config/tokyoNightTheme';

const AdminUserAnalyticsDark = () => {
    const navigate = useNavigate();

    // Raw loaded users (all registered users)
    const [rawUsers, setRawUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Active segment tab: 'ordered' | 'not_ordered'
    const [activeTab, setActiveTab] = useState('ordered');

    // Limiter state: default 50
    const [limiter, setLimiter] = useState(50); // 50 | 100 | 200 | 'all'

    // Search and sub-filter
    const [searchQuery, setSearchQuery] = useState('');
    const [subFilter, setSubFilter] = useState('all');

    // User details modal state
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const formatLastSeen = (lastActive, createdAt) => {
        const date = lastActive || createdAt;
        if (!date) return 'Never';
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days} days ago`;
        return new Date(date).toLocaleDateString();
    };

    // Fetch ALL users with no artificial page limiter so the page can fully analyze all data
    const loadAllUserData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            
            // Request full user list with limit=1000 so nothing is truncated
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?limit=1000`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const fetchedUsers = (data.users || []).map(u => {
                    const orders = Array.isArray(u.orders) ? u.orders : [];
                    const validOrders = orders.filter(o => o.status !== 'cancelled');
                    const totalSpent = validOrders.reduce((sum, o) => sum + (Number(o.finalTotal || o.totalAmount) || 0), 0);
                    const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;
                    const resolvedPhone = u.phone || u.addresses?.[0]?.phoneNumber || u.orders?.[0]?.userInfo?.phone || '';

                    return {
                        ...u,
                        orders,
                        orderCount: orders.length,
                        validOrderCount: validOrders.length,
                        totalSpent,
                        lastOrderDate,
                        resolvedPhone
                    };
                });

                setRawUsers(fetchedUsers);
            } else {
                toast.error('Failed to load user records from server');
            }
        } catch (error) {
            console.error('Error loading user analytics data:', error);
            toast.error('Network error loading user records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllUserData();
    }, []);

    // Reset sub-filter when switching tabs
    useEffect(() => {
        setSubFilter('all');
    }, [activeTab]);

    // Compute Comprehensive Analytics across all 563+ users
    const analytics = useMemo(() => {
        const totalUsers = rawUsers.length;
        const orderedUsers = rawUsers.filter(u => u.orderCount > 0);
        const neverOrderedUsers = rawUsers.filter(u => u.orderCount === 0);

        const orderedUserCount = orderedUsers.length;
        const neverOrderedUserCount = neverOrderedUsers.length;
        const conversionRate = totalUsers > 0 ? parseFloat(((orderedUserCount / totalUsers) * 100).toFixed(1)) : 0;

        const singleOrderCount = orderedUsers.filter(u => u.orderCount === 1).length;
        const repeatCustomers = orderedUsers.filter(u => u.orderCount >= 2).length;
        const repeatRate = orderedUserCount > 0 ? parseFloat(((repeatCustomers / orderedUserCount) * 100).toFixed(1)) : 0;

        const tier2to4 = orderedUsers.filter(u => u.orderCount >= 2 && u.orderCount <= 4).length;
        const tier5to9 = orderedUsers.filter(u => u.orderCount >= 5 && u.orderCount <= 9).length;
        const tier10Plus = orderedUsers.filter(u => u.orderCount >= 10).length;

        // Financials
        let totalOrderSpend = 0;
        let totalValidOrders = 0;
        orderedUsers.forEach(u => {
            totalOrderSpend += u.totalSpent;
            totalValidOrders += u.validOrderCount;
        });

        const avgOrderValue = totalValidOrders > 0 ? Math.round(totalOrderSpend / totalValidOrders) : 0;
        const avgCustomerSpend = orderedUserCount > 0 ? Math.round(totalOrderSpend / orderedUserCount) : 0;

        // Contact Reachability
        const usersWithPhone = rawUsers.filter(u => !!u.resolvedPhone).length;
        const usersEmailOnly = Math.max(0, totalUsers - usersWithPhone);

        return {
            totalUsers,
            orderedUserCount,
            neverOrderedUserCount,
            conversionRate,
            singleOrderCount,
            repeatCustomers,
            repeatRate,
            frequencyBreakdown: {
                single: singleOrderCount,
                tier2to4,
                tier5to9,
                tier10Plus
            },
            financials: {
                totalOrderSpend,
                totalOrderCount: totalValidOrders,
                avgOrderValue,
                avgCustomerSpend
            },
            reachability: {
                usersWithPhone,
                usersEmailOnly
            }
        };
    }, [rawUsers]);

    // Active Segment List (without limiter)
    const filteredUsers = useMemo(() => {
        let base = activeTab === 'ordered'
            ? rawUsers.filter(u => u.orderCount > 0)
            : rawUsers.filter(u => u.orderCount === 0);

        // Apply sub-filters
        if (activeTab === 'ordered') {
            if (subFilter === 'single') base = base.filter(u => u.orderCount === 1);
            else if (subFilter === 'repeat') base = base.filter(u => u.orderCount >= 2);
            else if (subFilter === 'loyal') base = base.filter(u => u.orderCount >= 5);
            else if (subFilter === 'vip') base = base.filter(u => u.orderCount >= 10);
            else if (subFilter === 'has_phone') base = base.filter(u => !!u.resolvedPhone);
            else if (subFilter === 'no_phone') base = base.filter(u => !u.resolvedPhone);
        } else {
            if (subFilter === 'has_phone') base = base.filter(u => !!u.resolvedPhone);
            else if (subFilter === 'no_phone') base = base.filter(u => !u.resolvedPhone);
        }

        // Apply search query across name, email, phone
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            base = base.filter(u => 
                (u.name && u.name.toLowerCase().includes(query)) ||
                (u.email && u.email.toLowerCase().includes(query)) ||
                (u.resolvedPhone && u.resolvedPhone.toLowerCase().includes(query))
            );
        }

        return base;
    }, [rawUsers, activeTab, subFilter, searchQuery]);

    // Client-Side CSV Export (opens in Excel immediately without server dependencies)
    const exportToCSV = (targetFilter) => {
        try {
            const targetUsers = targetFilter === 'ordered'
                ? rawUsers.filter(u => u.orderCount > 0)
                : rawUsers.filter(u => u.orderCount === 0);

            if (targetUsers.length === 0) {
                toast.error('No users to export in this segment');
                return;
            }

            const isOrdered = targetFilter === 'ordered';
            const headers = isOrdered 
                ? ['Name', 'Email', 'Phone', 'Orders Placed', 'Total Spent (INR)', 'Joined Date', 'Last Active']
                : ['Name', 'Email', 'Phone', 'Joined Date', 'Last Active', 'WhatsApp Reachable'];

            const rows = targetUsers.map(u => {
                if (isOrdered) {
                    return [
                        `"${(u.name || '').replace(/"/g, '""')}"`,
                        `"${(u.email || '').replace(/"/g, '""')}"`,
                        `"${u.resolvedPhone || ''}"`,
                        u.orderCount || 0,
                        u.totalSpent ? Math.round(u.totalSpent) : 0,
                        `"${new Date(u.createdAt).toLocaleDateString()}"`,
                        `"${formatLastSeen(u.lastActive, u.createdAt)}"`
                    ];
                } else {
                    return [
                        `"${(u.name || '').replace(/"/g, '""')}"`,
                        `"${(u.email || '').replace(/"/g, '""')}"`,
                        `"${u.resolvedPhone || ''}"`,
                        `"${new Date(u.createdAt).toLocaleDateString()}"`,
                        `"${formatLastSeen(u.lastActive, u.createdAt)}"`,
                        u.resolvedPhone ? 'Yes' : 'No'
                    ];
                }
            });

            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `RG_Basket_${isOrdered ? 'Ordered_Customers' : 'Never_Ordered_Users'}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success(`Exported ${targetUsers.length} ${isOrdered ? 'ordered customers' : 'never-ordered users'} to CSV!`);
        } catch (e) {
            console.error('Export error:', e);
            toast.error('Failed to export data');
        }
    };

    // Columns for Ordered Customers
    const orderedColumns = [
        {
            key: 'name',
            label: 'Customer',
            sortable: true,
            render: (_, user) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-[#7aa2f7] flex items-center justify-center text-[#1a1b26] font-bold shadow-md shadow-emerald-500/20">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <p className={`font-bold ${tw.textPrimary}`}>{user.name || 'Anonymous Customer'}</p>
                        <p className={`text-xs ${tw.textSecondary}`}>Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'resolvedPhone',
            label: 'Phone / WhatsApp',
            render: (phone, user) => {
                if (phone) {
                    const cleanPhone = phone.replace(/[^0-9]/g, '');
                    const waUrl = `https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(user.name || 'there')}!%20Thank%20you%20for%20shopping%20with%20RG%20Basket.`;
                    return (
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-emerald-300 font-medium">{phone}</span>
                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                                title="Chat on WhatsApp"
                            >
                                <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                        </div>
                    );
                }
                return <span className={`text-xs ${tw.textSecondary}`}>Not provided</span>;
            }
        },
        {
            key: 'email',
            label: 'Email',
            sortable: true,
            render: (email) => <span className={`text-xs ${tw.textSecondary}`}>{email || 'N/A'}</span>
        },
        {
            key: 'orderCount',
            label: 'Orders Placed',
            sortable: true,
            render: (count) => {
                const isVip = count >= 10;
                const isRepeat = count >= 2;
                return (
                    <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isVip 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                                : isRepeat 
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                            <ShoppingBag className="w-3 h-3" />
                            {count} {count === 1 ? 'order' : 'orders'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7aa2f7]/80">
                            {isVip ? '👑 VIP Shopper' : isRepeat ? '🔄 Repeat Customer' : '🌱 First Order'}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'totalSpent',
            label: 'Total Spend (LTV)',
            sortable: true,
            render: (spent) => (
                <div className="flex flex-col">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                        ₹{Math.round(spent || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#565f89]">Lifetime Value</span>
                </div>
            )
        },
        {
            key: 'lastActive',
            label: 'Last Seen',
            sortable: true,
            render: (date, user) => (
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${new Date() - new Date(date || user.createdAt) < 5 * 60 * 1000 ? 'bg-green-500 animate-pulse' : 'bg-[#414868]'}`} />
                    <span className={`text-xs ${tw.textSecondary}`}>{formatLastSeen(date, user.createdAt)}</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Action',
            render: (_, user) => (
                <AdminButtonDark
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                        setIsModalOpen(true);
                    }}
                >
                    View
                </AdminButtonDark>
            )
        }
    ];

    // Columns for Never Ordered Users
    const notOrderedColumns = [
        {
            key: 'name',
            label: 'Registered User',
            sortable: true,
            render: (_, user) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff9e64] to-[#f7768e] flex items-center justify-center text-[#1a1b26] font-bold shadow-md shadow-orange-500/20">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <p className={`font-bold ${tw.textPrimary}`}>{user.name || 'Anonymous User'}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-[#ff9e64]/10 text-[#ff9e64] border border-[#ff9e64]/30">
                            <UserX className="w-2.5 h-2.5" /> 0 Orders Placed
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'resolvedPhone',
            label: 'WhatsApp Status',
            render: (phone, user) => {
                if (phone) {
                    const cleanPhone = phone.replace(/[^0-9]/g, '');
                    const waUrl = `https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(user.name || 'there')}!%20Welcome%20to%20RG%20Basket.%20Enjoy%20fresh%20groceries%20delivered%20in%20minutes!%20Use%20code%20WELCOME%20for%20special%20discount.`;
                    return (
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#9ece6a] font-medium">{phone}</span>
                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-[#9ece6a]/15 text-[#9ece6a] border border-[#9ece6a]/30 hover:bg-[#9ece6a]/25 transition-colors"
                                title="Send WhatsApp Welcome Offer"
                            >
                                <MessageCircle className="w-3.5 h-3.5" /> Send Offer
                            </a>
                        </div>
                    );
                }
                return (
                    <span className="text-xs text-amber-400/70 italic flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400/50" /> No phone (Email only)
                    </span>
                );
            }
        },
        {
            key: 'email',
            label: 'Email',
            sortable: true,
            render: (email) => <span className={`text-xs ${tw.textSecondary}`}>{email || 'N/A'}</span>
        },
        {
            key: 'createdAt',
            label: 'Registered On',
            sortable: true,
            render: (date) => (
                <div className="flex items-center gap-1.5 text-xs text-[#c0caf5]">
                    <Calendar className="w-3.5 h-3.5 text-[#7aa2f7]" />
                    <span>{new Date(date).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            key: 'lastActive',
            label: 'Last Active',
            sortable: true,
            render: (date, user) => (
                <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#565f89]" />
                    <span className={`text-xs ${tw.textSecondary}`}>{formatLastSeen(date, user.createdAt)}</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Action',
            render: (_, user) => (
                <AdminButtonDark
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                        setIsModalOpen(true);
                    }}
                >
                    View
                </AdminButtonDark>
            )
        }
    ];

    return (
        <AdminLayoutDark>
            <div className="space-y-6 pb-12">
                {/* Header with Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <button
                                onClick={() => navigate('/portal-dashboard/users')}
                                className="p-1.5 rounded-lg bg-[#24283b] text-[#7aa2f7] hover:bg-[#7aa2f7]/20 transition-colors"
                                title="Back to All Users"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary} flex items-center gap-2`}>
                                <TrendingUp className="w-6 h-6 text-[#7aa2f7]" />
                                User Analytics & Statistics
                            </h1>
                        </div>
                        <p className={`text-xs sm:text-sm ${tw.textSecondary} ml-9`}>
                            Full comprehensive analysis of registered customers who ordered vs users who haven't ordered yet.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <AdminButtonDark
                            variant="secondary"
                            size="sm"
                            icon={RefreshCcw}
                            onClick={() => {
                                toast.success('Reloading full user database...');
                                loadAllUserData();
                            }}
                        >
                            Refresh
                        </AdminButtonDark>
                        <AdminButtonDark
                            variant="outline"
                            size="sm"
                            icon={FileDown}
                            className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => exportToCSV('ordered')}
                        >
                            Export Ordered ({analytics.orderedUserCount})
                        </AdminButtonDark>
                        <AdminButtonDark
                            variant="outline"
                            size="sm"
                            icon={FileDown}
                            className="border-[#ff9e64]/50 text-[#ff9e64] hover:bg-[#ff9e64]/10"
                            onClick={() => exportToCSV('not_ordered')}
                        >
                            Export Never Ordered ({analytics.neverOrderedUserCount})
                        </AdminButtonDark>
                    </div>
                </div>

                {/* Top Executive Stats (6 Cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    <StatsCardDark
                        title="Total Users"
                        value={analytics.totalUsers}
                        icon={Users}
                        color="blue"
                    />
                    <StatsCardDark
                        title="Ordered Users"
                        value={analytics.orderedUserCount}
                        icon={UserCheck}
                        color="green"
                        trend="up"
                        trendValue={`${analytics.conversionRate}% converted`}
                    />
                    <StatsCardDark
                        title="Never Ordered"
                        value={analytics.neverOrderedUserCount}
                        icon={UserX}
                        color="orange"
                        trendValue={`${analytics.totalUsers > 0 ? (100 - analytics.conversionRate).toFixed(1) : 0}% pending`}
                    />
                    <StatsCardDark
                        title="Repeat Buyers"
                        value={analytics.repeatCustomers}
                        icon={Award}
                        color="purple"
                        trendValue={`${analytics.repeatRate}% repeat rate`}
                    />
                    <StatsCardDark
                        title="Total Spend (LTV)"
                        value={`₹${Math.round(analytics.financials?.totalOrderSpend || 0).toLocaleString('en-IN')}`}
                        icon={DollarSign}
                        color="blue"
                    />
                    <StatsCardDark
                        title="Avg Customer Value"
                        value={`₹${Math.round(analytics.financials?.avgCustomerSpend || 0).toLocaleString('en-IN')}`}
                        icon={Sparkles}
                        color="yellow"
                    />
                </div>

                {/* Conversion & Frequency Visual Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Panel 1: Order Conversion Funnel */}
                    <div className={`${tw.bgSecondary} p-5 rounded-2xl border ${tw.borderPrimary} shadow-lg space-y-4`}>
                        <div className="flex items-center justify-between">
                            <h3 className={`text-sm font-bold uppercase tracking-wider ${tw.textPrimary} flex items-center gap-2`}>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Conversion Ratio
                            </h3>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                {analytics.conversionRate}% Converted
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="h-4 w-full bg-[#1a1b26] rounded-full overflow-hidden flex border border-[#414868]/40">
                                <div 
                                    className="bg-gradient-to-r from-emerald-500 to-green-400 h-full transition-all duration-700" 
                                    style={{ width: `${Math.min(100, Math.max(5, analytics.conversionRate))}%` }} 
                                    title={`Ordered: ${analytics.orderedUserCount}`}
                                />
                                <div 
                                    className="bg-gradient-to-r from-orange-500/80 to-amber-500/80 h-full transition-all duration-700" 
                                    style={{ width: `${Math.max(0, 100 - analytics.conversionRate)}%` }} 
                                    title={`Never Ordered: ${analytics.neverOrderedUserCount}`}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] font-medium text-[#7aa2f7]">
                                <span className="flex items-center gap-1.5 text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Ordered ({analytics.orderedUserCount})
                                </span>
                                <span className="flex items-center gap-1.5 text-[#ff9e64]">
                                    <span className="w-2 h-2 rounded-full bg-[#ff9e64]" />
                                    Never Ordered ({analytics.neverOrderedUserCount})
                                </span>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#1a1b26] border border-[#414868]/30 space-y-2 text-xs">
                            <div className="flex justify-between items-center text-[#c0caf5]">
                                <span>Single Order Customers:</span>
                                <strong className="text-white">{analytics.singleOrderCount} users</strong>
                            </div>
                            <div className="flex justify-between items-center text-[#c0caf5]">
                                <span>Repeat (2+ Orders):</span>
                                <strong className="text-emerald-400">{analytics.repeatCustomers} users</strong>
                            </div>
                            <div className="flex justify-between items-center text-[#c0caf5]">
                                <span>Total Revenue from Customers:</span>
                                <strong className="text-emerald-400">₹{Math.round(analytics.financials?.totalOrderSpend || 0).toLocaleString('en-IN')}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Panel 2: Customer Loyalty Tiers */}
                    <div className={`${tw.bgSecondary} p-5 rounded-2xl border ${tw.borderPrimary} shadow-lg space-y-4`}>
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${tw.textPrimary} flex items-center gap-2`}>
                            <Award className="w-4 h-4 text-[#bb9af7]" /> Order Frequency Cohort
                        </h3>

                        <div className="space-y-3">
                            {[
                                { label: '1 Order (First Timers)', count: analytics.frequencyBreakdown?.single || analytics.singleOrderCount, color: 'bg-emerald-400', max: analytics.orderedUserCount || 1 },
                                { label: '2 - 4 Orders (Regulars)', count: analytics.frequencyBreakdown?.tier2to4 || 0, color: 'bg-blue-400', max: analytics.orderedUserCount || 1 },
                                { label: '5 - 9 Orders (Loyal Fans)', count: analytics.frequencyBreakdown?.tier5to9 || 0, color: 'bg-purple-400', max: analytics.orderedUserCount || 1 },
                                { label: '10+ Orders (VIP Shoppers)', count: analytics.frequencyBreakdown?.tier10Plus || 0, color: 'bg-yellow-400', max: analytics.orderedUserCount || 1 },
                            ].map((tier, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-[#c0caf5]">{tier.label}</span>
                                        <span className="font-bold text-white">{tier.count} users ({tier.max > 0 ? Math.round((tier.count / tier.max) * 100) : 0}%)</span>
                                    </div>
                                    <div className="h-2 w-full bg-[#1a1b26] rounded-full overflow-hidden">
                                        <div 
                                            className={`${tier.color} h-full rounded-full transition-all duration-500`} 
                                            style={{ width: `${Math.min(100, Math.max(3, (tier.count / tier.max) * 100))}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Panel 3: Marketing & Contact Reachability */}
                    <div className={`${tw.bgSecondary} p-5 rounded-2xl border ${tw.borderPrimary} shadow-lg space-y-4`}>
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${tw.textPrimary} flex items-center gap-2`}>
                            <Phone className="w-4 h-4 text-emerald-400" /> WhatsApp Campaign Readiness
                        </h3>

                        <div className="space-y-3">
                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-emerald-300 font-bold uppercase">Has WhatsApp Phone</p>
                                    <p className="text-xl font-black text-white">{analytics.reachability?.usersWithPhone || 0}</p>
                                    <p className="text-[10px] text-emerald-400/80">Can receive WhatsApp promo discount campaigns</p>
                                </div>
                                <MessageCircle className="w-8 h-8 text-emerald-400/50" />
                            </div>

                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-amber-300 font-bold uppercase">Email Only (No Phone)</p>
                                    <p className="text-xl font-black text-white">{analytics.reachability?.usersEmailOnly || 0}</p>
                                    <p className="text-[10px] text-amber-400/80">Reachable via App push notifications & Email</p>
                                </div>
                                <Mail className="w-8 h-8 text-amber-400/50" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Segmented Table Explorer Section - NO LIMITER */}
                <div className={`${tw.bgSecondary} p-5 rounded-2xl border ${tw.borderPrimary} shadow-xl space-y-4`}>
                    {/* Tab Navigation & Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#414868]/40 pb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActiveTab('ordered')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                    activeTab === 'ordered'
                                        ? 'bg-emerald-500 text-[#1a1b26] shadow-lg shadow-emerald-500/25'
                                        : 'bg-[#1a1b26] text-[#7aa2f7] hover:bg-[#24283b] border border-[#414868]/50'
                                }`}
                            >
                                <UserCheck className="w-4 h-4" />
                                <span>Ordered Customers</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                    activeTab === 'ordered' ? 'bg-[#1a1b26]/20 text-[#1a1b26]' : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                    {analytics.orderedUserCount}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('not_ordered')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                    activeTab === 'not_ordered'
                                        ? 'bg-[#ff9e64] text-[#1a1b26] shadow-lg shadow-orange-500/25'
                                        : 'bg-[#1a1b26] text-[#7aa2f7] hover:bg-[#24283b] border border-[#414868]/50'
                                }`}
                            >
                                <UserX className="w-4 h-4" />
                                <span>Never Ordered Users</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                    activeTab === 'not_ordered' ? 'bg-[#1a1b26]/20 text-[#1a1b26]' : 'bg-[#ff9e64]/20 text-[#ff9e64]'
                                }`}>
                                    {analytics.neverOrderedUserCount}
                                </span>
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative max-w-sm w-full">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary}`} />
                            <input
                                type="text"
                                placeholder={`Search by name, email, or phone...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                            />
                        </div>
                    </div>

                    {/* Sub-Filters & Counter */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase text-[#565f89] flex items-center gap-1 mr-2">
                                <Filter className="w-3 h-3" /> Filter Segment:
                            </span>
                            {activeTab === 'ordered' ? (
                                [
                                    { id: 'all', label: `All Ordered (${analytics.orderedUserCount})` },
                                    { id: 'single', label: `1 Order (${analytics.singleOrderCount})` },
                                    { id: 'repeat', label: `2+ Repeat (${analytics.repeatCustomers})` },
                                    { id: 'loyal', label: `5+ Loyal (${(analytics.frequencyBreakdown?.tier5to9 || 0) + (analytics.frequencyBreakdown?.tier10Plus || 0)})` },
                                    { id: 'vip', label: `10+ VIP (${analytics.frequencyBreakdown?.tier10Plus || 0})` },
                                    { id: 'has_phone', label: 'Has WhatsApp' },
                                    { id: 'no_phone', label: 'Email Only' },
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setSubFilter(f.id)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                                            subFilter === f.id
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                                                : 'bg-[#1a1b26] border-[#414868] text-[#9ab1fe] hover:border-[#7aa2f7]'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))
                            ) : (
                                [
                                    { id: 'all', label: `All Never Ordered (${analytics.neverOrderedUserCount})` },
                                    { id: 'has_phone', label: 'Has WhatsApp Phone' },
                                    { id: 'no_phone', label: 'Email Only' },
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setSubFilter(f.id)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                                            subFilter === f.id
                                                ? 'bg-[#ff9e64]/20 border-[#ff9e64] text-[#ff9e64] font-bold'
                                                : 'bg-[#1a1b26] border-[#414868] text-[#9ab1fe] hover:border-[#7aa2f7]'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Limiter Button Group & Counter */}
                        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                            <div className="flex items-center gap-1 bg-[#1a1b26] p-1 rounded-xl border border-[#414868]/60 shadow-inner">
                                <span className="text-[11px] font-bold uppercase text-[#565f89] px-2 flex items-center gap-1">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#7aa2f7]" /> Limiter:
                                </span>
                                {[50, 100, 200, 'all'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setLimiter(opt)}
                                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                            limiter === opt
                                                ? 'bg-[#7aa2f7] text-[#1a1b26] shadow-md shadow-blue-500/25'
                                                : 'text-[#9ab1fe] hover:text-white hover:bg-[#24283b]'
                                        }`}
                                    >
                                        {opt === 'all' ? 'All (No Limiter)' : `${opt}`}
                                    </button>
                                ))}
                            </div>

                            <div className="text-xs text-[#7aa2f7] font-semibold bg-[#1a1b26] px-3 py-1.5 rounded-xl border border-[#414868]/40">
                                {limiter === 'all' ? (
                                    <span>Showing all <strong className="text-white">{filteredUsers.length}</strong> {activeTab === 'ordered' ? 'customers' : 'users'} (no limiter)</span>
                                ) : (
                                    <span>Showing <strong className="text-white">{Math.min(limiter, filteredUsers.length)}</strong> of <strong className="text-white">{filteredUsers.length}</strong> {activeTab === 'ordered' ? 'customers' : 'users'} (limiter: {limiter})</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <AdminTableDark
                        key={`${activeTab}-${subFilter}-${limiter}-${searchQuery}`}
                        columns={activeTab === 'ordered' ? orderedColumns : notOrderedColumns}
                        data={filteredUsers}
                        isLoading={loading}
                        pagination={limiter !== 'all'}
                        itemsPerPage={typeof limiter === 'number' ? limiter : 50}
                        onRowClick={(user) => {
                            setSelectedUser(user);
                            setIsModalOpen(true);
                        }}
                    />

                    {/* Empty State */}
                    {!loading && filteredUsers.length === 0 && (
                        <div className={`p-10 rounded-xl border border-dashed ${tw.borderPrimary} text-center space-y-2`}>
                            <AlertCircle className="w-8 h-8 text-[#565f89] mx-auto" />
                            <p className={`text-sm font-bold ${tw.textPrimary}`}>No users match the selected filter</p>
                            <p className={`text-xs ${tw.textSecondary}`}>Try clearing your search query or choosing another filter segment.</p>
                            <button
                                onClick={() => { setSearchQuery(''); setSubFilter('all'); }}
                                className="mt-2 text-xs font-bold text-[#7aa2f7] hover:underline"
                            >
                                Reset Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* User Details Modal */}
                <AdminModalDark
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={selectedUser ? `Customer Details: ${selectedUser.name}` : 'Customer Details'}
                    footer={
                        <div className="flex justify-end">
                            <AdminButtonDark variant="outline" onClick={() => setIsModalOpen(false)}>
                                Close
                            </AdminButtonDark>
                        </div>
                    }
                >
                    {selectedUser && (
                        <div className="space-y-6">
                            {/* Profile Header */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7aa2f7] to-[#bb9af7] flex items-center justify-center text-[#1a1b26] text-2xl font-bold shadow-lg shadow-blue-500/20">
                                    {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${tw.textPrimary}`}>{selectedUser.name || 'Anonymous User'}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {(selectedUser.orderCount || 0) > 0 ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                                                <ShoppingBag className="w-3 h-3" /> Ordered ({selectedUser.orderCount} Orders)
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ff9e64]/20 text-[#ff9e64] border border-[#ff9e64]/30 flex items-center gap-1">
                                                <UserX className="w-3 h-3" /> Never Ordered (0 Orders)
                                            </span>
                                        )}
                                        <span className={`text-xs ${tw.textSecondary} flex items-center gap-1`}>
                                            <Calendar className="w-3 h-3" /> Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-xl border ${tw.borderPrimary} ${tw.bgInput}`}>
                                    <div className="flex items-center gap-2 mb-1 text-xs text-[#7aa2f7] font-bold uppercase">
                                        <Mail className="w-4 h-4" /> Email Address
                                    </div>
                                    <p className={`font-medium ${tw.textPrimary} text-sm break-all`}>{selectedUser.email || 'Not provided'}</p>
                                </div>

                                <div className={`p-4 rounded-xl border ${tw.borderPrimary} ${tw.bgInput}`}>
                                    <div className="flex items-center gap-2 mb-1 text-xs text-emerald-400 font-bold uppercase">
                                        <Phone className="w-4 h-4" /> Phone / WhatsApp
                                    </div>
                                    <p className={`font-medium ${tw.textPrimary} text-sm`}>
                                        {selectedUser.resolvedPhone || 'Not provided'}
                                    </p>
                                    {selectedUser.resolvedPhone && (
                                        <a
                                            href={`https://wa.me/91${selectedUser.resolvedPhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(selectedUser.name || 'there')}!%20Greetings%20from%20RG%20Basket.`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:underline mt-1"
                                        >
                                            <MessageCircle className="w-3 h-3" /> Open in WhatsApp
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Summary Cards for Selected User */}
                            {selectedUser.orderCount > 0 && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <p className="text-[10px] text-emerald-300 font-bold uppercase">Total Lifetime Spend</p>
                                        <p className="text-lg font-black text-white">₹{Math.round(selectedUser.totalSpent || 0).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <p className="text-[10px] text-blue-300 font-bold uppercase">Total Orders</p>
                                        <p className="text-lg font-black text-white">{selectedUser.orderCount}</p>
                                    </div>
                                </div>
                            )}

                            {/* Order History (if ordered) */}
                            {selectedUser.orders && selectedUser.orders.length > 0 ? (
                                <div className="space-y-3">
                                    <h4 className={`font-bold ${tw.textPrimary} flex items-center gap-2 text-sm`}>
                                        <ShoppingBag className="w-4 h-4 text-[#bb9af7]" /> Order History ({selectedUser.orders.length})
                                    </h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedUser.orders.map((ord, idx) => (
                                            <div key={idx} className={`p-3 rounded-lg border ${tw.borderPrimary} ${tw.bgSecondary} flex justify-between items-center text-xs`}>
                                                <div>
                                                    <p className="font-mono font-bold text-white">#{ord._id?.slice(-8).toUpperCase()}</p>
                                                    <p className={tw.textSecondary}>{new Date(ord.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-emerald-400">₹{ord.finalTotal || ord.totalAmount}</p>
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                        ord.status === 'delivered' ? 'bg-green-500/20 text-green-300' :
                                                        ord.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                                                        'bg-blue-500/20 text-blue-300'
                                                    }`}>
                                                        {ord.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={`p-6 rounded-xl border border-dashed ${tw.borderPrimary} text-center space-y-2`}>
                                    <UserX className="w-8 h-8 text-[#ff9e64]/60 mx-auto" />
                                    <p className={`text-sm font-bold ${tw.textPrimary}`}>Never Ordered Customer</p>
                                    <p className={`text-xs ${tw.textSecondary}`}>This customer registered an account but hasn't placed any orders yet.</p>
                                    {selectedUser.resolvedPhone && (
                                        <a
                                            href={`https://wa.me/91${selectedUser.resolvedPhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(selectedUser.name || 'there')}!%20Enjoy%20fresh%20groceries%20at%20RG%20Basket!`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#25D366] text-black shadow-lg shadow-green-500/20 hover:bg-[#20ba5a] transition-colors mt-2"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" /> Send Welcome Offer on WhatsApp
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </AdminModalDark>
            </div>
        </AdminLayoutDark>
    );
};

export default AdminUserAnalyticsDark;
