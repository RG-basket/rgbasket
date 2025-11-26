import React from 'react';

const ProductList = ({
    products,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    selectedProduct,
    setSelectedProduct
}) => {
    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="bg-white rounded-lg shadow border p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Select Product</h3>

            {/* Search */}
            <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border rounded px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />

            {/* Category Filter */}
            <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border rounded px-3 py-2 mb-4 text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
            </select>

            {/* Product List */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {filteredProducts.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm py-4">No products found</p>
                ) : (
                    filteredProducts.map(product => (
                        <div
                            key={product._id}
                            onClick={() => setSelectedProduct(product)}
                            className={`p-3 rounded border cursor-pointer transition-all duration-200 ${selectedProduct?._id === product._id
                                    ? 'bg-green-50 border-green-500 shadow-sm'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {product.images?.[0] ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-10 h-10 object-cover rounded bg-white"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                                        No Img
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{product.category}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductList;
