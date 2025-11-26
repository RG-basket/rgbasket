import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Upload, Plus, Trash2, ArrowLeft, Package, DollarSign, Layers, Image as ImageIcon, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminInputDark from './SharedDark/AdminInputDark';
import { tw } from '../../config/tokyoNightTheme';

const ProductFormDark = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [slots, setSlots] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        description: [''],
        category: '',
        weights: [{ weight: '', price: '', offerPrice: '', unit: 'kg' }],
        stock: 0,
        lowStockThreshold: 10,
        featured: false,
        active: true,
        requiresSlotSelection: false,
        availableSlots: []
    });

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const units = ['kg', 'g', 'ml', 'l', 'piece', 'pack', 'dozen', 'bundle'];

    useEffect(() => {
        fetchCategories();
        fetchSlots();
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
            const data = await response.json();
            if (data.success) {
                setCategories(data.categories || data.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        }
    };

    const fetchSlots = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/slots`);
            const data = await response.json();
            setSlots(data.data || data || []);
        } catch (error) {
            console.error('Error fetching slots:', error);
        }
    };

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
            const data = await response.json();

            if (data.success) {
                const product = data.product;
                setFormData({
                    name: product.name,
                    description: product.description || [''],
                    category: product.category,
                    weights: product.weights || [{ weight: '', price: '', offerPrice: '', unit: 'kg' }],
                    stock: product.stock,
                    lowStockThreshold: product.lowStockThreshold || 10,
                    featured: product.featured,
                    active: product.active,
                    requiresSlotSelection: product.requiresSlotSelection || false,
                    availableSlots: product.availableSlots || []
                });
                setImagePreviews(product.images || []);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDescriptionChange = (index, value) => {
        const newDescription = [...formData.description];
        newDescription[index] = value;
        setFormData(prev => ({ ...prev, description: newDescription }));
    };

    const addDescription = () => {
        setFormData(prev => ({ ...prev, description: [...prev.description, ''] }));
    };

    const removeDescription = (index) => {
        if (formData.description.length > 1) {
            setFormData(prev => ({
                ...prev,
                description: prev.description.filter((_, i) => i !== index)
            }));
        }
    };

    const handleWeightChange = (index, field, value) => {
        const newWeights = [...formData.weights];
        newWeights[index] = {
            ...newWeights[index],
            [field]: field === 'price' || field === 'offerPrice' ? parseFloat(value) || 0 : value
        };
        setFormData(prev => ({ ...prev, weights: newWeights }));
    };

    const addWeight = () => {
        setFormData(prev => ({
            ...prev,
            weights: [...prev.weights, { weight: '', price: '', offerPrice: '', unit: 'kg' }]
        }));
    };

    const removeWeight = (index) => {
        if (formData.weights.length > 1) {
            setFormData(prev => ({
                ...prev,
                weights: prev.weights.filter((_, i) => i !== index)
            }));
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
        setImages(prev => [...prev, ...files]);
    };

    const removeImage = (index) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        const existingCount = imagePreviews.length - images.length;
        if (index >= existingCount) {
            const fileIndex = index - existingCount;
            setImages(prev => prev.filter((_, i) => i !== fileIndex));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                toast.error('Please login as admin first');
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', JSON.stringify(formData.description.filter(d => d.trim())));
            formDataToSend.append('category', formData.category);
            formDataToSend.append('weights', JSON.stringify(formData.weights));
            formDataToSend.append('stock', formData.stock);
            formDataToSend.append('lowStockThreshold', formData.lowStockThreshold);
            formDataToSend.append('featured', formData.featured);
            formDataToSend.append('active', formData.active);
            formDataToSend.append('requiresSlotSelection', formData.requiresSlotSelection);

            formData.availableSlots.forEach(slot => {
                formDataToSend.append('availableSlots', slot);
            });

            images.forEach(image => {
                formDataToSend.append('images', image);
            });

            const url = id
                ? `${import.meta.env.VITE_API_URL}/api/products/${id}`
                : `${import.meta.env.VITE_API_URL}/api/products`;

            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Product ${id ? 'updated' : 'created'} successfully!`);
                setTimeout(() => navigate('/admin/products'), 1000);
            } else {
                throw new Error(data.message || 'Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error(error.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayoutDark>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/products')}
                            className={`p-2 rounded-lg ${tw.bgInput} ${tw.textSecondary} hover:text-[#c0caf5] transition-colors`}
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>{id ? 'Edit Product' : 'New Product'}</h1>
                            <p className={`text-sm ${tw.textSecondary}`}>{id ? 'Update product details' : 'Add a new product to inventory'}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <AdminButtonDark variant="secondary" onClick={() => navigate('/admin/products')}>
                            Cancel
                        </AdminButtonDark>
                        <AdminButtonDark
                            variant="primary"
                            icon={Save}
                            onClick={handleSubmit}
                            isLoading={loading}
                        >
                            {id ? 'Update Product' : 'Create Product'}
                        </AdminButtonDark>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className={`${tw.bgSecondary} p-6 rounded-xl border ${tw.borderPrimary} space-y-6`}>
                        <h2 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
                            <Package className="w-5 h-5 text-[#7aa2f7]" /> Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AdminInputDark
                                label="Product Name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="e.g., Fresh Tomatoes"
                                required
                            />

                            <div>
                                <label className={`block text-sm font-medium ${tw.textSecondary} mb-1.5`}>Category</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => handleInputChange('category', e.target.value)}
                                    className={`w-full px-4 py-2.5 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${tw.textSecondary} mb-1.5`}>Description Points</label>
                            <div className="space-y-3">
                                {formData.description.map((desc, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={desc}
                                            onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                            className={`flex-1 px-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                            placeholder="Product feature or detail"
                                        />
                                        {formData.description.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeDescription(index)}
                                                className={`p-2 rounded-lg hover:bg-[#f7768e]/10 text-[#f7768e] transition-colors`}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addDescription} className="text-sm text-[#7aa2f7] font-medium flex items-center gap-1 hover:underline">
                                    <Plus className="w-4 h-4" /> Add Point
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Variants */}
                    <div className={`${tw.bgSecondary} p-6 rounded-xl border ${tw.borderPrimary} space-y-6`}>
                        <div className="flex justify-between items-center">
                            <h2 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
                                <DollarSign className="w-5 h-5 text-[#9ece6a]" /> Variants & Pricing
                            </h2>
                            <button type="button" onClick={addWeight} className="text-sm text-[#7aa2f7] font-medium flex items-center gap-1 hover:underline">
                                <Plus className="w-4 h-4" /> Add Variant
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.weights.map((weight, index) => (
                                <div key={index} className={`grid grid-cols-1 md:grid-cols-5 gap-4 p-4 ${tw.bgInput} rounded-lg border ${tw.borderPrimary}`}>
                                    <div>
                                        <label className={`block text-xs ${tw.textSecondary} mb-1`}>Weight/Size</label>
                                        <input
                                            type="text"
                                            value={weight.weight}
                                            onChange={(e) => handleWeightChange(index, 'weight', e.target.value)}
                                            className={`w-full px-3 py-2 ${tw.bgSecondary} border ${tw.borderPrimary} rounded-lg text-sm ${tw.textPrimary}`}
                                            placeholder="e.g., 1"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs ${tw.textSecondary} mb-1`}>Unit</label>
                                        <select
                                            value={weight.unit}
                                            onChange={(e) => handleWeightChange(index, 'unit', e.target.value)}
                                            className={`w-full px-3 py-2 ${tw.bgSecondary} border ${tw.borderPrimary} rounded-lg text-sm ${tw.textPrimary}`}
                                        >
                                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs ${tw.textSecondary} mb-1`}>Price (₹)</label>
                                        <input
                                            type="number"
                                            value={weight.price}
                                            onChange={(e) => handleWeightChange(index, 'price', e.target.value)}
                                            className={`w-full px-3 py-2 ${tw.bgSecondary} border ${tw.borderPrimary} rounded-lg text-sm ${tw.textPrimary}`}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs ${tw.textSecondary} mb-1`}>Offer Price (₹)</label>
                                        <input
                                            type="number"
                                            value={weight.offerPrice}
                                            onChange={(e) => handleWeightChange(index, 'offerPrice', e.target.value)}
                                            className={`w-full px-3 py-2 ${tw.bgSecondary} border ${tw.borderPrimary} rounded-lg text-sm ${tw.textPrimary}`}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="flex items-end justify-center">
                                        {formData.weights.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeWeight(index)}
                                                className={`p-2 rounded-lg hover:bg-[#f7768e]/10 text-[#f7768e] transition-colors`}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inventory & Settings */}
                    <div className={`${tw.bgSecondary} p-6 rounded-xl border ${tw.borderPrimary} space-y-6`}>
                        <h2 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
                            <Settings className="w-5 h-5 text-[#bb9af7]" /> Inventory & Settings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AdminInputDark
                                type="number"
                                label="Stock Quantity"
                                value={formData.stock}
                                onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                            />
                            <AdminInputDark
                                type="number"
                                label="Low Stock Threshold"
                                value={formData.lowStockThreshold}
                                onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.featured}
                                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                                    className="rounded border-gray-600 bg-[#1a1b26] text-[#7aa2f7] focus:ring-[#7aa2f7]"
                                />
                                <span className={`text-sm ${tw.textPrimary}`}>Featured Product</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => handleInputChange('active', e.target.checked)}
                                    className="rounded border-gray-600 bg-[#1a1b26] text-[#7aa2f7] focus:ring-[#7aa2f7]"
                                />
                                <span className={`text-sm ${tw.textPrimary}`}>Active</span>
                            </label>
                        </div>
                    </div>

                    {/* Slot Availability */}
                    <div className={`${tw.bgSecondary} p-6 rounded-xl border ${tw.borderPrimary} space-y-6`}>
                        <h2 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
                            <Layers className="w-5 h-5 text-[#ff9e64]" /> Slot Availability
                        </h2>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.requiresSlotSelection}
                                onChange={(e) => handleInputChange('requiresSlotSelection', e.target.checked)}
                                className="rounded border-gray-600 bg-[#1a1b26] text-[#7aa2f7] focus:ring-[#7aa2f7]"
                            />
                            <span className={`text-sm ${tw.textPrimary}`}>Restrict to specific delivery slots</span>
                        </label>

                        {formData.requiresSlotSelection && (
                            <div className={`pl-6 border-l-2 ${tw.borderPrimary}`}>
                                <p className={`text-sm ${tw.textSecondary} mb-3`}>Select available slots:</p>
                                <div className="flex flex-wrap gap-3">
                                    {slots.map(slot => (
                                        <label key={slot._id} className={`flex items-center gap-2 cursor-pointer ${tw.bgInput} px-3 py-2 rounded-lg border ${tw.borderPrimary} hover:border-[#7aa2f7]`}>
                                            <input
                                                type="checkbox"
                                                checked={formData.availableSlots.includes(slot.name)}
                                                onChange={(e) => {
                                                    const newSlots = e.target.checked
                                                        ? [...formData.availableSlots, slot.name]
                                                        : formData.availableSlots.filter(s => s !== slot.name);
                                                    handleInputChange('availableSlots', newSlots);
                                                }}
                                                className="rounded border-gray-600 bg-[#1a1b26] text-[#7aa2f7] focus:ring-[#7aa2f7]"
                                            />
                                            <span className={`text-sm ${tw.textPrimary}`}>{slot.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Images */}
                    <div className={`${tw.bgSecondary} p-6 rounded-xl border ${tw.borderPrimary} space-y-6`}>
                        <h2 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
                            <ImageIcon className="w-5 h-5 text-[#e0af68]" /> Product Images
                        </h2>
                        <div className={`border-2 border-dashed ${tw.borderPrimary} rounded-xl p-8 text-center hover:border-[#7aa2f7] transition-colors group`}>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                                <Upload className={`w-10 h-10 ${tw.textSecondary} mb-3 group-hover:text-[#7aa2f7] transition-colors`} />
                                <p className={`font-medium ${tw.textPrimary}`}>Click to upload images</p>
                                <p className={`text-xs ${tw.textSecondary} mt-1`}>Max 5 images (PNG, JPG)</p>
                            </label>
                        </div>

                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img src={preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-lg border border-[#414868]" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-[#f7768e] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </AdminLayoutDark>
    );
};

export default ProductFormDark;
