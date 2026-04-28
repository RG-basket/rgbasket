import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayoutDark';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCoins, FaSave, FaHistory, FaGift, FaPercentage, FaShoppingCart, FaSearch, FaUser, FaPlus, FaMinus, FaWallet } from 'react-icons/fa';
import { tw } from '../../config/tokyoNightTheme';
import AdminButtonDark from './SharedDark/AdminButtonDark';

const AdminRewardsDark = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Give Coins State
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [foundUser, setFoundUser] = useState(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentNote, setAdjustmentNote] = useState('');
    const [adjusting, setAdjusting] = useState(false);

    // Top Users State
    const [topUsers, setTopUsers] = useState([]);
    const [fetchingTop, setFetchingTop] = useState(false);
    const [displayLimit, setDisplayLimit] = useState(10);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reward-settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data.settings || []);
            }
        } catch (error) {
            toast.error('Failed to load reward settings');
        } finally {
            setLoading(false);
        }
    };

    const fetchTopUsers = async () => {
        try {
            setFetchingTop(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/top-coins`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setTopUsers(data.users || []);
            }
        } catch (error) {
            console.error('Failed to load top coin holders:', error);
        } finally {
            setFetchingTop(false);
        }
    };

    useEffect(() => {
        fetchSettings();
        fetchTopUsers();
    }, []);

    const handleLoadMore = () => {
        setDisplayLimit(prev => prev + 10);
    };

    const handleUpdateSetting = async (key, value, description) => {
        try {
            setSaving(true);
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/reward-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key, value, description })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Setting updated successfully!');
                fetchSettings();
            }
        } catch (error) {
            toast.error('Error updating setting');
        } finally {
            setSaving(false);
        }
    };

    const handleSearchUser = async () => {
        if (!searchQuery) return;
        try {
            setSearching(true);
            setFoundUser(null);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/search?query=${searchQuery}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.user) {
                setFoundUser(data.user);
            } else {
                toast.error(data.message || 'User not found');
            }
        } catch (error) {
            toast.error('Error searching user');
        } finally {
            setSearching(false);
        }
    };

    const handleAdjustCoins = async () => {
        if (!foundUser || !adjustmentAmount) {
            toast.error('Please specify the amount');
            return;
        }

        try {
            setAdjusting(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${foundUser._id}/adjust-coins`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: Number(adjustmentAmount),
                    note: adjustmentNote || 'Admin adjustment'
                })
            });

            if (response.ok) {
                toast.success('Coins adjusted successfully');
                setFoundUser({ ...foundUser, rgCoins: foundUser.rgCoins + Number(adjustmentAmount) });
                setAdjustmentAmount('');
                setAdjustmentNote('');
                fetchTopUsers(); // Refresh the top holders list
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to adjust coins');
            }
        } catch (error) {
            toast.error('Error adjusting coins');
        } finally {
            setAdjusting(false);
        }
    };

    const getIcon = (key) => {
        switch (key) {
            case 'conversionRate': return <FaCoins className="text-amber-400" />;
            case 'maxRedemptionRupees': return <FaWallet className="text-blue-400" />;
            case 'minOrderForRedemption': return <FaShoppingCart className="text-rose-400" />;
            case 'orderRewardPercent': return <FaPercentage className="text-emerald-400" />;
            case 'referralRewardCoins': return <FaGift className="text-purple-400" />;
            case 'signupBonusCoins': return <FaUser className="text-indigo-400" />;
            case 'refereeBonusCoins': return <FaUser className="text-emerald-400" />;
            case 'minOrderForReferral': return <FaShoppingCart className="text-rose-400" />;
            default: return <FaCoins />;
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 max-w-6xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">RG Coin Rewards</h1>
                        <p className={`${tw.textSecondary} text-sm font-medium mt-1 uppercase tracking-widest`}>
                            Configure global earning and redemption rates
                        </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
                        <FaCoins className="text-amber-500 text-2xl animate-bounce" />
                    </div>
                </div>

                {/* Give Coins Section - NEW FEATURE */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${tw.bgSecondary} p-8 rounded-[2.5rem] border ${tw.borderPrimary} shadow-2xl relative overflow-hidden`}
                >
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <FaWallet size={120} className="text-amber-500" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                                <FaPlus className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Manual Coin Adjustment</h2>
                                <p className={`${tw.textSecondary} text-xs font-bold uppercase tracking-widest`}>Distribute coins to any user instantly</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Left Side: Search */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#565f89] uppercase tracking-widest ml-1">Search User (Email or Phone)</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#414868]" />
                                            <input 
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                                                placeholder="user@example.com or 9876543210"
                                                className={`w-full ${tw.bgInput} border-2 ${tw.borderPrimary} rounded-xl pl-11 pr-4 py-3 text-white font-medium focus:border-amber-500 transition-all outline-none`}
                                            />
                                        </div>
                                        <AdminButtonDark 
                                            variant="secondary"
                                            className="bg-amber-500 hover:bg-amber-600 text-[#1a1b26] border-none px-6"
                                            onClick={handleSearchUser}
                                            disabled={searching}
                                        >
                                            {searching ? '...' : 'FIND'}
                                        </AdminButtonDark>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {foundUser && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="p-4 bg-[#1a1b26] rounded-2xl border border-amber-500/30 flex items-center gap-4"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                                                {foundUser.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-white font-bold">{foundUser.name}</h4>
                                                <p className="text-xs text-[#565f89]">{foundUser.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <FaCoins className="text-amber-500 text-[10px]" />
                                                    <span className="text-xs font-black text-amber-500">{foundUser.rgCoins || 0} Coins</span>
                                                </div>
                                            </div>
                                            <button onClick={() => setFoundUser(null)} className="p-2 text-[#414868] hover:text-white transition-colors">
                                                <FaHistory size={14} />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Right Side: Adjust */}
                            <div className={`space-y-6 transition-opacity duration-300 ${foundUser ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#565f89] uppercase tracking-widest ml-1">Adjustment Amount</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                value={adjustmentAmount}
                                                onChange={(e) => setAdjustmentAmount(e.target.value)}
                                                placeholder="e.g. 500 or -200"
                                                className={`w-full ${tw.bgInput} border-2 ${tw.borderPrimary} rounded-xl px-4 py-3 text-white font-black focus:border-amber-500 transition-all outline-none`}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
                                                <FaPlus className="text-emerald-400 text-[10px]" />
                                                <FaMinus className="text-red-400 text-[10px]" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#565f89] uppercase tracking-widest ml-1">Reason / Note (Optional)</label>
                                        <input 
                                            type="text"
                                            value={adjustmentNote}
                                            onChange={(e) => setAdjustmentNote(e.target.value)}
                                            placeholder="e.g. Refund or Bonus"
                                            className={`w-full ${tw.bgInput} border-2 ${tw.borderPrimary} rounded-xl px-4 py-3 text-white font-medium focus:border-amber-500 transition-all outline-none`}
                                        />
                                    </div>
                                </div>

                                <AdminButtonDark 
                                    variant="primary"
                                    className="w-full bg-[#7aa2f7] hover:bg-[#89b4fa] text-[#1a1b26] border-none font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-blue-500/20"
                                    onClick={handleAdjustCoins}
                                    disabled={adjusting || !foundUser}
                                >
                                    {adjusting ? 'PROCESSING ADJUSTMENT...' : 'CONFIRM COIN ADJUSTMENT'}
                                </AdminButtonDark>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Global Settings Grid */}
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <FaPercentage className="text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Global Parameters</h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-[#7aa2f7] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {settings.map((setting) => (
                                <motion.div 
                                    key={setting.key}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`${tw.bgSecondary} p-6 rounded-3xl border ${tw.borderPrimary} shadow-xl hover:border-[#7aa2f7]/30 transition-all group`}
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-[#1a1b26] flex items-center justify-center text-xl shadow-inner border border-[#414868]/30">
                                                {getIcon(setting.key)}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-sm capitalize">
                                                    {setting.key.replace(/([A-Z])/g, ' $1').trim()}
                                                </h3>
                                                <p className={`${tw.textSecondary} text-[10px] font-medium leading-tight mt-0.5`}>
                                                    {setting.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                defaultValue={setting.value}
                                                onBlur={(e) => {
                                                    if (e.target.value !== setting.value.toString()) {
                                                        handleUpdateSetting(setting.key, Number(e.target.value), setting.description);
                                                    }
                                                }}
                                                className={`w-full ${tw.bgInput} border-2 ${tw.borderPrimary} rounded-xl px-4 py-2.5 text-white font-black focus:border-[#7aa2f7] focus:ring-0 transition-all outline-none`}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <FaSave className="text-[#414868] group-hover:text-[#7aa2f7] transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Coin Holders List - NEW FEATURE */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <FaHistory className="text-amber-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Top Coin Holders</h2>
                        </div>
                        <button 
                            onClick={fetchTopUsers}
                            className="p-2 text-[#565f89] hover:text-amber-500 transition-colors"
                        >
                            <FaHistory className={fetchingTop ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className={`${tw.bgSecondary} rounded-[2.5rem] border ${tw.borderPrimary} overflow-hidden shadow-2xl`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#1a1b26]/50 border-b border-[#414868]/30">
                                        <th className="px-8 py-5 text-[10px] font-black text-[#565f89] uppercase tracking-[0.2em]">Rank</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-[#565f89] uppercase tracking-[0.2em]">User</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-[#565f89] uppercase tracking-[0.2em]">Contact</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-[#565f89] uppercase tracking-[0.2em] text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#414868]/20">
                                    {fetchingTop && topUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-10 text-center">
                                                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                            </td>
                                        </tr>
                                    ) : topUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-10 text-center text-[#565f89] font-bold italic">
                                                No coin holders found yet
                                            </td>
                                        </tr>
                                    ) : (
                                        topUsers.slice(0, displayLimit).map((user, index) => (
                                            <tr key={user._id} className="hover:bg-[#1a1b26]/30 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                                        index === 0 ? 'bg-amber-500 text-[#1a1b26]' :
                                                        index === 1 ? 'bg-slate-300 text-[#1a1b26]' :
                                                        index === 2 ? 'bg-orange-400 text-[#1a1b26]' :
                                                        'bg-[#1a1b26] text-[#565f89]'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <img 
                                                            src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                                                            alt="" 
                                                            className="w-10 h-10 rounded-full border-2 border-[#414868]/30 group-hover:border-amber-500/50 transition-all"
                                                        />
                                                        <div>
                                                            <p className="text-white font-black text-sm">{user.name}</p>
                                                            <p className="text-[#565f89] text-[10px] font-medium">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-[#c0caf5] font-bold text-xs">{user.phone || 'NO PHONE'}</p>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <FaCoins className="text-amber-500 text-[10px]" />
                                                        <span className="text-amber-500 font-black text-lg tracking-tight">
                                                            {user.rgCoins.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {topUsers.length > displayLimit && (
                            <div className="p-8 flex justify-center border-t border-[#414868]/30 bg-[#1a1b26]/20">
                                <AdminButtonDark 
                                    variant="secondary"
                                    className="bg-[#1a1b26] border border-[#414868] text-[#565f89] hover:text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                    onClick={handleLoadMore}
                                >
                                    LOAD MORE HOLDERS
                                </AdminButtonDark>
                            </div>
                        )}
                    </div>
                </div>

                {/* Audit Tip */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <FaHistory className="text-amber-500" />
                    </div>
                    <p className={`${tw.textSecondary} text-xs font-medium leading-relaxed`}>
                        <span className="text-amber-500 font-black mr-2 uppercase tracking-widest">Security Tip:</span>
                        All manual coin adjustments are logged with your admin ID and timestamp. Ensure you provide clear reasons for every adjustment for future auditing.
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminRewardsDark;