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
    const [formData, setFormData] = useState({ pincode: '', name: '', isActive: true });
    const [saving, setSaving] = useState(false);

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
                    isActive: formData.isActive
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
            setFormData({ pincode: area.pincode, name: area.name, isActive: area.isActive });
        } else {
            setEditingArea(null);
            setFormData({ pincode: '', name: '', isActive: true });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingArea(null);
        setFormData({ pincode: '', name: '', isActive: true });
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
            render: (_, area) => (
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
            )
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
                    <AdminButtonDark
                        variant="primary"
                        icon={Plus}
                        onClick={() => handleOpenModal()}
                    >
                        Add New Area
                    </AdminButtonDark>
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
