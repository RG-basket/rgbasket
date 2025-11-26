import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, MoreVertical, Edit, Trash2,
    Package, CheckCircle, XCircle, Grid, List, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminInputDark from './SharedDark/AdminInputDark';
import AdminTableDark from './SharedDark/AdminTableDark';
import { tw } from '../../config/tokyoNightTheme';

const AdminProductsDark = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [categories, setCategories] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const navigate = useNavigate();

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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/products/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Product deleted successfully');
                fetchProducts();
            } else {
                toast.error('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Error deleting product');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;

        try {
            const token = localStorage.getItem('adminToken');
            // Implement bulk delete API call here
            // For now, we'll delete one by one (ideal to have a bulk endpoint)
            await Promise.all(selectedProducts.map(id =>
                fetch(`${import.meta.env.VITE_API_URL}/api/admin/products/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                })
            ));

            toast.success('Products deleted successfully');
            setSelectedProducts([]);
            fetchProducts();
        } catch (error) {
            console.error('Error bulk deleting:', error);
            toast.error('Failed to delete some products');
        }
    };

    const toggleSelectAll = () => {
        if (selectedProducts.length === filteredProducts.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(filteredProducts.map(p => p._id));
        }
    };

    const toggleSelectProduct = (id) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(pId => pId !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        const productInStock = product.weights?.[0]?.inStock ?? product.inStock ?? true;
        const matchesStock = stockFilter === 'all' ||
            (stockFilter === 'inStock' && productInStock) ||
            (stockFilter === 'outOfStock' && !productInStock);

        return matchesSearch && matchesCategory && matchesStock;
    });

    const columns = [
        {
            key: 'select',
            label: (
                <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-600 bg-[#1f2335] text-[#7aa2f7] focus:ring-[#7aa2f7]"
                />
            ),
            render: (_, product) => (
                <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={() => toggleSelectProduct(product._id)}
                    className="rounded border-gray-600 bg-[#1f2335] text-[#7aa2f7] focus:ring-[#7aa2f7]"
                />
            )
        },
        {
            key: 'name',
            label: 'Product',
            sortable: true,
            render: (_, product) => (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${tw.bgInput} flex items-center justify-center overflow-hidden border ${tw.borderSecondary}`}>
                        {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Package className={`w-5 h-5 ${tw.textSecondary}`} />
                        )}
                    </div>
                    <div>
                        <p className={`font-medium ${tw.textPrimary}`}>{product.name}</p>
                        <p className={`text-xs ${tw.textSecondary}`}>{product.weight} {product.unit}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'category',
            label: 'Category',
            sortable: true,
            render: (cat) => <span className={`px-2 py-1 rounded-md ${tw.bgInput} text-xs ${tw.textSecondary}`}>{cat}</span>
        },
        {
            key: 'price',
            label: 'Price',
            sortable: true,
            render: (_, product) => {
                const weight = product.weights?.[0] || {};
                const price = weight.price || 0;
                const offerPrice = weight.offerPrice || 0;
                return (
                    <div>
                        {offerPrice > 0 ? (
                            <div className="flex flex-col">
                                <span className={`font-medium ${tw.textPrimary}`}>₹{offerPrice}</span>
                                <span className="text-xs text-[#565f89] line-through">₹{price}</span>
                            </div>
                        ) : (
                            <span className={`font-medium ${tw.textPrimary}`}>₹{price}</span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'stock',
            label: 'Stock',
            sortable: true,
            render: (_, product) => {
                const inStock = product.weights?.[0]?.inStock ?? product.inStock ?? true;
                const stock = product.weights?.[0]?.stock ?? product.stock ?? 0;
                return (
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-[#9ece6a]' : 'bg-[#f7768e]'}`}></span>
                        <span className={`text-sm ${inStock ? 'text-[#9ece6a]' : 'text-[#f7768e]'}`}>
                            {inStock ? `In Stock (${stock})` : 'Out of Stock'}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, product) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                        className={`p-1.5 rounded-lg hover:bg-[#7aa2f7]/10 text-[#7aa2f7] transition-colors`}
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(product._id)}
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
                        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Products</h1>
                        <p className={`text-sm ${tw.textSecondary}`}>Manage your product inventory</p>
                    </div>
                    <div className="flex gap-3">
                        <AdminButtonDark
                            variant="secondary"
                            onClick={() => navigate('/admin/products/bulk-edit')}
                        >
                            Bulk Edit
                        </AdminButtonDark>
                        <AdminButtonDark
                            variant="primary"
                            icon={Plus}
                            onClick={() => navigate('/admin/products/new')}
                        >
                            Add Product
                        </AdminButtonDark>
                    </div>
                </div>

                {/* Filters */}
                <div className={`${tw.bgSecondary} p-4 rounded-xl border ${tw.borderPrimary} flex flex-col md:flex-row gap-4 justify-between items-center`}>
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
                        <div className="relative flex-1 max-w-md">
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
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className={`px-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            <select
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                                className={`px-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] ${tw.textPrimary}`}
                            >
                                <option value="all">All Status</option>
                                <option value="inStock">In Stock</option>
                                <option value="outOfStock">Out of Stock</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-l border-[#414868] pl-4">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#7aa2f7]/20 text-[#7aa2f7]' : `${tw.textSecondary} hover:text-[#c0caf5]`}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#7aa2f7]/20 text-[#7aa2f7]' : `${tw.textSecondary} hover:text-[#c0caf5]`}`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedProducts.length > 0 && (
                    <div className={`bg-[#7aa2f7]/10 border border-[#7aa2f7]/20 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2`}>
                        <div className="flex items-center gap-3">
                            <span className={`font-medium ${tw.textPrimary}`}>{selectedProducts.length} selected</span>
                            <button
                                onClick={() => setSelectedProducts([])}
                                className={`text-sm ${tw.textSecondary} hover:text-[#c0caf5] underline`}
                            >
                                Clear selection
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <AdminButtonDark variant="danger" size="sm" icon={Trash2} onClick={handleBulkDelete}>
                                Delete Selected
                            </AdminButtonDark>
                        </div>
                    </div>
                )}

                {/* Content */}
                {viewMode === 'list' ? (
                    <AdminTableDark
                        columns={columns}
                        data={filteredProducts}
                        isLoading={loading}
                        itemsPerPage={10}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map(product => {
                            const inStock = product.weights?.[0]?.inStock ?? product.inStock ?? true;
                            const price = product.weights?.[0]?.price || 0;
                            const offerPrice = product.weights?.[0]?.offerPrice || 0;

                            return (
                                <div key={product._id} className={`${tw.bgSecondary} rounded-xl border ${tw.borderPrimary} overflow-hidden hover:border-[#7aa2f7]/50 transition-all group`}>
                                    <div className="relative aspect-square">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className={`w-full h-full ${tw.bgInput} flex items-center justify-center`}>
                                                <Package className={`w-12 h-12 ${tw.textSecondary}`} />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-md ${inStock ? 'bg-[#9ece6a]/80 text-[#1a1b26]' : 'bg-[#f7768e]/80 text-white'
                                                }`}>
                                                {inStock ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </div>
                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                                                className="p-2 bg-white rounded-full text-[#1a1b26] hover:scale-110 transition-transform"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product._id)}
                                                className="p-2 bg-[#f7768e] rounded-full text-white hover:scale-110 transition-transform"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className={`font-medium ${tw.textPrimary} line-clamp-1`}>{product.name}</h3>
                                                <p className={`text-xs ${tw.textSecondary}`}>{product.category}</p>
                                            </div>
                                            <div className="text-right">
                                                {offerPrice > 0 ? (
                                                    <>
                                                        <p className={`font-bold ${tw.textPrimary}`}>₹{offerPrice}</p>
                                                        <p className="text-xs text-[#565f89] line-through">₹{price}</p>
                                                    </>
                                                ) : (
                                                    <p className={`font-bold ${tw.textPrimary}`}>₹{price}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayoutDark>
    );
};

export default AdminProductsDark;
