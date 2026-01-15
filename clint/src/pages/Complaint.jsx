import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import axios from 'axios';
import {
    FiCamera, FiCheckCircle, FiClock, FiInfo, FiChevronRight,
    FiAlertCircle, FiPlus, FiImage, FiFileText, FiX, FiLoader, FiClipboard, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ISSUE_TYPES = [
    'Damaged/Rotten Product',
    'Wrong/Missing Item',
    'Delivery Problem',
    'Pricing/Billing Issue',
    'Suggestion/Feedback',
    'Other'
];

const Complaint = () => {
    const { user, API_URL, isLoggedIn, setShowUserLogin } = useAppContext();
    const [lastOrders, setLastOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedItem, setSelectedItem] = useState('');
    const [issueType, setIssueType] = useState('');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState([]); // File objects
    const [previews, setPreviews] = useState([]); // Preview URLs
    const [myComplaints, setMyComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('new'); // 'new', 'active', 'resolved'
    const [viewingImages, setViewingImages] = useState(null);
    const [alertConfig, setAlertConfig] = useState(null); // { message, type }

    useEffect(() => {
        if (isLoggedIn && user) {
            fetchUserOrders();
            fetchUserComplaints();
        } else if (!isLoggedIn) {
            setShowUserLogin(true);
        }
    }, [isLoggedIn, user]);

    const fetchUserOrders = async () => {
        try {
            const userId = user._id || user.id;
            const response = await axios.get(`${API_URL}/api/orders/user/${userId}`);
            if (response.data.success) {
                // Get last 5 orders
                setLastOrders(response.data.orders.slice(0, 5));
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchUserComplaints = async () => {
        try {
            setLoading(true);
            const userId = user._id || user.id;
            const response = await axios.get(`${API_URL}/api/complaints/user/${userId}`);
            if (response.data.success) {
                setMyComplaints(response.data.complaints);
            }
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        if (photos.length + files.length > 2) {
            setAlertConfig({ message: 'Only 2 photos are required for reporting.', type: 'error' });
            return;
        }

        const newPhotos = [...photos];
        const newPreviews = [...previews];

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                setAlertConfig({ message: `${file.name} is too large. Maximum size is 5MB.`, type: 'error' });
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                setAlertConfig({ message: `${file.name} is not a valid format. Please use JPG or PNG.`, type: 'error' });
                return;
            }
            newPhotos.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        setPhotos(newPhotos);
        setPreviews(newPreviews);
    };

    const removePhoto = (index) => {
        const newPhotos = [...photos];
        const newPreviews = [...previews];
        newPhotos.splice(index, 1);
        newPreviews.splice(index, 1);
        setPhotos(newPhotos);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOrder) return setAlertConfig({ message: 'Please select an order to proceed.', type: 'error' });
        if (!selectedItem) return setAlertConfig({ message: 'Please select an item from your order.', type: 'error' });
        if (!issueType) return setAlertConfig({ message: 'Please select the type of issue you are facing.', type: 'error' });
        if (description.length < 20) return setAlertConfig({ message: 'Please provide more detail (minimum 20 characters).', type: 'error' });
        if (photos.length !== 2) return setAlertConfig({ message: 'Exactly 2 photos are required for validation.', type: 'error' });

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('userId', user._id || user.id);
        formData.append('orderId', selectedOrder._id);
        formData.append('displayOrderId', selectedOrder._id.slice(-6).toUpperCase());
        formData.append('itemName', selectedItem);
        formData.append('issueType', issueType);
        formData.append('description', description);
        photos.forEach(photo => formData.append('photos', photo));

        try {
            const response = await axios.post(`${API_URL}/api/complaints`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                toast.success('Complaint submitted successfully');
                resetForm();
                fetchUserComplaints();
                setActiveTab('active');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error submitting complaint');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedOrder(null);
        setSelectedItem('');
        setIssueType('');
        setDescription('');
        setPhotos([]);
        setPreviews([]);
    };

    const activeComplaints = (myComplaints || []).filter(c => c.status !== 'Resolved');
    const resolvedComplaints = (myComplaints || []).filter(c => c.status === 'Resolved');

    const StatusBadge = ({ status }) => {
        const styles = {
            'Pending': 'bg-amber-100 text-amber-700',
            'Investigating': 'bg-blue-100 text-blue-700',
            'Resolved': 'bg-emerald-100 text-emerald-700'
        };
        const icons = {
            'Pending': <FiClock className="mr-1" />,
            'Investigating': <FiLoader className="mr-1 animate-spin" />,
            'Resolved': <FiCheckCircle className="mr-1" />
        };
        const labels = {
            'Pending': '⏳ Submitted - We\'ll review soon',
            'Investigating': '🔄 Under Review - Our team is checking',
            'Resolved': '✅ Resolved'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
                {icons[status]} {labels[status]}
            </span>
        );
    };

    if (loading && myComplaints.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10b981]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
                        <p className="text-gray-600">Report an issue with your order or share your suggestions.</p>
                    </div>
                    <button
                        onClick={fetchUserComplaints}
                        disabled={loading}
                        className={`p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:text-[#10b981] hover:border-[#10b981] transition-all ${loading ? 'opacity-50' : ''}`}
                        title="Refresh"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                    </button>
                </div>
            </div>

            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
                {[
                    { id: 'new', label: 'New Report', icon: FiPlus },
                    { id: 'active', label: `Active (${activeComplaints.length})`, icon: FiAlertCircle },
                    { id: 'resolved', label: `Resolved (${resolvedComplaints.length})`, icon: FiCheckCircle }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id
                            ? 'bg-white text-[#10b981] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="text-lg" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'new' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Order</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#10b981] focus:border-transparent outline-none transition-all"
                                        value={selectedOrder?._id || ''}
                                        onChange={(e) => {
                                            const order = lastOrders.find(o => o._id === e.target.value);
                                            setSelectedOrder(order);
                                            setSelectedItem('');
                                        }}
                                        required
                                    >
                                        <option value="">Choose an order</option>
                                        {lastOrders.map(order => (
                                            <option key={order._id} value={order._id}>
                                                Order #{order._id.slice(-6).toUpperCase()} - {new Date(order.createdAt).toLocaleDateString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Item</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#10b981] focus:border-transparent outline-none transition-all"
                                        value={selectedItem}
                                        onChange={(e) => setSelectedItem(e.target.value)}
                                        required
                                        disabled={!selectedOrder}
                                    >
                                        <option value="">Choose an item</option>
                                        {selectedOrder?.items.map((item, idx) => (
                                            <option key={idx} value={item.name}>{item.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Type</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#10b981] focus:border-transparent outline-none transition-all"
                                        value={issueType}
                                        onChange={(e) => setIssueType(e.target.value)}
                                        required
                                    >
                                        <option value="">What's the problem?</option>
                                        {ISSUE_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload 2 Photos</label>
                                    <div className="flex gap-4">
                                        {previews.map((src, idx) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                                                <img src={src} alt="preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(idx)}
                                                    className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white"
                                                >
                                                    <FiX size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {photos.length < 2 && (
                                            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#10b981] hover:bg-emerald-50 transition-all text-gray-400 hover:text-[#10b981]">
                                                <FiCamera size={24} />
                                                <span className="text-[10px] mt-1 font-medium">Add Photo</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} multiple />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#10b981] focus:border-transparent outline-none transition-all min-h-[120px]"
                                    placeholder="Please describe the issue in detail (min 20 characters)..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                                <div className="mt-1 flex justify-between">
                                    <p className="text-xs text-gray-400">Be as specific as possible to help us resolve the issue faster.</p>
                                    <p className={`text-xs ${description.length < 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {description.length}/20 characters
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[#10b981] text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-[#059669] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FiLoader className="animate-spin" /> Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle /> Submit Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {(activeTab === 'active' || activeTab === 'resolved') && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {(activeTab === 'active' ? activeComplaints : resolvedComplaints).map((complaint) => (
                            <div
                                key={complaint._id}
                                className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#10b981] group-hover:scale-110 transition-transform">
                                            <FiFileText size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-xl text-gray-900">Order #{complaint.displayOrderId}</h3>
                                            <p className="text-sm font-medium text-gray-400 flex items-center gap-1">
                                                <FiClock size={14} /> Reported on {new Date(complaint.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <StatusBadge status={complaint.status} />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-50">
                                        <p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest mb-2 px-1">Item Details</p>
                                        <p className="text-base font-bold text-gray-900 leading-tight">{complaint.itemName}</p>
                                        <div className="mt-2 inline-flex border border-white/50 bg-white/40 px-3 py-1 rounded-full">
                                            <p className="text-xs font-bold text-[#10b981]">{complaint.issueType}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 px-1">Issue Description</p>
                                        <p className="text-sm text-gray-600 leading-relaxed font-medium line-clamp-3 italic">"{complaint.description}"</p>
                                    </div>
                                </div>

                                {complaint.adminNotes && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-gradient-to-r from-emerald-500 to-teal-600 p-[1px] rounded-2xl mb-6 shadow-md"
                                    >
                                        <div className="bg-white p-5 rounded-[15px]">
                                            <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest mb-2">
                                                <FiInfo size={18} />
                                                Support Response
                                            </div>
                                            <p className="text-sm text-gray-700 font-semibold leading-relaxed">{complaint.adminNotes}</p>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-1">
                                    <button
                                        onClick={() => setViewingImages(complaint.photos)}
                                        className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#10b981] text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-[#059669] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group/btn"
                                    >
                                        <FiImage className="group-hover/btn:rotate-12 transition-transform" />
                                        View Evidence Photos
                                    </button>

                                    <div className="flex flex-col items-end">
                                        {complaint.resolvedAt && (
                                            <p className="text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full">
                                                Resolved {new Date(complaint.resolvedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-gray-300 font-bold mt-1 uppercase tracking-tighter">Reference ID: {complaint._id}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(activeTab === 'active' ? activeComplaints : resolvedComplaints).length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed"
                            >
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FiClipboard className="text-gray-300 text-4xl" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Nothing found here</h3>
                                <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">
                                    {activeTab === 'active'
                                        ? "You don't have any active complaints or reports at the moment."
                                        : "Your resolved complaint history is currently empty."}
                                </p>
                                {activeTab === 'active' && (
                                    <button
                                        onClick={() => setActiveTab('new')}
                                        className="mt-8 bg-emerald-50 text-[#10b981] px-6 py-2.5 rounded-full font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
                                    >
                                        Submit New Report
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alert Modal */}
            <AnimatePresence>
                {alertConfig && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${alertConfig.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'
                                }`}>
                                <FiAlertCircle size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {alertConfig.type === 'error' ? 'Wait a moment' : 'Awesome!'}
                            </h3>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                {alertConfig.message}
                            </p>
                            <button
                                onClick={() => setAlertConfig(null)}
                                className={`w-full py-4 rounded-2xl font-bold transition-all ${alertConfig.type === 'error'
                                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100'
                                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-100'
                                    }`}
                            >
                                Got it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Modal */}
            <AnimatePresence>
                {viewingImages && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setViewingImages(null)}
                    >
                        <div className="relative max-w-4xl w-full grid grid-cols-2 gap-4" onClick={e => e.stopPropagation()}>
                            <button
                                className="absolute -top-12 right-0 text-white text-3xl hover:text-gray-300 transition-colors"
                                onClick={() => setViewingImages(null)}
                            >
                                <FiX />
                            </button>
                            {viewingImages.map((photo, idx) => (
                                <img
                                    key={idx}
                                    src={photo.startsWith('http') ? photo : `${API_URL}${photo}`}
                                    alt="complaint"
                                    className="w-full h-auto max-h-[70vh] object-contain rounded-xl shadow-2xl"
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Complaint;
