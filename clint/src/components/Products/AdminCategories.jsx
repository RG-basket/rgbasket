import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL;


const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: '', emoji: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      } else {
        toast.error('Failed to load categories');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error while fetching categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.emoji) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const url = editingId ? `${API_BASE}/api/categories/${editingId}` : `${API_BASE}/api/categories`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Category updated!' : 'Category created!');
        setFormData({ name: '', emoji: '' });
        setEditingId(null);
        fetchCategories();
      } else {
        toast.error(data.message || 'Error saving category');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cat) => {
    setFormData({ name: cat.name, emoji: cat.emoji });
    setEditingId(cat._id);
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Category deleted');
        fetchCategories();
      } else {
        toast.error(data.message || 'Error deleting category');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Categories</h1>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Category name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Emoji (🍎)"
          value={formData.emoji}
          onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editingId ? 'Update Category' : 'Create Category'}
        </button>
      </form>

      <ul className="space-y-2">
        {categories.map(cat => (
          <li key={cat._id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
            <span>{cat.emoji} {cat.name}</span>
            <div className="space-x-3">
              <button onClick={() => startEdit(cat)} className="text-sm text-blue-600 hover:underline">
                Edit
              </button>
              <button onClick={() => deleteCategory(cat._id)} className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminCategories;