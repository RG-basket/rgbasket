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
    const [imageUrl, setImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [targetPath, setTargetPath] = useState('/');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
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
            toast.error(error.response?.data?.message || 'Failed to upload image. Please ensure VITE_API_URL in your clint/.env points to your local server (http://localhost:5000) while testing.');
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
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0">
                    <FiBell size={24} />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">Push Notifications</h1>
                    <p className="text-xs md:text-sm text-gray-500">Send instant alerts to all users</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
                {/* Form Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-3xl shadow-sm border border-gray-100 order-2 lg:order-1"
                >
                    <form onSubmit={handleBroadcast} className="space-y-5 md:space-y-6">
                        <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                                Notification Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm md:text-base font-medium"
                                placeholder="e.g. Flash Sale Live! ⚡"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                                Message Body
                            </label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-28 md:h-32 resize-none text-sm md:text-base font-medium"
                                placeholder="e.g. Get 20% OFF on all fresh vegetables..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                                Notification Banner Image (Optional)
                            </label>
                            
                            <div className="space-y-3">
                                {/* Upload Box */}
                                <div className="flex items-center gap-3">
                                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-4 cursor-pointer transition-all bg-gray-50/50 hover:bg-emerald-50/10">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            {uploading ? (
                                                <>
                                                    <FiLoader className="animate-spin text-emerald-600 mb-1" size={20} />
                                                    <span className="text-xs text-emerald-600 font-bold">Uploading to Cloudinary...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiGlobe className="text-gray-400 mb-1" size={20} />
                                                    <span className="text-xs text-gray-600 font-bold">Click to upload image</span>
                                                    <span className="text-[10px] text-gray-400 mt-0.5">Supports PNG, JPG, WEBP (Max 5MB)</span>
                                                </>
                                            )}
                                        </div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleImageUpload} 
                                            disabled={uploading} 
                                            className="hidden" 
                                        />
                                    </label>
                                    
                                    {imageUrl && (
                                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shrink-0 relative group shadow-sm">
                                            <img src={imageUrl} alt="Uploaded Banner" className="w-full h-full object-cover" />
                                            <button 
                                                type="button" 
                                                onClick={() => setImageUrl('')}
                                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Manual input fallback */}
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs font-medium"
                                        placeholder="Or paste banner image URL manually..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                                On Click: Open Path
                            </label>
                            <div className="relative">
                                <select
                                    value={targetPath}
                                    onChange={(e) => setTargetPath(e.target.value)}
                                    className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none text-sm md:text-base font-medium"
                                >
                                    <option value="/">Home Page</option>
                                    <option value="/products/all">All Products</option>
                                    <option value="/cart">Cart</option>
                                    <option value="/orders">My Orders</option>
                                    <option value="/faq">Offers / FAQ</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <FiGlobe size={16} />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-4 md:py-5 rounded-xl md:rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm md:text-base"
                        >
                            {loading ? <FiLoader className="animate-spin" /> : <FiSend />}
                            {loading ? 'Sending Broadcast...' : 'Send to All Users'}
                        </button>
                    </form>
                </motion.div>

                {/* Preview / Result Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6 order-1 lg:order-2"
                >
                    {/* Phone Preview - Slightly smaller on mobile */}
                    <div className="bg-gray-900 rounded-[2.5rem] p-3 md:p-4 border-[6px] md:border-[8px] border-gray-800 shadow-2xl aspect-[9/16] max-w-[240px] md:max-w-[280px] mx-auto relative overflow-hidden group">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 md:w-20 h-4 md:h-5 bg-gray-800 rounded-full"></div>
                        
                        <div className="mt-10 md:mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-3 md:p-4 border border-white/10 mx-1 md:mx-2 shadow-xl">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 md:w-4 md:h-4 bg-emerald-500 rounded-sm"></div>
                                <span className="text-[9px] md:text-[10px] text-white/60 font-bold tracking-wider">RG BASKET</span>
                            </div>
                            <h4 className="text-white text-xs md:text-sm font-bold truncate">{title || 'Notification Title'}</h4>
                            <p className="text-white/80 text-[10px] md:text-xs line-clamp-2 mt-0.5 leading-relaxed">{body || 'This is how your message will appear on users\' phones.'}</p>
                            {imageUrl && (
                                <img 
                                    src={imageUrl} 
                                    alt="Banner Preview" 
                                    className="mt-2.5 w-full h-24 object-cover rounded-xl border border-white/10 shadow-sm"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            )}
                        </div>
                    </div>

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-4 rounded-2xl border ${result.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'} shadow-sm`}
                        >
                            <div className="flex items-center gap-2 font-bold mb-1">
                                {result.success ? <FiCheckCircle /> : <FiAlertCircle />}
                                {result.success ? 'Broadcast Success' : 'Broadcast Failed'}
                            </div>
                            <p className="text-sm opacity-90 font-medium">{result.message}</p>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Subscribers Section */}
            <div className="mt-8 md:mt-12 p-4 md:p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <FiUsers size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-800">Subscribers</h2>
                            <p className="text-[10px] text-gray-500 font-medium">{subscribers.length} total devices reached</p>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name or email..."
                            value={subscriberSearch}
                            onChange={(e) => setSubscriberSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-64 font-medium"
                        />
                    </div>
                </div>

                {fetchingSubscribers ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <FiLoader className="animate-spin text-blue-500" size={32} />
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading List...</p>
                    </div>
                ) : subscribers.length === 0 ? (
                    <div className="text-center py-12">
                         <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                             <FiUsers size={24} className="text-gray-300" />
                         </div>
                         <p className="text-gray-400 text-sm font-medium">No subscribers found yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-gray-50">
                                        <th className="pb-4 pl-4 font-black">User Identity</th>
                                        <th className="pb-4 font-black text-center">Platform</th>
                                        <th className="pb-4 font-black">Last Activity</th>
                                        <th className="pb-4 pr-4 text-right font-black">Quick Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredSubscribers.slice(0, visibleCount).map((sub) => (
                                        <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 pl-4">
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{sub.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{sub.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex justify-center gap-3">
                                                    {sub.pushToken && <FiGlobe title="Web" className="text-blue-500 hover:scale-110 transition-transform" size={16} />}
                                                    {sub.pushTokens?.some(t => t.platform === 'android') && <FiSmartphone title="Android" className="text-emerald-500 hover:scale-110 transition-transform" size={16} />}
                                                </div>
                                            </td>
                                            <td className="py-4 text-xs font-bold text-gray-500">
                                                {new Date(sub.lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="py-4 pr-4 text-right">
                                                <button
                                                    onClick={() => handleSendToUser(sub._id, sub.name)}
                                                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-blue-100"
                                                >
                                                    <FiSend size={12} /> Send Test
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden space-y-3">
                            {filteredSubscribers.slice(0, visibleCount).map((sub) => (
                                <div key={sub._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{sub.name}</p>
                                            <p className="text-[10px] text-gray-500">{sub.email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {sub.pushToken && <FiGlobe className="text-blue-500" size={14} />}
                                            {sub.pushTokens?.some(t => t.platform === 'android') && <FiSmartphone className="text-emerald-500" size={14} />}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-200/50">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                            Active: {new Date(sub.lastActive).toLocaleDateString()}
                                        </p>
                                        <button
                                            onClick={() => handleSendToUser(sub._id, sub.name)}
                                            className="bg-blue-600 active:scale-95 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-100"
                                        >
                                            <FiSend size={10} /> Send Test
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {filteredSubscribers.length > visibleCount && (
                    <div className="mt-8 flex justify-center">
                        <button 
                            onClick={() => setVisibleCount(prev => prev + 10)}
                            className="w-full sm:w-auto px-8 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all active:scale-95 shadow-xl shadow-gray-200 text-sm"
                        >
                            Load More Subscribers
                        </button>
                    </div>
                )}
            </div>

            {/* Info Notes */}
            <div className="mt-8 md:mt-12 p-5 md:p-6 bg-amber-50 rounded-3xl border border-amber-100 shadow-sm shadow-amber-50">
                <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-3 text-sm md:text-base">
                    <FiAlertCircle /> Important System Notes
                </h3>
                <ul className="text-xs md:text-sm text-amber-700/80 space-y-2 font-medium">
                    <li className="flex gap-2"><span>•</span> Notifications only deliver if users "Allowed" permissions in browser/app.</li>
                    <li className="flex gap-2"><span>•</span> For APK: Firebase Cloud Messaging (FCM) must be linked.</li>
                    <li className="flex gap-2"><span>•</span> For Web: VAPID key in <code>Firebase.js</code> must match Firebase Console.</li>
                </ul>
            </div>
        </div>
    );
};

export default AdminNotifications;
