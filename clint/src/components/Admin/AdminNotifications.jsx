import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSend, FiBell, FiCheckCircle, FiAlertCircle, FiLoader, FiUsers,
    FiSmartphone, FiGlobe, FiSearch, FiClock, FiLayers
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
import AdminLayoutDark from './AdminLayoutDark';
import AdminNotificationBatchesDark from './AdminNotificationBatchesDark';
import { tw } from '../../config/tokyoNightTheme';

const AdminNotifications = () => {
    const { API_URL } = useAppContext();
    const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'broadcast' | 'subscribers'

    // Broadcast state
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [targetPath, setTargetPath] = useState('/');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // Subscribers state
    const [subscribers, setSubscribers] = useState([]);
    const [fetchingSubscribers, setFetchingSubscribers] = useState(false);
    const [subscriberSearch, setSubscriberSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(10);

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Only image files are allowed');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        const toastId = toast.loading('Uploading banner image...');

        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post(
                `${API_URL}/api/admin/notifications/upload-image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setImageUrl(response.data.imageUrl);
                toast.dismiss(toastId);
                toast.success('Banner uploaded successfully!');
            } else {
                toast.dismiss(toastId);
                toast.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Image upload failed:', error);
            toast.dismiss(toastId);
            toast.error(error.response?.data?.message || 'Failed to upload image.');
        } finally {
            setUploading(false);
        }
    };

    const fetchSubscribers = async () => {
        setFetchingSubscribers(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/notifications/subscribers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSubscribers(response.data.subscribers);
            }
        } catch (error) {
            console.error('Failed to fetch subscribers:', error);
        } finally {
            setFetchingSubscribers(false);
        }
    };

    const handleSendToUser = async (userId, userName) => {
        if (!title || !body) {
            toast.error('Please fill in title and message first');
            return;
        }

        const confirmSend = window.confirm(`Send this notification to ${userName}?`);
        if (!confirmSend) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(
                `${API_URL}/api/admin/notifications/send-to-user`,
                { userId, title, body, data: { path: targetPath, image: imageUrl } },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Sent to ${userName}`);
        } catch (error) {
            toast.error('Failed to send individual notification');
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!title || !body) {
            toast.error('Please fill in both title and message');
            return;
        }

        const confirmSend = window.confirm(`Are you sure you want to send this notification to ALL users?`);
        if (!confirmSend) return;

        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post(
                `${API_URL}/api/admin/notifications/broadcast`,
                { 
                    title, 
                    body, 
                    data: { 
                        path: targetPath, 
                        image: imageUrl 
                    } 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Notification broadcasted successfully!');
                setResult({
                    success: true,
                    message: `Sent to ${response.data.successCount} active device(s).`,
                    totalTokens: response.data.totalTokens
                });
                // Reset form
                setTitle('');
                setBody('');
                setImageUrl('');
            }
        } catch (error) {
            console.error('Broadcast failed:', error);
            toast.error(error.response?.data?.message || 'Failed to send broadcast');
            setResult({
                success: false,
                message: 'Error: Could not reach notification server.'
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredSubscribers = subscribers.filter(s => 
        s.name?.toLowerCase().includes(subscriberSearch.toLowerCase()) || 
        s.email?.toLowerCase().includes(subscriberSearch.toLowerCase())
    );

    return (
        <AdminLayoutDark>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Top Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className={`text-2xl sm:text-3xl font-extrabold ${tw.textPrimary} tracking-tight`}>
                                Notifications & Automated Drips
                            </h1>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#7aa2f7]/15 text-[#7aa2f7] border border-[#7aa2f7]/30">
                                Push Engine
                            </span>
                        </div>
                        <p className={`text-xs sm:text-sm ${tw.textSecondary} mt-1`}>
                            Automate scheduled campaigns, send instant broadcast alerts, and monitor subscriber devices
                        </p>
                    </div>
                </div>

                {/* Section Navigation Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-[#24283b] border border-[#292e42] rounded-2xl overflow-x-auto scrollbar-none">
                    <button
                        onClick={() => setActiveTab('batches')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                            activeTab === 'batches'
                                ? 'bg-gradient-to-r from-[#7aa2f7] to-[#bb9af7] text-[#1a1b26] shadow-lg shadow-blue-500/20'
                                : 'text-[#7982a9] hover:text-[#c0caf5] hover:bg-[#1f2335]'
                        }`}
                    >
                        <FiClock className="w-4 h-4" />
                        <span>Auto-Pilot Batch Scheduler</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                            activeTab === 'batches' ? 'bg-[#1a1b26] text-[#7aa2f7]' : 'bg-[#1a1b26] text-[#7982a9]'
                        }`}>
                            NEW
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('broadcast')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                            activeTab === 'broadcast'
                                ? 'bg-gradient-to-r from-[#7aa2f7] to-[#bb9af7] text-[#1a1b26] shadow-lg shadow-blue-500/20'
                                : 'text-[#7982a9] hover:text-[#c0caf5] hover:bg-[#1f2335]'
                        }`}
                    >
                        <FiSend className="w-4 h-4" />
                        <span>Quick Instant Broadcast</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('subscribers')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                            activeTab === 'subscribers'
                                ? 'bg-gradient-to-r from-[#7aa2f7] to-[#bb9af7] text-[#1a1b26] shadow-lg shadow-blue-500/20'
                                : 'text-[#7982a9] hover:text-[#c0caf5] hover:bg-[#1f2335]'
                        }`}
                    >
                        <FiUsers className="w-4 h-4" />
                        <span>Subscribers & Devices</span>
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-[#1a1b26] text-[#7982a9]">
                            {subscribers.length}
                        </span>
                    </button>
                </div>

                {/* Tab 1: AUTO-PILOT BATCH SCHEDULER */}
                {activeTab === 'batches' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <AdminNotificationBatchesDark />
                    </motion.div>
                )}

                {/* Tab 2: QUICK INSTANT BROADCAST */}
                {activeTab === 'broadcast' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Broadcast Form */}
                            <div className="bg-[#24283b] p-5 sm:p-6 rounded-2xl border border-[#292e42] shadow-xl space-y-5">
                                <div className="flex items-center gap-2.5 pb-2 border-b border-[#292e42]">
                                    <span className="p-2 bg-[#7aa2f7]/20 text-[#7aa2f7] rounded-xl border border-[#7aa2f7]/30">
                                        <FiSend className="w-4 h-4" />
                                    </span>
                                    <div>
                                        <h3 className="text-base font-bold text-[#c0caf5]">Send One-Time Instant Push</h3>
                                        <p className="text-xs text-[#7982a9]">Broadcasts right now to all active mobile & web subscriber tokens.</p>
                                    </div>
                                </div>

                                <form onSubmit={handleBroadcast} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#7982a9] mb-1.5 uppercase tracking-wider">
                                            Notification Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1b26] border border-[#414868] focus:border-[#7aa2f7] outline-none text-sm text-[#c0caf5] font-medium"
                                            placeholder="e.g. Flash Sale Live! ⚡"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#7982a9] mb-1.5 uppercase tracking-wider">
                                            Message Body *
                                        </label>
                                        <textarea
                                            value={body}
                                            onChange={(e) => setBody(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1b26] border border-[#414868] focus:border-[#7aa2f7] outline-none text-sm text-[#c0caf5] font-medium h-28 resize-none"
                                            placeholder="e.g. Get 20% OFF on all fresh fruits and vegetables..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#7982a9] mb-1.5 uppercase tracking-wider">
                                            Notification Banner Image (Optional)
                                        </label>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#414868] hover:border-[#7aa2f7] rounded-xl p-3 cursor-pointer bg-[#1a1b26] transition-all">
                                                    {uploading ? (
                                                        <div className="flex items-center gap-2 text-xs text-[#7aa2f7]">
                                                            <FiLoader className="animate-spin" />
                                                            <span>Uploading banner...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-xs text-[#7982a9] hover:text-[#c0caf5]">
                                                            <FiGlobe />
                                                            <span>Click to upload image file</span>
                                                        </div>
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={handleImageUpload} 
                                                        disabled={uploading} 
                                                        className="hidden" 
                                                    />
                                                </label>
                                                {imageUrl && (
                                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#414868] relative group shrink-0">
                                                        <img src={imageUrl} alt="Banner" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setImageUrl('')}
                                                            className="absolute inset-0 bg-black/70 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="url"
                                                value={imageUrl}
                                                onChange={(e) => setImageUrl(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-[#1a1b26] border border-[#414868] outline-none text-xs text-[#c0caf5]"
                                                placeholder="Or paste external banner image URL..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#7982a9] mb-1.5 uppercase tracking-wider">
                                            On Tap: Destination Route
                                        </label>
                                        <select
                                            value={targetPath}
                                            onChange={(e) => setTargetPath(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#1a1b26] border border-[#414868] outline-none text-xs sm:text-sm text-[#c0caf5] font-medium"
                                        >
                                            <option value="/">Home Page (/)</option>
                                            <option value="/products">All Products (/products)</option>
                                            <option value="/category/fruits-vegetables">Vegetables & Fruits</option>
                                            <option value="/category/dairy-breakfast">Dairy & Breakfast</option>
                                            <option value="/cart">Shopping Cart (/cart)</option>
                                            <option value="/orders">My Orders (/orders)</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                    >
                                        {loading ? <FiLoader className="animate-spin" /> : <FiSend />}
                                        <span>{loading ? 'Broadcasting...' : 'Broadcast to All Devices'}</span>
                                    </button>
                                </form>
                            </div>

                            {/* Live Mobile Push Preview */}
                            <div className="space-y-4">
                                <div className="p-4 bg-[#24283b] border border-[#292e42] rounded-2xl">
                                    <h4 className="text-xs font-bold text-[#7aa2f7] uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <FiSmartphone /> Live Push Mockup Preview
                                    </h4>

                                    <div className="bg-[#0f111a] rounded-3xl p-4 border-2 border-[#292e42] shadow-2xl max-w-sm mx-auto space-y-3">
                                        <div className="flex justify-between text-[10px] text-gray-500 font-bold px-1">
                                            <span>12:45</span>
                                            <span>5G • 85%</span>
                                        </div>

                                        <div className="p-3.5 bg-[#1f2335]/95 backdrop-blur-md rounded-2xl border border-[#414868]/60 shadow-xl space-y-2">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <div className="flex items-center gap-1.5 font-bold text-[#c0caf5]">
                                                    <div className="w-4 h-4 bg-gradient-to-br from-[#7aa2f7] to-[#bb9af7] rounded flex items-center justify-center text-[9px] font-black text-[#1a1b26]">
                                                        RG
                                                    </div>
                                                    <span>RG Basket</span>
                                                </div>
                                                <span className="text-[10px] text-[#565f89]">now</span>
                                            </div>

                                            <div>
                                                <h5 className="text-xs font-black text-white">
                                                    {title || 'Flash Sale Live! ⚡'}
                                                </h5>
                                                <p className="text-[11px] text-[#a9b1d6] mt-0.5 leading-snug">
                                                    {body || 'Get 20% OFF on all fresh fruits and vegetables with express delivery...'}
                                                </p>
                                            </div>

                                            {imageUrl && (
                                                <div className="w-full h-28 rounded-xl overflow-hidden bg-black/40 border border-white/10 mt-1">
                                                    <img
                                                        src={imageUrl}
                                                        alt="Banner Preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                </div>
                                            )}

                                            <div className="pt-1 flex items-center justify-between text-[10px] text-[#7aa2f7] border-t border-white/5">
                                                <span>Opens: {targetPath}</span>
                                                <span>Tap to view →</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {result && (
                                    <div className={`p-4 rounded-2xl border ${
                                        result.success 
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                    }`}>
                                        <div className="flex items-center gap-2 font-bold text-xs mb-1">
                                            {result.success ? <FiCheckCircle /> : <FiAlertCircle />}
                                            <span>{result.success ? 'Broadcast Succeeded' : 'Broadcast Issue'}</span>
                                        </div>
                                        <p className="text-xs">{result.message}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tab 3: SUBSCRIBERS LIST */}
                {activeTab === 'subscribers' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-[#24283b] p-5 sm:p-6 rounded-2xl border border-[#292e42] shadow-xl space-y-5"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#7aa2f7]/20 text-[#7aa2f7] rounded-xl border border-[#7aa2f7]/30">
                                    <FiUsers size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#c0caf5]">Subscribed Customer Devices</h2>
                                    <p className="text-xs text-[#7982a9]">{subscribers.length} total active notification device tokens</p>
                                </div>
                            </div>

                            <div className="relative w-full sm:w-auto">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#565f89]" />
                                <input 
                                    type="text" 
                                    placeholder="Search name or email..."
                                    value={subscriberSearch}
                                    onChange={(e) => setSubscriberSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-[#1a1b26] border border-[#414868] rounded-xl outline-none text-xs text-[#c0caf5] w-full sm:w-64"
                                />
                            </div>
                        </div>

                        {fetchingSubscribers ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="w-8 h-8 border-3 border-[#7aa2f7] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs text-[#7982a9] font-bold uppercase tracking-wider">Loading Subscribers...</p>
                            </div>
                        ) : filteredSubscribers.length === 0 ? (
                            <div className="text-center py-12 text-[#7982a9] text-xs">
                                No subscribers match your query.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="text-[#565f89] uppercase tracking-wider font-bold border-b border-[#292e42]">
                                                <th className="pb-3 pl-3">Customer</th>
                                                <th className="pb-3 text-center">Platforms</th>
                                                <th className="pb-3">Last Active</th>
                                                <th className="pb-3 pr-3 text-right">Direct Test</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#292e42]">
                                            {filteredSubscribers.slice(0, visibleCount).map((sub) => (
                                                <tr key={sub._id} className="hover:bg-[#1f2335] transition-colors">
                                                    <td className="py-3 pl-3">
                                                        <div className="font-bold text-[#c0caf5]">{sub.name || 'Unnamed Customer'}</div>
                                                        <div className="text-[11px] text-[#7982a9]">{sub.email}</div>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            {sub.pushToken && <FiGlobe title="Web Push Token" className="text-[#7aa2f7]" size={16} />}
                                                            {sub.pushTokens?.some(t => t.platform === 'android') && (
                                                                <FiSmartphone title="Android Device" className="text-emerald-400" size={16} />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-[#7982a9]">
                                                        {sub.lastActive ? new Date(sub.lastActive).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="py-3 pr-3 text-right">
                                                        <button
                                                            onClick={() => handleSendToUser(sub._id, sub.name)}
                                                            className="px-3 py-1.5 rounded-lg bg-[#7aa2f7]/15 hover:bg-[#7aa2f7]/25 text-[#7aa2f7] border border-[#7aa2f7]/30 text-xs font-bold transition-all"
                                                        >
                                                            Send Test
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredSubscribers.length > visibleCount && (
                                    <div className="text-center pt-3">
                                        <button
                                            onClick={() => setVisibleCount(prev => prev + 20)}
                                            className="px-4 py-2 bg-[#1f2335] hover:bg-[#1a1b26] text-[#c0caf5] rounded-xl text-xs font-bold border border-[#414868]"
                                        >
                                            Load More ({filteredSubscribers.length - visibleCount} remaining)
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Important System Notes Box */}
                <div className="p-4 bg-[#24283b] rounded-2xl border border-[#292e42] text-xs text-[#7982a9] space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-[#e0af68]">
                        <FiAlertCircle />
                        <span>Push Notification Guidelines</span>
                    </div>
                    <ul className="space-y-1 text-[11px] list-disc list-inside">
                        <li>Automatic batch drips run in the background on your server without needing this browser tab open.</li>
                        <li>Quiet Hours (10:00 PM – 7:00 AM IST) prevent overnight customer disruptions.</li>
                        <li>Notifications deliver to Android app APK installs and browsers where users permitted notifications.</li>
                    </ul>
                </div>
            </div>
        </AdminLayoutDark>
    );
};

export default AdminNotifications;
