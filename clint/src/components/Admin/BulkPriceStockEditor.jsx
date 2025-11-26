import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Save, X, Search, Filter, DollarSign, Package, TrendingUp,
    CheckCircle, AlertCircle, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminButton, AdminInput } from './Shared';
import AdminLayout from './AdminLayout';

const BulkPriceStockEditor = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');

    // Edited products tracking
    const [editedProducts, setEditedProducts] = useState({});

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Failed to fetch categories');
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

    const getProductValue = (product, field) => {
        if (editedProducts[product._id]?.[field] !== undefined) {
            return editedProducts[product._id][field];
        }

        // Get values from weights array structure
        const weight = product.weights?.[0];
        
        if (field === 'normalPrice') {
            return weight?.price || ''; // Normal/MRP price
        }
        if (field === 'offerPrice') {
            return weight?.offerPrice || ''; // Selling/Discounted price
        }
        if (field === 'stock') {
            return weight?.stock || product.stock || '';
        }
        if (field === 'inStock') {
            return weight?.inStock ?? product.inStock ?? true;
        }
        return '';
    };

    const hasChanges = (productId) => {
        return editedProducts[productId] !== undefined;
    };

    const handleSaveAll = async () => {
        const changedProducts = Object.keys(editedProducts);

        if (changedProducts.length === 0) {
            toast.error('No changes to save');
            return;
        }

        if (!confirm(`Save changes for ${changedProducts.length} product(s)?`)) {
            return;
        }

        setSaving(true);
        const token = localStorage.getItem('adminToken');
        let successCount = 0;
        let errorCount = 0;

        try {
            const updatePromises = changedProducts.map(async (productId) => {
                const changes = editedProducts[productId];
                const updateData = {
                    weights: [{}] // Update weights array structure
                };

                // Build update object for weights[0]
                if (changes.normalPrice !== undefined) {
                    updateData.weights[0].price = parseFloat(changes.normalPrice) || 0;
                }
                if (changes.offerPrice !== undefined) {
                    updateData.weights[0].offerPrice = parseFloat(changes.offerPrice) || 0;
                }
                if (changes.stock !== undefined) {
                    updateData.weights[0].stock = parseInt(changes.stock) || 0;
                }
                if (changes.inStock !== undefined) {
                    updateData.weights[0].inStock = changes.inStock;
                }

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
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                }
            });

            await Promise.all(updatePromises);

            if (successCount > 0) {
                toast.success(`Successfully updated ${successCount} product(s)`);
                setEditedProducts({});
                fetchProducts();
            }

            if (errorCount > 0) {
                toast.error(`Failed to update ${errorCount} product(s)`);
            }
        } catch (error) {
            toast.error('Error saving changes');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (Object.keys(editedProducts).length > 0) {
            if (confirm('Discard all unsaved changes?')) {
                setEditedProducts({});
            }
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

    const changedCount = Object.keys(editedProducts).length;

    return (
        <AdminLayout>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Price & Stock Editor</h1>
                <p className="text-gray-600">Update prices and stock for multiple products at once</p>
            </div>

            {/* Save Bar */}
            {changedCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-gray-900">
                                {changedCount} product{changedCount > 1 ? 's' : ''} modified
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AdminButton
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                disabled={saving}
                            >
                                Discard Changes
                            </AdminButton>
                            <AdminButton
                                size="sm"
                                icon={saving ? Loader : Save}
                                onClick={handleSaveAll}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : `Save ${changedCount} Change${changedCount > 1 ? 's' : ''}`}
                            </AdminButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <AdminInput
                            icon={Search}
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                        <option value="all">All Stock</option>
                        <option value="inStock">In Stock</option>
                        <option value="outOfStock">Out of Stock</option>
                    </select>
                </div>
            </div>

            {/* Products Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading products...</p>
                    </div>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Normal Price (₹)
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Offer Price (₹)
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock Qty
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredProducts.map((product) => (
                                    <tr
                                        key={product._id}
                                        className={`transition-colors ${hasChanges(product._id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {product.images?.[0] ? (
                                                        <img
                                                            src={`${import.meta.env.VITE_API_URL}${product.images[0]}`}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                                    {hasChanges(product._id) && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Modified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-600">{product.category}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={getProductValue(product, 'normalPrice')}
                                                onChange={(e) => handleFieldChange(product._id, 'normalPrice', e.target.value)}
                                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="MRP"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={getProductValue(product, 'offerPrice')}
                                                onChange={(e) => handleFieldChange(product._id, 'offerPrice', e.target.value)}
                                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="Selling price"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <input
                                                type="number"
                                                min="0"
                                                value={getProductValue(product, 'stock')}
                                                onChange={(e) => handleFieldChange(product._id, 'stock', e.target.value)}
                                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <select
                                                value={getProductValue(product, 'inStock') ? 'true' : 'false'}
                                                onChange={(e) => handleFieldChange(product._id, 'inStock', e.target.value === 'true')}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            )}

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                        <p className="font-medium text-gray-900 mb-1">Price Structure:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Normal Price:</strong> MRP/Original price (weights[0].price)</li>
                            <li><strong>Offer Price:</strong> Selling/Discounted price (weights[0].offerPrice)</li>
                            <li>Edit any field to mark a product as modified</li>
                            <li>Changes are highlighted in blue</li>
                            <li>Click "Save Changes" to apply all modifications at once</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default BulkPriceStockEditor;