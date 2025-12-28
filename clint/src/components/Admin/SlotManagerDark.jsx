import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Save, Calendar, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminInputDark from './SharedDark/AdminInputDark';
import { tw } from '../../config/tokyoNightTheme';

const SlotManagerDark = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ capacity: 20, cutoffHours: 0.0833 }); // 5 minutes

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
        setEditForm({
            capacity: slot.capacity,
            cutoffHours: slot.cutoffHours,
            isActive: slot.isActive
        });
    };

    const handleSave = async (slotId) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/slots/${slotId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                toast.success('Slot updated successfully');
                setEditingId(null);
                fetchSlots();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update slot');
            }
        } catch (error) {
            console.error('Error updating slot:', error);
            toast.error(error.message || 'Error updating slot');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({ capacity: 20, cutoffHours: 0.0833 }); // 5 minutes
    };

    const handleToggleActive = async (slotId, currentStatus) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/slots/${slotId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (response.ok) {
                toast.success(`Slot ${!currentStatus ? 'activated' : 'deactivated'}`);
                fetchSlots();
            } else {
                throw new Error('Failed to update slot status');
            }
        } catch (error) {
            console.error('Error updating slot status:', error);
            toast.error('Error updating slot status');
        }
    };

    if (loading) {
        return (
            <AdminLayoutDark>
                <div className="flex items-center justify-center h-64">
                    <div className={`text-lg ${tw.textSecondary}`}>Loading delivery slots...</div>
                </div>
            </AdminLayoutDark>
        );
    }

    return (
        <AdminLayoutDark>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Delivery Slot Configuration</h1>
                        <p className={`text-sm ${tw.textSecondary}`}>Manage delivery time slots and capacities</p>
                    </div>
                </div>

                {/* Slots Configuration */}
                <div className={`${tw.bgSecondary} rounded-xl border ${tw.borderPrimary} p-6`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
                            <Calendar className="w-5 h-5 text-[#7aa2f7]" />
                            Standard Daily Slots
                        </h2>
                    </div>

                    {slots.length === 0 ? (
                        <div className={`text-center py-12 ${tw.bgInput} rounded-xl border border-dashed ${tw.borderSecondary}`}>
                            <Clock className={`w-12 h-12 ${tw.textSecondary} mx-auto mb-3 opacity-50`} />
                            <p className={tw.textSecondary}>No slots configured</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className={`grid grid-cols-12 gap-4 px-4 py-3 ${tw.bgInput} rounded-lg border ${tw.borderPrimary} font-medium`}>
                                <div className="col-span-3">
                                    <span className={tw.textSecondary}>Slot Name & Time</span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className={tw.textSecondary}>Capacity</span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className={tw.textSecondary}>Cutoff (Hrs)</span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className={tw.textSecondary}>Status</span>
                                </div>
                                <div className="col-span-3 text-right">
                                    <span className={tw.textSecondary}>Actions</span>
                                </div>
                            </div>

                            {slots.map((slot) => (
                                <div key={slot._id} className={`grid grid-cols-12 gap-4 items-center p-4 rounded-xl ${tw.bgInput} border ${tw.borderPrimary} animate-in fade-in`}>
                                    {/* Slot Name & Time */}
                                    <div className="col-span-3">
                                        <div className="font-medium text-[#c0caf5]">{slot.name}</div>
                                        <div className="text-sm text-[#a9b1d6]">{slot.startTime} - {slot.endTime}</div>
                                    </div>

                                    {/* Capacity */}
                                    <div className="col-span-2">
                                        {editingId === slot._id ? (
                                            <AdminInputDark
                                                type="number"
                                                value={editForm.capacity}
                                                onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 0 })}
                                                min="1"
                                                className="text-center"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <span className="bg-[#7aa2f7] text-[#1a1b26] px-3 py-1 rounded-full text-sm font-semibold">
                                                    {slot.capacity}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Cutoff Hours */}
                                    <div className="col-span-2">
                                        {editingId === slot._id ? (
                                            <AdminInputDark
                                                type="number"
                                                value={editForm.cutoffHours}
                                                onChange={(e) => setEditForm({ ...editForm, cutoffHours: parseInt(e.target.value) || 0 })}
                                                min="0"
                                                step="0.5"
                                                className="text-center"
                                            />
                                        ) : (
                                            <div className="text-center text-[#c0caf5] font-medium">
                                                {slot.cutoffHours}h
                                            </div>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 text-center">
                                        <button
                                            onClick={() => handleToggleActive(slot._id, slot.isActive)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${slot.isActive
                                                    ? 'bg-[#73daca] text-[#1a1b26]'
                                                    : 'bg-[#f7768e] text-[#1a1b26]'
                                                }`}
                                        >
                                            {slot.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-3 flex justify-end gap-2">
                                        {editingId === slot._id ? (
                                            <div className="flex gap-2">
                                                <AdminButtonDark
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleSave(slot._id)}
                                                    isLoading={saving}
                                                >
                                                    Save
                                                </AdminButtonDark>
                                                <AdminButtonDark
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={handleCancelEdit}
                                                >
                                                    Cancel
                                                </AdminButtonDark>
                                            </div>
                                        ) : (
                                            <AdminButtonDark
                                                variant="secondary"
                                                size="sm"
                                                icon={Edit}
                                                onClick={() => handleEdit(slot)}
                                            >
                                                Edit
                                            </AdminButtonDark>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-[#1a1b26] rounded-lg border border-[#3b4261]">
                        <p className={`text-sm ${tw.textSecondary}`}>
                            💡 These settings apply to ALL days. Capacity determines how many orders can be taken per slot.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayoutDark>
    );
};

export default SlotManagerDark;