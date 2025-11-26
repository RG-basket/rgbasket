import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            key: 'email',
            label: 'Email',
            sortable: true,
            render: (email) => <span className={tw.textSecondary}>{email}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCardDark
                        title="Total Users"
                        value={users.length}
                        icon={User}
                        color="blue"
                    />
                    <StatsCardDark
                        title="Active This Month"
                        value={users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                        icon={Calendar}
                        color="green"
                    />
                    <StatsCardDark
                        title="Admins"
                        value={users.filter(u => u.role === 'admin').length}
                        icon={Shield}
                        color="purple"
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
                    onRowClick={(user) => {
                        setSelectedUser(user);
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
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7aa2f7] to-[#bb9af7] flex items-center justify-center text-[#1a1b26] text-3xl font-bold shadow-lg shadow-blue-500/20">
                                    {selectedUser.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${tw.textPrimary}`}>{selectedUser.name}</h3>
                                    <p className={tw.textSecondary}>Member since {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

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
                                    <p className={`font-medium ${tw.textPrimary}`}>{selectedUser.phone || 'N/A'}</p>
                                </div>
                            </div>

                            {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                                <div>
                                    <h4 className={`font-medium ${tw.textPrimary} mb-3 flex items-center gap-2`}>
                                        <MapPin className="w-4 h-4" /> Saved Addresses
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedUser.addresses.map((addr, idx) => (
                                            <div key={idx} className={`p-4 rounded-lg border ${tw.borderPrimary} ${tw.bgInput}`}>
                                                <p className={`font-medium ${tw.textPrimary}`}>{addr.type || 'Home'}</p>
                                                <p className={`text-sm ${tw.textSecondary} mt-1`}>
                                                    {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </AdminModalDark>
            </div>
        </AdminLayoutDark>
    );
};

export default AdminUsersDark;
