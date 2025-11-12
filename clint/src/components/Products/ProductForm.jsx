import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Upload, Package, Plus, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: [''],
    category: '',
    weights: [{ weight: '', price: '', offerPrice: '', unit: 'kg' }],
    stock: 0,
    lowStockThreshold: 10,
    featured: false,
    active: true
  });
  
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const units = ['kg', 'g', 'ml', 'l', 'piece', 'pack', 'dozen', 'bundle'];

  // Fetch categories from localStorage or use default
  useEffect(() => {
    const loadCategories = () => {
      try {
        const savedCategories = localStorage.getItem('productCategories');
        if (savedCategories) {
          setCategories(JSON.parse(savedCategories));
        } else {
          // Default categories
          const defaultCategories = [
            'Vegetables', 'Fruits', 'Beverages', 'Instant', 'Dairy', 
            'Bakery', 'Grains', 'Meat', 'Snacks', 'Others', 
            'Seafood', 'Frozen', 'Household', 'seeds', 'masala'
          ];
          setCategories(defaultCategories);
          localStorage.setItem('productCategories', JSON.stringify(defaultCategories));
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to default categories
        const defaultCategories = [
          'Vegetables', 'Fruits', 'Beverages', 'Instant', 'Dairy', 
          'Bakery', 'Grains', 'Meat', 'Snacks', 'Others', 
          'Seafood', 'Frozen', 'Household', 'seeds', 'masala'
        ];
        setCategories(defaultCategories);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Save categories to localStorage whenever they change
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('productCategories', JSON.stringify(categories));
    }
  }, [categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.category || !formData.weights[0].weight) {
      toast.error('Please fill all required fields');
      return;
    }

    // Validate description has at least one non-empty point
    const validDescription = formData.description.filter(desc => desc.trim() !== '');
    if (validDescription.length === 0) {
      toast.error('Please add at least one description point');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Please login as admin first');
        return;
      }

      const formDataToSend = new FormData();

      // Append basic fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', JSON.stringify(validDescription));
      formDataToSend.append('category', formData.category);
      formDataToSend.append('weights', JSON.stringify(formData.weights));
      formDataToSend.append('stock', formData.stock.toString());
      formDataToSend.append('lowStockThreshold', formData.lowStockThreshold.toString());
      formDataToSend.append('featured', formData.featured.toString());
      formDataToSend.append('active', formData.active.toString());

      // Append images
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product created successfully!');
        // Redirect to products list
        setTimeout(() => {
          window.location.href = '/admin/products';
        }, 1000);
      } else {
        throw new Error(data.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
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
    setFormData(prev => ({
      ...prev,
      description: newDescription
    }));
  };

  const addDescription = () => {
    setFormData(prev => ({
      ...prev,
      description: [...prev.description, '']
    }));
  };

  const removeDescription = (index) => {
    if (formData.description.length > 1) {
      const newDescription = formData.description.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        description: newDescription
      }));
    }
  };

  const handleWeightChange = (index, field, value) => {
    const newWeights = [...formData.weights];
    newWeights[index] = {
      ...newWeights[index],
      [field]: field === 'price' || field === 'offerPrice' ? parseFloat(value) || 0 : value
    };
    setFormData(prev => ({
      ...prev,
      weights: newWeights
    }));
  };

  const addWeight = () => {
    setFormData(prev => ({
      ...prev,
      weights: [...prev.weights, { weight: '', price: '', offerPrice: '', unit: 'kg' }]
    }));
  };

  const removeWeight = (index) => {
    if (formData.weights.length > 1) {
      const newWeights = formData.weights.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        weights: newWeights
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newImages = images.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
    setImages(newImages);
  };

  // Category Management Functions
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === 'manage-categories') {
      setShowCategoryManager(true);
    } else {
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  const addNewCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
      toast.success('New category added');
    } else if (categories.includes(newCategory.trim())) {
      toast.error('Category already exists');
    } else {
      toast.error('Please enter a valid category name');
    }
  };

  const startEditCategory = (category) => {
    setEditingCategory(category);
    setEditCategoryName(category);
  };

  const saveEditCategory = () => {
    if (editCategoryName.trim() && !categories.includes(editCategoryName.trim())) {
      const updatedCategories = categories.map(cat => 
        cat === editingCategory ? editCategoryName.trim() : cat
      );
      setCategories(updatedCategories);
      
      // Update form if the edited category was selected
      if (formData.category === editingCategory) {
        setFormData(prev => ({ ...prev, category: editCategoryName.trim() }));
      }
      
      setEditingCategory(null);
      setEditCategoryName('');
      toast.success('Category updated successfully');
    } else if (categories.includes(editCategoryName.trim())) {
      toast.error('Category name already exists');
    } else {
      toast.error('Please enter a valid category name');
    }
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryName('');
  };

  const deleteCategory = (category) => {
    if (window.confirm(`Are you sure you want to delete the category "${category}"?`)) {
      const updatedCategories = categories.filter(cat => cat !== category);
      setCategories(updatedCategories);
      
      // Clear form if the deleted category was selected
      if (formData.category === category) {
        setFormData(prev => ({ ...prev, category: '' }));
      }
      
      toast.success('Category deleted successfully');
    }
  };

  if (loadingCategories) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Product
            </h1>
            <p className="text-gray-600 mt-2">Add a new product to your store</p>
          </div>
          <button
            onClick={() => window.location.href = '/admin/products'}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category *
              </label>
              {!showCategoryManager ? (
                <div className="space-y-2">
                  <select
                    required
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    <option value="manage-categories">✏️ Manage Categories</option>
                  </select>
                  
                  {/* Quick Add Category */}
                  <div className="flex space-x-2 mt-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Quick add category"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={addNewCategory}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-700">Manage Categories</h4>
                    <button
                      type="button"
                      onClick={() => setShowCategoryManager(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {categories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded">
                        {editingCategory === category ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="text"
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <button
                              type="button"
                              onClick={saveEditCategory}
                              className="text-green-600 hover:text-green-800 text-xs"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditCategory}
                              className="text-gray-600 hover:text-gray-800 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm flex-1">{category}</span>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => startEditCategory(category)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteCategory(category)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Add new category in manager */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={addNewCategory}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Description Points *
            </label>
            <div className="space-y-3">
              {formData.description.map((desc, index) => (
                <div key={index} className="flex gap-3">
                  <textarea
                    type="text"
                    required
                    value={desc}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={`Description point ${index + 1}`}
                  />
                  {formData.description.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDescription(index)}
                      className="px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDescription}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Description Point
              </button>
            </div>
          </div>

          {/* Weights/Variants */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Product Variants *
              </label>
              <button
                type="button"
                onClick={addWeight}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Variant
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.weights.map((weight, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-xl border">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Weight Label *</label>
                    <input
                      type="text"
                      required
                      value={weight.weight}
                      onChange={(e) => handleWeightChange(index, 'weight', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="e.g., 1kg, 500g"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unit *</label>
                    <select
                      required
                      value={weight.unit}
                      onChange={(e) => handleWeightChange(index, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={weight.price}
                      onChange={(e) => handleWeightChange(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Offer Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={weight.offerPrice}
                      onChange={(e) => handleWeightChange(index, 'offerPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    {formData.weights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWeight(index)}
                        className="w-full px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Featured Product</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Product Images
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="product-images"
              />
              <label
                htmlFor="product-images"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload images or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, JPEG up to 5MB (Max 5 images)
                </p>
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => window.location.href = '/admin/products'}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;