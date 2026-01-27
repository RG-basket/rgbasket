import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminInputDark from './SharedDark/AdminInputDark';
import AdminTableDark from './SharedDark/AdminTableDark';
import AdminModalDark from './SharedDark/AdminModalDark';
import { tw } from '../../config/tokyoNightTheme';

const AdminServiceAreasDark = () => {
    const [serviceAreas, setServiceAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [formData, setFormData] = useState({
        pincode: '',
        name: '',
        isActive: true,
        deliveryCharge: 0,
        minOrderForFreeDelivery: 0
    });
    const [saving, setSaving] = useState(false);
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [bulkEditData, setBulkEditData] = useState({});

    useEffect(() => {
        fetchServiceAreas();
    }, []);

    const fetchServiceAreas = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/service-areas/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setServiceAreas(data.serviceAreas || []);
            }
        } catch (error) {
            console.error('Error fetching service areas:', error);
            toast.error('Failed to load service areas');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!/^\d{6}$/.test(formData.pincode)) {
            toast.error('Pincode must be exactly 6 digits');
            return;
        }

        if (!formData.name.trim()) {
            toast.error('Please enter area name');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingArea
                ? `${import.meta.env.VITE_API_URL}/api/service-areas/${editingArea._id}`
                : `${import.meta.env.VITE_API_URL}/api/service-areas`;

            const method = editingArea ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    pincode: formData.pincode.trim(),
                    name: formData.name.trim(),
                    isActive: formData.isActive,
                    deliveryCharge: Number(formData.deliveryCharge),
                    minOrderForFreeDelivery: Number(formData.minOrderForFreeDelivery)
                })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(editingArea ? 'Service area updated' : 'Service area created');
                fetchServiceAreas();
                handleCloseModal();
            } else {
                toast.error(result.message || 'Failed to save service area');
            }
        } catch (error) {
            console.error('Error saving area:', error);
            toast.error('Error saving service area');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this service area?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/service-areas/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Service area deleted');
                fetchServiceAreas();
            } else {
                const result = await response.json();
                toast.error(result.message || 'Failed to delete service area');
            }
        } catch (error) {
            console.error('Error deleting area:', error);
            toast.error('Error deleting service area');
        }
    };

    const handleOpenModal = (area = null) => {
        if (area) {
            setEditingArea(area);
            setFormData({
                pincode: area.pincode,
                name: area.name,
                isActive: area.isActive,
                deliveryCharge: area.deliveryCharge || 0,
                minOrderForFreeDelivery: area.minOrderForFreeDelivery || 0
            });
        } else {
            setEditingArea(null);
            setFormData({
                pincode: '',
                name: '',
                isActive: true,
                deliveryCharge: 0,
                minOrderForFreeDelivery: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingArea(null);
        setFormData({
            pincode: '',
            name: '',
            isActive: true,
            deliveryCharge: 0,
            minOrderForFreeDelivery: 0
        });
    };

    const handleBulkEditToggle = () => {
        if (bulkEditMode) {
            // Exiting bulk edit mode
            setBulkEditData({});
        }
        setBulkEditMode(!bulkEditMode);
    };

    const handleBulkFieldChange = (areaId, field, value) => {
        setBulkEditData(prev => ({
            ...prev,
            [areaId]: {
                ...prev[areaId],
                [field]: value
            }
        }));
    };

    const handleBulkSave = async () => {
        const updates = Object.entries(bulkEditData).map(([id, changes]) => ({
            id,
            ...changes
        }));

        if (updates.length === 0) {
            toast.error('No changes to save');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/service-areas/bulk-update`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ updates })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`Updated ${updates.length} service area(s)`);
                fetchServiceAreas();
                setBulkEditMode(false);
                setBulkEditData({});
            } else {
                toast.error(result.message || 'Failed to save changes');
            }
        } catch (error) {
            console.error('Error saving bulk changes:', error);
            toast.error('Error saving changes');
        } finally {
            setSaving(false);
        }
    };

    const filteredAreas = serviceAreas.filter(area =>
        area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        area.pincode.includes(searchQuery)
    );

    const columns = [
        {
            key: 'pincode',
            label: 'Pincode',
            sortable: true,
            render: (pincode) => (
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#7aa2f7]/10 text-[#7aa2f7]">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <span className={`font-mono font-bold ${tw.textPrimary}`}>{pincode}</span>
                </div>
            )
        },
        {
            key: 'name',
            label: 'Area Name',
            sortable: true,
            render: (name) => (
                <span className={tw.textPrimary}>{name}</span>
            )
        },
        {
            key: 'deliveryCharge',
            label: 'Delivery Fee',
            sortable: true,
            render: (charge, area) => {
                if (bulkEditMode) {
                    const currentValue = bulkEditData[area._id]?.deliveryCharge ?? charge;
                    return (
                        <input
                            type="number"
                            value={currentValue}
                            onChange={(e) => handleBulkFieldChange(area._id, 'deliveryCharge', Number(e.target.value))}
                            className={`w-20 px-2 py-1 rounded border ${tw.borderPrimary} ${tw.bgInput} ${tw.textPrimary} font-medium focus:ring-1 focus:ring-[#7aa2f7] focus:border-[#7aa2f7]`}
                            min="0"
                        />
                    );
                }
                return <span className={`font-medium ${tw.textPrimary}`}>₹{charge || 0}</span>;
            }
        },
        {
            key: 'minOrderForFreeDelivery',
            label: 'Free Above',
            sortable: true,
            render: (min, area) => {
                if (bulkEditMode) {
                    const currentValue = bulkEditData[area._id]?.minOrderForFreeDelivery ?? min;
                    return (
                        <input
                            type="number"
                            value={currentValue}
                            onChange={(e) => handleBulkFieldChange(area._id, 'minOrderForFreeDelivery', Number(e.target.value))}
                            className={`w-20 px-2 py-1 rounded border ${tw.borderPrimary} ${tw.bgInput} ${tw.textPrimary} font-medium focus:ring-1 focus:ring-[#7aa2f7] focus:border-[#7aa2f7]`}
                            min="0"
                        />
                    );
                }
                return <span className={`font-medium ${tw.textPrimary}`}>₹{min || 0}</span>;
            }
        },
        {
            key: 'isActive',
            label: 'Status',
            render: (isActive) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-red-500/20 text-red-500'
                    }`}>
                    {isActive ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'updatedAt',
            label: 'Last Updated',
            render: (date) => (
                <span className={tw.textSecondary}>
                    {new Date(date).toLocaleDateString()}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, area) => {
                if (bulkEditMode) return null;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleOpenModal(area)}
                            className={`p-1.5 rounded-lg hover:bg-[#7aa2f7]/10 text-[#7aa2f7] transition-colors`}
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(area._id)}
                            className={`p-1.5 rounded-lg hover:bg-[#f7768e]/10 text-[#f7768e] transition-colors`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <AdminLayoutDark>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Service Areas</h1>
                        <p className={`text-sm ${tw.textSecondary}`}>Manage pincodes where delivery is available</p>
                    </div>
                    <div className="flex gap-2">
                        {bulkEditMode ? (
                            <>
                                <AdminButtonDark
                                    variant="success"
                                    onClick={handleBulkSave}
                                    disabled={saving || Object.keys(bulkEditData).length === 0}
                                >
                                    {saving ? 'Saving...' : `Save Changes (${Object.keys(bulkEditData).length})`}
                                </AdminButtonDark>
                                <AdminButtonDark
                                    variant="outline"
                                    onClick={handleBulkEditToggle}
                                    disabled={saving}
                                >
                                    Cancel
                                </AdminButtonDark>
                            </>
                        ) : (
                            <>
                                <AdminButtonDark
                                    variant="outline"
                                    onClick={handleBulkEditToggle}
                                >
                                    Bulk Edit
                                </AdminButtonDark>
                                <AdminButtonDark
                                    variant="primary"
                                    icon={Plus}
                                    onClick={() => handleOpenModal()}
                                >
                                    Add New Area
                                </AdminButtonDark>
                            </>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className={`${tw.bgSecondary} p-4 rounded-xl border ${tw.borderPrimary}`}>
                    <div className="relative max-w-md">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary}`} />
                        <input
                            type="text"
                            placeholder="Search area or pincode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                        />
                    </div>
                </div>

                {/* Table */}
                <AdminTableDark
                    columns={columns}
                    data={filteredAreas}
                    isLoading={loading}
                />

                {/* Modal */}
                <AdminModalDark
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={editingArea ? 'Edit Service Area' : 'Add New Service Area'}
                    footer={
                        <div className="flex justify-end gap-3">
                            <AdminButtonDark variant="ghost" onClick={handleCloseModal}>
                                Cancel
                            </AdminButtonDark>
                            <AdminButtonDark
                                variant="primary"
                                onClick={() => handleSubmit()}
                                isLoading={saving}
                            >
                                {editingArea ? 'Update Area' : 'Add Area'}
                            </AdminButtonDark>
                        </div>
                    }
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AdminInputDark
                            label="Pincode"
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                            placeholder="e.g., 751001"
                            maxLength={6}
                            required
                            helperText="Must be a valid 6-digit number"
                        />
                        <AdminInputDark
                            label="Area Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Saheed Nagar, Bhubaneswar"
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <AdminInputDark
                                label="Delivery Charge (₹)"
                                type="number"
                                value={formData.deliveryCharge}
                                onChange={(e) => setFormData({ ...formData, deliveryCharge: e.target.value })}
                                placeholder="e.g., 49"
                                required
                            />
                            <AdminInputDark
                                label="Free Delivery Above (₹)"
                                type="number"
                                value={formData.minOrderForFreeDelivery}
                                onChange={(e) => setFormData({ ...formData, minOrderForFreeDelivery: e.target.value })}
                                placeholder="e.g., 499"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1b26] border border-[#24283b]">
                            <label className="flex flex-1 items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-[#7aa2f7] focus:ring-[#7aa2f7]"
                                />
                                <span className={`text-sm ${tw.textPrimary}`}>Currently Serving (Active)</span>
                            </label>
                        </div>
                    </form>
                </AdminModalDark>
            </div>
        </AdminLayoutDark>
    );
};

export default AdminServiceAreasDark;
