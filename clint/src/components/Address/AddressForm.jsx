import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { useAppContext } from '../../context/AppContext';

const AddressForm = ({ user, onAddressSaved, onCancel, initialData, defaultType = 'Home' }) => {
  const { serviceAreas } = useAppContext();
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    phoneNumber: initialData?.phoneNumber || '',
    confirmPhoneNumber: initialData?.phoneNumber || '',
    alternatePhone: initialData?.alternatePhone || '',
    addressType: initialData?.addressType || defaultType || 'Home',
    otherLabel: initialData?.otherLabel || '',
    street: initialData?.street || '',
    locality: initialData?.locality || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
    landmark: initialData?.landmark || '',
    isDefault: initialData?.isDefault ?? true,
    location: initialData?.location || null
  });

  const [loading, setLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(initialData?.pincode ? 'valid' : null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showBudgetPopup, setShowBudgetPopup] = useState(initialData ? false : true);

  // Phone validation state
  const [phoneValidation, setPhoneValidation] = useState({
    status: initialData?.phoneNumber ? 'valid' : 'idle',
    message: initialData?.phoneNumber ? 'Phone numbers match ✓' : '',
    showValidation: initialData?.phoneNumber ? true : false
  });

  // Debounced phone validation function
  const debouncedValidatePhone = useCallback(
    debounce((phone1, phone2) => {
      // Reset if either field is empty
      if (!phone1 || !phone2) {
        setPhoneValidation({
          status: 'idle',
          message: '',
          showValidation: false
        });
        return;
      }

      // Only validate if both have 10 digits
      if (phone1.length === 10 && phone2.length === 10) {
        const isValid = phone1 === phone2;
        setPhoneValidation({
          status: isValid ? 'valid' : 'invalid',
          message: isValid ? 'Phone numbers match ✓' : 'Phone numbers don\'t match ✗',
          showValidation: true
        });
      } else {
        // Still typing or incomplete
        setPhoneValidation(prev => ({
          ...prev,
          status: 'idle',
          showValidation: false
        }));
      }
    }, 600), // 600ms delay after typing stops
    []
  );

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0, backdropFilter: "blur(0px)" },
    visible: {
      opacity: 1,
      backdropFilter: "blur(10px)",
      transition: { duration: 0.3 }
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
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const popupVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: -20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  // Synchronize form when initialData changes (handles Add vs Edit)
  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        phoneNumber: initialData.phoneNumber || '',
        confirmPhoneNumber: initialData.phoneNumber || '',
        alternatePhone: initialData.alternatePhone || '',
        addressType: initialData.addressType || defaultType || 'Home',
        otherLabel: initialData.otherLabel || '',
        street: initialData.street || '',
        locality: initialData.locality || '',
        city: initialData.city || '',
        state: initialData.state || '',
        pincode: initialData.pincode || '',
        landmark: initialData.landmark || '',
        isDefault: initialData.isDefault ?? true,
        location: initialData.location || null
      });
      setPincodeStatus('valid');
      setPhoneValidation({
        status: 'valid',
        message: 'Phone numbers match ✓',
        showValidation: true
      });
      setShowBudgetPopup(false);
    } else {
      // Reset for NEW address
      setFormData({
        fullName: user?.name || '',
        phoneNumber: '',
        confirmPhoneNumber: '',
        alternatePhone: '',
        addressType: defaultType || 'Home',
        otherLabel: '',
        street: '',
        locality: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        isDefault: true,
        location: null
      });
      setPincodeStatus(null);
      setPhoneValidation({
        status: 'idle',
        message: '',
        showValidation: false
      });
      setShowBudgetPopup(true);
    }
  }, [initialData, user, defaultType]);

  // Auto-detect location and fill landmark
  useEffect(() => {
    const autoDetectLocation = async () => {
      if (!navigator.geolocation) {
        console.log('Geolocation not supported');
        return;
      }

      setIsDetectingLocation(true);

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });

        const { latitude, longitude } = position.coords;

        // Reverse geocode to get address
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/geocode/reverse?lat=${latitude}&lon=${longitude}`
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.location) {
            // Just indicate that location was captured, don't show details
            // This avoids confusing users with potentially incorrect GPS pincode
            setFormData(prev => ({
              ...prev,
              landmark: 'Location Captured',
              location: {
                type: 'Point',
                coordinates: [longitude, latitude],
                accuracy: position.coords.accuracy || 0,
                capturedAt: new Date().toISOString()
              }
            }));

            toast.success('Location detected - Please enter your pincode manually');
          }
        }
      } catch (error) {
        console.log('Location detection failed:', error);
        // Silent fail - landmark remains empty
      } finally {
        setIsDetectingLocation(false);
      }
    };

    // Auto-detect location when component mounts
    autoDetectLocation();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Only allow numbers for phone and pincode fields
    if ((name === 'phoneNumber' || name === 'confirmPhoneNumber' ||
      name === 'alternatePhone' || name === 'pincode') && /\D/.test(value)) {
      return;
    }

    // Update form data
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    // If street, locality, pincode or city fields are edited, clear the coordinates
    // since they no longer correspond to the typed text address.
    if (name === 'street' || name === 'locality' || name === 'pincode' || name === 'city') {
      newFormData.location = null;
    }
 
    setFormData(newFormData);

    // Validate pincode in real-time
    if (name === 'pincode') {
      if (value.length === 6) {
        const match = serviceAreas.find(p => p.pincode === value);
        if (match) {
          setPincodeStatus('valid');
          // Auto-fill city and state for valid pincodes
          setFormData(prev => ({
            ...prev,
            city: match.name.split(',')[1]?.trim() || "Cuttack",
            state: "Odisha"
          }));
        } else {
          setPincodeStatus('invalid');
          setFormData(prev => ({
            ...prev,
            city: "",
            state: ""
          }));
        }
      } else {
        setPincodeStatus(null);
      }
    }

    // Trigger debounced phone validation when phone fields change
    if (name === 'phoneNumber' || name === 'confirmPhoneNumber') {
      debouncedValidatePhone(newFormData.phoneNumber, newFormData.confirmPhoneNumber);
    }
  };

  // Helper to get delivery info for current pincode
  const getDeliveryInfo = () => {
    if (pincodeStatus === 'valid') {
      const area = serviceAreas.find(p => p.pincode === formData.pincode);
      if (area) {
        const totalCharge = area.deliveryCharge ?? 29;
        const standardFee = Math.min(totalCharge, 29);
        const surcharge = totalCharge > 29 ? (totalCharge - 29) : 0;

        return {
          charge: totalCharge,
          standardFee: standardFee,
          surcharge: surcharge,
          freeAbove: area.minOrderForFreeDelivery ?? 299
        };
      }
    }
    return null;
  };

  const deliveryInfo = getDeliveryInfo();

  // Manual verify button handler
  const handleManualVerify = () => {
    if (!formData.phoneNumber || !formData.confirmPhoneNumber) {
      toast.error('Please enter both phone numbers');
      return;
    }

    if (formData.phoneNumber.length !== 10 || formData.confirmPhoneNumber.length !== 10) {
      toast.error('Please enter complete 10-digit phone numbers');
      return;
    }

    const isValid = formData.phoneNumber === formData.confirmPhoneNumber;
    setPhoneValidation({
      status: isValid ? 'valid' : 'invalid',
      message: isValid ? 'Phone numbers match ✓' : 'Phone numbers don\'t match ✗',
      showValidation: true
    });

    if (!isValid) {
      toast.error('Phone numbers do not match. Please correct them.');
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.fullName || !formData.phoneNumber || !formData.confirmPhoneNumber ||
      !formData.street || !formData.locality || !formData.city || !formData.state ||
      !formData.pincode) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Phone number confirmation validation
    if (formData.phoneNumber !== formData.confirmPhoneNumber) {
      toast.error('Phone numbers do not match. Please check both fields.');
      return;
    }

    if (formData.alternatePhone && !/^\d{10}$/.test(formData.alternatePhone)) {
      toast.error('Please enter a valid 10-digit alternate phone number');
      return;
    }

    if (formData.alternatePhone && formData.alternatePhone === formData.phoneNumber) {
      toast.error('Alternate phone number cannot be the same as your primary number');
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
      const userId = user?._id || user?.id || user?.user?.id;

      if (!userId) {
        throw new Error('User not logged in. Please login first.');
      }

      const addressData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        alternatePhone: formData.alternatePhone,
        addressType: formData.addressType || 'Home',
        otherLabel: formData.otherLabel || '',
        street: formData.street,
        locality: formData.locality,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        landmark: formData.landmark,
        isDefault: formData.isDefault,
        user: userId,
        location: formData.location
      };

      const url = initialData?._id 
        ? `${import.meta.env.VITE_API_URL}/api/addresses/${initialData._id}`
        : `${import.meta.env.VITE_API_URL}/api/addresses`;
      
      const method = initialData?._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData)
      });

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
        toast.success(initialData?._id ? 'Address updated successfully!' : `${formData.addressType || 'Address'} saved successfully!`);
        onAddressSaved(data.address);
      } else {
        throw new Error(data.message || 'Failed to save address');
      }

    } catch (error) {
      console.error('Error saving address:', error);

      // Fallback to localStorage
      try {
        const userId = user?._id || user?.id || user?.user?.id;

        if (userId) {
          const addressData = {
            _id: initialData?._id || 'addr_' + Date.now(),
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            alternatePhone: formData.alternatePhone,
            addressType: formData.addressType || 'Home',
            otherLabel: formData.otherLabel || '',
            street: formData.street,
            locality: formData.locality,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            landmark: formData.landmark,
            isDefault: formData.isDefault,
            user: userId,
            location: formData.location,
            createdAt: initialData?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          let existingAddresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
          
          if (addressData.isDefault) {
            existingAddresses.forEach(addr => {
              if (addr.user === userId) addr.isDefault = false;
            });
          }

          if (initialData?._id) {
            // Update existing in local storage
            existingAddresses = existingAddresses.map(addr => 
              addr._id === initialData._id ? addressData : addr
            );
          } else {
            // Add new to local storage
            existingAddresses.push(addressData);
          }
          
          localStorage.setItem('userAddresses', JSON.stringify(existingAddresses));

          toast.success('Address saved successfully! (Saved locally)');
          onAddressSaved(addressData);
        } else {
          toast.error('Please login first to save address');
        }
      } catch (localError) {
        console.error('LocalStorage fallback failed:', localError);
        toast.error('Failed to save address. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete =
    formData.fullName &&
    formData.phoneNumber &&
    formData.confirmPhoneNumber &&
    formData.street &&
    formData.locality &&
    formData.city &&
    formData.state &&
    formData.pincode &&
    pincodeStatus === 'valid' &&
    phoneValidation.status === 'valid' &&
    (!formData.alternatePhone || formData.alternatePhone !== formData.phoneNumber);

  return (
    <>
      {/* Budget Constraint Popup - Mobile Optimized */}
      <AnimatePresence>
        {showBudgetPopup && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 sm:p-4 z-[10000]"
          >
            <motion.div
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 sm:p-5">
                <h3 className="text-lg sm:text-xl font-bold text-white text-center">
                  Important Notice
                </h3>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <p className="font-bold text-gray-800 text-center">
                    Budget Constraints Notice
                  </p>

                  <div className="space-y-2 text-gray-600">
                    <p>
                      <span className="font-semibold text-gray-800">Important:</span> Due to budget limitations, OTP phone verification is temporarily disabled.
                    </p>

                    <p className="font-semibold text-gray-800 pt-0.5">
                      Please double-check:
                    </p>

                    <ul className="list-disc pl-4 space-y-1 text-[11px] sm:text-xs">
                      <li>Your phone number is entered correctly</li>
                      <li>Your delivery address is complete and clear</li>
                      <li>All information is verified before saving</li>
                    </ul>

                    <p className="text-[11px] sm:text-xs text-gray-500 pt-1">
                      This helps ensure smooth delivery. Thank you for understanding!
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4 sm:mt-5">
                  <motion.button
                    type="button"
                    onClick={() => setShowBudgetPopup(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm transition-all duration-200 shadow-md"
                  >
                    I Understand & Will Double-Check
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Address Form Modal - Mobile Optimized */}
      <AnimatePresence>
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 bg-black/60 sm:bg-white/80 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[9999]"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 sm:border-white/20 overscroll-contain"
          >
            {/* Top Sheet Drag Handle on mobile */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />
            <div className="p-3.5 sm:p-6 pt-1 sm:pt-6">
              {/* Header */}
              <motion.div
                variants={itemVariants}
                className="flex justify-between items-center mb-3 sm:mb-4 pb-2 border-b border-gray-100"
              >
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
                    Add / Edit Delivery <span className="text-emerald-600">Address</span>
                  </h2>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Please provide accurate details for fast delivery</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-700 text-lg sm:text-xl w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors bg-gray-100 hover:bg-gray-200 shrink-0"
                >
                  &times;
                </motion.button>
              </motion.div>

              {/* Location Detection Status */}
              {isDetectingLocation && (
                <motion.div
                  variants={itemVariants}
                  className="mb-2.5 sm:mb-3 p-2 sm:p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-b-transparent border-blue-600"></div>
                    <span className="text-blue-800 text-xs font-medium">Detecting your location...</span>
                  </div>
                </motion.div>
              )}

              {/* Important Notice */}
              <motion.div
                variants={itemVariants}
                className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-amber-50/90 border border-amber-200/70 rounded-xl flex items-start gap-2.5"
              >
                <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5 shadow-sm">
                  <span className="text-white text-[10px] sm:text-xs font-black">!</span>
                </div>
                <div>
                  <p className="text-amber-900 font-bold text-xs sm:text-sm leading-tight">
                    Service Area Notice
                  </p>
                  <p className="text-amber-800 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                    We currently deliver only in select areas of Cuttack. Please enter a valid Cuttack pincode to check service availability.
                  </p>
                </div>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* 3-Location Slot Selector */}
                <motion.div variants={itemVariants} className="space-y-2 bg-emerald-50/40 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-emerald-200/70 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-900">
                        Save address as <span className="text-emerald-600">*</span>
                      </label>
                      <p className="text-[10px] sm:text-xs text-gray-500">Choose location slot</p>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm uppercase tracking-wider">
                      3 Slots Max
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                    {[
                      { type: 'Home', icon: '🏠', title: 'Home', desc: 'Personal home' },
                      { type: 'Office', icon: '🏢', title: 'Office / Work', desc: 'Workplace' },
                      { type: 'Other', icon: '📍', title: 'Other', desc: 'Friends, gym, etc.' }
                    ].map((item) => {
                      const isSelected = formData.addressType === item.type;
                      return (
                        <motion.button
                          key={item.type}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFormData(prev => ({ ...prev, addressType: item.type }))}
                          className={`relative flex flex-col items-center justify-center py-2 px-1 sm:py-3 sm:px-2 rounded-xl border-2 transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-white text-emerald-950 shadow-sm ring-2 ring-emerald-500/20'
                              : 'border-emerald-100/80 hover:border-emerald-300 bg-white/70 text-gray-700 hover:bg-white'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-1 right-1 text-white font-bold text-[8px] sm:text-[9px] bg-emerald-600 rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center shadow">
                              ✓
                            </span>
                          )}
                          <span className="text-lg sm:text-2xl mb-0.5">{item.icon}</span>
                          <span className="font-bold text-[11px] sm:text-xs text-center leading-tight">{item.title}</span>
                          <span className="text-[9px] text-gray-400 hidden sm:block mt-0.5 leading-tight">{item.desc}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {formData.addressType === 'Other' && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-1.5 border-t border-emerald-100"
                    >
                      <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1">
                        Location Nickname / Label (Optional)
                      </label>
                      <input
                        type="text"
                        name="otherLabel"
                        value={formData.otherLabel || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, otherLabel: e.target.value }))}
                        placeholder="e.g. Parents' House, Gym, Friend's Flat"
                        className="w-full border border-emerald-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all"
                        maxLength="30"
                      />
                    </motion.div>
                  )}
                </motion.div>

                {/* Personal Information */}
                <motion.div variants={itemVariants} className="space-y-2.5">
                  <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                      Personal Details
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.01, borderColor: "#059669" }}
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-150"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.01, borderColor: "#059669" }}
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={`w-full border rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-150 ${phoneValidation.status === 'valid'
                          ? 'border-green-500'
                          : phoneValidation.status === 'invalid'
                            ? 'border-red-500'
                            : 'border-gray-200'
                          }`}
                        placeholder="10-digit mobile number"
                        maxLength="10"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Number Confirmation Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] sm:text-xs font-bold text-gray-700">
                        Confirm Phone Number *
                      </label>

                      {formData.phoneNumber.length === 10 &&
                        formData.confirmPhoneNumber.length === 10 &&
                        phoneValidation.status === 'idle' && (
                          <motion.button
                            type="button"
                            onClick={handleManualVerify}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-md transition-colors"
                          >
                            Verify Match
                          </motion.button>
                        )}
                    </div>

                    <motion.input
                      whileFocus={{ scale: 1.01, borderColor: "#059669" }}
                      type="tel"
                      name="confirmPhoneNumber"
                      value={formData.confirmPhoneNumber}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-150 ${phoneValidation.status === 'valid'
                        ? 'border-green-500'
                        : phoneValidation.status === 'invalid'
                          ? 'border-red-500'
                          : 'border-gray-200'
                        }`}
                      placeholder="Re-enter your phone number"
                      maxLength="10"
                      required
                    />

                    {/* Phone Number Match Status */}
                    <AnimatePresence>
                      {phoneValidation.showValidation && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] sm:text-xs font-medium mt-1.5 ${phoneValidation.status === 'valid'
                            ? 'text-green-700 bg-green-50 border-green-200'
                            : 'text-red-700 bg-red-50 border-red-200'
                            }`}
                        >
                          {phoneValidation.status === 'valid' ? (
                            <>
                              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>{phoneValidation.message}</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span>{phoneValidation.message}</span>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1">
                      ☎️ Alternate Contact Phone / WhatsApp <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01, borderColor: "#059669" }}
                      type="tel"
                      name="alternatePhone"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-150 ${formData.alternatePhone && formData.alternatePhone === formData.phoneNumber
                        ? 'border-red-500'
                        : 'border-gray-200'
                        }`}
                      placeholder="Optional alternate number"
                      maxLength="10"
                    />
                    <AnimatePresence>
                      {formData.alternatePhone && formData.alternatePhone === formData.phoneNumber && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="mt-1 text-red-600 text-[11px] font-medium flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Alternate number cannot be same as primary number
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Address Information */}
                <motion.div variants={itemVariants} className="space-y-2.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                      Address Details
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1">
                      Street / House Number *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01, borderColor: "#059669" }}
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-150"
                      placeholder="House no, building, apartment"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1">
                      Locality / Area *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01, borderColor: "#059669" }}
                      type="text"
                      name="locality"
                      value={formData.locality}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-150"
                      placeholder="Area, locality, landmark nearby"
                      required
                    />
                  </div>

                  {/* Pincode with validation */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01, borderColor: "#059669" }}
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className={`w-full border rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-150 ${pincodeStatus === 'valid'
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
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="mt-1.5 space-y-2"
                        >
                          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-xl border border-green-200 text-xs font-medium">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shrink-0"></div>
                            <span>✅ Serviceable area: {serviceAreas.find(p => p.pincode === formData.pincode)?.name}</span>
                          </div>

                          {deliveryInfo && (
                            <div className="bg-emerald-50/50 p-2.5 sm:p-3 rounded-xl border border-emerald-200 shadow-sm">
                              <div className="flex justify-between items-center pb-1.5 border-b border-emerald-100 mb-2">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-3.5 bg-emerald-500 rounded-full"></div>
                                  <span className="text-xs font-bold text-emerald-900">Delivery Information</span>
                                </div>
                                <span className="text-[9px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                                  Cuttack Region
                                </span>
                              </div>

                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-500 text-[11px] font-semibold">Base Delivery Fee</span>
                                  <span className="font-bold text-gray-800">₹{deliveryInfo.standardFee}</span>
                                </div>

                                {deliveryInfo.surcharge > 0 && (
                                  <div className="flex justify-between items-center bg-white/60 px-2 py-1 rounded-lg border border-emerald-100">
                                    <div className="flex items-center gap-1">
                                      <span className="text-amber-800 font-semibold text-[11px]">Distance Surcharge</span>
                                      <span className="text-[10px] text-amber-600">🚚</span>
                                    </div>
                                    <span className="font-bold text-amber-700">+ ₹{deliveryInfo.surcharge}</span>
                                  </div>
                                )}

                                <div className="flex justify-between items-center pt-2 border-t border-emerald-200/80 mt-1.5">
                                  <div>
                                    <span className="text-[9px] font-bold text-emerald-800/60 uppercase block">Total Charge</span>
                                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full inline-block mt-0.5">
                                      FREE OVER ₹{deliveryInfo.freeAbove}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xl sm:text-2xl font-black text-emerald-700 leading-none block">₹{deliveryInfo.charge}</span>
                                    <span className="text-[9px] text-emerald-600 font-medium mt-0.5 block">Current Area Rate</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {pincodeStatus === 'invalid' && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded-xl border border-red-200 text-xs font-medium mt-1.5"
                        >
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0"></div>
                          <span>❌ Not serviceable in this area</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1">
                        City *
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.01, borderColor: "#059669" }}
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm bg-gray-50/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="City"
                        required
                        readOnly={pincodeStatus === 'valid'}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1">
                        State *
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.01, borderColor: "#059669" }}
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm bg-gray-50/80 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="State"
                        required
                        readOnly={pincodeStatus === 'valid'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-gray-700 mb-1">
                      📍 Landmark (Auto-detected)
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01, borderColor: "#059669" }}
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      readOnly
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm bg-gray-50/80 cursor-not-allowed text-gray-600 transition-all"
                      placeholder="Location will be auto-detected"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      This field is automatically filled with your detected location
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefaultCheckbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="isDefaultCheckbox" className="text-xs sm:text-sm font-medium text-gray-800 cursor-pointer">
                    Set as default address
                  </label>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="flex space-x-3 pt-3 border-t border-gray-100"
                >
                  <motion.button
                    type="button"
                    onClick={onCancel}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading || !isFormComplete}
                    whileHover={{ scale: (loading || !isFormComplete) ? 1 : 1.01 }}
                    whileTap={{ scale: (loading || !isFormComplete) ? 1 : 0.99 }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="rounded-full h-4 w-4 border-2 border-b-transparent border-white mr-2"
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
    </>
  );
};

export default AddressForm;