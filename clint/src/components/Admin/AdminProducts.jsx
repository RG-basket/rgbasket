import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Package, Search, Filter, Edit3, Image as ImageIcon, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import BulkEditProducts from './BulkEditProducts.jsx';

// Product Form Modal Component
const ProductFormModal = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    sku: '',
    inStock: true,
    stock: 0,
    weights: [{ weight: '', unit: '', price: 0, offerPrice: 0 }],
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);

  const categories = [
    'Vegetables', 'Fruits', 'Beverages', 'Instant', 'Dairy', 
    'Bakery', 'Grains', 'Meat', 'Snacks', 'Others', 
    'Seafood', 'Frozen', 'Household'
  ];

  const units = ['kg', 'g', 'ml', 'l', 'piece', 'pack', 'dozen', 'bundle'];

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        sku: product.sku || '',
        inStock: product.inStock !== undefined ? product.inStock : true,
        stock: product.stock || 0,
        weights: product.weights?.length > 0 ? product.weights.map(w => ({
          weight: w.weight || '',
          unit: w.unit || '',
          price: w.price || 0,
          offerPrice: w.offerPrice || 0
        })) : [{ weight: '', unit: '', price: 0, offerPrice: 0 }],
        images: product.images || []
      });
    }
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Append basic fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('sku', formData.sku);
      submitData.append('inStock', formData.inStock);
      submitData.append('stock', formData.stock);
      submitData.append('weights', JSON.stringify(formData.weights));

      // Append new image files
      imageFiles.forEach(file => {
        submitData.append('images', file);
      });

      await onSave(submitData, product?._id);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (index, field, value) => {
    const updatedWeights = [...formData.weights];
    updatedWeights[index] = {
      ...updatedWeights[index],
      [field]: field === 'price' || field === 'offerPrice' ? parseFloat(value) || 0 : value
    };
    setFormData(prev => ({ ...prev, weights: updatedWeights }));
  };

  const addWeightVariant = () => {
    setFormData(prev => ({
      ...prev,
      weights: [...prev.weights, { weight: '', unit: '', price: 0, offerPrice: 0 }]
    }));
  };

  const removeWeightVariant = (index) => {
    if (formData.weights.length > 1) {
      setFormData(prev => ({
        ...prev,
        weights: prev.weights.filter((_, i) => i !== index)
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setImageFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newImages = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const removeImage = (index) => {
    // Remove from both preview and files
    const isNewImage = index >= (formData.images.length - imageFiles.length);
    
    if (isNewImage) {
      const fileIndex = index - (formData.images.length - imageFiles.length);
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
    }
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                 
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={formData.inStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="inStock" className="ml-2 text-sm text-gray-700">
                    In Stock
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Price Variants */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Price Variants</h3>
              <button
                type="button"
                onClick={addWeightVariant}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
              >
                Add Variant
              </button>
            </div>

            <div className="space-y-3">
              {formData.weights.map((weight, index) => (
                <div key={index} className="flex items-end space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight/Size *
                    </label>
                    <input
                      type="text"
                      required
                      value={weight.weight}
                      onChange={(e) => handleWeightChange(index, 'weight', e.target.value)}
                      placeholder="e.g., 1, 500, 2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit *
                    </label>
                    <select
                      required
                      value={weight.unit}
                      onChange={(e) => handleWeightChange(index, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Unit</option>
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={weight.price}
                      onChange={(e) => handleWeightChange(index, 'price', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offer Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={weight.offerPrice}
                      onChange={(e) => handleWeightChange(index, 'offerPrice', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  {formData.weights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWeightVariant(index)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded mb-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <h3 className="text-lg font-medium mb-4">Product Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <label className="flex items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
              <Upload className="w-6 h-6 text-gray-400 mr-2" />
              <span className="text-gray-600">Upload Images</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  
  const categories = [
    'Vegetables', 'Fruits', 'Beverages', 'Instant', 'Dairy', 
    'Bakery', 'Grains', 'Meat', 'Snacks', 'Others', 
    'Seafood', 'Frozen', 'Household'
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveProduct = async (formData, productId = null) => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = productId 
        ? `${import.meta.env.VITE_API_URL}/api/products/${productId}`
        : `${import.meta.env.VITE_API_URL}/api/products`;
      
      const method = productId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Product ${productId ? 'updated' : 'created'} successfully`);
        fetchProducts();
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Failed to ${productId ? 'update' : 'create'} product`);
      return false;
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  // Quick edit functions
  const toggleStock = async (productId, currentStock) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inStock: !currentStock })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Product ${!currentStock ? 'added to' : 'removed from'} stock`);
        fetchProducts();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const updateStock = async (productId, newStock) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock: parseInt(newStock) })
      });

      const data = await response.json();

      if (data.success) {
        fetchProducts();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating stock quantity:', error);
      toast.error('Failed to update stock quantity');
    }
  };

  const updatePrice = async (productId, weightIndex, newPrice) => {
    const product = products.find(p => p._id === productId);
    if (!product || !product.weights) return;

    const updatedWeights = [...product.weights];
    updatedWeights[weightIndex] = {
      ...updatedWeights[weightIndex],
      offerPrice: parseFloat(newPrice)
    };

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ weights: updatedWeights })
      });

      const data = await response.json();

      if (data.success) {
        fetchProducts();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleCloseForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600">Manage your product catalog ({filteredProducts.length} products)</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowProductForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => setShowBulkEdit(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Bulk Edit</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            onChange={(e) => {
              if (e.target.value === 'inStock') {
                setProducts(prev => prev.filter(p => p.inStock));
              } else if (e.target.value === 'outOfStock') {
                setProducts(prev => prev.filter(p => !p.inStock));
              } else {
                fetchProducts();
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Stock Status</option>
            <option value="inStock">In Stock Only</option>
            <option value="outOfStock">Out of Stock</option>
          </select>

          <button
            onClick={fetchProducts}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 relative group">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded shadow-lg"
                    title="Edit Product"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteProduct(product._id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded shadow-lg"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Stock Badge */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                  product.inStock 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 truncate flex-1 mr-2">{product.name}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {/* Stock Management */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stock:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleStock(product._id, product.inStock)}
                        className={`w-8 h-4 rounded-full transition-colors ${
                          product.inStock ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${
                          product.inStock ? 'translate-x-4' : 'translate-x-1'
                        }`} />
                      </button>
                      <input
                        type="number"
                        value={product.stock || 0}
                        onChange={(e) => updateStock(product._id, e.target.value)}
                        onBlur={(e) => updateStock(product._id, e.target.value)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Price Variants */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600 font-medium">Price Variants:</div>
                    {product.weights?.map((weight, index) => (
                      <div key={index} className="flex justify-between items-center text-xs bg-gray-50 px-2 py-1 rounded">
                        <span className="font-medium">
                          {weight.weight} {weight.unit && `(${weight.unit})`}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-500 line-through text-xs">
                            ₹{weight.price}
                          </span>
                          <input
                            type="number"
                            value={weight.offerPrice}
                            onChange={(e) => updatePrice(product._id, index, e.target.value)}
                            onBlur={(e) => updatePrice(product._id, index, e.target.value)}
                            className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SKU */}
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>SKU: {product.sku}</span>
                    <span>{product.weights?.length || 0} variants</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300"
        >
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or add a new product.</p>
          <button
            onClick={() => setShowProductForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Add Your First Product
          </button>
        </motion.div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductFormModal
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={handleCloseForm}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <BulkEditProducts
          products={filteredProducts}
          onUpdate={fetchProducts}
          onClose={() => setShowBulkEdit(false)}
        />
      )}
    </div>
  );
};

export default AdminProducts;