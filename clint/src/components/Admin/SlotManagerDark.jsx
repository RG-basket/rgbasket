import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Save, Calendar, Edit, X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminInputDark from './SharedDark/AdminInputDark';
import { tw } from '../../config/tokyoNightTheme';

const SlotManagerDark = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Form state for both add and edit
    const [formData, setFormData] = useState({
        name: '',
        startTime: '',
        endTime: '',
        capacity: 20,
        cutoffMinutes: 60,
        isActive: true
    });

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/slots`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSlots(data || []);
            } else {
                throw new Error('Failed to fetch slots');
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
            toast.error('Failed to load slots');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (slot) => {
        setEditingId(slot._id);
        setFormData({
            name: slot.name,
            startTime: slot.startTime,
            endTime: slot.endTime,
            capacity: slot.capacity,
            cutoffMinutes: slot.cutoffMinutes,
            isActive: slot.isActive
        });
        setShowAddForm(false);
    };

    const handleAdd = () => {
        setEditingId(null);
        setFormData({
            name: '',
            startTime: '',
            endTime: '',
            capacity: 50,
            cutoffMinutes: 60,
            isActive: true
        });
        setShowAddForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingId 
                ? `${import.meta.env.VITE_API_URL}/api/slots/${editingId}`
                : `${import.meta.env.VITE_API_URL}/api/slots`;
            
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success(editingId ? 'Slot updated successfully' : 'New slot created successfully');
                setEditingId(null);
                setShowAddForm(false);
                fetchSlots();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save slot');
            }
        } catch (error) {
            console.error('Error saving slot:', error);
            toast.error(error.message || 'Error saving slot');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this delivery slot? This cannot be undone.')) return;
        
        setDeletingId(id);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/slots/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Slot deleted successfully');
                fetchSlots();
            } else {
                throw new Error('Failed to delete slot');
            }
        } catch (error) {
            console.error('Error deleting slot:', error);
            toast.error('Error deleting slot');
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Delivery Slots</h1>
                        <p className={`text-sm ${tw.textSecondary}`}>Configure delivery windows and capacity limits</p>
                    </div>
                    {!showAddForm && !editingId && (
                        <AdminButtonDark 
                            icon={Plus} 
                            onClick={handleAdd}
                            variant="primary"
                        >
                            Add New Slot
                        </AdminButtonDark>
                    )}
                </div>

                {/* Add/Edit Form */}
                {(showAddForm || editingId) && (
                    <div className={`${tw.bgSecondary} rounded-2xl border ${tw.borderPrimary} overflow-hidden shadow-2xl animate-in slide-in-from-top duration-300`}>
                        <div className="px-6 py-4 border-b border-[#3b4261] bg-[#1a1b26] flex items-center justify-between">
                            <h3 className="font-bold text-[#7aa2f7] flex items-center gap-2">
                                {editingId ? <Edit size={18}/> : <Plus size={18}/>}
                                {editingId ? 'Edit Delivery Slot' : 'Create New Delivery Slot'}
                            </h3>
                            <button 
                                onClick={() => { setShowAddForm(false); setEditingId(null); }}
                                className="p-1 hover:bg-[#3b4261] rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Slot Name</label>
                                    <AdminInputDark
                                        placeholder="e.g. Early Morning"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Start Time</label>
                                    <AdminInputDark
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">End Time</label>
                                    <AdminInputDark
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Max Orders (Capacity)</label>
                                    <AdminInputDark
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Cutoff Window (Minutes)</label>
                                    <AdminInputDark
                                        type="number"
                                        value={formData.cutoffMinutes}
                                        onChange={(e) => setFormData({...formData, cutoffMinutes: parseInt(e.target.value)})}
                                        min="0"
                                        required
                                    />
                                    <p className="text-[10px] text-gray-500 italic">Mins before start time window closes</p>
                                </div>
                                <div className="flex items-end pb-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div 
                                            onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                            className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? 'bg-[#73daca]' : 'bg-gray-600'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isActive ? 'left-7' : 'left-1'}`} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-300">Slot Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-[#3b4261] flex justify-end gap-3">
                                <AdminButtonDark 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={() => { setShowAddForm(false); setEditingId(null); }}
                                >
                                    Cancel
                                </AdminButtonDark>
                                <AdminButtonDark 
                                    type="submit" 
                                    variant="primary" 
                                    isLoading={saving}
                                    icon={Save}
                                >
                                    {editingId ? 'Update Slot' : 'Create Slot'}
                                </AdminButtonDark>
                            </div>
                        </form>
                    </div>
                )}

                {/* Slots Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {slots.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-[#1a1b26] rounded-3xl border-2 border-dashed border-[#3b4261]">
                            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-30" />
                            <h3 className="text-xl font-bold text-gray-400">No Slots Configured</h3>
                            <button onClick={handleAdd} className="mt-4 text-[#7aa2f7] hover:underline">Add your first delivery slot</button>
                        </div>
                    ) : (
                        slots.map((slot) => (
                            <div 
                                key={slot._id} 
                                className={`${tw.bgSecondary} rounded-2xl border ${tw.borderPrimary} p-5 hover:border-[#7aa2f7]/50 transition-all group relative overflow-hidden`}
                            >
                                {!slot.isActive && (
                                    <div className="absolute top-0 right-0 p-1.5 bg-[#f7768e] text-[#1a1b26] text-[10px] font-bold rounded-bl-lg">
                                        INACTIVE
                                    </div>
                                )}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-[#1a1b26] p-3 rounded-xl border border-[#3b4261] group-hover:border-[#7aa2f7]/30 transition-colors">
                                        <Clock className="w-6 h-6 text-[#7aa2f7]" />
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleEdit(slot)}
                                            className="p-2 hover:bg-[#3b4261] rounded-lg text-gray-400 hover:text-[#7aa2f7] transition-all"
                                            title="Edit Slot"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(slot._id)}
                                            className="p-2 hover:bg-[#f7768e20] rounded-lg text-gray-400 hover:text-[#f7768e] transition-all"
                                            title="Delete Slot"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg text-white group-hover:text-[#7aa2f7] transition-colors">{slot.name}</h3>
                                    <div className="flex items-center gap-2 text-[#a9b1d6] text-sm">
                                        <Calendar size={14} />
                                        <span>Daily • {slot.startTime} - {slot.endTime}</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-5 border-t border-[#3b4261] grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Capacity</p>
                                        <p className="font-bold text-[#c0caf5]">{slot.capacity} orders</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Cutoff</p>
                                        <p className="font-bold text-[#c0caf5]">{slot.cutoffMinutes} min</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Tip */}
                <div className="bg-[#1e2030] p-6 rounded-3xl border border-[#3b4261] flex gap-4 items-start">
                    <div className="bg-[#7aa2f7]/10 p-2 rounded-lg">
                        <Check size={20} className="text-[#7aa2f7]" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-1">Pro Tip</h4>
                        <p className="text-sm text-gray-400">
                            The cutoff window prevents last-minute orders. For example, a 30-minute cutoff for a 7:00 AM slot means users can't book that slot after 6:30 AM.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayoutDark>
    );
};

export default SlotManagerDark;