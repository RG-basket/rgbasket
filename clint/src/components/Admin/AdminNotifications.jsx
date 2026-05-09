import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiSend, FiBell, FiCheckCircle, FiAlertCircle, FiLoader, FiUsers, FiSmartphone, FiGlobe, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';

const AdminNotifications = () => {
    const { API_URL } = useAppContext();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [targetPath, setTargetPath] = useState('/');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [subscribers, setSubscribers] = useState([]);
    const [fetchingSubscribers, setFetchingSubscribers] = useState(false);
    const [subscriberSearch, setSubscriberSearch] = useState('');

    useEffect(() => {
        fetchSubscribers();
    }, []);

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
                { userId, title, body, data: { path: targetPath } },
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
                    data: { path: targetPath } 
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

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                    <FiBell size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Push Notifications</h1>
                    <p className="text-sm text-gray-500">Send instant alerts to all APK and Webapp users</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Form Section */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
                >
                    <form onSubmit={handleBroadcast} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                Notification Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. Flash Sale Live! ⚡"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                Message Body
                            </label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all h-32 resize-none"
                                placeholder="e.g. Get 20% OFF on all fresh vegetables for the next 2 hours."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                On Click: Open Path
                            </label>
                            <select
                                value={targetPath}
                                onChange={(e) => setTargetPath(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="/">Home Page</option>
                                <option value="/products/all">All Products</option>
                                <option value="/cart">Cart</option>
                                <option value="/orders">My Orders</option>
                                <option value="/faq">Offers / FAQ</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <FiLoader className="animate-spin" /> : <FiSend />}
                            {loading ? 'Sending Broadcast...' : 'Send to All Users'}
                        </button>
                    </form>
                </motion.div>

                {/* Preview / Instructions Section */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="bg-gray-900 rounded-[2.5rem] p-4 border-[8px] border-gray-800 shadow-2xl aspect-[9/16] max-w-[280px] mx-auto relative overflow-hidden">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-full"></div>
                        
                        <div className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 mx-2">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
                                <span className="text-[10px] text-white/60 font-medium">RG BASKET</span>
                            </div>
                            <h4 className="text-white text-xs font-bold truncate">{title || 'Notification Title'}</h4>
                            <p className="text-white/80 text-[10px] line-clamp-2 mt-0.5">{body || 'This is how your message will appear on users\' phones.'}</p>
                        </div>
                    </div>

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-2xl border ${result.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}
                        >
                            <div className="flex items-center gap-2 font-bold mb-1">
                                {result.success ? <FiCheckCircle /> : <FiAlertCircle />}
                                {result.success ? 'Broadcast Success' : 'Broadcast Failed'}
                            </div>
                            <p className="text-sm opacity-90">{result.message}</p>
                            {result.totalTokens > 0 && (
                                <p className="text-[10px] mt-2 font-mono">Total Tokens Found: {result.totalTokens}</p>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </div>

            <div className="mt-12 p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <FiUsers size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Notification Subscribers</h2>
                        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {subscribers.length}
                        </span>
                    </div>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search subscribers..."
                            value={subscriberSearch}
                            onChange={(e) => setSubscriberSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                        />
                    </div>
                </div>

                {fetchingSubscribers ? (
                    <div className="flex items-center justify-center py-12">
                        <FiLoader className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : subscribers.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        No subscribers found yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-50">
                                    <th className="pb-3 pl-4">User</th>
                                    <th className="pb-3">Platform</th>
                                    <th className="pb-3">Last Active</th>
                                    <th className="pb-3 pr-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {subscribers
                                    .filter(s => 
                                        s.name?.toLowerCase().includes(subscriberSearch.toLowerCase()) || 
                                        s.email?.toLowerCase().includes(subscriberSearch.toLowerCase())
                                    )
                                    .map((sub) => (
                                    <tr key={sub._id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="py-4 pl-4">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={sub.photo || 'https://via.placeholder.com/40'} 
                                                    className="w-10 h-10 rounded-full border border-gray-100"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{sub.name}</p>
                                                    <p className="text-xs text-gray-500">{sub.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex gap-2">
                                                {sub.pushToken && <FiGlobe title="Web" className="text-blue-500" />}
                                                {sub.pushTokens?.some(t => t.platform === 'android') && <FiSmartphone title="Android" className="text-emerald-500" />}
                                            </div>
                                        </td>
                                        <td className="py-4 text-xs text-gray-500">
                                            {new Date(sub.lastActive).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 pr-4 text-right">
                                            <button
                                                onClick={() => handleSendToUser(sub._id, sub.name)}
                                                className="opacity-0 group-hover:opacity-100 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ml-auto"
                                            >
                                                <FiSend size={12} /> Send Test
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-12 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-2">
                    <FiAlertCircle /> Important Implementation Notes
                </h3>
                <ul className="text-sm text-amber-700 space-y-2 list-disc pl-5">
                    <li>Notifications will only be delivered to users who have "Allowed" permissions.</li>
                    <li>For APK: Ensure your Firebase Cloud Messaging (FCM) is linked in Firebase Console.</li>
                    <li>For Web: Ensure the VAPID key is correctly set in the <code>Firebase.js</code> file.</li>
                    <li>Server-side: You must add the <code>FIREBASE_SERVICE_ACCOUNT</code> JSON string to your backend <code>.env</code> file.</li>
                </ul>
            </div>
        </div>
    );
};

export default AdminNotifications;
