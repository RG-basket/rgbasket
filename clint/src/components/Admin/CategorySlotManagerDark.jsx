import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Save, Plus, X, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminInputDark from './SharedDark/AdminInputDark';
import { tw } from '../../config/tokyoNightTheme';

const CategorySlotManagerDark = () => {
    const [categories, setCategories] = useState([]);
    const [slots, setSlots] = useState([]);
    const [restrictions, setRestrictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Form State
    const [selectedCategories, setSelectedCategories] = useState(['All']);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [date, setDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [reason, setReason] = useState('Unavailable');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            
            // 1. Fetch Categories
            const catRes = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let catData = [];
            if (catRes.ok) {
                const res = await catRes.json();
                catData = res.categories || [];
            }

            // 2. Fetch Slots
            const slotRes = await fetch(`${import.meta.env.VITE_API_URL}/api/slots`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let slotData = [];
            if (slotRes.ok) {
                const res = await slotRes.json();
                slotData = res || [];
            }

            // 3. Fetch Restrictions
            const restRes = await fetch(`${import.meta.env.VITE_API_URL}/api/category-slot-availability`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let restData = [];
            if (restRes.ok) {
                const res = await restRes.json();
                restData = res.restrictions || [];
            }

            setCategories(catData);
            setSlots(slotData);
            setRestrictions(restData);
        } catch (error) {
            console.error('Error fetching slot restrictions data:', error);
            toast.error('Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchRestrictions = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/category-slot-availability`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRestrictions(data.restrictions || []);
            }
        } catch (error) {
            console.error('Error fetching restrictions:', error);
        }
    };

    const handleCategoryToggle = (categoryName) => {
        if (categoryName === 'All') {
            setSelectedCategories(['All']);
            return;
        }

        let updated = selectedCategories.filter(c => c !== 'All');
        if (updated.includes(categoryName)) {
            updated = updated.filter(c => c !== categoryName);
        } else {
            updated.push(categoryName);
        }

        if (updated.length === 0) {
            setSelectedCategories(['All']);
        } else {
            setSelectedCategories(updated);
        }
    };

    const handleSlotToggle = (slotName) => {
        if (selectedSlots.includes(slotName)) {
            setSelectedSlots(selectedSlots.filter(s => s !== slotName));
        } else {
            setSelectedSlots([...selectedSlots, slotName]);
        }
    };

    const handleSelectAllSlots = () => {
        if (selectedSlots.length === slots.length) {
            setSelectedSlots([]);
        } else {
            setSelectedSlots(slots.map(s => s.name));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (selectedCategories.length === 0) {
            toast.error('Please select at least one category');
            return;
        }
        if (selectedSlots.length === 0) {
            toast.error('Please select at least one delivery slot to restrict');
            return;
        }
        if (!date) {
            toast.error('Please select a valid date');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/category-slot-availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    categories: selectedCategories,
                    date,
                    unavailableSlots: selectedSlots,
                    reason
                })
            });

            if (response.ok) {
                toast.success('Category restrictions applied successfully');
                setSelectedSlots([]);
                setReason('Unavailable');
                fetchRestrictions();
            } else {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to save restrictions');
            }
        } catch (error) {
            console.error('Error saving category restrictions:', error);
            toast.error(error.message || 'Error saving restrictions');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this restriction?')) return;
        
        setDeletingId(id);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/category-slot-availability/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Restriction removed successfully');
                fetchRestrictions();
            } else {
                throw new Error('Failed to delete restriction');
            }
        } catch (error) {
            console.error('Error deleting restriction:', error);
            toast.error('Error deleting restriction');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <AdminLayoutDark>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7aa2f7]"></div>
                </div>
            </AdminLayoutDark>
        );
    }

    return (
        <AdminLayoutDark>
            <div className="space-y-6 max-w-6xl mx-auto pb-10">
                {/* Header */}
                <div>
                    <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Category Slot Availability</h1>
                    <p className={`text-sm ${tw.textSecondary}`}>
                        Mark entire categories unavailable for specific slots on specific dates (e.g., Holi, Ramnavami)
                    </p>
                </div>

                {/* Form & Config Panel */}
                <div className={`${tw.bgSecondary} rounded-2xl border ${tw.borderPrimary} overflow-hidden shadow-2xl p-6`}>
                    <h3 className="text-lg font-bold text-[#7aa2f7] mb-6 flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Add Category Slot Restriction
                    </h3>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-400 flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-[#7aa2f7]" /> Date
                                </label>
                                <AdminInputDark
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Reason for Block */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-400">Reason / Notice</label>
                                <AdminInputDark
                                    placeholder="e.g. Ramnavami (Shop Closed), Holi"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Category Multiselect Pills */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-400 block">
                                Target Categories (Select multiple)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {/* All Category Pill */}
                                <button
                                    type="button"
                                    onClick={() => handleCategoryToggle('All')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        selectedCategories.includes('All')
                                            ? 'bg-gradient-to-r from-[#7aa2f7] to-[#bb9af7] text-[#1a1b26] border-transparent shadow-lg shadow-[#7aa2f7]/25'
                                            : 'bg-[#1f2335] text-gray-400 border-[#414868] hover:text-white hover:border-[#565f89]'
                                    }`}
                                >
                                    🌟 All Categories
                                </button>
                                
                                {categories.map((cat) => (
                                    <button
                                        key={cat._id}
                                        type="button"
                                        onClick={() => handleCategoryToggle(cat.name)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                            selectedCategories.includes(cat.name)
                                                ? 'bg-[#7aa2f7] text-[#1a1b26] border-transparent shadow-lg shadow-[#7aa2f7]/20'
                                                : 'bg-[#1f2335] text-gray-400 border-[#414868] hover:text-white hover:border-[#565f89]'
                                        }`}
                                    >
                                        <span>{cat.emoji}</span>
                                        <span>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Slots Checkbox Grid */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-[#3b4261] pb-2">
                                <label className="text-sm font-semibold text-gray-400">
                                    Select Slots to Restrict (Make Unavailable)
                                </label>
                                <button
                                    type="button"
                                    onClick={handleSelectAllSlots}
                                    className="text-xs font-bold text-[#7aa2f7] hover:underline flex items-center gap-1"
                                >
                                    {selectedSlots.length === slots.length ? 'Deselect All' : 'Select All Slots'}
                                </button>
                            </div>

                            {slots.length === 0 ? (
                                <p className="text-xs text-gray-500 italic py-4">No active delivery slots configured in system</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {slots.map((slot) => {
                                        const isSelected = selectedSlots.includes(slot.name);
                                        return (
                                            <div
                                                key={slot._id}
                                                onClick={() => handleSlotToggle(slot.name)}
                                                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                                                    isSelected
                                                        ? 'bg-[#f7768e]/10 border-[#f7768e] text-[#f7768e]'
                                                        : 'bg-[#1f2335] border-[#414868] text-gray-300 hover:border-[#565f89]'
                                                }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{slot.name}</span>
                                                    <span className="text-[10px] text-gray-500">{slot.startTime} - {slot.endTime}</span>
                                                </div>
                                                <div>
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5" />
                                                    ) : (
                                                        <Square className="w-5 h-5 opacity-40" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-[#3b4261] flex justify-end gap-3">
                            <AdminButtonDark
                                type="submit"
                                variant="primary"
                                isLoading={saving}
                                icon={Save}
                            >
                                Apply Restriction Rule
                            </AdminButtonDark>
                        </div>
                    </form>
                </div>

                {/* Restrictions Table Section */}
                <div className={`${tw.bgSecondary} rounded-2xl border ${tw.borderPrimary} overflow-hidden shadow-2xl`}>
                    <div className="px-6 py-4 border-b border-[#3b4261] bg-[#1a1b26]">
                        <h3 className="font-bold text-white">Active Restrictions</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#3b4261] text-xs font-bold text-gray-400 bg-[#1f2335]/50">
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Unavailable Slots</th>
                                    <th className="p-4">Reason</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restrictions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                                            No active date-specific category slot restrictions
                                        </td>
                                    </tr>
                                ) : (
                                    restrictions.map((res) => (
                                        <tr key={res._id} className="border-b border-[#3b4261]/40 hover:bg-[#1a1b26]/30 text-sm">
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                                    res.category === 'All'
                                                        ? 'bg-gradient-to-r from-[#7aa2f7]/20 to-[#bb9af7]/20 text-[#bb9af7]'
                                                        : 'bg-[#7aa2f7]/15 text-[#7aa2f7]'
                                                }`}>
                                                    {res.category === 'All' ? '🌟 All Categories' : res.category}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium text-white">{res.date}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1.5 max-w-md">
                                                    {res.unavailableSlots.map((slot, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-[#f7768e]/10 text-[#f7768e] text-[11px] font-semibold rounded-md border border-[#f7768e]/20">
                                                            {slot}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-400 italic text-xs">{res.reason}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(res._id)}
                                                    disabled={deletingId === res._id}
                                                    className="p-2 hover:bg-[#f7768e20] rounded-lg text-gray-400 hover:text-[#f7768e] transition-all disabled:opacity-40"
                                                    title="Delete Restriction"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayoutDark>
    );
};

export default CategorySlotManagerDark;
