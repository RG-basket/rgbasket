import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminInputDark from './SharedDark/AdminInputDark';
import AdminTableDark from './SharedDark/AdminTableDark';
import AdminModalDark from './SharedDark/AdminModalDark';
import { tw } from '../../config/tokyoNightTheme';

const AdminCategoriesDark = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', emoji: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate emoji
        if (!formData.emoji.trim()) {
            toast.error('Please enter an emoji');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingCategory
                ? `${import.meta.env.VITE_API_URL}/api/categories/${editingCategory._id}`
                : `${import.meta.env.VITE_API_URL}/api/categories`;

            const method = editingCategory ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    emoji: formData.emoji.trim()
                })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(editingCategory ? 'Category updated' : 'Category created');
                fetchCategories();
                handleCloseModal();
            } else {
                toast.error(result.message || 'Failed to save category');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Error saving category');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('Category deleted');
                fetchCategories();
            } else {
                toast.error(result.message || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Error deleting category');
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, emoji: category.emoji });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', emoji: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', emoji: '' });
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        {
            key: 'emoji',
            label: 'Emoji',
            render: (emoji) => (
                <div className="flex items-center justify-center">
                    <span className="text-2xl">{emoji}</span>
                </div>
            )
        },
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (name) => (
                <span className={`font-medium ${tw.textPrimary}`}>{name}</span>
            )
        },
        {
            key: 'productCount',
            label: 'Products',
            render: (_, cat) => (
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-[#7aa2f7]/20 text-[#7aa2f7]`}>
                    {cat.productCount || 0} products
                </span>
            )
        },
        {
            key: 'createdAt',
            label: 'Created',
            render: (createdAt) => (
                <span className={tw.textSecondary}>
                    {new Date(createdAt).toLocaleDateString()}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, cat) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleOpenModal(cat)}
                        className={`p-1.5 rounded-lg hover:bg-[#7aa2f7]/10 text-[#7aa2f7] transition-colors`}
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(cat._id)}
                        className={`p-1.5 rounded-lg hover:bg-[#f7768e]/10 text-[#f7768e] transition-colors`}
                        disabled={cat.productCount > 0}
                        title={cat.productCount > 0 ? 'Cannot delete category with products' : 'Delete category'}
                    >
                        <Trash2 className={`w-4 h-4 ${cat.productCount > 0 ? 'opacity-50' : ''}`} />
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
                        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Categories</h1>
                        <p className={`text-sm ${tw.textSecondary}`}>Manage product categories with emojis</p>
                    </div>
                    <AdminButtonDark
                        variant="primary"
                        icon={Plus}
                        onClick={() => handleOpenModal()}
                    >
                        Add Category
                    </AdminButtonDark>
                </div>

                {/* Search */}
                <div className={`${tw.bgSecondary} p-4 rounded-xl border ${tw.borderPrimary}`}>
                    <div className="relative max-w-md">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary}`} />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                        />
                    </div>
                </div>

                {/* Table */}
                <AdminTableDark
                    columns={columns}
                    data={filteredCategories}
                    isLoading={loading}
                />

                {/* Modal */}
                <AdminModalDark
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={editingCategory ? 'Edit Category' : 'Add Category'}
                    footer={
                        <div className="flex justify-end gap-3">
                            <AdminButtonDark variant="ghost" onClick={handleCloseModal}>
                                Cancel
                            </AdminButtonDark>
                            <AdminButtonDark
                                variant="primary"
                                onClick={handleSubmit}
                                isLoading={saving}
                            >
                                {editingCategory ? 'Update' : 'Create'}
                            </AdminButtonDark>
                        </div>
                    }
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AdminInputDark
                            label="Category Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Fruits & Vegetables"
                            required
                        />
                        <AdminInputDark
                            label="Emoji"
                            value={formData.emoji}
                            onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                            placeholder="e.g., 🍎"
                            required
                            helperText="Enter a single emoji to represent this category"
                        />
                        {formData.emoji && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#7aa2f7]/10">
                                <span className="text-2xl">{formData.emoji}</span>
                                <span className={tw.textSecondary}>Preview</span>
                            </div>
                        )}
                    </form>
                </AdminModalDark>
            </div>
        </AdminLayoutDark>
    );
};

export default AdminCategoriesDark;