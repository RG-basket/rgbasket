import React, { useState, useEffect } from 'react';
import {
    AlertCircle, CheckCircle, Clock, Trash2, MessageSquare,
    Search, Filter, ChevronDown, User, ShoppingBag, Eye, X, Loader2, RotateCcw
} from 'lucide-react';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import { tw } from '../../config/tokyoNightTheme';
import toast from 'react-hot-toast';
import axios from 'axios';

const AdminComplaintsDark = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');

    const API_URL = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/complaints/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setComplaints(res.data.complaints);
            }
        } catch (err) {
            toast.error('Failed to fetch complaints');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        setUpdatingId(id);
        try {
            const res = await axios.put(`${API_URL}/api/complaints/admin/${id}`,
                { status, adminNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                toast.success(`Status updated to ${status}`);
                fetchComplaints();
                if (selectedComplaint?._id === id) {
                    setSelectedComplaint(res.data.complaint);
                }
            }
        } catch (err) {
            toast.error('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this resolved complaint? This will also delete the associated photos.')) return;

        try {
            const res = await axios.delete(`${API_URL}/api/complaints/admin/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('Complaint deleted');
                fetchComplaints();
                if (selectedComplaint?._id === id) setSelectedComplaint(null);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete complaint');
        }
    };

    const filteredComplaints = complaints.filter(c => {
        const matchesFilter = filter === 'All' || c.status === filter;
        const matchesSearch =
            c.displayOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.issueType.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'text-[#ff9e64] bg-[#ff9e64]/10';
            case 'Investigating': return 'text-[#7aa2f7] bg-[#7aa2f7]/10';
            case 'Resolved': return 'text-[#9ece6a] bg-[#9ece6a]/10';
            default: return 'text-white bg-gray-500/10';
        }
    };

    return (
        <AdminLayoutDark>
            <div className="min-h-screen bg-[#1a1b26] p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-[#c0caf5]">Customer Complaints</h1>
                            <p className="text-sm text-[#9aa5ce]">View and manage reported issues</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <AdminButtonDark
                                variant="secondary"
                                icon={RotateCcw}
                                onClick={fetchComplaints}
                                isLoading={loading}
                            >
                                Refresh
                            </AdminButtonDark>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#565f89]" />
                                <input
                                    type="text"
                                    placeholder="Search complaints..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-[#1f2335] border border-[#414868] text-[#c0caf5] pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] w-64"
                                />
                            </div>
                            <div className="relative group">
                                <AdminButtonDark variant="secondary" icon={Filter}>
                                    {filter}
                                </AdminButtonDark>
                                <div className="absolute right-0 mt-2 w-48 bg-[#24283b] border border-[#565f89] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                    {['All', 'Pending', 'Investigating', 'Resolved'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className="w-full text-left px-4 py-2.5 text-sm text-[#9aa5ce] hover:bg-[#414868] hover:text-[#c0caf5] first:rounded-t-xl last:rounded-b-xl transition-colors"
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-[#24283b] border border-[#414868] rounded-xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#1f2335] border-b border-[#414868]">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-[#565f89] uppercase tracking-wider">Order</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#565f89] uppercase tracking-wider">Item & Issue</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#565f89] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#565f89] uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#565f89] uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#414868]">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-[#7aa2f7] mx-auto" />
                                            </td>
                                        </tr>
                                    ) : filteredComplaints.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-[#565f89]">No complaints found</td>
                                        </tr>
                                    ) : filteredComplaints.map(c => (
                                        <tr key={c._id} className="hover:bg-[#414868]/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#7aa2f7]/10 rounded-lg flex items-center justify-center text-[#7aa2f7]">
                                                        <ShoppingBag className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#c0caf5]">#{c.displayOrderId}</p>
                                                        <p className="text-xs text-[#565f89]">Order Details</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-[#c0caf5]">{c.itemName}</p>
                                                <p className="text-xs text-[#bb9af7]">{c.issueType}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(c.status)}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#9aa5ce]">
                                                {new Date(c.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <AdminButtonDark
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={Eye}
                                                    onClick={() => {
                                                        setSelectedComplaint(c);
                                                        setAdminNotes(c.adminNotes || '');
                                                    }}
                                                >
                                                    View
                                                </AdminButtonDark>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1a1b26]/80 backdrop-blur-sm" onClick={() => setSelectedComplaint(null)} />
                    <div className="relative bg-[#24283b] border border-[#565f89] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-[#414868] flex items-center justify-between bg-[#1f2335]">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#7aa2f7]/10 rounded-xl flex items-center justify-center text-[#7aa2f7]">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[#c0caf5]">Complaint #{selectedComplaint.displayOrderId}</h2>
                                    <p className="text-sm text-[#565f89]">Reported on {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedComplaint(null)}
                                className="p-2 hover:bg-[#414868] rounded-full text-[#565f89] hover:text-[#c0caf5] transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Info */}
                                <div className="space-y-6">
                                    <section>
                                        <label className="text-xs font-bold text-[#565f89] uppercase tracking-widest block mb-3">Customer Details</label>
                                        <div className="bg-[#1f2335] p-4 rounded-xl space-y-2">
                                            <p className="text-[#c0caf5] flex items-center gap-2 font-medium">
                                                <User className="w-4 h-4 text-[#7aa2f7]" /> {selectedComplaint.orderId?.userInfo?.name || 'Loading...'}
                                            </p>
                                            <p className="text-[#9aa5ce] text-sm flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4" /> {selectedComplaint.orderId?.userInfo?.phone || 'N/A'}
                                            </p>
                                        </div>
                                    </section>

                                    <section>
                                        <label className="text-xs font-bold text-[#565f89] uppercase tracking-widest block mb-3">Item Details</label>
                                        <div className="bg-[#1f2335] p-4 rounded-xl">
                                            <p className="text-[#c0caf5] font-bold">{selectedComplaint.itemName}</p>
                                            <p className="text-[#bb9af7] text-sm font-medium">{selectedComplaint.issueType}</p>
                                        </div>
                                    </section>

                                    <section>
                                        <label className="text-xs font-bold text-[#565f89] uppercase tracking-widest block mb-3">Description</label>
                                        <div className="bg-[#1f2335] p-4 rounded-xl text-[#9aa5ce] text-sm leading-relaxed whitespace-pre-wrap ring-1 ring-[#414868]">
                                            {selectedComplaint.description}
                                        </div>
                                    </section>
                                </div>

                                {/* Photos */}
                                <section>
                                    <label className="text-xs font-bold text-[#565f89] uppercase tracking-widest block mb-3">Evidence Photos</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedComplaint.photos.map((p, idx) => (
                                            <a
                                                key={idx}
                                                href={p.startsWith('http') ? p : `${API_URL}${p}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="relative group aspect-square rounded-xl overflow-hidden border border-[#414868]"
                                            >
                                                <img src={p.startsWith('http') ? p : `${API_URL}${p}`} alt="evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="text-white text-xs font-bold flex items-center gap-1"><Eye className="w-3 h-3" /> Full Size</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Admin Actions */}
                            <div className="bg-[#1f2335] p-6 rounded-2xl border border-[#414868] space-y-4">
                                <h3 className="text-[#c0caf5] font-bold flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-[#7aa2f7]" /> Admin Response & Action
                                </h3>

                                <div>
                                    <label className="text-xs text-[#565f89] block mb-2 font-bold uppercase">Internal Notes / Response to Customer</label>
                                    <textarea
                                        className="w-full bg-[#1a1b26] border border-[#414868] rounded-xl p-4 text-[#c0caf5] focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] min-h-[100px]"
                                        placeholder="Enter resolution notes here..."
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                    <div className="flex items-center gap-2">
                                        {selectedComplaint.status === 'Pending' && (
                                            <AdminButtonDark
                                                variant="primary"
                                                icon={Clock}
                                                isLoading={updatingId === selectedComplaint._id}
                                                onClick={() => handleUpdateStatus(selectedComplaint._id, 'Investigating')}
                                            >
                                                Mark Investigating
                                            </AdminButtonDark>
                                        )}
                                        {selectedComplaint.status === 'Investigating' && (
                                            <AdminButtonDark
                                                variant="success"
                                                icon={CheckCircle}
                                                isLoading={updatingId === selectedComplaint._id}
                                                onClick={() => handleUpdateStatus(selectedComplaint._id, 'Resolved')}
                                            >
                                                Mark Resolved
                                            </AdminButtonDark>
                                        )}
                                        {selectedComplaint.status === 'Resolved' && (
                                            <>
                                                <AdminButtonDark
                                                    variant="secondary"
                                                    icon={MessageSquare}
                                                    isLoading={updatingId === selectedComplaint._id}
                                                    onClick={() => handleUpdateStatus(selectedComplaint._id, 'Resolved')}
                                                >
                                                    Update Notes
                                                </AdminButtonDark>
                                                <AdminButtonDark
                                                    variant="danger"
                                                    icon={Trash2}
                                                    onClick={() => handleDelete(selectedComplaint._id)}
                                                >
                                                    Delete Resolution
                                                </AdminButtonDark>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-xs text-[#565f89]">
                                        Current Status: <span className={getStatusColor(selectedComplaint.status).split(' ')[0]}>{selectedComplaint.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayoutDark>
    );
};

export default AdminComplaintsDark;
