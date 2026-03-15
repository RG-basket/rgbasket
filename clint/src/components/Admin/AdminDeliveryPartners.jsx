import React, { useState, useEffect } from 'react';
import { Truck, Copy, CheckCircle, XCircle, Plus, Trash2, Check, UserCheck, Shield, Upload, CreditCard, Banknote, Calendar, Phone, Smartphone, MapPin, BadgeCheck, Activity, Award, Star, Info, ExternalLink, Package, ChevronDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayoutDark';

const AdminDeliveryPartners = () => {
    const [partners, setPartners] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        altPhone: '',
        vehiclePlateNumber: '',
        paymentPhone: '',
        upiId: '',
        bankDetails: {
            accountNumber: '',
            ifscCode: '',
            bankName: '',
            accountHolderName: ''
        },
        joinDate: new Date().toISOString().split('T')[0],
        loginPin: ''
    });
    const [files, setFiles] = useState({
        aadharCard: null,
        drivingLicense: null,
        vehicleRc: null
    });
    const [loading, setLoading] = useState(false);
    const [expandedRiders, setExpandedRiders] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPartners = partners.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery)
    );

    const toggleRiderExpand = (id) => {
        setExpandedRiders(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    useEffect(() => {
        fetchPartners();
        const interval = setInterval(fetchPartners, 30000); // Polling for live status
        return () => clearInterval(interval);
    }, []);

    const fetchPartners = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/admin`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setPartners(data.partners);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load delivery partners');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData({
                ...formData,
                [parent]: { ...formData[parent], [child]: value }
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const form = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'bankDetails') {
                form.append(key, JSON.stringify(formData[key]));
            } else {
                form.append(key, formData[key]);
            }
        });

        if (files.aadharCard) form.append('aadharCard', files.aadharCard);
        if (files.drivingLicense) form.append('drivingLicense', files.drivingLicense);
        if (files.vehicleRc) form.append('vehicleRc', files.vehicleRc);

        try {
            if (formData.loginPin.length < 4) {
                toast.error('PIN must be at least 4 digits');
                setLoading(false);
                return;
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/admin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: form
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Rider Enrolled Successfully');
                setPartners([data.partner, ...partners]);
                setShowForm(false);
                setFormData({
                    name: '', phone: '', altPhone: '', vehiclePlateNumber: '',
                    paymentPhone: '', upiId: '',
                    bankDetails: { accountNumber: '', ifscCode: '', bankName: '', accountHolderName: '' },
                    joinDate: new Date().toISOString().split('T')[0],
                    loginPin: ''
                });
                setFiles({ aadharCard: null, drivingLicense: null, vehicleRc: null });
            } else {
                toast.error(data.message || 'Error creating rider');
            }
        } catch (err) {
            toast.error('Network Error');
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this delivery partner?')) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/admin/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Rider Deleted');
                setPartners(partners.filter(p => p._id !== id));
            }
        } catch (err) {
            toast.error('Error deleting rider');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/admin/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            const data = await res.json();
            if (data.success) {
                setPartners(partners.map(p => p._id === id ? { ...p, isActive: !currentStatus } : p));
                toast.success(data.message || 'Status Updated');
            }
        } catch (err) {
            toast.error('Error updating status');
        }
    };

    const overrideCopyLink = (token) => {
        const link = `${window.location.origin}/rider/${token}`;
        navigator.clipboard.writeText(link);
        toast.success('Rider Portal Link Copied!');
    };

    return (
        <AdminLayout>
            <div className="p-4 sm:p-8 bg-[#0a0f18] min-h-screen text-slate-200 font-sans">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                                <Truck className="text-emerald-500 w-7 h-7" />
                            </div>
                            <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                Delivery Fleet
                            </h1>
                        </div>
                        <p className="text-slate-400 text-sm font-medium ml-12">
                            Manage and monitor your active delivery partners and logistics.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64 group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                                <Search size={18} />
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search riders..."
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700"
                            />
                        </div>

                        <div className="hidden lg:flex flex-col items-end mr-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Fleet</span>
                            <span className="text-xl font-black text-emerald-500">{partners.filter(p => p.isActive).length}/{partners.length}</span>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${showForm
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:-translate-y-0.5 shadow-emerald-900/20'
                                }`}
                        >
                            {showForm ? <XCircle size={20} /> : <Plus size={20} />}
                            {showForm ? 'Discard Form' : 'Enlist New Rider'}
                        </button>
                    </div>
                </div>

                {/* Enrollment Form */}
                {showForm && (
                    <div className="max-w-5xl mx-auto mb-12 animate-in fade-in slide-in-from-top-5 duration-500">
                        <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="p-8 md:p-10">
                                <div className="flex items-center gap-3 mb-10">
                                    <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
                                    <h2 className="text-2xl font-black text-slate-100 italic">Rider Onboarding Profile</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    {/* Section 1: Identity */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="bg-emerald-500/10 p-2 rounded-lg"><UserCheck size={18} className="text-emerald-500" /></div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500/80">Personal Identity</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="group">
                                                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block ml-1 transition-colors group-focus-within:text-emerald-500">Full Legal Name</label>
                                                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Sahil Sahoo" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-700" />
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block ml-1 transition-colors group-focus-within:text-emerald-500">Contact Number (Primary)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">+91</span>
                                                    <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="9876543210" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:border-emerald-500 outline-none transition-all" />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block ml-1">Alternative Contact</label>
                                                <input type="text" name="altPhone" value={formData.altPhone} onChange={handleInputChange} placeholder="Emergency number" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:border-emerald-500 outline-none transition-all" />
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block ml-1">Appointment Date</label>
                                                <input type="date" name="joinDate" value={formData.joinDate} onChange={handleInputChange} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:border-emerald-500 outline-none transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Logistics */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="bg-amber-500/10 p-2 rounded-lg"><Shield size={18} className="text-amber-500" /></div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500/80">Vehicle & Compliance</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="group">
                                                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block ml-1">Vehicle Plate Number</label>
                                                <input type="text" name="vehiclePlateNumber" value={formData.vehiclePlateNumber} onChange={handleInputChange} placeholder="OR 02 AB 1234" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:border-amber-500 outline-none transition-all uppercase placeholder:normal-case" />
                                            </div>

                                            <div className="space-y-3">
                                                <div className="p-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 hover:border-emerald-500/50 transition-colors cursor-pointer relative group">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-black text-emerald-500/80 uppercase">Aadhar Card Verification</span>
                                                        {files.aadharCard && <Check className="text-emerald-500 w-4 h-4" />}
                                                    </div>
                                                    <input type="file" name="aadharCard" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                                    <p className="text-[10px] text-slate-600 truncate">{files.aadharCard ? files.aadharCard.name : 'Select HD Capture...'}</p>
                                                </div>

                                                <div className="p-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 hover:border-amber-500/50 transition-colors cursor-pointer relative">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-black text-amber-500/80 uppercase">Driver License</span>
                                                        {files.drivingLicense && <Check className="text-amber-500 w-4 h-4" />}
                                                    </div>
                                                    <input type="file" name="drivingLicense" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                                    <p className="text-[10px] text-slate-600 truncate">{files.drivingLicense ? files.drivingLicense.name : 'Select HD Capture...'}</p>
                                                </div>

                                                <div className="p-3 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 hover:border-blue-500/50 transition-colors cursor-pointer relative">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-black text-blue-500/80 uppercase">Vehicle Registration (RC)</span>
                                                        {files.vehicleRc && <Check className="text-blue-500 w-4 h-4" />}
                                                    </div>
                                                    <input type="file" name="vehicleRc" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                                    <p className="text-[10px] text-slate-600 truncate">{files.vehicleRc ? files.vehicleRc.name : 'Select HD Capture...'}</p>
                                                </div>
                                            </div>

                                            <div className="group pt-2">
                                                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block ml-1">Portal Security PIN</label>
                                                <input required type="password" name="loginPin" maxLength="6" value={formData.loginPin} onChange={handleInputChange} placeholder="6-digit unique PIN" className="w-full bg-slate-950/80 border border-emerald-900/30 rounded-xl px-4 py-3.5 text-center text-xl font-black tracking-[0.8em] focus:border-emerald-500 outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-800" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Finance */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="bg-blue-500/10 p-2 rounded-lg"><CreditCard size={18} className="text-blue-500" /></div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-500/80">Payout Configuration</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="group">
                                                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block ml-1">Payment Linked Phone</label>
                                                <input type="text" name="paymentPhone" value={formData.paymentPhone} onChange={handleInputChange} placeholder="G-Pay / PhonePe number" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-all" />
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block ml-1">Registered UPI ID</label>
                                                <input type="text" name="upiId" value={formData.upiId} onChange={handleInputChange} placeholder="username@bank" className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-all" />
                                            </div>

                                            <div className="p-5 bg-slate-950/70 rounded-[1.5rem] border border-slate-800 space-y-4">
                                                <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
                                                    <Banknote size={14} className="text-blue-400" />
                                                    <span className="text-[10px] font-black uppercase text-slate-400">Direct Bank Settlement</span>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <input type="text" name="bankDetails.bankName" value={formData.bankDetails.bankName} onChange={handleInputChange} placeholder="Bank Name" className="w-full bg-transparent border-b border-slate-800 p-1 text-xs focus:border-blue-500 outline-none" />
                                                        <input type="text" name="bankDetails.accountNumber" value={formData.bankDetails.accountNumber} onChange={handleInputChange} placeholder="Account Number" className="w-full bg-transparent border-b border-slate-800 p-1 text-xs font-mono focus:border-blue-500 outline-none" />
                                                        <input type="text" name="bankDetails.ifscCode" value={formData.bankDetails.ifscCode} onChange={handleInputChange} placeholder="IFSC Code" className="w-full bg-transparent border-b border-slate-800 p-1 text-xs uppercase focus:border-blue-500 outline-none" />
                                                        <input type="text" name="bankDetails.accountHolderName" value={formData.bankDetails.accountHolderName} onChange={handleInputChange} placeholder="Full Holder Name" className="w-full bg-transparent border-b border-slate-800 p-1 text-xs focus:border-blue-500 outline-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Info size={14} />
                                    <p className="text-[10px] font-bold uppercase tracking-tighter">Authorized background check will be initiated after submission.</p>
                                </div>
                                <button type="submit" disabled={loading} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center gap-3 py-4 px-12 rounded-2xl transition-all shadow-xl shadow-emerald-900/10 active:scale-95 disabled:opacity-50">
                                    {loading ? (
                                        <>Updating Database...</>
                                    ) : (
                                        <>
                                            <BadgeCheck size={20} /> Deploy Delivery Partner
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Fleet Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {filteredPartners.map(partner => (
                        <div key={partner._id} className="group relative bg-[#0d131f] border border-slate-800/80 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-500/20 transition-all duration-500 flex flex-col md:flex-row">
                            {/* Live Badge Top Corner */}
                            <div className="absolute top-4 right-4 z-10">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${partner.isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                    <Activity size={10} className={partner.isActive ? 'animate-pulse' : ''} />
                                    {partner.isActive ? 'Active Duty' : 'Off-Duty'}
                                </div>
                            </div>

                            {/* Sidebar Indicator */}
                            <div className={`w-full md:w-3 min-h-[12px] md:h-auto ${partner.isActive ? 'bg-emerald-500' : 'bg-rose-500'} opacity-80`} />

                            <div className="flex-1 flex flex-col">
                                <div className="p-6 sm:p-8 flex-1">
                                    {/* Profile Header */}
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8 text-center sm:text-left relative">
                                        <button
                                            onClick={() => toggleRiderExpand(partner._id)}
                                            className="absolute -top-2 -left-2 z-20 bg-slate-800 text-slate-400 p-1.5 rounded-lg border border-slate-700 hover:text-emerald-500 transition-all shadow-lg"
                                        >
                                            <ChevronDown size={16} className={`transition-transform duration-500 ${expandedRiders[partner._id] ? 'rotate-180' : ''}`} />
                                        </button>
                                        <div className="relative group">
                                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black border-2 ${partner.isActive ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                                {partner.name.charAt(0)}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-[#0d131f] p-1.5 rounded-lg border border-slate-800 shadow-lg text-slate-400 group-hover:text-emerald-500 transition-colors cursor-pointer" onClick={() => overrideCopyLink(partner.portalToken)}>
                                                <Smartphone size={16} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black text-slate-100 group-hover:text-emerald-400 transition-colors leading-none">
                                                {partner.name}
                                            </h3>
                                            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                                                <a href={`tel:${partner.phone}`} className="text-sm font-bold text-slate-400 flex items-center gap-1.5 hover:text-emerald-500 transition-colors">
                                                    <Smartphone size={14} className="text-slate-600" /> +91 {partner.phone}
                                                </a>
                                                {partner.altPhone && (
                                                    <span className="text-[10px] font-black bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase">Alt: {partner.altPhone}</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] pt-1 flex items-center justify-center sm:justify-start gap-2">
                                                <Calendar size={12} /> Joined {new Date(partner.joinDate || partner.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Collapsible Details */}
                                    <div className={`transition-all duration-500 overflow-hidden ${expandedRiders[partner._id] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        {/* Intensive Data Sections */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                            {/* Performance Stats */}
                                            <div className="bg-slate-950/40 border border-slate-800/40 rounded-2xl p-5 hover:bg-slate-950/60 transition-colors">
                                                <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-2">
                                                    <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase">
                                                        <Award size={14} /> Performance Stats
                                                    </div>
                                                    <BadgeCheck size={12} className="text-emerald-500/50" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="text-center p-2 bg-slate-900/50 rounded-xl border border-slate-800/50">
                                                        <p className="text-[9px] font-black text-slate-500 uppercase leading-none mb-1">Delivered</p>
                                                        <p className="text-lg font-black text-emerald-500 leading-none">{partner.stats?.deliveredCount || 0}</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-slate-900/50 rounded-xl border border-slate-800/50">
                                                        <p className="text-[9px] font-black text-slate-500 uppercase leading-none mb-1">Earnings</p>
                                                        <p className="text-lg font-black text-slate-100 leading-none">₹{partner.stats?.totalEarnings?.toLocaleString() || 0}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 text-center">
                                                    <p className="text-[9px] font-black text-slate-600 uppercase">Active Orders: <span className="text-blue-400">{partner.stats?.activeOrdersCount || 0}</span></p>
                                                </div>
                                            </div>

                                            {/* Financial Info & Live Tracking */}
                                            <div className="bg-slate-950/40 border border-slate-800/40 rounded-2xl p-5 hover:bg-slate-950/60 transition-colors">
                                                <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-2">
                                                    <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase">
                                                        <Activity size={14} /> Live Status
                                                    </div>
                                                    {partner.liveLocation?.lastPing && (
                                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                                                            Last Ping: {new Date(partner.liveLocation.lastPing).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    {partner.liveLocation?.latitude ? (
                                                        <button
                                                            onClick={() => window.open(`https://www.google.com/maps?q=${partner.liveLocation.latitude},${partner.liveLocation.longitude}`, '_blank')}
                                                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                                                        >
                                                            <MapPin size={14} /> Track Rider Live
                                                        </button>
                                                    ) : (
                                                        <div className="text-center py-2 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                                                            <p className="text-[9px] font-black text-slate-600 uppercase">Location Hidden</p>
                                                        </div>
                                                    )}

                                                    <div className="pt-2 border-t border-slate-800/60">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-500 font-bold uppercase">UPI ID</span>
                                                            <span className="text-blue-400 font-black truncate max-w-[100px]">{partner.upiId || 'Not Set'}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] mt-1">
                                                            <span className="text-slate-500 font-bold uppercase">Bank</span>
                                                            <span className="text-slate-300 font-black truncate max-w-[100px]">{partner.bankDetails?.bankName || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Current Active Orders Detail */}
                                        {partner.currentOrders?.length > 0 && (
                                            <div className="mb-8 p-5 bg-blue-500/5 border border-blue-500/10 rounded-2x-[2.5rem] rounded-2xl">
                                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Package size={14} /> On-Going Deliveries ({partner.currentOrders.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {partner.currentOrders.map(order => (
                                                        <div key={order._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                                            <div>
                                                                <p className="text-xs font-black text-slate-200 leading-none mb-1">#{order._id.substring(order._id.length - 6)}</p>
                                                                <p className="text-[9px] text-slate-500 font-bold uppercase truncate max-w-[150px]">{order.shippingAddress?.locality || 'Guest'}</p>
                                                            </div>
                                                            <div className="flex items-center justify-between w-full sm:w-auto sm:text-right gap-3">
                                                                <p className="text-xs font-black text-emerald-400 leading-none">₹{order.totalAmount}</p>
                                                                <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter border border-blue-500/20">{order.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    </div>

                                    {/* Action Footbar */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800/60">
                                        <div className="px-5 py-2 flex flex-row sm:flex-col justify-between items-center sm:items-start border-b sm:border-b-0 sm:border-r border-slate-800/60 pb-2 sm:pb-0 sm:pr-4">
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Secure Entry</span>
                                            <span className="text-sm font-black text-emerald-500 font-mono tracking-widest">{partner.loginPin}</span>
                                        </div>
                                        <div className="flex flex-1 gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(partner._id, partner.isActive)}
                                                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border ${partner.isActive
                                                    ? 'border-rose-900/30 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10'
                                                    : 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10'
                                                    }`}
                                            >
                                                {partner.isActive ? 'Suspend Rider' : 'Activate Access'}
                                            </button>
                                            <button
                                                onClick={() => overrideCopyLink(partner.portalToken)}
                                                className="bg-slate-800 text-slate-300 p-3 rounded-xl hover:bg-slate-700 transition shadow-lg border border-slate-700 active:scale-90"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(partner._id)}
                                                className="bg-slate-800 text-rose-500/60 p-3 rounded-xl hover:bg-rose-950/30 hover:text-rose-500 transition shadow-lg border border-slate-700 active:scale-90"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {partners.length > 0 && filteredPartners.length === 0 && (
                        <div className="col-span-full py-24 bg-slate-900/40 rounded-[3rem] border border-slate-800/80 flex flex-col items-center justify-center">
                            <Search className="w-16 h-16 text-slate-700 mb-4" />
                            <h3 className="text-xl font-black text-slate-400 mb-2">No Matches Found</h3>
                            <p className="text-slate-600 text-sm font-bold uppercase tracking-widest">No riders found for "{searchQuery}"</p>
                        </div>
                    )}

                    {partners.length === 0 && (
                        <div className="col-span-full py-24 bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-800/80 flex flex-col items-center justify-center animate-pulse">
                            <div className="bg-slate-900 p-8 rounded-full border border-slate-800 mb-6 shadow-2xl">
                                <Truck className="w-16 h-16 text-slate-700" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-400 mb-2 italic">Fleet Empty</h3>
                            <p className="text-slate-600 text-sm font-bold uppercase tracking-[0.3em]">No delivery partners enlisted</p>
                            <button onClick={() => setShowForm(true)} className="mt-8 px-8 py-3 bg-emerald-600 rounded-xl text-white font-black hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">
                                Enroll First Partner
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDeliveryPartners;
