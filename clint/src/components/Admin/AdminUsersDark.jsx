import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, MapPin, Calendar, Shield, ChevronDown, ChevronUp, ShoppingBag, Package, Globe, ExternalLink, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminTableDark from './SharedDark/AdminTableDark';
import StatsCardDark from './SharedDark/StatsCardDark';
import AdminModalDark from './SharedDark/AdminModalDark';
import { tw } from '../../config/tokyoNightTheme';

const AdminUsersDark = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState(false);

    const [page, setPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [userStats, setUserStats] = useState({ total: 0, totalActive: 0, totalAdmins: 0, onlineNow: 0, dau: 0 });

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

    useEffect(() => {
        fetchUsers(1);
    }, []);

    const fetchUsers = async (pageNumber = 1, searchTermOverride = null) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const term = searchTermOverride !== null ? searchTermOverride : searchQuery;
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?page=${pageNumber}&limit=10&search=${term}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
                setTotalPages(data.pagination?.pages || 0);
                setTotalUsers(data.pagination?.total || 0);
                if (data.stats) setUserStats(data.stats);
                setPage(pageNumber);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredUsers = users;

    const columns = [
        {
            key: 'name',
            label: 'User',
            sortable: true,
            render: (_, user) => (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-[#7aa2f7] to-[#bb9af7] flex items-center justify-center text-[#1a1b26] font-bold shadow-lg shadow-blue-500/20`}>
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className={`font-medium ${tw.textPrimary}`}>{user.name}</p>
                        <p className={`text-xs ${tw.textSecondary}`}>Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'createdAt',
            label: 'Join Date',
            sortable: true,
            render: (date) => <span className={tw.textSecondary}>{new Date(date).toLocaleDateString()}</span>
        },
        {
            key: 'email',
            label: 'Email',
            sortable: true,
            render: (email) => <span className={tw.textSecondary}>{email}</span>
        },
        {
            key: 'lastActive',
            label: 'Last Seen',
            sortable: true,
            render: (date, user) => (
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${new Date() - new Date(date || user.createdAt) < 5 * 60 * 1000 ? 'bg-green-500 animate-pulse' : 'bg-[#414868]'}`} />
                    <span className={tw.textSecondary}>{formatLastSeen(date, user.createdAt)}</span>
                </div>
            )
        },
        {
            key: 'phone',
            label: 'Phone',
            render: (_, user) => (
                <span className={tw.textSecondary}>
                    {user.phone ||
                        user.addresses?.[0]?.phoneNumber ||
                        user.orders?.[0]?.userInfo?.phone ||
                        'N/A'}
                </span>
            )
        },
        {
            key: 'role',
            label: 'Role',
            sortable: true,
            render: (role) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${role === 'admin' ? 'bg-[#bb9af7]/20 text-[#bb9af7]' : 'bg-[#7aa2f7]/20 text-[#7aa2f7]'
                    }`}>
                    {role || 'User'}
                </span>
            )
        },
        {
            key: 'orders',
            label: 'Orders',
            render: (_, user) => (
                <span className={`font-medium ${tw.textPrimary}`}>{user.orders?.length || 0} orders</span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, user) => (
                <AdminButtonDark
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                        setIsModalOpen(true);
                    }}
                >
                    Details
                </AdminButtonDark>
            )
        }
    ];

    return (
        <AdminLayoutDark>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Users</h1>
                        <p className={`text-sm ${tw.textSecondary}`}>Manage registered customers</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatsCardDark
                        title="Total Users"
                        value={userStats.total}
                        icon={User}
                        color="blue"
                    />
                    <StatsCardDark
                        title="Online Now"
                        value={userStats.onlineNow}
                        icon={Shield}
                        color="green"
                    />
                    <StatsCardDark
                        title="DAU (Last 24h)"
                        value={userStats.dau}
                        icon={Calendar}
                        color="purple"
                    />
                    <StatsCardDark
                        title="Total Admins"
                        value={userStats.totalAdmins}
                        icon={Shield}
                        color="orange"
                    />
                </div>

                {/* Search */}
                <div className={`${tw.bgSecondary} p-4 rounded-xl border ${tw.borderPrimary}`}>
                    <div className="relative max-w-md">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary}`} />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                        />
                    </div>
                </div>

                {/* Table */}
                <AdminTableDark
                    columns={columns}
                    data={filteredUsers}
                    isLoading={loading}
                    serverSidePagination={true}
                    totalServerPages={totalPages}
                    currentServerPage={page}
                    onPageChange={(newPage) => fetchUsers(newPage)}
                    onRowClick={(user) => {
                        setSelectedUser(user);
                        setExpandedOrders(false);
                        setIsModalOpen(true);
                    }}
                />

                {/* User Details Modal */}
                <AdminModalDark
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="User Details"
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
                            {/* Profile Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7aa2f7] to-[#bb9af7] flex items-center justify-center text-[#1a1b26] text-3xl font-bold shadow-lg shadow-blue-500/20">
                                    {selectedUser.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${tw.textPrimary}`}>{selectedUser.name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedUser.role === 'admin' ? 'bg-[#bb9af7]/20 text-[#bb9af7]' : 'bg-[#7aa2f7]/20 text-[#7aa2f7]'}`}>
                                            {selectedUser.role || 'User'}
                                        </span>
                                        <p className={`text-xs ${tw.textSecondary} flex items-center gap-1`}>
                                            <Calendar className="w-3 h-3" /> Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                                        </p>
                                        {selectedUser.orders?.some(o => o.location?.coordinates?.latitude) && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 animate-pulse flex items-center gap-1">
                                                <Globe className="w-3 h-3" /> GPS AVAILABLE
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
                                <div className={`p-4 rounded-lg border ${tw.borderPrimary} ${tw.bgInput}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Mail className={`w-5 h-5 ${tw.textSecondary}`} />
                                        <span className={`text-sm ${tw.textSecondary}`}>Email</span>
                                    </div>
                                    <p className={`font-medium ${tw.textPrimary}`}>{selectedUser.email}</p>
                                </div>
                                <div className={`p-4 rounded-lg border ${tw.borderPrimary} ${tw.bgInput}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Phone className={`w-5 h-5 ${tw.textSecondary}`} />
                                        <span className={`text-sm ${tw.textSecondary}`}>Phone</span>
                                    </div>
                                    <p className={`font-medium ${tw.textPrimary}`}>
                                        {selectedUser.phone ||
                                            selectedUser.addresses?.[0]?.phoneNumber ||
                                            selectedUser.orders?.find(o => o.userInfo?.phone)?.userInfo?.phone ||
                                            'N/A'}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-lg border ${tw.borderPrimary} ${tw.bgInput}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock className={`w-5 h-5 ${tw.textSecondary}`} />
                                        <span className={`text-sm ${tw.textSecondary}`}>Activity Status</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${new Date() - new Date(selectedUser.lastActive || selectedUser.createdAt) < 5 * 60 * 1000 ? 'bg-green-500 animate-pulse' : 'bg-[#414868]'}`} />
                                        <p className={`font-medium ${tw.textPrimary}`}>
                                            {new Date() - new Date(selectedUser.lastActive || selectedUser.createdAt) < 5 * 60 * 1000 ? 'Online Now' : `Last seen ${formatLastSeen(selectedUser.lastActive, selectedUser.createdAt)}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Global Last Known Location (from Orders) */}
                            {(!selectedUser.addresses?.some(a => a.location?.coordinates) &&
                                selectedUser.orders?.some(o => o.location?.coordinates?.latitude)) && (
                                    <div className={`p-4 rounded-xl border border-green-500/30 bg-green-500/5`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-5 h-5 text-green-400" />
                                                <div>
                                                    <p className="text-sm font-bold text-green-400">Last Known Delivery GPS</p>
                                                    <p className="text-[10px] text-green-400/70">Found in order history</p>
                                                </div>
                                            </div>
                                            {(() => {
                                                const lastOrderWithGPS = [...selectedUser.orders]
                                                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                                    .find(o => o.location?.coordinates?.latitude);

                                                return lastOrderWithGPS && (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${lastOrderWithGPS.location.coordinates.latitude},${lastOrderWithGPS.location.coordinates.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-[#1a1b26] rounded-lg text-xs font-bold hover:bg-green-400 transition-colors shadow-lg shadow-green-500/20"
                                                    >
                                                        <ExternalLink className="w-3 h-3" /> OPEN IN GOOGLE MAPS
                                                    </a>
                                                );
                                            })()}
                                        </div>
                                        <p className="text-xs text-green-400/60 italic">
                                            * No coordinates saved in the user's profile address, but GPS was captured during a recent delivery.
                                        </p>
                                    </div>
                                )}

                            {/* Addresses Section */}
                            <div className="space-y-3">
                                <h4 className={`font-medium ${tw.textPrimary} flex items-center gap-2`}>
                                    <MapPin className="w-4 h-4 text-[#7aa2f7]" /> Saved Addresses ({selectedUser.addresses?.length || 0})
                                </h4>
                                {selectedUser.addresses && selectedUser.addresses.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedUser.addresses.map((addr, idx) => (
                                            <div key={idx} className={`p-3 rounded-lg border ${tw.borderPrimary} ${tw.bgInput}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs font-bold uppercase ${tw.textSecondary}`}>{addr.type || 'Address'}</span>
                                                    {addr.isDefault && (
                                                        <span className="text-[10px] bg-[#7aa2f7]/20 text-[#7aa2f7] px-1.5 py-0.5 rounded">DEFAULT</span>
                                                    )}
                                                </div>
                                                <p className={`text-sm ${tw.textPrimary}`}>{addr.fullName}</p>
                                                <p className={`text-xs ${tw.textSecondary} mt-1`}>
                                                    {addr.street}, {addr.locality}, {addr.city}
                                                </p>
                                                <p className={`text-xs ${tw.textSecondary}`}>
                                                    {addr.state} - {addr.pincode}
                                                </p>
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#414868]">
                                                    {addr.location?.coordinates ? (
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="w-3 h-3 text-green-400" />
                                                            <span className="text-[10px] text-green-400 font-mono">
                                                                {addr.location.coordinates[1].toFixed(4)}, {addr.location.coordinates[0].toFixed(4)}
                                                            </span>
                                                            <a
                                                                href={`https://www.google.com/maps?q=${addr.location.coordinates[1]},${addr.location.coordinates[0]}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <ExternalLink className="w-3 h-3 text-[#7aa2f7]" />
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-red-400/50 italic flex items-center gap-1">
                                                            <Globe className="w-3 h-3" /> Coordinates not captured
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`p-4 rounded-lg border border-dashed ${tw.borderPrimary} text-center`}>
                                        <p className={`text-sm ${tw.textSecondary}`}>No saved addresses found</p>
                                    </div>
                                )}
                            </div>

                            {/* Orders Section (Collapsible) */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => setExpandedOrders(!expandedOrders)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border ${tw.borderPrimary} ${tw.bgInput} hover:bg-[#414868]/50 transition-colors`}
                                >
                                    <div className="flex items-center gap-3">
                                        <ShoppingBag className="w-5 h-5 text-[#bb9af7]" />
                                        <div className="text-left">
                                            <p className={`font-medium ${tw.textPrimary}`}>Order History</p>
                                            <p className={`text-xs ${tw.textSecondary}`}>{selectedUser.orders?.length || 0} total orders</p>
                                        </div>
                                    </div>
                                    {expandedOrders ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>

                                {expandedOrders && (
                                    <div className="space-y-3 mt-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedUser.orders && selectedUser.orders.length > 0 ? (
                                            selectedUser.orders.map((order, idx) => (
                                                <div key={idx} className={`p-3 rounded-lg border ${tw.borderPrimary} ${tw.bgSecondary}`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className={`text-xs font-mono ${tw.textSecondary}`}>#{order._id.slice(-8).toUpperCase()}</span>
                                                        <div className="flex gap-2">
                                                            {order.location?.coordinates?.latitude && (
                                                                <a
                                                                    href={`https://www.google.com/maps?q=${order.location.coordinates.latitude},${order.location.coordinates.longitude}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 text-[10px] text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded hover:bg-green-500/10 transition-colors"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Globe className="w-2.5 h-2.5" /> GPS
                                                                </a>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium 
                                                                ${order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                                                                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                                        'bg-blue-500/20 text-blue-400'}`}>
                                                                {order.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className={`text-sm font-bold ${tw.textPrimary}`}>₹{order.finalTotal || order.totalAmount}</p>
                                                            <p className={`text-xs ${tw.textSecondary}`}>{new Date(order.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`text-[10px] ${tw.textSecondary}`}>{order.items?.length || 0} Items</p>
                                                            <p className={`text-[10px] ${tw.textSecondary}`}>{order.paymentMethod?.replace('_', ' ')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className={`p-8 rounded-lg border border-dashed ${tw.borderPrimary} text-center`}>
                                                <Package className="w-8 h-8 ${tw.textSecondary} mx-auto mb-2 opacity-20" />
                                                <p className={`text-sm ${tw.textSecondary}`}>No orders found for this user</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </AdminModalDark>
            </div>
        </AdminLayoutDark>
    );
};

export default AdminUsersDark;
