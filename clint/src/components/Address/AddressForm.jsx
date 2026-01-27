import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { useAppContext } from '../../context/AppContext';

const AddressForm = ({ user, onAddressSaved, onCancel }) => {
  const { serviceAreas } = useAppContext();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    confirmPhoneNumber: '',
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
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showBudgetPopup, setShowBudgetPopup] = useState(true);

  // Phone validation state
  const [phoneValidation, setPhoneValidation] = useState({
    status: 'idle', // 'idle' | 'valid' | 'invalid' | 'checking'
    message: '',
    showValidation: false // Only show validation after user has interacted
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

  // Set user name when component mounts
  useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name
      }));
    }
  }, [user]);

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
              landmark: 'Location Captured'
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

      // Fallback to localStorage
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

          const existingAddresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
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
      {/* Budget Constraint Popup */}
      <AnimatePresence>
        {showBudgetPopup && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
          >
            <motion.div
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
                <h3 className="text-2xl font-bold text-white text-center">
                  Important Notice
                </h3>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-lg font-medium text-gray-800 text-center">
                    Budget Constraints Notice
                  </p>

                  <div className="space-y-3">
                    <p className="text-gray-600">
                      <span className="font-semibold">Important:</span> Due to current budget limitations, we are unable to provide OTP-based phone verification at this time.
                    </p>

                    <p className="text-gray-600">
                      <span className="font-semibold">Please double-check:</span>
                    </p>

                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                      <li>Your phone number is entered correctly</li>
                      <li>Your delivery address is accurate and complete</li>
                      <li>All information is verified before saving </li>
                    </ul>

                    <p className="text-gray-600">
                      This helps ensure smooth and timely delivery service. Thank you for your understanding!
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  <motion.button
                    type="button"
                    onClick={() => setShowBudgetPopup(false)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md"
                  >
                    I Understand & Will Double-Check
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Address Form */}
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
          >
            <div className="p-8">
              {/* Header */}
              <motion.div
                variants={itemVariants}
                className="flex justify-between items-center mb-8"
              >
                <h2 className="text-3xl font-bold text-gray-900">
                  Add / Edit Delivery <span className="text-[#2e8b57]">Address</span>
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

              {/* Location Detection Status */}
              {isDetectingLocation && (
                <motion.div
                  variants={itemVariants}
                  className="mb-6 p-4 bg-blue-50/80 border border-blue-200 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-blue-800 font-medium">Detecting your location...</span>
                  </div>
                </motion.div>
              )}

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
                      We currently deliver only in select areas of Cuttack. Please enter a valid Cuttack pincode to check service availability.
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
                        className={`w-full border-2 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 ${phoneValidation.status === 'valid'
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-lg font-semibold text-gray-800">
                        Confirm Phone Number *
                      </label>

                      {/* Manual Verify Button - Shows when both fields have 10 digits but validation hasn't triggered */}
                      {formData.phoneNumber.length === 10 &&
                        formData.confirmPhoneNumber.length === 10 &&
                        phoneValidation.status === 'idle' && (
                          <motion.button
                            type="button"
                            onClick={handleManualVerify}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            Verify Match
                          </motion.button>
                        )}
                    </div>

                    <motion.input
                      whileFocus={{ scale: 1.02, borderColor: "#2e8b57" }}
                      type="tel"
                      name="confirmPhoneNumber"
                      value={formData.confirmPhoneNumber}
                      onChange={handleChange}
                      className={`w-full border-2 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 ${phoneValidation.status === 'valid'
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
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${phoneValidation.status === 'valid'
                            ? 'text-green-700 bg-green-50/80 border-green-200'
                            : 'text-red-700 bg-red-50/80 border-red-200'
                            }`}
                        >
                          {phoneValidation.status === 'valid' ? (
                            <>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">{phoneValidation.message}</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">{phoneValidation.message}</span>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                      className={`w-full border-2 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 ${formData.alternatePhone && formData.alternatePhone === formData.phoneNumber
                        ? 'border-red-500'
                        : 'border-gray-200'
                        }`}
                      placeholder="Optional alternate number"
                      maxLength="10"
                    />
                    <AnimatePresence>
                      {formData.alternatePhone && formData.alternatePhone === formData.phoneNumber && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-2 text-red-600 text-sm font-medium flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Alternate number cannot be same as primary number
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                        className={`w-full border-2 rounded-xl px-5 py-4 text-lg focus:ring-2 focus:ring-[#2e8b57] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 ${pincodeStatus === 'valid'
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
                            className="mt-2 text-green-600 text-sm font-medium flex flex-col gap-2"
                          >
                            <div className="flex items-center gap-3 text-green-700 bg-green-50/80 px-4 py-3 rounded-xl border border-green-200">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="font-medium">✅ Serviceable area: {serviceAreas.find(p => p.pincode === formData.pincode)?.name}</span>
                            </div>
                            {deliveryInfo && (
                              <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 mt-2">
                                <div className="flex justify-between items-center pb-2 border-b border-emerald-100/30 mb-2">
                                  <span className="text-sm font-semibold text-emerald-800">Delivery Information</span>
                                  <span className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-tight">
                                    Serviceable Area
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Standard Delivery Fee</span>
                                    <span className="font-bold text-gray-700">₹{deliveryInfo.standardFee}</span>
                                  </div>

                                  {deliveryInfo.surcharge > 0 && (
                                    <div className="flex justify-between items-start text-sm">
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-500 font-medium">Distance Surcharge</span>
                                          <div className="group relative">
                                            <span className="cursor-help text-amber-500 hover:text-amber-600">
                                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                              </svg>
                                            </span>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                              This ₹{deliveryInfo.surcharge} helps our partners cover fuel and effort for deliveries to remote locations.
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-800"></div>
                                            </div>
                                          </div>
                                        </div>
                                        <span className="text-[10px] text-amber-600 font-semibold italic">Additional fee for long-distance delivery 🚚</span>
                                      </div>
                                      <span className="font-bold text-amber-600">+ ₹{deliveryInfo.surcharge}</span>
                                    </div>
                                  )}

                                  <div className="flex justify-between items-end pt-2 mt-1 border-t border-emerald-100/30">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Total Charge</span>
                                      <span className="text-[10px] text-gray-400 font-medium italic">FREE on orders above ₹{deliveryInfo.freeAbove}</span>
                                    </div>
                                    <span className="text-2xl font-black text-emerald-700 tracking-tighter">₹{deliveryInfo.charge}</span>
                                  </div>
                                </div>
                              </div>
                            )}
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
                        📍 Landmark (Auto-detected)
                      </label>
                      <motion.input
                        whileFocus={{ scale: 1.02, borderColor: "#2e8b57" }}
                        type="text"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleChange}
                        readOnly
                        className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-lg bg-gray-50/80 cursor-not-allowed backdrop-blur-sm transition-all duration-200"
                        placeholder="Location will be auto-detected"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        This field is automatically filled with your detected location
                      </p>
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
      </AnimatePresence >
    </>
  );
};

export default AddressForm;