import React, { useState, useEffect } from 'react';
import { useAppContext } from "../../context/AppContext.jsx";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, setUser } = useAppContext();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      // Reset image error when user changes
      setImageError(false);
    }
  }, [user]);

  // Function to generate default avatar URL
  const getDefaultAvatar = (name = 'User') => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=005650&color=fff&size=150&bold=true&length=1`;
  };

  // Function to handle image loading errors
  const handleImageError = () => {
    setImageError(true);
  };

  // Function to get the correct image source
  const getImageSrc = () => {
    if (imageError || !user?.photo) {
      return getDefaultAvatar(user?.name);
    }
    return user.photo;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedUser = {
        ...user,
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
      toast.success('Profile updated successfully! 🎉');

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <motion.div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005650] mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600 text-lg">Complete account information</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Profile Overview Card */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              {/* Profile Photo */}
              <motion.div
                className="mb-4"
                whileHover={{ scale: 1.05 }}
              >
                <div className="relative inline-block">
                  <motion.img
                    src={getImageSrc()}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#005650] shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    onError={handleImageError}
                    loading="lazy"
                  />
                  <motion.div
                    className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.2 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>

              <h2 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h2>
              <p className="text-gray-500 text-sm mb-4">{user.email}</p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.7, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                  <span className="text-green-800 font-medium text-sm">Account Active</span>
                </div>
              </div>

              <motion.button
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-[#005650] hover:bg-[#004440] text-white py-3 px-4 rounded-xl transition-all duration-300 font-medium shadow-lg"
              >
                ✏️ Edit Profile
              </motion.button>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -3 }}
            >
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <motion.button
                  onClick={() => navigate('/orders')}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="w-full flex items-center gap-3 text-left p-3 rounded-lg border border-gray-200 hover:border-[#005650] hover:bg-[#005650] hover:text-white transition-all duration-300"
                >
                  <span className="text-lg">📦</span>
                  <span className="flex-1">
                    <div className="font-medium">My Orders</div>
                    <div className="text-xs opacity-75">View order history</div>
                  </span>
                </motion.button>

                <motion.button
                  onClick={() => navigate('/products')}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="w-full flex items-center gap-3 text-left p-3 rounded-lg border border-gray-200 hover:border-[#005650] hover:bg-[#005650] hover:text-white transition-all duration-300"
                >
                  <span className="text-lg">🛒</span>
                  <span className="flex-1">
                    <div className="font-medium">Continue Shopping</div>
                    <div className="text-xs opacity-75">Browse products</div>
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Main Profile Information */}
          <div className="lg:col-span-3">
            <motion.div
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Profile Information</h3>
                {!isEditing && (
                  <motion.div
                    className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >

                  </motion.div>
                )}
              </div>

              {!isEditing ? (
                <motion.div
                  className="space-y-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.1 }}
                >
                  {/* Personal Information */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">👤 Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-gray-900 font-medium">{user.name}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-gray-900 font-medium">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-gray-900 font-medium">
                              {user.phone || <span className="text-gray-400 italic">Not provided</span>}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">User ID</label>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-gray-900 font-mono text-sm">{user._id}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Account Details */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 Account Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.div
                        className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                        whileHover={{ y: -2 }}
                      >
                        <label className="block text-sm font-medium text-blue-700 mb-1">Account Type</label>
                        <p className="text-blue-900 font-medium">{user.isAdmin ? 'Administrator' : 'Standard User'}</p>
                      </motion.div>
                      <motion.div
                        className="bg-green-50 border border-green-200 rounded-xl p-4"
                        whileHover={{ y: -2 }}
                      >
                        <label className="block text-sm font-medium text-green-700 mb-1">Account Status</label>
                        <p className="text-green-900 font-medium">{user.active ? 'Active' : 'Active'}</p>
                      </motion.div>
                      <motion.div
                        className="bg-purple-50 border border-purple-200 rounded-xl p-4"
                        whileHover={{ y: -2 }}
                      >
                        <label className="block text-sm font-medium text-purple-700 mb-1">Member Since</label>
                        <p className="text-purple-900 font-medium">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'Recently'}
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>


                </motion.div>
              ) : (
                <motion.form
                  onSubmit={handleSaveProfile}
                  className="space-y-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-6">Edit Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Full Name *</label>
                        <motion.input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#005650] focus:border-transparent transition-all duration-300"
                          placeholder="Enter your full name"
                          whileFocus={{ scale: 1.02 }}
                        />
                      </motion.div>

                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Email Address</label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-sm text-gray-400 mt-2">Email cannot be changed</p>
                      </motion.div>

                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Phone Number</label>
                        <motion.input
                          type="number"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          placeholder="Enter your phone number"
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#005650] focus:border-transparent transition-all duration-300"
                          whileFocus={{ scale: 1.02 }}
                        />
                      </motion.div>

                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Delivery Address</label>
                        <motion.textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter your complete delivery address"
                          rows="3"
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-[#005650] focus:border-transparent transition-all duration-300 resize-none"
                          whileFocus={{ scale: 1.02 }}
                        />
                      </motion.div>
                    </div>
                  </div>

                  <motion.div
                    className="flex space-x-4 pt-6 border-t border-gray-200"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    <motion.button
                      type="button"
                      onClick={handleCancelEdit}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 px-6 rounded-xl transition-all duration-300 font-medium text-lg"
                      disabled={loading}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 bg-[#005650] hover:bg-[#004440] text-white py-4 px-6 rounded-xl transition-all duration-300 font-medium text-lg flex items-center justify-center disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <motion.div
                            className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          Saving Changes...
                        </>
                      ) : (
                        '💾 Save Changes'
                      )}
                    </motion.button>
                  </motion.div>
                </motion.form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;