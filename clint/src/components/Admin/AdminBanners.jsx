import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    X, Save, Upload, Plus, Trash2, ArrowLeft, Image as ImageIcon,
    Settings, Eye, EyeOff, GripVertical, Link as LinkIcon,
    Clock, Type, FileText, MousePointer2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminInputDark from './SharedDark/AdminInputDark';
import { tw, tokyoNight } from '../../config/tokyoNightTheme';
import axios from 'axios';

const AdminBanners = () => {
    const navigate = useNavigate();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        linkUrl: '',
        altText: 'RG Basket Banner',
        duration: 5000,
        isActive: true,
        order: 0
    });

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/banners/admin/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setBanners(response.data.banners);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            toast.error('Failed to load banners');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (editingId) {
            // Single upload for edit
            const file = files[0];
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            // Batch upload or single upload for new
            if (files.length > 1) {
                setImages(files);
                setImagePreviews(files.map(file => URL.createObjectURL(file)));
            } else {
                const file = files[0];
                setImages([file]);
                setImagePreviews([URL.createObjectURL(file)]);
                // Also set single image for preview
                setImagePreview(URL.createObjectURL(file));
            }
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            linkUrl: '',
            altText: 'RG Basket Banner',
            duration: 5000,
            isActive: true,
            order: 0
        });
        setImage(null);
        setImagePreview(null);
        setImages([]);
        setImagePreviews([]);
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (banner) => {
        setFormData({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            linkUrl: banner.linkUrl || '',
            altText: banner.altText || 'RG Basket Banner',
            duration: banner.duration || 5000,
            isActive: banner.isActive,
            order: banner.order || 0
        });
        setImagePreview(banner.imageUrl);
        setEditingId(banner._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.delete(`${API_URL}/api/banners/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success('Banner deleted successfully');
                fetchBanners();
            }
        } catch (error) {
            toast.error('Failed to delete banner');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('adminToken');

            if (!editingId && images.length > 1) {
                // Batch Upload
                const formDataToSend = new FormData();
                images.forEach(img => {
                    formDataToSend.append('images', img);
                });

                const response = await axios.post(`${API_URL}/api/banners/batch`, formDataToSend, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (response.data.success) {
                    toast.success(`${images.length} banners created successfully`);
                    resetForm();
                    fetchBanners();
                }
            } else {
                // Single Upload (New or Edit)
                const data = new FormData();
                Object.keys(formData).forEach(key => {
                    data.append(key, formData[key]);
                });

                if (editingId) {
                    if (image) data.append('image', image);
                } else {
                    if (images.length > 0) data.append('image', images[0]);
                }

                const url = editingId
                    ? `${API_URL}/api/banners/${editingId}`
                    : `${API_URL}/api/banners`;

                const method = editingId ? 'put' : 'post';

                const response = await axios({
                    method,
                    url,
                    data,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (response.data.success) {
                    toast.success(`Banner ${editingId ? 'updated' : 'created'} successfully`);
                    resetForm();
                    fetchBanners();
                }
            }
        } catch (error) {
            console.error('Error saving banner:', error);
            toast.error(error.response?.data?.message || 'Failed to save banner');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (banner) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.put(`${API_URL}/api/banners/${banner._id}`,
                { isActive: !banner.isActive },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                toast.success('Status updated');
                fetchBanners();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const moveBanner = async (id, direction) => {
        const index = banners.findIndex(b => b._id === id);
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === banners.length - 1) return;

        const newBanners = [...banners];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newBanners[index], newBanners[swapIndex]] = [newBanners[swapIndex], newBanners[index]];

        try {
            const token = localStorage.getItem('adminToken');
            const bannerIds = newBanners.map(b => b._id);
            const response = await axios.patch(`${API_URL}/api/banners/reorder`,
                { bannerIds },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.data.success) {
                setBanners(newBanners);
            }
        } catch (error) {
            toast.error('Failed to reorder banners');
        }
    };

    return (
        <AdminLayoutDark>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Manage Banners</h1>
                        <p className={`text-sm ${tw.textSecondary}`}>Configure carousel slides for the main homepage banner</p>
                    </div>
                    {!showForm && (
                        <AdminButtonDark
                            variant="primary"
                            icon={Plus}
                            onClick={() => setShowForm(true)}
                        >
                            Add New Slide
                        </AdminButtonDark>
                    )}
                </div>

                {showForm ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={resetForm}
                                className={`p-2 rounded-lg ${tw.bgInput} ${tw.textSecondary} hover:text-[#c0caf5] transition-colors`}
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h2 className={`text-xl font-bold ${tw.textPrimary}`}>
                                {editingId ? 'Edit Slide' : 'Create New Slide'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Image Upload & Preview */}
                            <div className="space-y-6">
                                <div className={`${tw.bgSecondary} p-6 rounded-xl border ${tw.borderPrimary} space-y-4`}>
                                    <h3 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
                                        <ImageIcon className="w-5 h-5 text-[#e0af68]" /> Slide Image
                                    </h3>

                                    <div className={`border-2 border-dashed ${tw.borderPrimary} rounded-xl p-8 text-center hover:border-[#7aa2f7] transition-colors group relative overflow-hidden`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple={!editingId}
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="banner-upload"
                                        />
                                        <label htmlFor="banner-upload" className="cursor-pointer flex flex-col items-center">
                                            {editingId || images.length === 1 ? (
                                                <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden border border-[#414868]">
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Upload className="w-8 h-8 text-white" />
                                                    </div>
                                                </div>
                                            ) : images.length > 1 ? (
                                                <div className="grid grid-cols-3 gap-2 w-full">
                                                    {imagePreviews.map((prev, i) => (
                                                        <img key={i} src={prev} className="w-full aspect-square object-cover rounded border border-[#414868]" />
                                                    ))}
                                                    <div className="flex items-center justify-center bg-[#1a1b26] rounded border border-dashed border-[#414868]">
                                                        <Plus className="w-6 h-6 text-[#7aa2f7]" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className={`w-10 h-10 ${tw.textSecondary} mb-3 group-hover:text-[#7aa2f7] transition-colors`} />
                                                    <p className={`font-medium ${tw.textPrimary}`}>Click to upload image(s)</p>
                                                    <p className={`text-xs ${tw.textSecondary} mt-1`}>Recommended ratio 7:2 (e.g. 1400x400)</p>
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    {(!editingId && images.length > 1) && (
                                        <p className="text-xs text-amber-400 font-medium">Batch mode: These {images.length} images will be created as separate slides with default settings.</p>
                                    )}

                                    <AdminInputDark
                                        label="Alt Text"
                                        value={formData.altText}
                                        onChange={(e) => handleInputChange('altText', e.target.value)}
                                        placeholder="e.g. Winter Sale Banner"
                                    />
                                </div>
                            </div>

                            {/* Right Column: Content & Settings */}
                            <div className="space-y-6">
                                <div className={`${tw.bgSecondary} p-6 rounded-xl border ${tw.borderPrimary} space-y-4`}>
                                    <h3 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
                                        <Type className="w-5 h-5 text-[#7aa2f7]" /> Overlaid Content
                                    </h3>

                                    <AdminInputDark
                                        label="Main Heading"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="e.g. Fresh Groceries Delivered"
                                    />

                                    <AdminInputDark
                                        label="Sub-heading / Description"
                                        value={formData.subtitle}
                                        onChange={(e) => handleInputChange('subtitle', e.target.value)}
                                        placeholder="e.g. Get up to 50% off on all fruits"
                                    />

                                    <div className="grid grid-cols-1 gap-4">
                                        <AdminInputDark
                                            label="Redirect URL"
                                            value={formData.linkUrl}
                                            onChange={(e) => handleInputChange('linkUrl', e.target.value)}
                                            placeholder="/category/fruits"
                                        />
                                    </div>
                                </div>

                                <div className={`${tw.bgSecondary} p-6 rounded-xl border ${tw.borderPrimary} space-y-4`}>
                                    <h3 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
                                        <Clock className="w-5 h-5 text-[#bb9af7]" /> Carousel Behavior
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <AdminInputDark
                                            label="Display Duration (ms)"
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                                            placeholder="5000"
                                        />
                                        <div className="flex items-end pb-2.5">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isActive}
                                                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                                    className="rounded border-gray-600 bg-[#1a1b26] text-[#7aa2f7] focus:ring-[#7aa2f7]"
                                                />
                                                <span className={`text-sm ${tw.textPrimary}`}>Visible to users</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <AdminButtonDark variant="secondary" onClick={resetForm}>
                                        Cancel
                                    </AdminButtonDark>
                                    <AdminButtonDark
                                        variant="primary"
                                        icon={Save}
                                        onClick={handleSubmit}
                                        isLoading={loading}
                                    >
                                        {editingId ? 'Update Slide' : 'Create Slide'}
                                    </AdminButtonDark>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {loading && banners.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7aa2f7]"></div>
                            </div>
                        ) : banners.length === 0 ? (
                            <div className={`${tw.bgSecondary} p-20 rounded-xl border border-dashed ${tw.borderPrimary} text-center`}>
                                <ImageIcon className={`w-16 h-16 ${tw.textSecondary} mx-auto mb-4 opacity-20`} />
                                <h3 className={`text-xl font-bold ${tw.textPrimary}`}>No banners yet</h3>
                                <p className={`text-sm ${tw.textSecondary} mb-8`}>Add your first promotional slide to get started</p>
                                <AdminButtonDark variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
                                    Add New Slide
                                </AdminButtonDark>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {banners.map((banner, index) => (
                                    <motion.div
                                        key={banner._id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`${tw.bgSecondary} border ${tw.borderPrimary} rounded-xl overflow-hidden group hover:border-[#7aa2f7]/50 transition-all`}
                                    >
                                        <div className="flex flex-col md:flex-row items-center p-4 gap-6">
                                            {/* Reorder Buttons */}
                                            <div className="flex md:flex-col gap-2">
                                                <button
                                                    onClick={() => moveBanner(banner._id, 'up')}
                                                    disabled={index === 0}
                                                    className={`p-1 rounded bg-[#1a1b26] border border-[#414868] ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:border-[#7aa2f7] text-[#7aa2f7]'}`}
                                                >
                                                    <GripVertical className="rotate-0 md:rotate-0 w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => moveBanner(banner._id, 'down')}
                                                    disabled={index === banners.length - 1}
                                                    className={`p-1 rounded bg-[#1a1b26] border border-[#414868] ${index === banners.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:border-[#7aa2f7] text-[#7aa2f7]'}`}
                                                >
                                                    <GripVertical className="rotate-0 md:rotate-0 w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Thumbnail */}
                                            <div className="w-full md:w-64 aspect-[21/9] bg-[#1a1b26] rounded-lg overflow-hidden border border-[#414868]">
                                                <img src={banner.imageUrl} alt={banner.altText} className="w-full h-full object-cover" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className={`font-bold ${tw.textPrimary} truncate`}>
                                                        {banner.title || 'Untitled Slide'}
                                                    </h3>
                                                    {banner.isActive ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#9ece6a]/10 text-[#9ece6a] border border-[#9ece6a]/20">Active</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#f7768e]/10 text-[#f7768e] border border-[#f7768e]/20">Inactive</span>
                                                    )}
                                                </div>
                                                <p className={`text-xs ${tw.textSecondary} truncate mb-2`}>{banner.subtitle || 'No subtitle'}</p>
                                                <div className="flex flex-wrap gap-4 text-xs">
                                                    <div className={`flex items-center gap-1.5 ${tw.textSecondary}`}>
                                                        <LinkIcon className="w-3.5 h-3.5" /> {banner.linkUrl || 'No link'}
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${tw.textSecondary}`}>
                                                        <Clock className="w-3.5 h-3.5" /> {banner.duration}ms
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(banner)}
                                                    className={`p-2 rounded-lg ${tw.bgInput} ${tw.textSecondary} hover:text-[#7aa2f7] transition-all`}
                                                    title={banner.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {banner.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(banner)}
                                                    className={`p-2 rounded-lg ${tw.bgInput} ${tw.textSecondary} hover:text-[#7aa2f7] transition-all`}
                                                    title="Edit"
                                                >
                                                    <ImageIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(banner._id)}
                                                    className={`p-2 rounded-lg ${tw.bgInput} text-[#f7768e] hover:bg-[#f7768e]/10 transition-all`}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayoutDark>
    );
};

export default AdminBanners;
