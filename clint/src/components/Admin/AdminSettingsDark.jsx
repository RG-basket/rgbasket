import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, ShieldCheck, RefreshCw, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import { tw } from '../../config/tokyoNightTheme';

const AdminSettingsDark = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [surges, setSurges] = useState([]);
    
    // CRUD temporary states
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newIsActive, setNewIsActive] = useState(false);
    
    const [editSurgeId, setEditSurgeId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editAmount, setEditAmount] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingSurge, setSavingSurge] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            
            // Fetch Maintenance Mode
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/system-config/maintenance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setMaintenanceMode(!!data.maintenanceMode);
            } else {
                throw new Error('Failed to fetch settings');
            }

            // Fetch Surge Configurations
            const surgeResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/system-config/surge/admin`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (surgeResponse.ok) {
                const data = await surgeResponse.json();
                setSurges(data.surges || []);
            }

        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load system settings');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMaintenance = async () => {
        setSaving(true);
        const nextMode = !maintenanceMode;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/system-config/maintenance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ maintenanceMode: nextMode })
            });

            if (response.ok) {
                setMaintenanceMode(nextMode);
                toast.success(`Maintenance mode turned ${nextMode ? 'ON' : 'OFF'}`);
            } else {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update maintenance settings');
            }
        } catch (error) {
            console.error('Error setting maintenance mode:', error);
            toast.error(error.message || 'Error updating settings');
        } finally {
            setSaving(false);
        }
    };

    // Toggle surge isActive status
    const handleToggleSurge = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/system-config/surge/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success('Surge status updated!');
                setSurges(prev => prev.map(s => s._id === id ? data.surge : s));
            } else {
                throw new Error('Failed to toggle surge');
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Create a new surge
    const handleCreateSurge = async (e) => {
        e.preventDefault();
        if (!newName.trim() || newAmount === '') return;
        setSavingSurge(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/system-config/surge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newName.trim(),
                    amount: Number(newAmount),
                    isActive: newIsActive
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success('Surge charge created successfully!');
                setSurges(prev => [data.surge, ...prev]);
                setNewName('');
                setNewAmount('');
                setNewIsActive(false);
            } else {
                const err = await response.json();
                throw new Error(err.message || 'Failed to create surge');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingSurge(false);
        }
    };

    // Update an existing surge name/amount
    const handleUpdateSurge = async (e) => {
        e.preventDefault();
        if (!editName.trim() || editAmount === '') return;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/system-config/surge/${editSurgeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: editName.trim(),
                    amount: Number(editAmount)
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success('Surge charge updated successfully!');
                setSurges(prev => prev.map(s => s._id === editSurgeId ? data.surge : s));
                setEditSurgeId(null);
                setEditName('');
                setEditAmount('');
            } else {
                const err = await response.json();
                throw new Error(err.message || 'Failed to update surge');
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Delete a surge
    const handleDeleteSurge = async (id) => {
        if (!window.confirm('Are you sure you want to delete this surge charge?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/system-config/surge/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Surge charge deleted successfully');
                setSurges(prev => prev.filter(s => s._id !== id));
            } else {
                throw new Error('Failed to delete surge');
            }
        } catch (error) {
            toast.error(error.message);
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
            <div className="space-y-6 max-w-4xl mx-auto pb-10">
                {/* Header */}
                <div>
                    <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>System Settings</h1>
                    <p className={`text-sm ${tw.textSecondary}`}>Manage system-wide parameters and maintenance controls</p>
                </div>

                {/* Maintenance Mode Card */}
                <div className={`${tw.bgSecondary} rounded-2xl border ${tw.borderPrimary} overflow-hidden shadow-2xl p-6`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#3b4261] pb-6">
                        <div className="space-y-1 max-w-lg">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-[#bb9af7]" /> Maintenance Mode
                            </h3>
                            <p className="text-sm text-gray-400">
                                Instantly locks down all public facing features of the store for routine updates or emergency database maintenance.
                            </p>
                        </div>
                        
                        {/* Toggle Switch */}
                        <button
                            onClick={handleToggleMaintenance}
                            disabled={saving}
                            className={`flex-shrink-0 w-16 h-8 rounded-full transition-all relative ${
                                maintenanceMode ? 'bg-[#f7768e]' : 'bg-gray-600'
                            } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            aria-label="Toggle maintenance mode"
                        >
                            <div
                                className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all flex items-center justify-center ${
                                    maintenanceMode ? 'left-9' : 'left-1'
                                }`}
                            >
                                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-700" />}
                            </div>
                        </button>
                    </div>

                    {/* Status details & Warning alerts */}
                    <div className="mt-6 space-y-4">
                        {maintenanceMode ? (
                            <div className="bg-[#f7768e]/10 border border-[#f7768e]/30 rounded-xl p-4 flex gap-3.5 items-start">
                                <AlertTriangle className="w-5 h-5 text-[#f7768e] flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-gray-300">
                                    <p className="font-bold text-[#f7768e] mb-1">Maintenance Mode is ACTIVE</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-400">
                                        <li>Public site visitors and mobile application users will see the Maintenance overlay block.</li>
                                        <li>Active shopping carts will remain cached, but checkout processes are blocked.</li>
                                        <li>Admin dashboard paths (<code className="bg-[#1a1b26] px-1 py-0.5 rounded text-white">/admin/*</code>) remain operational.</li>
                                        <li>Delivery rider portals remain open to resolve ongoing dispatch orders.</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#9ece6a]/10 border border-[#9ece6a]/30 rounded-xl p-4 flex gap-3.5 items-start">
                                <ShieldCheck className="w-5 h-5 text-[#9ece6a] flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-gray-300">
                                    <p className="font-bold text-[#9ece6a] mb-1">System is LIVE</p>
                                    <p className="text-xs text-gray-400">
                                        All services, categories, and shopping aisles are fully accessible to customers. Live order booking processes are executing normally.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Informative advice */}
                        <div className="bg-[#1e2030] p-4 rounded-xl border border-[#3b4261] text-xs text-gray-400">
                            <strong>Note:</strong> Changes to maintenance mode sync instantly across active customer devices without requiring page updates, via automatic window-focus checks and background interval checks.
                        </div>
                    </div>
                </div>

                {/* Surge Surcharges Card */}
                <div className={`${tw.bgSecondary} rounded-2xl border ${tw.borderPrimary} overflow-hidden shadow-2xl p-6 space-y-6`}>
                    <div className="border-b border-[#3b4261] pb-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-[#ff9e64]" /> Surge Surcharges (Rain, Demand, Peak Hours)
                            </h3>
                            <p className="text-sm text-gray-400">
                                Create and configure multiple custom charges. Active ones will combine on customer checkouts automatically.
                            </p>
                        </div>
                    </div>

                    {/* Create New Surge Form */}
                    <div className={`p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26]/50`}>
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-[#ff9e64]" /> Create New Surge Charge
                        </h4>
                        <form onSubmit={handleCreateSurge} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Surge Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Rain Surge"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className={`w-full text-sm px-3 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff9e64] ${tw.textPrimary}`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    placeholder="e.g. 30"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                    className={`w-full text-sm px-3 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff9e64] ${tw.textPrimary}`}
                                />
                            </div>
                            <div className="flex items-center gap-2 h-[38px] px-1">
                                <input
                                    type="checkbox"
                                    id="newIsActive"
                                    checked={newIsActive}
                                    onChange={(e) => setNewIsActive(e.target.checked)}
                                    className="rounded border-[#3b4261] bg-[#1a1b26] text-[#ff9e64] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                />
                                <label htmlFor="newIsActive" className="text-xs font-semibold text-gray-300 cursor-pointer">
                                    Activate immediately
                                </label>
                            </div>
                            <AdminButtonDark type="submit" variant="primary" isLoading={savingSurge} className="w-full h-[38px] justify-center">
                                Add Surge Surcharge
                            </AdminButtonDark>
                        </form>
                    </div>

                    {/* Surge List Table */}
                    <div className={`rounded-xl border ${tw.borderPrimary} overflow-hidden bg-[#1a1b26]/30`}>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className={`${tw.bgInput} border-b ${tw.borderPrimary}`}>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Surge Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Amount (₹)</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400">Active Switch</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3b4261]">
                                {surges.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">
                                            No surge configurations created yet. Use the form above to add one.
                                        </td>
                                    </tr>
                                ) : (
                                    surges.map((surge) => (
                                        <tr key={surge._id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-sm text-white font-medium">
                                                {editSurgeId === surge._id ? (
                                                    <input
                                                        type="text"
                                                        required
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className={`w-full max-w-[200px] text-sm px-2 py-1 ${tw.bgInput} border ${tw.borderPrimary} rounded focus:outline-none ${tw.textPrimary}`}
                                                    />
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-gray-200">
                                                        ⚡ {surge.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#7dcfff] font-bold">
                                                {editSurgeId === surge._id ? (
                                                    <input
                                                        type="number"
                                                        required
                                                        min="0"
                                                        value={editAmount}
                                                        onChange={(e) => setEditAmount(e.target.value)}
                                                        className={`w-full max-w-[100px] text-sm px-2 py-1 ${tw.bgInput} border ${tw.borderPrimary} rounded focus:outline-none ${tw.textPrimary}`}
                                                    />
                                                ) : (
                                                    <span>₹{surge.amount}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    disabled={editSurgeId === surge._id}
                                                    onClick={() => handleToggleSurge(surge._id, surge.isActive)}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${
                                                        surge.isActive ? 'bg-[#ff9e64]' : 'bg-gray-600'
                                                    } cursor-pointer inline-block disabled:opacity-50`}
                                                >
                                                    <div
                                                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                                                            surge.isActive ? 'left-6.5' : 'left-0.5'
                                                        }`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {editSurgeId === surge._id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={handleUpdateSurge}
                                                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded font-bold"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditSurgeId(null)}
                                                            className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2.5 py-1 rounded font-bold"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-3 text-gray-400">
                                                        <button
                                                            onClick={() => {
                                                                setEditSurgeId(surge._id);
                                                                setEditName(surge.name);
                                                                setEditAmount(surge.amount);
                                                            }}
                                                            className="hover:text-white transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSurge(surge._id)}
                                                            className="hover:text-red-400 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
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

export default AdminSettingsDark;
