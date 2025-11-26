// BulkEditProducts.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Search, Filter, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const BulkEditProducts = ({ products, onUpdate, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editedProducts, setEditedProducts] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  const categories = [
    'Vegetables', 'Fruits', 'Beverages', 'Instant', 'Dairy', 
    'Bakery', 'Grains', 'Meat', 'Snacks', 'Others', 
    'Seafood', 'Frozen', 'Household'
  ];

  // Initialize edited products
  useEffect(() => {
    const initialEditedProducts = {};
    products.forEach(product => {
      initialEditedProducts[product._id] = {
        ...product,
        weights: product.weights?.map(weight => ({ ...weight })) || []
      };
    });
    setEditedProducts(initialEditedProducts);
  }, [products]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePriceChange = (productId, weightIndex, field, value) => {
    setEditedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        weights: prev[productId].weights.map((weight, index) => 
          index === weightIndex 
            ? { ...weight, [field]: parseFloat(value) || 0 }
            : weight
        )
      }
    }));
  };

  const handleStockChange = (productId, field, value) => {
    setEditedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: field === 'stock' ? parseInt(value) || 0 : value === 'true'
      }
    }));
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      const allSelected = {};
      filteredProducts.forEach(product => {
        allSelected[product._id] = true;
      });
      setEditedProducts(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          if (allSelected[id]) {
            updated[id].selected = true;
          }
        });
        return updated;
      });
    } else {
      setEditedProducts(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          updated[id].selected = false;
        });
        return updated;
      });
    }
  };

  const handleProductSelect = (productId) => {
    setEditedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: !prev[productId].selected
      }
    }));
  };

  const getSelectedProducts = () => {
    return Object.values(editedProducts).filter(product => product.selected);
  };

  const hasChanges = (productId) => {
    const originalProduct = products.find(p => p._id === productId);
    const editedProduct = editedProducts[productId];
    
    if (!originalProduct || !editedProduct) return false;

    // Check stock changes
    if (originalProduct.stock !== editedProduct.stock) return true;
    if (originalProduct.inStock !== editedProduct.inStock) return true;

    // Check price changes
    if (originalProduct.weights?.length !== editedProduct.weights?.length) return true;
    
    for (let i = 0; i < (originalProduct.weights?.length || 0); i++) {
      const originalWeight = originalProduct.weights[i];
      const editedWeight = editedProduct.weights[i];
      
      if (originalWeight.price !== editedWeight.price || 
          originalWeight.offerPrice !== editedWeight.offerPrice) {
        return true;
      }
    }

    return false;
  };

  const saveAllChanges = async () => {
    const productsToUpdate = Object.values(editedProducts).filter(product => 
      product.selected && hasChanges(product._id)
    );

    if (productsToUpdate.length === 0) {
      toast.error('No changes to save');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      let successCount = 0;

      for (const product of productsToUpdate) {
        const updateData = {
          stock: product.stock,
          inStock: product.inStock,
          weights: product.weights
        };

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${product._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });

        const data = await response.json();
        if (data.success) {
          successCount++;
        }
      }

      toast.success(`Successfully updated ${successCount} products`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating products:', error);
      toast.error('Failed to update some products');
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async (productId) => {
    const product = editedProducts[productId];
    if (!hasChanges(productId)) {
      toast.error('No changes to save');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const updateData = {
        stock: product.stock,
        inStock: product.inStock,
        weights: product.weights
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product updated successfully');
        onUpdate();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = getSelectedProducts().length;
  const changedCount = Object.values(editedProducts).filter(product => 
    product.selected && hasChanges(product._id)
  ).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold">Bulk Edit Products</h2>
            <p className="text-gray-600">
              {selectedCount} selected • {changedCount} with changes • {filteredProducts.length} total
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span>Select All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => {
              const editedProduct = editedProducts[product._id];
              const hasProductChanges = hasChanges(product._id);

              return (
                <div
                  key={product._id}
                  className={`border rounded-lg p-4 ${
                    editedProduct?.selected 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-white'
                  } ${hasProductChanges ? 'ring-2 ring-blue-200' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={editedProduct?.selected || false}
                        onChange={() => handleProductSelect(product._id)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-600">SKU: {product.sku}</span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {product.category}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Stock:</span>
                              <input
                                type="number"
                                value={editedProduct?.stock || 0}
                                onChange={(e) => handleStockChange(product._id, 'stock', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                min="0"
                              />
                            </div>
                            
                            <select
                              value={editedProduct?.inStock?.toString() || 'true'}
                              onChange={(e) => handleStockChange(product._id, 'inStock', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="true">In Stock</option>
                              <option value="false">Out of Stock</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Variants */}
                  <div className="ml-7">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Price Variants:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {editedProduct?.weights?.map((weight, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">
                              {weight.weight} {weight.unit && `(${weight.unit})`}
                            </span>
                            {hasChanges(product._id) && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Original Price</label>
                              <input
                                type="number"
                                step="0.01"
                                value={weight.price}
                                onChange={(e) => handlePriceChange(product._id, index, 'price', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                min="0"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Offer Price</label>
                              <input
                                type="number"
                                step="0.01"
                                value={weight.offerPrice}
                                onChange={(e) => handlePriceChange(product._id, index, 'offerPrice', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Button for Individual Product */}
                  {hasProductChanges && (
                    <div className="ml-7 mt-4 flex justify-end">
                      <button
                        onClick={() => saveProduct(product._id)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search criteria.</p>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{selectedCount} products selected</span>
                  <span className="text-gray-600 ml-2">({changedCount} with changes)</span>
                </div>
                <button
                  onClick={saveAllChanges}
                  disabled={loading || changedCount === 0}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {loading ? 'Saving...' : `Save ${changedCount} Products`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BulkEditProducts;