import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, User, Package, Send, Loader2, Minus, Plus, ChevronRight, Check, AlertCircle, FileText } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const SpecialRequestModal = ({ isOpen, onClose, product }) => {
    const { user, API_URL, serviceAreas } = useAppContext();
    const [quantity, setQuantity] = useState('');
    const [instructions, setInstructions] = useState('');
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [pincodeValid, setPincodeValid] = useState(null); // null, 'valid', 'invalid'
    const [isMounted, setIsMounted] = useState(false);
    const [errors, setErrors] = useState({});
    const [isPolicyExpanded, setIsPolicyExpanded] = useState(false);
    const [isAddressExpanded, setIsAddressExpanded] = useState(true);

    // Form state if no address
    const [formData, setFormData] = useState({
        fullName: user?.name || '',
        phoneNumber: '',
        street: '',
        locality: '',
        city: 'Cuttack',
        state: 'Odisha',
        pincode: '',
        landmark: '',
        alternatePhone: ''
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && user) {
            fetchUserAddress();
        }
    }, [isOpen, user]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setErrors({}); // Reset errors when opening
        } else {
            document.body.style.overflow = 'unset';
            setInstructions('');
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const fetchUserAddress = async () => {
        const userId = user?.id || user?._id;
        if (!userId) return;

        setIsFetchingAddress(true);
        try {
            const response = await fetch(`${API_URL}/api/addresses/user/${userId}`);
            const data = await response.json();
            if (data.success && data.addresses && data.addresses.length > 0) {
                const defaultAddr = data.addresses.find(a => a.isDefault) || data.addresses[0];
                setAddress(defaultAddr);
                setShowForm(false);
            } else {
                setAddress(null);
                setShowForm(true);
            }
        } catch (error) {
            console.error('Error fetching address:', error);
            setShowForm(true);
        } finally {
            setIsFetchingAddress(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }
        
        if (name === 'pincode') {
            if (value.length === 6) {
                const match = serviceAreas.find(p => p.pincode === value);
                if (match) {
                    setPincodeValid('valid');
                    setFormData(prev => ({
                        ...prev,
                        pincode: value,
                        locality: match.name.split(',')[0]?.trim() || prev.locality
                    }));
                } else {
                    setPincodeValid('invalid');
                    setFormData(prev => ({ ...prev, pincode: value }));
                }
            } else {
                setPincodeValid(null);
                setFormData(prev => ({ ...prev, pincode: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const captureLocation = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        });
    };

    const handleSend = async () => {
        const newErrors = {};
        
        // Validation: Quantity
        if (!quantity || quantity.trim() === '') {
            newErrors.quantity = true;
        }

        // Validation: Address
        if (showForm) {
            if (!formData.fullName) newErrors.fullName = true;
            if (!formData.phoneNumber || formData.phoneNumber.length < 10) newErrors.phoneNumber = true;
            if (!formData.street) newErrors.street = true;
            if (!formData.pincode || pincodeValid === 'invalid') newErrors.pincode = true;
        } else if (!address) {
            newErrors.address = true;
            setShowForm(true);
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill all required fields highlighted in red");
            return;
        }

        setLoading(true);
        const location = await captureLocation();
        
        let finalAddress = "";
        let customerName = "";
        let customerPhone = "";

        if (showForm) {
            finalAddress = `${formData.street}, ${formData.locality}, ${formData.city} - ${formData.pincode}${formData.landmark ? ` (Landmark: ${formData.landmark})` : ''}`;
            customerName = formData.fullName;
            customerPhone = formData.phoneNumber + (formData.alternatePhone ? ` / ${formData.alternatePhone}` : '');
        } else {
            finalAddress = `${address.street}, ${address.locality}, ${address.city} - ${address.pincode}${address.landmark ? ` (Landmark: ${address.landmark})` : ''}`;
            customerName = address.fullName || user.name;
            customerPhone = address.phoneNumber + (address.alternatePhone ? ` / ${address.alternatePhone}` : '');
        }

        const mapsLink = location ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` : "Not provided";
        
        const message = `[ SPECIAL REQUEST ]
------------------------------------
* CUSTOMER DETAILS *
------------------------------------
Name: ${customerName}
Phone: ${customerPhone}
Email: ${user?.email || 'N/A'}

* ORDER ITEM *
------------------------------------
Product: ${product.name}
Requirement: ${quantity}${instructions && instructions.trim() ? `\nInstructions: ${instructions.trim()}` : ''}

* DELIVERY ADDRESS *
------------------------------------
${finalAddress}

* LIVE LOCATION *
------------------------------------
Link: ${mapsLink}

------------------------------------
RG Basket - Freshness Delivered!`;

        const whatsappUrl = `https://wa.me/919078771530?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        setLoading(false);
        onClose();
    };

    if (!isMounted || !product) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-3 pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-xs pointer-events-auto"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 30 }}
                        transition={{ type: "spring", duration: 0.28, bounce: 0.15 }}
                        className="bg-white w-full max-w-[420px] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl z-[10001] pointer-events-auto max-h-[88vh] flex flex-col relative border border-gray-200"
                    >
                        {/* Mobile Pull Indicator */}
                        <div className="sm:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-1 shrink-0" />

                        {/* Header */}
                        <div className="bg-gray-50/90 px-4 py-2.5 flex items-center justify-between border-b border-gray-100 shrink-0 sticky top-0 z-10">
                            <div className="flex gap-2.5 items-center">
                                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center border border-emerald-200 shrink-0">
                                    <Package className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-900 leading-tight">Special Request</h2>
                                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Order Customization</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-7 h-7 rounded-full bg-white hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors border border-gray-200 shadow-xs"
                                aria-label="Close"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-grow overflow-y-auto p-3.5 space-y-3 custom-scrollbar-light bg-gray-50/30 text-xs">
                            {/* Product Header Card */}
                            <div className="bg-white rounded-xl p-2.5 border border-gray-200 shadow-xs flex items-center gap-3">
                                <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 p-1 shrink-0">
                                    <img 
                                        src={(Array.isArray(product.images) && product.images[0]) || (typeof product.image === 'string' && product.image) || (Array.isArray(product.image) && product.image[0]) || (typeof product.images === 'string' && product.images) || "https://placehold.co/400x400?text=No+Image"} 
                                        alt={product.name} 
                                        onError={(e) => { e.currentTarget.src = "https://placehold.co/400x400?text=No+Image"; }}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 bg-emerald-100 rounded uppercase tracking-wider mb-0.5">
                                        {product.category || 'Custom Order'}
                                    </span>
                                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug truncate">{product.name}</h3>
                                    <p className="text-[11px] font-bold text-emerald-700 mt-0.5">Price on Request</p>
                                </div>
                            </div>

                            {/* Quantity Requirement Input */}
                            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${errors.quantity ? 'text-red-500' : 'text-gray-500'}`}>
                                        Quantity Requirement *
                                    </label>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${errors.quantity ? 'bg-red-50 text-red-500' : 'text-emerald-700 bg-emerald-50'}`}>
                                        Mandatory
                                    </span>
                                </div>
                                <motion.div 
                                    animate={errors.quantity ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                                    className="relative"
                                >
                                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${errors.quantity ? 'text-red-500' : 'text-emerald-600'}`}>
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={quantity}
                                        onChange={(e) => {
                                            setQuantity(e.target.value);
                                            if (errors.quantity) setErrors(prev => ({ ...prev, quantity: false }));
                                        }}
                                        className={`w-full bg-gray-50/70 border rounded-lg pl-9 pr-8 py-2 text-xs font-semibold text-gray-900 placeholder:text-gray-400 outline-none transition-all ${
                                            errors.quantity 
                                            ? 'border-red-500 ring-2 ring-red-500/10' 
                                            : 'border-gray-200 focus:bg-white focus:border-emerald-500'
                                        }`}
                                        placeholder="e.g. 1.5 kg, 2 pieces, 500g"
                                    />
                                    {errors.quantity && (
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500">
                                            <AlertCircle size={15} />
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            {/* Special Instructions Box */}
                            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                        <FileText className="w-3 h-3 text-emerald-600" />
                                        <span>Special Instructions</span>
                                    </label>
                                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded text-gray-400 bg-gray-100 uppercase">
                                        Optional
                                    </span>
                                </div>
                                <textarea 
                                    rows={2}
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    className="w-full bg-gray-50/70 border border-gray-200 rounded-lg p-2 text-xs font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-emerald-500 resize-none transition-all leading-relaxed"
                                    placeholder="e.g. Bengali cut, curry cut, skinless, clean thoroughly"
                                />
                            </div>

                            {/* Purchase Policy Accordion */}
                            <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 overflow-hidden shadow-xs">
                                <button 
                                    type="button"
                                    onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
                                    className="w-full flex items-center justify-between p-2.5 transition-colors hover:bg-amber-50/80 text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                                            !
                                        </div>
                                        <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">Purchase Policy</h4>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isPolicyExpanded ? 90 : 0 }}
                                        className="text-amber-700"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </motion.div>
                                </button>
                                
                                <AnimatePresence>
                                    {isPolicyExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-amber-200/60"
                                        >
                                            <div className="p-2.5 text-[11px] text-amber-900 leading-relaxed font-medium bg-amber-50/70">
                                                Certain premium seafood and fish varieties are sold as <strong className="text-amber-800">complete whole units</strong> based on final weight. Partial cuts or specific gram-based portions may not be available to ensure quality standards.
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Delivery Address Section */}
                            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs space-y-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                                    className="w-full flex items-center justify-between group text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <MapPin className={`w-3.5 h-3.5 ${errors.address ? 'text-red-500' : 'text-emerald-600'}`} />
                                        <h3 className={`text-[11px] font-bold uppercase tracking-wider ${errors.address ? 'text-red-500' : 'text-gray-800'}`}>
                                            Delivery Address
                                        </h3>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isAddressExpanded ? 90 : 0 }}
                                        className="text-gray-400 group-hover:text-emerald-600 transition-colors"
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {isAddressExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden pt-1"
                                        >
                                            {isFetchingAddress ? (
                                                <div className="flex items-center justify-center py-4 gap-2 text-gray-400 text-xs">
                                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                                    <span>Loading address...</span>
                                                </div>
                                            ) : !showForm && address ? (
                                                <div className="bg-emerald-50/50 border border-emerald-300 rounded-lg p-2.5 relative">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="text-xs">🏠</span>
                                                            <h4 className="font-bold text-gray-900 text-xs truncate">{address.fullName}</h4>
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowForm(true);
                                                            }}
                                                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 transition-colors shrink-0"
                                                        >
                                                            CHANGE
                                                        </button>
                                                    </div>
                                                    <p className="text-[11px] text-gray-600 leading-snug line-clamp-2">
                                                        {address.street}, {address.locality}, {address.city} - <span className="font-semibold text-gray-800">{address.pincode}</span>
                                                    </p>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 mt-1 pt-1 border-t border-emerald-100">
                                                        <span>📞 {address.phoneNumber}</span>
                                                        {address.alternatePhone && <span className="text-gray-400 text-[10px]">• Alt: {address.alternatePhone}</span>}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 pt-1 text-xs">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className={`block text-[10px] font-bold uppercase mb-0.5 ${errors.fullName ? 'text-red-500' : 'text-gray-500'}`}>Full Name *</label>
                                                            <input 
                                                                type="text" 
                                                                name="fullName"
                                                                value={formData.fullName}
                                                                onChange={handleFormChange}
                                                                className={`w-full bg-gray-50 border rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none ${
                                                                    errors.fullName ? 'border-red-500' : 'border-gray-200 focus:bg-white focus:border-emerald-500'
                                                                }`}
                                                                placeholder="Your name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className={`block text-[10px] font-bold uppercase mb-0.5 ${errors.phoneNumber ? 'text-red-500' : 'text-gray-500'}`}>Phone Number *</label>
                                                            <input 
                                                                type="tel" 
                                                                name="phoneNumber"
                                                                value={formData.phoneNumber}
                                                                onChange={handleFormChange}
                                                                className={`w-full bg-gray-50 border rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none ${
                                                                    errors.phoneNumber ? 'border-red-500' : 'border-gray-200 focus:bg-white focus:border-emerald-500'
                                                                }`}
                                                                placeholder="10-digit phone"
                                                                maxLength="10"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className={`block text-[10px] font-bold uppercase mb-0.5 ${errors.street ? 'text-red-500' : 'text-gray-500'}`}>Street / House Address *</label>
                                                        <input 
                                                            type="text" 
                                                            name="street"
                                                            value={formData.street}
                                                            onChange={handleFormChange}
                                                            className={`w-full bg-gray-50 border rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none ${
                                                                errors.street ? 'border-red-500' : 'border-gray-200 focus:bg-white focus:border-emerald-500'
                                                            }`}
                                                            placeholder="House, street, colony"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className={`block text-[10px] font-bold uppercase mb-0.5 ${errors.pincode ? 'text-red-500' : 'text-gray-500'}`}>Pincode *</label>
                                                            <input 
                                                                type="text" 
                                                                name="pincode"
                                                                value={formData.pincode}
                                                                onChange={handleFormChange}
                                                                className={`w-full bg-gray-50 border rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none ${
                                                                    errors.pincode || pincodeValid === 'invalid' ? 'border-red-500' : pincodeValid === 'valid' ? 'border-emerald-500' : 'border-gray-200'
                                                                }`}
                                                                placeholder="6-digit"
                                                                maxLength="6"
                                                            />
                                                            {pincodeValid === 'invalid' && <p className="text-[9px] text-red-500 font-bold mt-0.5">Non-serviceable</p>}
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Area / Locality</label>
                                                            <input 
                                                                type="text" 
                                                                name="locality"
                                                                value={formData.locality}
                                                                onChange={handleFormChange}
                                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none focus:bg-white focus:border-emerald-500"
                                                                placeholder="Locality"
                                                            />
                                                        </div>
                                                    </div>

                                                    {address && (
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowForm(false);
                                                            }}
                                                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline uppercase tracking-wider pt-1 block"
                                                        >
                                                            ← Use Saved Address
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Compact Footer */}
                        <div className="p-3 border-t border-gray-100 shrink-0 bg-white">
                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={loading || isFetchingAddress}
                                className="w-full h-11 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={3} />
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                        </svg>
                                        <span>REQUEST ON WHATSAPP</span>
                                    </>
                                )}
                            </button>
                            <div className="flex items-center justify-center gap-1.5 mt-2 text-gray-400">
                                <Package className="w-3 h-3" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Secure RG Basket Order</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default SpecialRequestModal;
