import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Serviceable pincodes for Cuttack
const serviceablePincodes = [
  { pincode: "753001", city: "Cuttack", area: "Buxi Bazaar" },
  { pincode: "753002", city: "Cuttack", area: "Chandinchowk" },
  { pincode: "753003", city: "Cuttack", area: "Chhatra Bazar" },
  { pincode: "753004", city: "Cuttack", area: "College Square" },
  { pincode: "753005", city: "Cuttack", area: "Barabati Stadium" },
  { pincode: "753006", city: "Cuttack", area: "Jobra" },
  { pincode: "753007", city: "Cuttack", area: "Tulasipur" },
  { pincode: "753008", city: "Cuttack", area: "Bidanasi" },
  { pincode: "753009", city: "Cuttack", area: "Rajabagicha" },
  { pincode: "753010", city: "Cuttack", area: "Sikharpur" },
  { pincode: "753011", city: "Cuttack", area: "Bhanpur" },
  { pincode: "753012", city: "Cuttack", area: "A D Market" },
  { pincode: "753013", city: "Cuttack", area: "Omp Square" },
  { pincode: "753014", city: "Cuttack", area: "Avinab Bidanasi" }
];

const AddressForm = ({ user, onAddressSaved, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    alternatePhone: '',
    street: '',
    locality: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: true
  });
  
  const [loading, setLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null); // null, 'valid', 'invalid'

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0, backdropFilter: "blur(0px)" },
    visible: { 
      opacity: 1, 
      backdropFilter: "blur(10px)",
      transition: {
        duration: 0.3
      }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      filter: "blur(10px)"
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.5
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -50,
      filter: "blur(10px)",
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Set user name when component mounts or user changes
  React.useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Only allow numbers for phone and pincode fields
    if ((name === 'phoneNumber' || name === 'alternatePhone' || name === 'pincode') && /\D/.test(value)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Validate pincode in real-time
    if (name === 'pincode') {
      if (value.length === 6) {
        const isValidPincode = serviceablePincodes.some(p => p.pincode === value);
        if (isValidPincode) {
          setPincodeStatus('valid');
          // Auto-fill city and state for valid pincodes
          const pincodeInfo = serviceablePincodes.find(p => p.pincode === value);
          if (pincodeInfo) {
            setFormData(prev => ({
              ...prev,
              city: pincodeInfo.city,
              state: "Odisha",
              country: "India"
            }));
          }
        } else {
          setPincodeStatus('invalid');
          // Clear city and state for invalid pincodes
          setFormData(prev => ({
            ...prev,
            city: "",
            state: "",
            country: ""
          }));
        }
      } else {
        setPincodeStatus(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.fullName || !formData.phoneNumber || !formData.street || 
        !formData.locality || !formData.city || !formData.state || !formData.pincode) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (formData.alternatePhone && !/^\d{10}$/.test(formData.alternatePhone)) {
      toast.error('Please enter a valid 10-digit alternate phone number');
      return;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    // Check if pincode is serviceable
    if (pincodeStatus !== 'valid') {
      toast.error('Please enter a serviceable pincode for Cuttack area');
      return;
    }

    setLoading(true);

    try {
      // Get user ID from different possible properties
      const userId = user?._id || user?.id || user?.user?.id;
      
      if (!userId) {
        throw new Error('User not logged in. Please login first.');
      }

      const addressData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        alternatePhone: formData.alternatePhone,
        street: formData.street,
        locality: formData.locality,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        landmark: formData.landmark,
        isDefault: formData.isDefault,
        user: userId
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData)
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server error: Invalid response format');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        toast.success('Address saved successfully!');
        onAddressSaved(data.address);
      } else {
        throw new Error(data.message || 'Failed to save address');
      }

    } catch (error) {
      console.error('Error saving address:', error);
      
      if (error.message.includes('User not logged in')) {
        // Try localStorage fallback
        try {
          const userId = user?._id || user?.id || user?.user?.id;
          
          if (userId) {
            const addressData = {
              _id: 'addr_' + Date.now(),
              fullName: formData.fullName,
              phoneNumber: formData.phoneNumber,
              alternatePhone: formData.alternatePhone,
              street: formData.street,
              locality: formData.locality,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
              landmark: formData.landmark,
              isDefault: formData.isDefault,
              user: userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            // Save to localStorage
            const existingAddresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
            
            // If setting as default, remove default from others
            if (addressData.isDefault) {
              existingAddresses.forEach(addr => {
                if (addr.user === userId) addr.isDefault = false;
              });
            }
            
            const newAddresses = [...existingAddresses, addressData];
            localStorage.setItem('userAddresses', JSON.stringify(newAddresses));
            
            toast.success('Address saved successfully! (Saved locally)');
            onAddressSaved(addressData);
          } else {
            toast.error('Please login first to save address');
          }
        } catch (localError) {
          console.error('LocalStorage fallback failed:', localError);
          toast.error('Failed to save address. Please try again.');
        }
      } else if (error.message.includes('Server error: Invalid response format')) {
        toast.error('Server error: Please check if the addresses API is working');
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('Network error: Cannot connect to server');
      } else {
        toast.error(error.message || 'Failed to save address. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete =
    formData.fullName &&
    formData.phoneNumber &&
    formData.street &&
    formData.locality &&
    formData.city &&
    formData.state &&
    formData.pincode &&
    pincodeStatus === 'valid';

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 bg-white/80 flex items-center justify-center p-4 z-50"
        style={{ backdropFilter: "blur(10px)" }}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white/95 backdrop-blur-lg rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
          style={{ 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="p-8">
            {/* Header */}
            <motion.div 
              variants={itemVariants}
              className="flex justify-between items-center mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900">
                Add Delivery <span className="text-[#2e8b57]">Address</span>
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.9 }}
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              >
                &times;
              </motion.button>
            </motion.div>

            {/* Important Notice */}
            <motion.div
              variants={itemVariants}
              className="mb-6 p-6 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <p className="text-amber-800 font-medium text-lg">
                    Service Area Notice
                  </p>
                  <p className="text-amber-700 mt-1">
                    We currently deliver only in specific areas of Cuttack. Please enter a valid Cuttack pincode to check service availability.
                  </p>
                </div>
              </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <motion.div variants={itemVariants} className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 border-b pb-3">
                  Personal Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Full Name *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.02, borderColor: "#2e8b57" }}
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Phone Number *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.02, borderColor: "#2e8b57" }}
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    ☎️ Alternate Contact Phone / WhatsApp
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.02, borderColor: "#2e8b57" }}
                    type="tel"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                    placeholder="Optional alternate number"
                    maxLength="10"
                  />
                </div>
              </motion.div>

              {/* Address Information */}
              <motion.div variants={itemVariants} className="space-y-6 pt-6 border-t">
                <h3 className="text-2xl font-bold text-gray-900 border-b pb-3">
                  Address Details
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Street / House Number *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.02, borderColor: "#2e8b57" }}
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      placeholder="House no, building, apartment"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Locality / Area *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.02, borderColor: "#2e8b57" }}
                      type="text"
                      name="locality"
                      value={formData.locality}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      placeholder="Area, locality, sector"
                      required
                    />
                  </div>

                  {/* Pincode with validation */}
                  <div className="space-y-3">
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Pincode *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.02, borderColor: "#2e8b57" }}
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                        pincodeStatus === 'valid' 
                          ? 'border-green-500' 
                          : pincodeStatus === 'invalid' 
                          ? 'border-red-500' 
                          : 'border-gray-200'
                      }`}
                      placeholder="6-digit pincode"
                      maxLength="6"
                      required
                    />
                    
                    {/* Pincode Status Messages */}
                    <AnimatePresence>
                      {pincodeStatus === 'valid' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-3 text-green-700 bg-green-50/80 px-4 py-3 rounded-xl border border-green-200"
                        >
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-medium">✅ Serviceable in {formData.city}</span>
                        </motion.div>
                      )}
                      
                      {pincodeStatus === 'invalid' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-3 text-red-700 bg-red-50/80 px-4 py-3 rounded-xl border border-red-200"
                        >
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="font-medium">❌ Not serviceable in this area</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lg font-semibold text-gray-800 mb-3">
                        City *
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.02, borderColor: "#2e8b57" }}
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                        placeholder="City"
                        required
                        readOnly={pincodeStatus === 'valid'}
                      />
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-gray-800 mb-3">
                        State *
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.02, borderColor: "#2e8b57" }}
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                        placeholder="State"
                        required
                        readOnly={pincodeStatus === 'valid'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      Landmark (Optional)
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.02, borderColor: "#2e8b57" }}
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                      placeholder="Nearby famous place, landmark"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center space-x-3">
                <motion.input
                  whileTap={{ scale: 0.95 }}
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="h-5 w-5 text-[#2e8b57] focus:ring-[#2e8b57] border-gray-300 rounded"
                />
                <label className="text-lg font-medium text-gray-900">
                  Set as default address
                </label>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="flex space-x-4 pt-6 border-t"
              >
                <motion.button
                  type="button"
                  onClick={onCancel}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gray-100/80 hover:bg-gray-200/80 text-gray-800 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 backdrop-blur-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading || !isFormComplete}
                  whileHover={{ scale: (loading || !isFormComplete) ? 1 : 1.02 }}
                  whileTap={{ scale: (loading || !isFormComplete) ? 1 : 0.98 }}
                  className="flex-1 bg-[#2e8b57] hover:bg-[#26734d] text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl backdrop-blur-sm"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="rounded-full h-6 w-6 border-b-2 border-white mr-3"
                      ></motion.div>
                      Saving...
                    </div>
                  ) : (
                    'Save Address'
                  )}
                </motion.button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddressForm;