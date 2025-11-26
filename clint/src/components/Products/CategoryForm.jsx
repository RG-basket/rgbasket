import React, { useState } from 'react';
import toast from 'react-hot-toast';

const CategoryForm = () => {
  const [formData, setFormData] = useState({ name: '', emoji: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.emoji) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const existing = JSON.parse(localStorage.getItem('adminCategories') || '[]');
      const newCategory = {
        _id: 'cat_' + Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('adminCategories', JSON.stringify([...existing, newCategory]));
      toast.success('Category created!');
      setTimeout(() => (window.location.href = '/admin/products'), 1000);
    } catch (err) {
      toast.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-md mx-auto bg-gray-800 rounded-xl">
      <h2 className="text-xl text-white mb-4">New Category</h2>

      <input
        type="text"
        placeholder="Category name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
      />

      <input
        type="text"
        placeholder="Emoji (🍎)"
        value={formData.emoji}
        onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
        className="w-full mb-3 p-2 rounded bg-gray-700 text-white"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};

export default CategoryForm;