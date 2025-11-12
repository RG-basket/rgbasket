import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, FolderPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const CategoryForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    description: '',
    image: '',
    bgColor: '#FEF6DA',
    active: true
  });
  
  const [loading, setLoading] = useState(false);

  const predefinedColors = [
    '#FEF6DA', '#FEE0E0', '#F0F5DE', '#E1F5EC', 
    '#FEE6CD', '#E0F6FE', '#F1E3F9', '#E8F4FD'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.path) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Since we don't have a categories API yet, save to localStorage
      const existingCategories = JSON.parse(localStorage.getItem('adminCategories') || '[]');
      
      const newCategory = {
        _id: 'cat_' + Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedCategories = [...existingCategories, newCategory];
      localStorage.setItem('adminCategories', JSON.stringify(updatedCategories));

      toast.success('Category created successfully!');
      
      // Redirect back to products page
      setTimeout(() => {
        window.location.href = '/admin/products';
      }, 1000);

    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate path from name
    if (field === 'name') {
      const path = value.toLowerCase().replace(/\s+/g, '-');
      setFormData(prev => ({
        ...prev,
        path: path
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Create New Category
            </h1>
            <p className="text-gray-400 mt-2">Add a new product category to organize your products</p>
          </div>
          <button
            onClick={() => window.location.href = '/admin/products'}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700/50 p-8"
        >
          {/* Category Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Organic Vegetables, Fresh Fruits"
            />
          </div>

          {/* URL Path */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              URL Path *
            </label>
            <div className="flex items-center space-x-3">
              <span className="text-gray-400 text-sm">/products/</span>
              <input
                type="text"
                required
                value={formData.path}
                onChange={(e) => handleChange('path', e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="organic-vegetables"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows="3"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Brief description of this category..."
            />
          </div>

          {/* Background Color */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Background Color
            </label>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('bgColor', color)}
                  className={`h-12 rounded-lg border-2 transition-all ${
                    formData.bgColor === color 
                      ? 'border-white scale-110' 
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.bgColor}
                onChange={(e) => handleChange('bgColor', e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={formData.bgColor}
                onChange={(e) => handleChange('bgColor', e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white font-mono text-sm"
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => handleChange('image', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/category-image.jpg"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-3 mb-8">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleChange('active', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-300">
              Active Category (visible to customers)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-6 border-t border-gray-700/50">
            <button
              type="button"
              onClick={() => window.location.href = '/admin/products'}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Create Category</span>
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Preview */}
        {formData.name && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700/50 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Category Preview</h3>
            <div
              className="p-6 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
              style={{ backgroundColor: formData.bgColor }}
            >
              <div className="flex flex-col items-center justify-center text-center">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt={formData.name}
                    className="w-16 h-16 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                    <FolderPlus className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                <p className="font-semibold text-gray-800">{formData.name}</p>
                {formData.description && (
                  <p className="text-gray-600 text-sm mt-1">{formData.description}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CategoryForm;