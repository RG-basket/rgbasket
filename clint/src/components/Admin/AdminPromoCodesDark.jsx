import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayoutDark';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaTrash, FaToggleOn, FaToggleOff, FaMagic } from 'react-icons/fa';

const AdminPromoCodes = () => {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        percent: '',
        maxDiscountAmount: '',
        influencerRoute: '',
        influencerPercentage: ''
    });

    const fetchPromos = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/promo/admin/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPromos(data.data || []);
            }
        } catch (error) {
            toast.error('Failed to load promo codes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromos();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, code: result }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/promo/admin/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Promo Code Created!');
                fetchPromos();
                setFormData({
                    code: '', name: '', percent: '', maxDiscountAmount: '', influencerRoute: '', influencerPercentage: ''
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Error creating promo code');
        }
    };

    const toggleStatus = async (id) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${import.meta.env.VITE_API_URL}/api/promo/admin/toggle/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchPromos();
            toast.success('Status updated');
        } catch (error) {
            toast.error('Error updating status');
        }
    };

    const deletePromo = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${import.meta.env.VITE_API_URL}/api/promo/admin/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchPromos();
            toast.success('Promo code deleted');
        } catch (error) {
            toast.error('Error deleting promo code');
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <h1 className="text-3xl font-bold text-white mb-8">Promo Code Manager</h1>

                {/* Create Form */}
                <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700">
                    <h2 className="text-xl text-gray-200 mb-4 font-semibold">Create New Promo Code</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative">
                            <input
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="Code (e.g. SUMMER50)"
                                className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-green-500 outline-none uppercase"
                                required
                            />
                            <button type="button" onClick={generateCode} className="absolute right-2 top-3 text-gray-400 hover:text-green-400">
                                <FaMagic />
                            </button>
                        </div>
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Campaign Name" className="bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-green-500 outline-none" required />
                        <input name="percent" type="number" value={formData.percent} onChange={handleChange} placeholder="Discount %" className="bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-green-500 outline-none" required />
                        <input name="maxDiscountAmount" type="number" value={formData.maxDiscountAmount} onChange={handleChange} placeholder="Max Discount Amount (Optional)" className="bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-green-500 outline-none" />

                        {/* Influencer Section */}
                        <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4 mt-2">
                            <input name="influencerRoute" value={formData.influencerRoute} onChange={handleChange} placeholder="Influencer Route (e.g. ronaldo)" className="bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 outline-none" />
                            <input name="influencerPercentage" type="number" value={formData.influencerPercentage} onChange={handleChange} placeholder="Influencer Earnings %" className="bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 outline-none" />
                        </div>

                        <div className="md:col-span-2 lg:col-span-3">
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors">
                                Create Promo Code
                            </button>
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="p-4">Code</th>
                                    <th className="p-4">Discount</th>
                                    <th className="p-4">Usage</th>
                                    <th className="p-4">Influencer</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {promos.map(promo => (
                                    <tr key={promo._id} className="hover:bg-gray-750">
                                        <td className="p-4 font-mono font-bold text-white">{promo.code}</td>
                                        <td className="p-4">{promo.percent}% (Max ₹{promo.maxDiscountAmount || '∞'})</td>
                                        <td className="p-4">
                                            <span className="bg-gray-700 px-2 py-1 rounded text-xs">{promo.usageCount} uses</span>
                                            {promo.totalDiscountGiven > 0 && <div className="text-xs text-green-400 mt-1">₹{promo.totalDiscountGiven} given</div>}
                                        </td>
                                        <td className="p-4">
                                            {promo.influencerRoute ? (
                                                <div>
                                                    <span className="text-blue-400">/{promo.influencerRoute}</span>
                                                    <div className="text-xs text-gray-500">{promo.influencerPercentage}% comm.</div>
                                                    <div className="text-xs text-green-400">Earned: ₹{promo.influencerEarnings}</div>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4">
                                            <button onClick={() => toggleStatus(promo._id)} className={`${promo.isActive ? 'text-green-500' : 'text-gray-500'} text-xl`}>
                                                {promo.isActive ? <FaToggleOn /> : <FaToggleOff />}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => deletePromo(promo._id)} className="text-red-400 hover:text-red-300">
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {promos.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">No promo codes found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminPromoCodes;
