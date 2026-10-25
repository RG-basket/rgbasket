import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Upload, Plus, Trash2, ArrowLeft, Package, DollarSign, Layers, Image as ImageIcon, Settings, Info, Sparkles, ChevronLeft, ChevronRight, Star } from 'lucide-react';
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
        weights: [{ weight: '', price: '', offerPrice: '', unit: 'kg', customizationCharge: 0 }],
        stock: 0,
        lowStockThreshold: 10,
        maxOrderQuantity: 0,
        featured: false,
        active: true,
        requiresSlotSelection: false,
        availableSlots: [],
        isCustomizable: false,
        isSpecialRequest: false,
        specialRequestInfo: '',
        customizationCharges: [],
        isFullCoverImage: false
    });

    // Unified image items: { id, type: 'existing' | 'new', url?: string, file?: File, preview: string }
    const [imageList, setImageList] = useState([]);

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
                    weights: product.weights?.map(w => ({ ...w, customizationCharge: w.customizationCharge || 0 })) || [{ weight: '', price: '', offerPrice: '', unit: 'kg', customizationCharge: 0 }],
                    stock: product.stock,
                    lowStockThreshold: product.lowStockThreshold || 10,
                    maxOrderQuantity: product.maxOrderQuantity || 0,
                    featured: product.featured,
                    active: product.active,
                    requiresSlotSelection: product.requiresSlotSelection || false,
                    availableSlots: product.availableSlots || [],
                    isCustomizable: product.isCustomizable || false,
                    isSpecialRequest: product.isSpecialRequest || false,
                    specialRequestInfo: product.specialRequestInfo || '',
                    customizationCharges: product.customizationCharges || [],
                    isFullCoverImage: Boolean(product.isFullCoverImage)
                });

                const existingUrls = Array.isArray(product.images) && product.images.length > 0
                    ? product.images.filter(Boolean)
                    : (typeof product.image === 'string' && product.image ? [product.image] : (Array.isArray(product.image) ? product.image.filter(Boolean) : []));

                const existing = existingUrls.map((url, idx) => ({
                    id: `existing_${idx}_${url}`,
                    type: 'existing',
                    url,
                    preview: url
                }));
                setImageList(existing);
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
            [field]: field === 'price' || field === 'offerPrice' || field === 'customizationCharge' ? parseFloat(value) || 0 : value
        };
        setFormData(prev => ({ ...prev, weights: newWeights }));
    };

    const addWeight = () => {
        setFormData(prev => ({
            ...prev,
            weights: [...prev.weights, { weight: '', price: '', offerPrice: '', unit: 'kg', customizationCharge: 0 }]
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
        if (!files.length) return;
        if (imageList.length + files.length > 5) {
            toast.error(`Maximum 5 images allowed. You can only add ${Math.max(0, 5 - imageList.length)} more.`);
            return;
        }

        const newItems = files.map((file, i) => ({
            id: `new_${Date.now()}_${i}_${Math.random()}`,
            type: 'new',
            file,
            preview: URL.createObjectURL(file)
        }));
        setImageList(prev => [...prev, ...newItems]);
        e.target.value = '';
    };

    const removeImage = (index) => {
        setImageList(prev => prev.filter((_, i) => i !== index));
    };

    const moveImage = (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= imageList.length) return;
        setImageList(prev => {
            const updated = [...prev];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return updated;
        });
    };

    const setAsPrimary = (index) => {
        if (index === 0) return;
        moveImage(index, 0);
        toast.success('Set as 1st cover image!');
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

            if (imageList.length === 0) {
                toast.error('Please upload at least one product image');
                setLoading(false);
                return;
            }

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('description', JSON.stringify(formData.description.filter(d => d.trim())));
            formDataToSend.append('category', formData.category);
            formDataToSend.append('weights', JSON.stringify(formData.weights));
            formDataToSend.append('stock', formData.stock);
            formDataToSend.append('lowStockThreshold', formData.lowStockThreshold);
            formDataToSend.append('maxOrderQuantity', formData.maxOrderQuantity);
            formDataToSend.append('featured', formData.featured);
            formDataToSend.append('active', formData.active);
            formDataToSend.append('requiresSlotSelection', formData.requiresSlotSelection);
            formDataToSend.append('isCustomizable', formData.isCustomizable);
            formDataToSend.append('isSpecialRequest', formData.isSpecialRequest);
            formDataToSend.append('specialRequestInfo', formData.specialRequestInfo || '');
            formDataToSend.append('isFullCoverImage', Boolean(formData.isFullCoverImage));

            // AUTOMATICALLY derive customization rules from variants if enabled
            let cleanedCharges = [];
            if (formData.isCustomizable) {
                cleanedCharges = formData.weights.map(w => {
                    const weightVal = parseFloat(w.weight) || 0;
                    let grams = weightVal;
                    if (w.unit === 'kg' || w.unit === 'l') grams = weightVal * 1000;

                    return {
                        weight: grams,
                        charge: parseFloat(w.customizationCharge) || 0
                    };
                }).filter(c => c.weight > 0);
            }

            formDataToSend.append('customizationCharges', JSON.stringify(cleanedCharges));

            formData.availableSlots.forEach(slot => {
                formDataToSend.append('availableSlots', slot);
            });

            // Build ordered image descriptor array
            const imagesOrder = [];
            const newFiles = [];
            imageList.forEach(item => {
                if (item.type === 'existing') {
                    imagesOrder.push({ type: 'existing', url: item.url });
                } else if (item.type === 'new' && item.file) {
                    imagesOrder.push({ type: 'new' });
                    newFiles.push(item.file);
                }
            });

            // Append imagesOrder before files so multipart parsers receive it early
            formDataToSend.append('imagesOrder', JSON.stringify(imagesOrder));
            newFiles.forEach(file => {
                formDataToSend.append('images', file);
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
                setTimeout(() => navigate('/portal-dashboard/products'), 1000);
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
                            onClick={() => navigate('/portal-dashboard/products')}
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
                        <AdminButtonDark variant="secondary" onClick={() => navigate('/portal-dashboard/products')}>
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

                    {/* Customization Toggle */}
                    <div className={`${tw.bgSecondary} p-6 rounded-xl border ${tw.borderPrimary}`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#f7768e]/10 rounded-lg">
                                    <Settings className="w-5 h-5 text-[#f7768e]" />
                                </div>
                                <div>
                                    <h2 className={`text-lg font-bold ${tw.textPrimary}`}>Enable Customization</h2>
                                    <p className={`text-xs ${tw.textSecondary}`}>Turn this on to show "Extra Charge" inputs in your variants above</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isCustomizable}
                                    onChange={(e) => handleInputChange('isCustomizable', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f7768e]"></div>
                            </label>
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
                                <div key={index} className={`grid grid-cols-1 md:grid-cols-6 gap-4 p-4 ${tw.bgInput} rounded-lg border ${tw.borderPrimary}`}>
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
                                    {formData.isCustomizable && (
                                        <div>
                                            <label className={`block text-xs ${tw.textSecondary} mb-1`}>Extra Charge (₹)</label>
                                            <input
                                                type="number"
                                                value={weight.customizationCharge}
                                                onChange={(e) => handleWeightChange(index, 'customizationCharge', e.target.value)}
                                                className={`w-full px-3 py-2 ${tw.bgSecondary} border border-[#f7768e]/30 rounded-lg text-sm ${tw.textPrimary} focus:border-[#f7768e] focus:ring-1 focus:ring-[#f7768e]`}
                                                placeholder="e.g. 10"
                                            />
                                        </div>
                                    )}
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
                            <AdminInputDark
                                type="number"
                                label="Max Order Quantity (0 for unlimited)"
                                value={formData.maxOrderQuantity}
                                onChange={(e) => handleInputChange('maxOrderQuantity', parseInt(e.target.value) || 0)}
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
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isSpecialRequest}
                                    onChange={(e) => handleInputChange('isSpecialRequest', e.target.checked)}
                                    className="rounded border-gray-600 bg-[#1a1b26] text-[#7aa2f7] focus:ring-[#7aa2f7]"
                                />
                                <span className={`text-sm ${tw.textPrimary}`}>Special Request (WhatsApp)</span>
                            </label>
                        </div>

                        {formData.isSpecialRequest && (
                            <div className="mt-4 p-4 rounded-xl bg-[#16161e] border border-emerald-500/30 space-y-2">
                                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                                    <Sparkles className="w-4 h-4" />
                                    Special Request Details / Instructions for Customers
                                </div>
                                <p className={`text-xs ${tw.textSecondary}`}>
                                    Write the product info, pre-order timelines, cut/cleaning guidelines, or pricing rules that customers will see in the Details popup before placing a special request.
                                </p>
                                <textarea
                                    rows={4}
                                    value={formData.specialRequestInfo || ''}
                                    onChange={(e) => handleInputChange('specialRequestInfo', e.target.value)}
                                    placeholder="e.g. Sourced fresh daily. Minimum order 1.5 kg. Specify Bengali cut, Curry cut, or Boneless on WhatsApp. Order 12 hours ahead for morning delivery."
                                    className={`w-full ${tw.bgInput} ${tw.textPrimary} border ${tw.borderPrimary} rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500`}
                                />
                            </div>
                        )}
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                            <div>
                                <h2 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
                                    <ImageIcon className="w-5 h-5 text-[#e0af68]" /> Product Images & Display Order
                                </h2>
                                <p className={`text-xs ${tw.textSecondary} mt-0.5`}>
                                    The <span className="text-amber-400 font-bold">1st image</span> is the main cover photo shown on product cards. Use arrows to change sequence.
                                </p>
                            </div>
                            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-[#1a1b26] text-[#7aa2f7] border border-[#414868] self-start sm:self-auto">
                                {imageList.length} / 5 Images
                            </span>
                        </div>

                        {/* Edge-to-edge Blinkit Image Style Checkbox */}
                        <div className="p-4 rounded-xl bg-[#16161e] border border-white/10 flex items-start sm:items-center justify-between gap-4">
                            <div className="space-y-0.5">
                                <label htmlFor="isFullCoverImage" className={`text-sm font-bold ${tw.textPrimary} flex items-center gap-2 cursor-pointer`}>
                                    <span>Edge-to-Edge Full Cover Image (Blinkit Style)</span>
                                </label>
                                <p className={`text-xs ${tw.textSecondary}`}>
                                    Check this box if the photo has a full background (like the Potato image) and should cover the card edge-to-edge. Leave unchecked for cutouts and older images (like Onion PNGs) so they stay nicely contained and never get chopped.
                                </p>
                            </div>
                            <input
                                id="isFullCoverImage"
                                type="checkbox"
                                checked={Boolean(formData.isFullCoverImage)}
                                onChange={(e) => handleInputChange('isFullCoverImage', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-600 bg-[#1a1b26] text-[#7aa2f7] focus:ring-[#7aa2f7] cursor-pointer shrink-0 mt-0.5 sm:mt-0"
                            />
                        </div>

                        {imageList.length < 5 && (
                            <div className={`border-2 border-dashed ${tw.borderPrimary} rounded-xl p-6 text-center hover:border-[#7aa2f7] transition-all group bg-[#16161e]/40`}>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                                    <Upload className={`w-9 h-9 ${tw.textSecondary} mb-2 group-hover:text-[#7aa2f7] transition-colors`} />
                                    <p className={`text-sm font-semibold ${tw.textPrimary}`}>Click to select product images</p>
                                    <p className={`text-xs ${tw.textSecondary} mt-1`}>Upload up to 5 images (PNG, JPG, WebP) with clean or transparent background</p>
                                </label>
                            </div>
                        )}

                        {imageList.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {imageList.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={`relative rounded-xl p-2.5 border transition-all flex flex-col justify-between ${index === 0
                                                ? 'bg-gradient-to-b from-amber-500/10 via-[#1a1b26] to-[#1a1b26] border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                                                : `${tw.bgInput} ${tw.borderPrimary}`
                                            }`}
                                    >
                                        {/* Header / Badges */}
                                        <div className="flex items-center justify-between mb-2">
                                            {index === 0 ? (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-black text-black" /> 1st (Cover)
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1a1b26] text-[#7982a9] border border-[#414868]">
                                                    #{index + 1} Image
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                title="Delete this image"
                                                className="p-1 rounded-md bg-[#f7768e]/15 hover:bg-[#f7768e] text-[#f7768e] hover:text-white transition-all"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Image Box */}
                                        <div className="w-full h-32 rounded-lg overflow-hidden bg-white/5 border border-white/5 flex items-center justify-center p-2 mb-2.5">
                                            <img
                                                src={item.preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>

                                        {/* Reorder Controls */}
                                        <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    disabled={index === 0}
                                                    onClick={() => moveImage(index, index - 1)}
                                                    title="Move left / earlier in sequence"
                                                    className="flex-1 py-1 px-1.5 rounded-lg bg-[#1a1b26] hover:bg-[#24283b] disabled:opacity-30 disabled:cursor-not-allowed text-[#c0caf5] text-xs font-bold border border-[#414868] flex items-center justify-center gap-1 transition-all"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" /> Left
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === imageList.length - 1}
                                                    onClick={() => moveImage(index, index + 1)}
                                                    title="Move right / later in sequence"
                                                    className="flex-1 py-1 px-1.5 rounded-lg bg-[#1a1b26] hover:bg-[#24283b] disabled:opacity-30 disabled:cursor-not-allowed text-[#c0caf5] text-xs font-bold border border-[#414868] flex items-center justify-center gap-1 transition-all"
                                                >
                                                    Right <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {index !== 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setAsPrimary(index)}
                                                    className="w-full py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                                                >
                                                    <Star className="w-3 h-3" /> Make 1st (Cover)
                                                </button>
                                            )}
                                        </div>
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
