import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, Search, Filter, RefreshCw, CheckCircle, AlertTriangle, Package, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
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
    const [newVariantForms, setNewVariantForms] = useState({});
    const [isAddingVariant, setIsAddingVariant] = useState({});

    const ALLOWED_UNITS = ['kg', 'g', 'piece', 'pack', 'l', 'ml', 'dozen', 'bundle'];

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

    const getProductWeights = (product) => {
        if (editedProducts[product._id]?.weights) {
            return editedProducts[product._id].weights;
        }
        return product.weights || [];
    };

    const getRealProductStock = (product) => {
        if (!product) return 0;
        if (editedProducts[product._id]?.stock !== undefined && editedProducts[product._id]?.stock !== '') {
            return editedProducts[product._id].stock;
        }
        if (product.stock !== undefined && product.stock !== null) {
            return product.stock;
        }
        const weights = editedProducts[product._id]?.weights || product.weights || [];
        if (weights[0]?.stock !== undefined && weights[0]?.stock !== null && weights[0]?.stock !== '') {
            return weights[0].stock;
        }
        return 0;
    };

    const handleFieldChange = (productId, field, value) => {
        const product = products.find(p => p._id === productId);
        const currentWeights = product ? getProductWeights(product) : [];
        let updatedWeights = currentWeights.map(w => ({ ...w }));

        if (field === 'normalPrice' && updatedWeights.length > 0) {
            updatedWeights[0].price = value === '' ? '' : parseFloat(value) || 0;
        }
        if (field === 'offerPrice' && updatedWeights.length > 0) {
            updatedWeights[0].offerPrice = value === '' ? '' : parseFloat(value) || 0;
        }
        if (field === 'stock') {
            const stockVal = value === '' ? '' : parseInt(value) || 0;
            // Sync this real stock quantity to all variants
            updatedWeights = updatedWeights.map(w => ({
                ...w,
                stock: stockVal,
                inStock: stockVal === '' ? w.inStock : (stockVal > 0)
            }));
        }
        if (field === 'inStock') {
            const inStockVal = value === true || value === 'true';
            updatedWeights = updatedWeights.map(w => ({
                ...w,
                inStock: inStockVal
            }));
        }

        setEditedProducts(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value,
                weights: updatedWeights
            }
        }));
    };

    const handleVariantChange = (productId, variantIndex, field, value) => {
        const product = products.find(p => p._id === productId);
        if (!product) return;

        const currentWeights = getProductWeights(product);
        let updatedWeights = currentWeights.map((w, idx) => {
            if (idx !== variantIndex) return { ...w };
            return {
                ...w,
                [field]: (field === 'price' || field === 'offerPrice')
                    ? (value === '' ? '' : parseFloat(value) || 0)
                    : field === 'stock'
                    ? (value === '' ? '' : parseInt(value) || 0)
                    : value
            };
        });

        const productUpdates = {
            weights: updatedWeights
        };

        // If stock is edited in any variant row, treat it as real stock and keep all variants in sync
        if (field === 'stock') {
            const stockVal = value === '' ? '' : parseInt(value) || 0;
            productUpdates.stock = stockVal;
            productUpdates.weights = updatedWeights.map(w => ({
                ...w,
                stock: stockVal,
                inStock: stockVal === '' ? w.inStock : (stockVal > 0)
            }));
        }

        if (field === 'inStock') {
            const inStockVal = value === true || value === 'true';
            const anyInStock = updatedWeights.some((w, idx) => idx === variantIndex ? inStockVal : (w.inStock !== false));
            productUpdates.inStock = anyInStock;
        }

        setEditedProducts(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                ...productUpdates
            }
        }));
    };

    const handleAddVariant = (productId) => {
        const product = products.find(p => p._id === productId);
        if (!product) return;

        const form = newVariantForms[productId] || {};
        if (!form.weight || String(form.weight).trim() === '') {
            toast.error('Please enter a weight label (e.g. 500 or 1)');
            return;
        }
        if (form.price === '' || form.price === undefined || Number(form.price) < 0) {
            toast.error('Please enter a valid Normal Price (MRP)');
            return;
        }

        const currentWeights = getProductWeights(product);
        const normalPrice = parseFloat(form.price) || 0;
        const offerPrice = (form.offerPrice !== '' && form.offerPrice !== undefined && form.offerPrice !== null)
            ? parseFloat(form.offerPrice) || 0
            : normalPrice;

        if (offerPrice > normalPrice) {
            toast.error('Offer price cannot be higher than Normal price (MRP)');
            return;
        }

        // Real product stock is the single inventory pool
        const realStock = getRealProductStock(product);
        const numericRealStock = realStock !== '' && realStock !== undefined ? parseInt(realStock) || 0 : 0;
        const variantStock = (form.stock !== '' && form.stock !== undefined && form.stock !== null)
            ? (parseInt(form.stock) || 0)
            : numericRealStock;

        const realInStock = getProductValue(product, 'inStock');
        const variantInStock = form.inStock !== undefined ? (form.inStock !== false) : (realInStock !== false);

        const newVariant = {
            weight: String(form.weight).trim(),
            unit: form.unit || 'kg',
            price: normalPrice,
            offerPrice: offerPrice,
            stock: numericRealStock,
            inStock: variantInStock,
            customizationCharge: 0
        };

        // Ensure all existing variants and the new variant keep the real stock
        const updatedWeights = currentWeights.map(w => ({
            ...w,
            stock: numericRealStock
        })).concat(newVariant);

        setEditedProducts(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                weights: updatedWeights,
                stock: prev[productId]?.stock !== undefined ? prev[productId].stock : numericRealStock,
                inStock: prev[productId]?.inStock !== undefined ? prev[productId].inStock : variantInStock
            }
        }));

        setNewVariantForms(prev => ({
            ...prev,
            [productId]: { weight: '', unit: 'kg', price: '', offerPrice: '', stock: numericRealStock, inStock: true }
        }));
        setIsAddingVariant(prev => ({
            ...prev,
            [productId]: false
        }));

        toast.success(`Variant (${newVariant.weight} ${newVariant.unit}) added with stock ${numericRealStock}! Click "Save All Changes" to persist.`);
    };

    const handleRemoveVariant = (productId, variantIndex) => {
        const product = products.find(p => p._id === productId);
        if (!product) return;

        const currentWeights = getProductWeights(product);
        if (currentWeights.length <= 1) {
            toast.error('A product must have at least one variant.');
            return;
        }

        const toRemove = currentWeights[variantIndex];
        if (!window.confirm(`Are you sure you want to remove variant "${toRemove.weight} ${toRemove.unit}"?`)) {
            return;
        }

        const updatedWeights = currentWeights.filter((_, idx) => idx !== variantIndex);

        setEditedProducts(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                weights: updatedWeights
            }
        }));

        toast.success('Variant removed. Click "Save All Changes" to persist.');
    };

    const getProductValue = (product, field) => {
        if (!product) return '';
        // Check if there's an edited value first
        if (editedProducts[product._id] && editedProducts[product._id][field] !== undefined) {
            return editedProducts[product._id][field];
        }

        if (field === 'stock') {
            return getRealProductStock(product);
        }

        // Get values from weights array structure
        const weights = getProductWeights(product);
        const weight = weights[0] || {};

        if (field === 'normalPrice') {
            return weight.price !== undefined ? weight.price : '';
        }
        if (field === 'offerPrice') {
            return weight.offerPrice !== undefined ? weight.offerPrice : '';
        }
        if (field === 'inStock') {
            return product.inStock !== undefined ? product.inStock : (weight.inStock ?? true);
        }
        return '';
    };

    const getVariantValue = (productId, variantIndex, field) => {
        const product = products.find(p => p._id === productId);
        if (!product) return '';
        const currentWeights = getProductWeights(product);
        const weight = currentWeights[variantIndex] || {};

        if (field === 'stock') {
            // Treat the top product stock as the real stock quantity
            return getRealProductStock(product);
        }

        if (field === 'inStock') {
            if (weight.inStock !== undefined && weight.inStock !== '' && weight.inStock !== null) {
                return weight.inStock;
            }
            return getProductValue(product, 'inStock');
        }

        return weight[field] !== undefined ? weight[field] : '';
    };

    const isVariantEdited = (productId, variantIndex, field) => {
        const product = products.find(p => p._id === productId);
        if (!product || !editedProducts[productId]?.weights) return false;
        const originalWeights = product.weights || [];
        const currentWeights = editedProducts[productId].weights;
        if (variantIndex >= originalWeights.length) return true; // Newly added variant
        if (field === 'stock') {
            const originalStock = product.stock !== undefined ? product.stock : 0;
            const currentStock = editedProducts[productId]?.stock !== undefined ? editedProducts[productId].stock : originalStock;
            return originalStock !== currentStock;
        }
        return originalWeights[variantIndex]?.[field] !== currentWeights[variantIndex]?.[field];
    };

    const handleSaveAll = async () => {
        setSaving(true);
        const changedProductIds = Object.keys(editedProducts);
        let successCount = 0;
        let failCount = 0;

        try {
            const token = localStorage.getItem('adminToken');

            for (const productId of changedProductIds) {
                const changes = editedProducts[productId];
                const originalProduct = products.find(p => p._id === productId);
                if (!originalProduct) continue;

                let updatedWeights = changes.weights 
                    ? [...changes.weights] 
                    : [...(originalProduct.weights || [])];

                // Treat top stock as the real product inventory pool
                const realStockRaw = changes.stock !== undefined 
                    ? changes.stock 
                    : (originalProduct.stock !== undefined ? originalProduct.stock : (updatedWeights[0]?.stock || 0));
                const realStock = realStockRaw === '' ? 0 : (parseInt(realStockRaw) || 0);

                const inStockStatus = changes.inStock !== undefined
                    ? (changes.inStock === true || changes.inStock === 'true')
                    : (realStock > 0 && originalProduct.inStock !== false);

                // Ensure clean numbers and validity, with each variant inheriting realStock
                updatedWeights = updatedWeights.map(w => {
                    const price = parseFloat(w.price) || 0;
                    const offerPrice = (w.offerPrice !== '' && w.offerPrice !== null && w.offerPrice !== undefined)
                        ? parseFloat(w.offerPrice) || 0
                        : price;
                    return {
                        ...w,
                        weight: String(w.weight || '').trim(),
                        unit: w.unit || 'kg',
                        price: price,
                        offerPrice: Math.min(price, offerPrice),
                        stock: realStock,
                        inStock: inStockStatus
                    };
                });

                const updateData = {
                    weights: updatedWeights,
                    stock: realStock,
                    inStock: inStockStatus
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
            }

            if (successCount > 0) {
                toast.success(`Successfully updated ${successCount} products`);
                setEditedProducts({});
                setNewVariantForms({});
                setIsAddingVariant({});
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
                                        const productWeights = getProductWeights(product);

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
                                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-[#7aa2f7]" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className={`font-medium ${tw.textPrimary} line-clamp-1`}>{product.name}</p>
                                                                        <span className="px-1.5 py-0.5 bg-[#7aa2f7]/10 text-[#7aa2f7] border border-[#7aa2f7]/30 rounded text-[10px] font-semibold">
                                                                            {productWeights.length} variant{productWeights.length > 1 ? 's' : ''}
                                                                        </span>
                                                                    </div>
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
                                                {isExpanded && (
                                                    <tr className="bg-[#1a1b26]/60 border-b border-[#414868]/40">
                                                        <td colSpan="6" className="px-4 py-4">
                                                            <div className="ml-8 mr-4 space-y-3">
                                                                {/* Header with Title & Add Variant Button */}
                                                                <div className="flex items-center justify-between pb-1 border-b border-[#414868]/30">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-bold uppercase tracking-wider text-[#7aa2f7]">
                                                                            Variants for {product.name} ({productWeights.length})
                                                                        </span>
                                                                        <span className="text-[11px] text-[#9aa5ce]">
                                                                            &bull; Manage sizes, MRP, selling price & stock
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const willOpen = !isAddingVariant[product._id];
                                                                            if (willOpen && !newVariantForms[product._id]) {
                                                                                setNewVariantForms(prev => ({
                                                                                    ...prev,
                                                                                    [product._id]: {
                                                                                        weight: '',
                                                                                        unit: 'kg',
                                                                                        price: '',
                                                                                        offerPrice: '',
                                                                                        stock: getRealProductStock(product),
                                                                                        inStock: true
                                                                                    }
                                                                                }));
                                                                            }
                                                                            setIsAddingVariant(prev => ({
                                                                                ...prev,
                                                                                [product._id]: willOpen
                                                                            }));
                                                                        }}
                                                                        className="px-3 py-1 bg-[#7aa2f7]/20 hover:bg-[#7aa2f7]/30 text-[#7aa2f7] hover:text-white border border-[#7aa2f7]/40 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                        {isAddingVariant[product._id] ? 'Cancel Adding' : 'Add New Variant'}
                                                                    </button>
                                                                </div>

                                                                {/* Inline Add Variant Form */}
                                                                {isAddingVariant[product._id] && (
                                                                    <div className="p-3.5 bg-[#1f2335] border border-[#7aa2f7]/40 rounded-xl space-y-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                                <Plus className="w-3.5 h-3.5 text-[#7aa2f7]" />
                                                                                Add New Weight Variant
                                                                            </p>
                                                                            <span className="text-[11px] text-[#9aa5ce]">
                                                                                e.g. 500g, 1kg &bull; Stock auto-inherits {getRealProductStock(product)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                                                                            <div>
                                                                                <label className="text-[10px] text-[#9aa5ce] uppercase font-semibold block mb-1">Weight Label</label>
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="e.g. 500 or 1"
                                                                                    value={newVariantForms[product._id]?.weight || ''}
                                                                                    onChange={(e) => setNewVariantForms(prev => ({
                                                                                        ...prev,
                                                                                        [product._id]: { ...prev[product._id], weight: e.target.value }
                                                                                    }))}
                                                                                    className={`w-full px-2.5 py-1.5 text-xs ${tw.bgSecondary} border ${tw.borderPrimary} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#7aa2f7]`}
                                                                                />
                                                                            </div>

                                                                            <div>
                                                                                <label className="text-[10px] text-[#9aa5ce] uppercase font-semibold block mb-1">Unit</label>
                                                                                <select
                                                                                    value={newVariantForms[product._id]?.unit || 'kg'}
                                                                                    onChange={(e) => setNewVariantForms(prev => ({
                                                                                        ...prev,
                                                                                        [product._id]: { ...prev[product._id], unit: e.target.value }
                                                                                    }))}
                                                                                    className={`w-full px-2.5 py-1.5 text-xs ${tw.bgSecondary} border ${tw.borderPrimary} rounded-lg text-white focus:outline-none focus:border-[#7aa2f7]`}
                                                                                >
                                                                                    {ALLOWED_UNITS.map(u => (
                                                                                        <option key={u} value={u}>{u}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>

                                                                            <div>
                                                                                <label className="text-[10px] text-[#9aa5ce] uppercase font-semibold block mb-1">Normal Price (MRP ₹)</label>
                                                                                <input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    placeholder="e.g. 350"
                                                                                    value={newVariantForms[product._id]?.price || ''}
                                                                                    onChange={(e) => setNewVariantForms(prev => ({
                                                                                        ...prev,
                                                                                        [product._id]: { ...prev[product._id], price: e.target.value }
                                                                                    }))}
                                                                                    className={`w-full px-2.5 py-1.5 text-xs ${tw.bgSecondary} border ${tw.borderPrimary} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#7aa2f7]`}
                                                                                />
                                                                            </div>

                                                                            <div>
                                                                                <label className="text-[10px] text-[#9aa5ce] uppercase font-semibold block mb-1">Offer Price (Selling ₹)</label>
                                                                                <input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    placeholder="e.g. 320"
                                                                                    value={newVariantForms[product._id]?.offerPrice || ''}
                                                                                    onChange={(e) => setNewVariantForms(prev => ({
                                                                                        ...prev,
                                                                                        [product._id]: { ...prev[product._id], offerPrice: e.target.value }
                                                                                    }))}
                                                                                    className={`w-full px-2.5 py-1.5 text-xs ${tw.bgSecondary} border ${tw.borderPrimary} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#7aa2f7]`}
                                                                                />
                                                                            </div>

                                                                            <div>
                                                                                <label className="text-[10px] text-[#9aa5ce] uppercase font-semibold block mb-1">
                                                                                    Stock Qty (Real: {getRealProductStock(product)})
                                                                                </label>
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    placeholder={String(getRealProductStock(product))}
                                                                                    value={newVariantForms[product._id]?.stock !== undefined ? newVariantForms[product._id]?.stock : getRealProductStock(product)}
                                                                                    onChange={(e) => setNewVariantForms(prev => ({
                                                                                        ...prev,
                                                                                        [product._id]: { ...prev[product._id], stock: e.target.value }
                                                                                    }))}
                                                                                    className={`w-full px-2.5 py-1.5 text-xs ${tw.bgSecondary} border ${tw.borderPrimary} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#7aa2f7]`}
                                                                                />
                                                                            </div>

                                                                            <div>
                                                                                <label className="text-[10px] text-[#9aa5ce] uppercase font-semibold block mb-1">Status</label>
                                                                                <select
                                                                                    value={newVariantForms[product._id]?.inStock !== false ? 'true' : 'false'}
                                                                                    onChange={(e) => setNewVariantForms(prev => ({
                                                                                        ...prev,
                                                                                        [product._id]: { ...prev[product._id], inStock: e.target.value === 'true' }
                                                                                    }))}
                                                                                    className={`w-full px-2.5 py-1.5 text-xs ${tw.bgSecondary} border ${tw.borderPrimary} rounded-lg text-white focus:outline-none focus:border-[#7aa2f7]`}
                                                                                >
                                                                                    <option value="true">In Stock</option>
                                                                                    <option value="false">Out of Stock</option>
                                                                                </select>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex justify-end gap-2 pt-1 border-t border-[#414868]/30">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setIsAddingVariant(prev => ({ ...prev, [product._id]: false }))}
                                                                                className="px-3 py-1.5 text-xs text-[#9aa5ce] hover:text-white"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleAddVariant(product._id)}
                                                                                className="px-4 py-1.5 bg-[#7aa2f7] hover:bg-[#7aa2f7]/90 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                                                                            >
                                                                                <Plus className="w-3.5 h-3.5" />
                                                                                Add Variant to Table
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Variants Table */}
                                                                <div className="overflow-x-auto rounded-xl border border-[#414868]/40">
                                                                    <table className="w-full min-w-full">
                                                                        <thead>
                                                                            <tr className={`border-b ${tw.borderPrimary} bg-[#1f2335]`}>
                                                                                <th className={`px-3 py-2 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Variant (Weight & Unit)</th>
                                                                                <th className={`px-3 py-2 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Normal Price (₹)</th>
                                                                                <th className={`px-3 py-2 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Offer Price (₹)</th>
                                                                                <th className={`px-3 py-2 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Stock</th>
                                                                                <th className={`px-3 py-2 text-left text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Status</th>
                                                                                <th className={`px-3 py-2 text-right text-xs font-medium ${tw.textSecondary} uppercase tracking-wider`}>Action</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {productWeights.map((weight, index) => (
                                                                                <tr key={index} className={`border-b ${tw.borderPrimary} last:border-b-0 hover:bg-[#414868]/20`}>
                                                                                    <td className="px-3 py-2">
                                                                                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                                                            <input
                                                                                                type="text"
                                                                                                value={weight.weight || ''}
                                                                                                onChange={(e) => handleVariantChange(product._id, index, 'weight', e.target.value)}
                                                                                                className={`w-16 px-2 py-1 text-xs ${tw.bgSecondary} border ${tw.borderPrimary} rounded text-white focus:outline-none focus:border-[#7aa2f7]`}
                                                                                                placeholder="Weight"
                                                                                            />
                                                                                            <select
                                                                                                value={weight.unit || 'kg'}
                                                                                                onChange={(e) => handleVariantChange(product._id, index, 'unit', e.target.value)}
                                                                                                className={`px-2 py-1 text-xs ${tw.bgSecondary} border ${tw.borderPrimary} rounded text-white focus:outline-none focus:border-[#7aa2f7]`}
                                                                                            >
                                                                                                {ALLOWED_UNITS.map(u => (
                                                                                                    <option key={u} value={u}>{u}</option>
                                                                                                ))}
                                                                                            </select>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            min="0"
                                                                                            value={getVariantValue(product._id, index, 'price')}
                                                                                            onChange={(e) => handleVariantChange(product._id, index, 'price', e.target.value)}
                                                                                            className={`w-24 px-2 py-1 ${tw.bgSecondary} border ${isVariantEdited(product._id, index, 'price') ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded focus:outline-none focus:ring-1 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                                                            placeholder="MRP"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                                                                        <input
                                                                                            type="number"
                                                                                            step="0.01"
                                                                                            min="0"
                                                                                            value={getVariantValue(product._id, index, 'offerPrice')}
                                                                                            onChange={(e) => handleVariantChange(product._id, index, 'offerPrice', e.target.value)}
                                                                                            className={`w-24 px-2 py-1 ${tw.bgSecondary} border ${isVariantEdited(product._id, index, 'offerPrice') ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded focus:outline-none focus:ring-1 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                                                            placeholder="Selling"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                                                                        <input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            value={getVariantValue(product._id, index, 'stock')}
                                                                                            onChange={(e) => handleVariantChange(product._id, index, 'stock', e.target.value)}
                                                                                            className={`w-20 px-2 py-1 ${tw.bgSecondary} border ${isVariantEdited(product._id, index, 'stock') ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded focus:outline-none focus:ring-1 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                                                                        <select
                                                                                            value={getVariantValue(product._id, index, 'inStock').toString()}
                                                                                            onChange={(e) => handleVariantChange(product._id, index, 'inStock', e.target.value === 'true')}
                                                                                            className={`px-2 py-1 text-xs ${tw.bgSecondary} border ${isVariantEdited(product._id, index, 'inStock') ? 'border-[#7aa2f7] ring-1 ring-[#7aa2f7]' : tw.borderPrimary} rounded focus:outline-none focus:ring-1 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                                                                                        >
                                                                                            <option value="true">In Stock</option>
                                                                                            <option value="false">Out of Stock</option>
                                                                                        </select>
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                                                                        {productWeights.length > 1 && (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleRemoveVariant(product._id, index)}
                                                                                                className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                                                                                                title="Remove this variant"
                                                                                            >
                                                                                                <Trash2 className="w-4 h-4" />
                                                                                            </button>
                                                                                        )}
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