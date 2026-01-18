import React, { useState, useEffect } from 'react';
import { Search, Save, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminTableDark from './SharedDark/AdminTableDark';
import { tw } from '../../config/tokyoNightTheme';

const ProductSlotManagerDark = () => {
    const [products, setProducts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [restrictions, setRestrictions] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [saving, setSaving] = useState(false);

    // NEW: Stage all changes to allow for bulk save
    const [allPendingChanges, setAllPendingChanges] = useState({});
    // Track which products have been fetched to avoid reloading and losing local changes
    const [fetchedRestrictions, setFetchedRestrictions] = useState({});

    // Fetch data on component mount
    useEffect(() => {
        fetchProducts();
        fetchSlots();
        fetchCategories();
    }, []);

    // Fetch restrictions when product is selected
    useEffect(() => {
        if (selectedProduct) {
            const productId = selectedProduct._id;
            // If we already have pending changes for this product, use them
            if (allPendingChanges[productId]) {
                setRestrictions(allPendingChanges[productId]);
            }
            // Only fetch if we haven't fetched it yet this session (to preserve local changes)
            else if (!fetchedRestrictions[productId]) {
                fetchProductRestrictions(productId);
            } else {
                // If it was fetched before but has no pending changes, reset to empty or what we had
                setRestrictions(fetchedRestrictions[productId] || []);
            }
        }
    }, [selectedProduct]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
            const data = await response.json();
            if (data.success) {
                setProducts(data.products || []);
            } else {
                throw new Error('Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const fetchSlots = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/slots`);
            const data = await response.json();
            setSlots(data || []);
        } catch (error) {
            console.error('Error fetching slots:', error);
            toast.error('Failed to fetch time slots');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
            const data = await response.json();
            if (data.success) {
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProductRestrictions = async (productId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/product-slot-availability/product/${productId}`);
            const data = await response.json();
            if (data.success) {
                const currentRestrictions = data.restrictions || [];
                setRestrictions(currentRestrictions);
                setFetchedRestrictions(prev => ({
                    ...prev,
                    [productId]: currentRestrictions
                }));
            }
        } catch (error) {
            console.error('Error fetching restrictions:', error);
        }
    };

    // Toggle slot availability locally
    const toggleSlotAvailability = (dayOfWeek, slotName) => {
        if (!selectedProduct) return;

        const productId = selectedProduct._id;
        const newRestrictions = [...restrictions];
        const restrictionIndex = newRestrictions.findIndex(r => r.dayOfWeek === dayOfWeek);

        if (restrictionIndex > -1) {
            const restriction = { ...newRestrictions[restrictionIndex] };
            const currentlyUnavailable = restriction.unavailableSlots.includes(slotName);

            if (currentlyUnavailable) {
                restriction.unavailableSlots = restriction.unavailableSlots.filter(s => s !== slotName);
            } else {
                restriction.unavailableSlots = [...restriction.unavailableSlots, slotName];
            }
            newRestrictions[restrictionIndex] = restriction;
        } else {
            newRestrictions.push({
                productId,
                dayOfWeek,
                unavailableSlots: [slotName],
                reason: 'Unavailable',
                isActive: true
            });
        }

        setRestrictions(newRestrictions);
        setAllPendingChanges(prev => ({
            ...prev,
            [productId]: newRestrictions
        }));
    };

    const handleSaveAll = async () => {
        const productIds = Object.keys(allPendingChanges);
        if (productIds.length === 0) return;

        setSaving(true);
        try {
            const updates = productIds.map(productId => ({
                productId,
                restrictions: allPendingChanges[productId]
            }));

            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/product-slot-availability/multi-bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ updates })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('All changes saved successfully');
                // Update fetched restrictions to reflect new reality
                setFetchedRestrictions(prev => ({
                    ...prev,
                    ...allPendingChanges
                }));
                setAllPendingChanges({});
            } else {
                toast.error(data.message || 'Failed to save changes');
            }
        } catch (error) {
            console.error('Error saving all changes:', error);
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscardChanges = () => {
        if (confirm('Discard all unsaved changes?')) {
            setAllPendingChanges({});
            // Reset current view if a product is selected
            if (selectedProduct) {
                setRestrictions(fetchedRestrictions[selectedProduct._id] || []);
            }
        }
    };

    // Check if a slot is unavailable
    const isSlotUnavailable = (dayOfWeek, slotName) => {
        const restriction = restrictions.find(r => r.dayOfWeek === dayOfWeek);
        return restriction?.unavailableSlots?.includes(slotName) || false;
    };

    // Filter products based on search and category
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <AdminLayoutDark>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Product Slot Availability</h1>
                        <p className={`text-sm ${tw.textSecondary}`}>Manage which products are available during specific delivery slots</p>
                    </div>
                    {Object.keys(allPendingChanges).length > 0 && (
                        <div className="flex items-center gap-2">
                            <AdminButtonDark
                                variant="outline"
                                onClick={handleDiscardChanges}
                                disabled={saving}
                            >
                                Discard
                            </AdminButtonDark>
                            <AdminButtonDark
                                variant="primary"
                                icon={Save}
                                isLoading={saving}
                                onClick={handleSaveAll}
                            >
                                {saving ? 'Saving...' : `Save ${Object.keys(allPendingChanges).length} Products`}
                            </AdminButtonDark>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Panel - Product Selection */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Search and Filter */}
                        <div className={`${tw.bgSecondary} p-4 rounded-xl border ${tw.borderPrimary} space-y-4`}>
                            {/* Search */}
                            <div className="relative">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary}`} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                />
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${tw.textSecondary}`}>
                                    Category
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className={`w-full px-3 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(category => (
                                        <option key={category._id} value={category.name}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className={`${tw.bgSecondary} rounded-xl border ${tw.borderPrimary} overflow-hidden`}>
                            <div className={`p-4 border-b ${tw.borderPrimary}`}>
                                <h3 className={`font-semibold ${tw.textPrimary}`}>Products</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {filteredProducts.map(product => (
                                    <button
                                        key={product._id}
                                        onClick={() => setSelectedProduct(product)}
                                        className={`w-full p-4 text-left border-b ${tw.borderPrimary} transition-colors ${selectedProduct?._id === product._id
                                                ? 'bg-[#7aa2f7] text-[#1a1b26]'
                                                : `${tw.bgSecondary} ${tw.textPrimary} hover:bg-[#2a2e42]`
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-lg ${tw.bgInput} flex items-center justify-center overflow-hidden border ${tw.borderSecondary}`}>
                                                {product.image ? (
                                                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className={`w-full h-full bg-[#1f2335]`} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium truncate">{product.name}</p>
                                                    {allPendingChanges[product._id] && (
                                                        <span className="w-2 h-2 rounded-full bg-[#f7768e] shadow-[0_0_8px_#f7768e]" title="Unsaved changes" />
                                                    )}
                                                </div>
                                                <p className={`text-xs ${selectedProduct?._id === product._id ? 'text-[#1a1b26]/80' : tw.textSecondary}`}>
                                                    {product.category}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="p-4 text-center">
                                        <p className={tw.textSecondary}>No products found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Availability Grid */}
                    <div className="lg:col-span-3">
                        {selectedProduct ? (
                            <div className={`${tw.bgSecondary} rounded-xl border ${tw.borderPrimary} overflow-hidden`}>
                                <div className={`p-4 border-b ${tw.borderPrimary}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-lg ${tw.bgInput} flex items-center justify-center overflow-hidden border ${tw.borderSecondary}`}>
                                            {selectedProduct.image ? (
                                                <img src={selectedProduct.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className={`w-full h-full bg-[#1f2335]`} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className={`font-semibold ${tw.textPrimary}`}>{selectedProduct.name}</h3>
                                            <p className={`text-sm ${tw.textSecondary}`}>{selectedProduct.category}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Availability Grid */}
                                <div className="p-4 overflow-x-auto">
                                    <table className="w-full min-w-max">
                                        <thead>
                                            <tr>
                                                <th className={`p-3 text-left ${tw.textSecondary} font-normal`}>Day / Time</th>
                                                {slots.map(slot => (
                                                    <th key={slot._id} className={`p-3 text-center ${tw.textSecondary} font-normal border-l ${tw.borderPrimary}`}>
                                                        {slot.startTime} - {slot.endTime}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {days.map(day => (
                                                <tr key={day} className={`border-t ${tw.borderPrimary}`}>
                                                    <td className={`p-3 ${tw.textPrimary} font-medium`}>
                                                        {day}
                                                    </td>
                                                    {slots.map(slot => (
                                                        <td key={slot._id} className={`p-3 text-center border-l ${tw.borderPrimary}`}>
                                                            <button
                                                                onClick={() => toggleSlotAvailability(day, slot.name)}
                                                                disabled={saving}
                                                                className={`w-full py-2 rounded-lg transition-all ${isSlotUnavailable(day, slot.name)
                                                                        ? 'bg-[#f7768e]/20 text-[#f7768e] hover:bg-[#f7768e]/30'
                                                                        : 'bg-[#9ece6a]/20 text-[#9ece6a] hover:bg-[#9ece6a]/30'
                                                                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                {isSlotUnavailable(day, slot.name) ? (
                                                                    <XCircle className="w-5 h-5 mx-auto" />
                                                                ) : (
                                                                    <CheckCircle className="w-5 h-5 mx-auto" />
                                                                )}
                                                            </button>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Legend */}
                                <div className={`p-4 border-t ${tw.borderPrimary} flex items-center justify-center gap-6`}>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-[#9ece6a]" />
                                        <span className={`text-sm ${tw.textSecondary}`}>Available</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-[#f7768e]" />
                                        <span className={`text-sm ${tw.textSecondary}`}>Unavailable</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`text-center py-12 ${tw.bgSecondary} rounded-xl border border-dashed ${tw.borderPrimary}`}>
                                <Calendar className={`w-12 h-12 ${tw.textSecondary} mx-auto mb-3 opacity-50`} />
                                <p className={tw.textSecondary}>Please select a product to manage availability</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayoutDark>
    );
};

export default ProductSlotManagerDark;