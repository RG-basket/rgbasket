import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import { tw } from '../../config/tokyoNightTheme';

const AdminSettingsDark = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/system-config/maintenance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setMaintenanceMode(!!data.maintenanceMode);
            } else {
                throw new Error('Failed to fetch settings');
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
            </div>
        </AdminLayoutDark>
    );
};

export default AdminSettingsDark;
