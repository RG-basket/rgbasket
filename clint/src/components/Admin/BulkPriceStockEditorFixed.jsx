import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, Search, Filter, RefreshCw, CheckCircle, AlertTriangle, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminInputDark from './SharedDark/AdminInputDark';
import { tw } from '../../config/tokyoNightTheme';

const BulkPriceStockEditorFixed = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [categories, setCategories] = useState([]);
    const [editedProducts, setEditedProducts] = useState({});
    const [expandedProducts, setExpandedProducts] = useState({});

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const toggleProductExpand = (productId) => {
        setExpandedProducts(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }));
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleFieldChange = (productId, field, value) => {
        setEditedProducts(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value
            }
        }));
    };

    const handleVariantChange = (productId, variantIndex, field, value) => {
        setEditedProducts(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                variants: {
                    ...prev[productId]?.variants,
                    [variantIndex]: {
                        ...prev[productId]?.variants?.[variantIndex],
                        [field]: value
                    }
                }
            }
        }));
    };

    const getProductValue = (product, field) => {
        // Check if there's an edited value first
        if (editedProducts[product._id] && editedProducts[product._id][field] !== undefined) {
            return editedProducts[product._id][field];
        }

        // Get values from weights array structure
        const weight = product.weights?.[0] || {};

        if (field === 'normalPrice') {
            return weight.price || ''; // Normal/MRP price
        }
        if (field === 'offerPrice') {
            return weight.offerPrice || ''; // Selling/Discounted price
        }
        if (field === 'stock') {
            return weight.stock || product.stock || 0;
        }
        if (field === 'inStock') {
            // Priority: weight.inStock -> product.inStock -> true
            return weight.inStock ?? product.inStock ?? true;
        }
        return '';
    };

    const getVariantValue = (productId, variantIndex, field) => {
        const product = products.find(p => p._id === productId);
        const weight = product?.weights?.[variantIndex] || {};

        // Check if there's an edited value first
        if (editedProducts[productId]?.variants?.[variantIndex]?.[field] !== undefined) {
            return editedProducts[productId].variants[variantIndex][field];
        }

        return weight[field] || '';
    };

    const isVariantEdited = (productId, variantIndex, field) => {
        return editedProducts[productId]?.variants?.[variantIndex]?.[field] !== undefined;
    };

    const handleSaveAll = async () => {
        setSaving(true);
        const changedProductIds = Object.keys(editedProducts);
        let successCount = 0;
        let failCount = 0;

        try {
            const token = localStorage.getItem('adminToken');

            // Process updates sequentially to avoid overwhelming the server
            for (const productId of changedProductIds) {
                const changes = editedProducts[productId];
                const originalProduct = products.find(p => p._id === productId);

                if (!originalProduct) continue;

                // Check if we have variant edits
                const hasVariantEdits = changes.variants && Object.keys(changes.variants).length > 0;

                if (hasVariantEdits) {
                    // Handle variant updates
                    const updatedWeights = [...(originalProduct.weights || [])];

                    Object.keys(changes.variants).forEach(variantIndex => {
                        const variantChanges = changes.variants[variantIndex];
                        if (updatedWeights[variantIndex]) {
                            updatedWeights[variantIndex] = {
                                ...updatedWeights[variantIndex],
                                ...variantChanges
                            };
                        }
                    });

                    const updateData = {
                        weights: updatedWeights
                    };

                    try {
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/products/${productId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify(updateData)
                        });

                        if (response.ok) {
                            successCount++;
                        } else {
                            failCount++;
                            console.error(`Failed to update product ${productId}`);
                        }
                    } catch (err) {
                        failCount++;
                        console.error(`Error updating product ${productId}:`, err);
                    }
                } else {
                    // Handle main product updates (existing logic)
                    const currentWeight = originalProduct.weights?.[0] || {};

                    const updateData = {
                        weights: [{
                            ...currentWeight,
                            price: changes.normalPrice !== undefined
                                ? (parseFloat(changes.normalPrice) || 0)
                                : (currentWeight.price || 0),
                            offerPrice: changes.offerPrice !== undefined
                                ? (parseFloat(changes.offerPrice) || 0)
                                : (currentWeight.offerPrice || 0),
                            stock: changes.stock !== undefined
                                ? (parseInt(changes.stock) || 0)
                                : (currentWeight.stock || originalProduct.stock || 0),
                            inStock: changes.inStock !== undefined
                                ? changes.inStock
                                : (currentWeight.inStock ?? originalProduct.inStock ?? true)
                        }]
                    };

                    if (changes.stock !== undefined) updateData.stock = parseInt(changes.stock) || 0;
                    if (changes.inStock !== undefined) updateData.inStock = changes.inStock;

                    try {
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/products/${productId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify(updateData)
                        });

                        if (response.ok) {
                            successCount++;
                        } else {
                            failCount++;
                            console.error(`Failed to update product ${productId}`);
                        }
                    } catch (err) {
                        failCount++;
                        console.error(`Error updating product ${productId}:`, err);
                    }
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully updated ${successCount} products`);
                setEditedProducts({});
                fetchProducts(); // Refresh data
            }

            if (failCount > 0) {
                toast.error(`Failed to update ${failCount} products`);
            }

        } catch (error) {
            console.error('Bulk update error:', error);
            toast.error('An error occurred while saving changes');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        if (window.confirm('Are you sure you want to discard all changes?')) {
            setEditedProducts({});
            toast.success('Changes discarded');
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

        // Check stock status from weights[0] or fallback to product.inStock
        const productInStock = product.weights?.[0]?.inStock ?? product.inStock ?? true;
        const matchesStock = stockFilter === 'all' ||
            (stockFilter === 'inStock' && productInStock) ||
            (stockFilter === 'outOfStock' && !productInStock);

        return matchesSearch && matchesCategory && matchesStock;
    });

    const hasChanges = Object.keys(editedProducts).length > 0;

    return (
        <AdminLayoutDark>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Bulk Price & Stock Editor</h1>
                        <p className={`text-sm ${tw.textSecondary}`}>Efficiently manage prices and inventory for multiple products</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <AdminButtonDark
                            variant="secondary"
                            icon={RefreshCw}
                            onClick={fetchProducts}
                            isLoading={loading}
                        >
                            Refresh
                        </AdminButtonDark>
                        {hasChanges && (
                            <>
                                <AdminButtonDark
                                    variant="danger"
                                    icon={X}
                                    onClick={handleDiscard}
                                    disabled={saving}
                                >
                                    Discard
                                </AdminButtonDark>
                                <AdminButtonDark
                                    variant="primary"
                                    icon={Save}
                                    onClick={handleSaveAll}
                                    isLoading={saving}
                                >
                                    Save All Changes
                                </AdminButtonDark>
                            </>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className={`${tw.bgSecondary} p-4 rounded-xl border ${tw.borderPrimary} flex flex-col md:flex-row gap-4`}>
                    <div className="flex-1 relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary}`} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="relative min-w-[180px]">
                            <Filter className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary}`} />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary} appearance-none`}
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative min-w-[150px]">
                            <select
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                                className={`w-full px-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                            >
                                <option value="all">All Status</option>
                                <option value="inStock">In Stock</option>
                                <option value="outOfStock">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tips Alert */}
                <div className={`bg-[#7aa2f7]/10 border border-[#7aa2f7]/20 rounded-xl p-4 flex gap-3`}>
                    <AlertCircle className="w-5 h-5 text-[#7aa2f7] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[#c0caf5]">
                        <p className="font-medium text-[#7aa2f7] mb-1">Price Structure Guide:</p>
                        <ul className="list-disc list-inside space-y-1 text-[#9aa5ce]">
                            <li><strong>Normal Price:</strong> MRP/Original price (weights[0].price)</li>
                            <li><strong>Offer Price:</strong> Selling/Discounted price (weights[0].offerPrice)</li>
                            <li>Changes are highlighted in blue border</li>
                            <li>Click "Save All Changes" to apply modifications</li>
                            <li>Click on product rows to expand/collapse variants</li>
                        </ul>
                    </div>
                </div>

                {/* Table */}
                <div className={`${tw.bgSecondary} rounded-xl border ${tw.borderPrimary} overflow-hidden shadow-lg`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${tw.borderPrimary} ${tw.bgInput}`}>
                                    <th className={`px-4 py-3 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Product & Variants</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Category</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Normal Price (₹)</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Offer Price (₹)</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Stock Qty</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Status</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${tw.borderSecondary}`}>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center">
                                            <div className="flex justify-center">
                                                <div className="w-8 h-8 border-4 border-[#7aa2f7] border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className={`px-4 py-8 text-center ${tw.textSecondary}`}>
                                            No products found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map(product => {
                                        const isEdited = editedProducts[product._id];
                                        const isExpanded = expandedProducts[product._id];

                                        return (
                                            <React.Fragment key={product._id}>
                                                {/* Main Product Row */}
                                                <tr
                                                    className={`hover:bg-[#414868]/30 transition-colors cursor-pointer ${isEdited ? 'bg-[#7aa2f7]/5' : ''}`}
                                                    onClick={() => toggleProductExpand(product._id)}
                                                >
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg ${tw.bgInput} flex items-center justify-center overflow-hidden border ${tw.borderSecondary}`}>
                                                                {product.image ? (
                                                                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package className={`w-5 h-5 ${tw.textSecondary}`} />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                                <div>
                                                                    <p className={`font-medium ${tw.textPrimary} line-clamp-1`}>{product.name}</p>
                                                                    <p className={`text-xs ${tw.textSecondary}`}>{product.weight} {product.unit}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={`px-4 py-4 text-sm ${tw.textSecondary}`}>
                                                        {product.category}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={getProductValue(product, 'normalPrice')}
                                                            onChange={(e) => handleFieldChange(product._id, 'normalPrice', e.target.value)}
                                                            className={`w-24 px-3 py-2 ${tw.bgInput} border ${isEdited?.normalPrice !== undefined ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                            placeholder="MRP"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={getProductValue(product, 'offerPrice')}
                                                            onChange={(e) => handleFieldChange(product._id, 'offerPrice', e.target.value)}
                                                            className={`w-24 px-3 py-2 ${tw.bgInput} border ${isEdited?.offerPrice !== undefined ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                            placeholder="Selling"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={getProductValue(product, 'stock')}
                                                            onChange={(e) => handleFieldChange(product._id, 'stock', e.target.value)}
                                                            className={`w-20 px-3 py-2 ${tw.bgInput} border ${isEdited?.stock !== undefined ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={getProductValue(product, 'inStock').toString()}
                                                            onChange={(e) => handleFieldChange(product._id, 'inStock', e.target.value === 'true')}
                                                            className={`w-32 px-3 py-2 ${tw.bgInput} border ${isEdited?.inStock !== undefined ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <option value="true">In Stock</option>
                                                            <option value="false">Out of Stock</option>
                                                        </select>
                                                    </td>
                                                </tr>

                                                {/* Variants Dropdown Row */}
                                                {isExpanded && product.weights && product.weights.length > 1 && (
                                                    <tr className="bg-[#1a1b26]/50">
                                                        <td colSpan="6" className="px-4 py-3">
                                                            <div className="ml-12">

                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full min-w-full">
                                                                        <thead>
                                                                            <tr className={`border-b ${tw.borderPrimary}`}>
                                                                                <th className={`px-3 py-2 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Variant</th>
                                                                                <th className={`px-3 py-2 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Normal Price (₹)</th>
                                                                                <th className={`px-3 py-2 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Offer Price (₹)</th>
                                                                                <th className={`px-3 py-2 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Stock</th>
                                                                                <th className={`px-3 py-2 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Status</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {product.weights.map((weight, index) => (
                                                                                <tr key={index} className={`border-b ${tw.borderPrimary} last:border-b-0`}>
                                                                                    <td className={`px-3 py-2 text-sm ${tw.textPrimary}`}>
                                                                                        {weight.weight} {weight.unit && `(${weight.unit})`}
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            min="0"
                                                                                            value={getVariantValue(product._id, index, 'price')}
                                                                                            onChange={(e) => handleVariantChange(product._id, index, 'price', e.target.value)}
                                                                                            className={`w-full px-2 py-1 ${tw.bgSecondary} border ${isVariantEdited(product._id, index, 'price') ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded focus:outline-none focus:ring-1 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                                                            placeholder="MRP"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            min="0"
                                                                                            value={getVariantValue(product._id, index, 'offerPrice')}
                                                                                            onChange={(e) => handleVariantChange(product._id, index, 'offerPrice', e.target.value)}
                                                                                            className={`w-full px-2 py-1 ${tw.bgSecondary} border ${isVariantEdited(product._id, index, 'offerPrice') ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded focus:outline-none focus:ring-1 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                                                            placeholder="Selling"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        <input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            value={getVariantValue(product._id, index, 'stock')}
                                                                                            onChange={(e) => handleVariantChange(product._id, index, 'stock', e.target.value)}
                                                                                            className={`w-20 px-2 py-1 ${tw.bgSecondary} border ${isVariantEdited(product._id, index, 'stock') ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded focus:outline-none focus:ring-1 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        <select
                                                                                            value={getVariantValue(product._id, index, 'inStock').toString()}
                                                                                            onChange={(e) => handleVariantChange(product._id, index, 'inStock', e.target.value === 'true')}
                                                                                            className={`w-full px-2 py-1 ${tw.bgSecondary} border ${isVariantEdited(product._id, index, 'inStock') ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded focus:outline-none focus:ring-1 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                                                        >
                                                                                            <option value="true">In Stock</option>
                                                                                            <option value="false">Out of Stock</option>
                                                                                        </select>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayoutDark>
    );
};

export default BulkPriceStockEditorFixed;