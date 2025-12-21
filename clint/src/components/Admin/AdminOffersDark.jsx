import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayoutDark';
import { toast } from 'react-hot-toast';

import { FaTrash, FaPlus, FaToggleOn, FaToggleOff, FaTimes } from 'react-icons/fa';

const AdminOffersDark = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        minOrderValue: '',
        options: [''],
        isActive: true
    });

    const fetchOffers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/offers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setOffers(data.offers || []);
            }
        } catch (error) {
            toast.error('Failed to load offers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const handleOptionChange = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const addOption = () => {
        setFormData({ ...formData, options: [...formData.options, ''] });
    };

    const removeOption = (index) => {
        if (formData.options.length === 1) return;
        const newOptions = formData.options.filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const filteredOptions = formData.options.filter(opt => opt.trim() !== '');
        if (filteredOptions.length === 0) {
            toast.error('At least one option is required');
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/offers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, options: filteredOptions })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Offer Created!');
                fetchOffers();
                setFormData({ minOrderValue: '', options: [''], isActive: true });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Error creating offer');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${import.meta.env.VITE_API_URL}/api/offers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            fetchOffers();
            toast.success('Status updated');
        } catch (error) {
            toast.error('Error updating status');
        }
    };

    const deleteOffer = async (id) => {
        if (!window.confirm('Are you sure you want to delete this offer?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${import.meta.env.VITE_API_URL}/api/offers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchOffers();
            toast.success('Offer deleted');
        } catch (error) {
            toast.error('Error deleting offer');
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Gift Choice Offers</h1>
                    <div className="text-sm text-gray-400">
                        Higher threshold offers will override lower ones
                    </div>
                </div>

                {/* Create Form */}
                <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700 shadow-lg">
                    <h2 className="text-xl text-gray-200 mb-6 font-semibold flex items-center gap-2">
                        <FaPlus className="text-green-500 text-sm" /> Create New Threshold Offer
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Minimum Order Value (₹)</label>
                                <input
                                    type="number"
                                    value={formData.minOrderValue}
                                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                                    placeholder="e.g. 1000"
                                    className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-green-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="flex items-end pb-3">
                                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-green-500 bg-gray-700"
                                    />
                                    Active Immediately
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Gift Options (Text only)</label>
                            <div className="space-y-3">
                                {formData.options.map((option, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            placeholder={`Option ${index + 1} (e.g. Free 1kg Onion)`}
                                            className="flex-1 bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-green-500 outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="p-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            title="Remove Option"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addOption}
                                    className="flex items-center gap-2 text-green-500 hover:text-green-400 text-sm font-medium transition-colors"
                                >
                                    <FaPlus className="text-xs" /> Add Another Option
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-700">
                            <button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-all shadow-lg shadow-green-900/20 active:scale-[0.98]"
                            >
                                Create Offer Threshold
                            </button>
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead className="bg-gray-900 text-gray-400 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="p-4">Min. Order Value</th>
                                    <th className="p-4">Gift Options</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {offers.map(offer => (
                                    <tr key={offer._id} className="hover:bg-gray-750 transition-colors">
                                        <td className="p-4">
                                            <span className="text-xl font-bold text-white">₹{offer.minOrderValue}+</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-2">
                                                {offer.options.map((opt, i) => (
                                                    <span key={i} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm border border-gray-600">
                                                        {opt}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => toggleStatus(offer._id, offer.isActive)}
                                                className={`flex items-center gap-2 ${offer.isActive ? 'text-green-500' : 'text-gray-500'} transition-colors`}
                                            >
                                                <span className="text-2xl">
                                                    {offer.isActive ? <FaToggleOn /> : <FaToggleOff />}
                                                </span>
                                                <span className="text-sm font-medium uppercase tracking-tighter">
                                                    {offer.isActive ? 'Active' : 'Disabled'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => deleteOffer(offer._id)}
                                                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {offers.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-gray-500 italic">
                                            No gift offers defined yet
                                        </td>
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

export default AdminOffersDark;
