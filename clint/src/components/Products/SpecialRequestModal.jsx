import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, User, Package, Send, Loader2, Minus, Plus, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const SpecialRequestModal = ({ isOpen, onClose, product }) => {
    const { user, API_URL, serviceAreas } = useAppContext();
    const [quantity, setQuantity] = useState('');
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
Requirement: ${quantity}

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
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-4 pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="bg-white w-full max-w-lg md:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden shadow-2xl z-[10001] pointer-events-auto max-h-[95vh] flex flex-col relative mt-auto md:mt-0"
                    >
                        {/* Mobile Pull Indicator */}
                        <div className="md:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />

                        {/* Header */}
                        <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-gray-100 shrink-0 sticky top-0 z-10">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100 shrink-0">
                                    <Package className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">Special Request</h2>
                                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest mt-0.5">Order Customization</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2.5 hover:bg-gray-100 rounded-full transition-all shrink-0 outline-none active:scale-90"
                            >
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-grow overflow-y-auto px-6 py-6 custom-scrollbar-light bg-gray-50/30">
                            {/* Product Summary */}
                            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-6 flex flex-col gap-4">
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 p-2 shrink-0">
                                        <img 
                                            src={product.images?.[0] || product.image?.[0]} 
                                            alt={product.name} 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-gray-900 text-lg leading-tight truncate">{product.name}</h3>
                                        <p className="text-sm font-bold text-green-600 mt-1">Price on Request</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-2">
                                    <div className="flex items-center justify-between px-1">
                                        <label className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${errors.quantity ? 'text-red-500' : 'text-gray-400'}`}>
                                            Quantity Requirement *
                                        </label>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${errors.quantity ? 'bg-red-50 text-red-500' : 'text-green-600 bg-green-50'}`}>
                                            Mandatory
                                        </span>
                                    </div>
                                    <motion.div 
                                        animate={errors.quantity ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                                        className="relative group"
                                    >
                                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${errors.quantity ? 'text-red-500' : 'text-green-600 group-focus-within:text-emerald-700'}`}>
                                            <Package className="w-5 h-5" strokeWidth={2.5} />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={quantity}
                                            onChange={(e) => {
                                                setQuantity(e.target.value);
                                                if (errors.quantity) setErrors(prev => ({ ...prev, quantity: false }));
                                            }}
                                            className={`w-full bg-white border-2 rounded-3xl pl-14 pr-6 py-4.5 text-lg font-bold text-gray-900 placeholder:text-gray-300 shadow-sm transition-all outline-none ${
                                                errors.quantity 
                                                ? 'border-red-500 ring-4 ring-red-500/10' 
                                                : 'border-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/10'
                                            }`}
                                            placeholder=" write quantity here "
                                        />
                                        {errors.quantity && (
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-red-500">
                                                <AlertCircle size={18} />
                                            </div>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Marketplace Note */}
                                <div className="mt-2">
                                    <button 
                                        onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
                                        className="w-full flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-[1.5rem] transition-all hover:bg-amber-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="shrink-0 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                                                <span className="font-black text-[10px]">!</span>
                                            </div>
                                            <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-[0.1em]">Purchase Policy</h4>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isPolicyExpanded ? 180 : 0 }}
                                            className="text-amber-500"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </motion.div>
                                    </button>
                                    
                                    <AnimatePresence>
                                        {isPolicyExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                    <div className="p-5 pt-3 bg-amber-50/50 border-x border-b border-amber-100 rounded-b-[1.5rem] -mt-4 shadow-inner">
                                                        <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                                                            Some High-value premium items and certain fish varieties are sold only as <span className="text-amber-600 font-black">complete whole units</span> based on their final weight. 
                                                            <br/><br/>
                                                            We cannot provide partial cuts or specific gram-based portions for these exclusive selections to maintain quality standards.
                                                        </p>
                                                    </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="space-y-6">
                                <button 
                                    onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                                    className="w-full flex items-center justify-between px-1 group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`h-4 w-1 rounded-full transition-colors ${errors.address ? 'bg-red-500' : 'bg-green-600'}`} />
                                        <h3 className={`text-sm font-black uppercase tracking-widest transition-colors ${errors.address ? 'text-red-500' : 'text-gray-900'}`}>
                                            Delivery Address
                                        </h3>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isAddressExpanded ? 90 : 0 }}
                                        className="text-gray-400 group-hover:text-green-600 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" strokeWidth={3} />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {isAddressExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-2 pb-1">
                                                {isFetchingAddress ? (
                                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                                        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching details...</p>
                                                    </div>
                                                ) : !showForm && address ? (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="bg-white border-2 border-green-500 rounded-3xl p-6 shadow-xl shadow-green-100 relative overflow-hidden"
                                                    >
                                                        <div className="absolute top-0 right-0 p-3">
                                                            <div className="bg-green-500 text-white p-1 rounded-full">
                                                                <Check className="w-3 h-3" strokeWidth={4} />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                                                    <User className="w-5 h-5 text-green-600" />
                                                                </div>
                                                                <h4 className="font-black text-gray-900 text-lg">{address.fullName}</h4>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowForm(true);
                                                                }}
                                                                className="text-xs font-black text-green-600 hover:text-green-700 underline underline-offset-4"
                                                            >
                                                                CHANGE
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2 text-gray-600 font-medium">
                                                            <p className="leading-relaxed">{address.street}, {address.locality}</p>
                                                            <p>{address.city}, {address.state} - <span className="font-bold text-gray-900">{address.pincode}</span></p>
                                                            <div className="flex items-center gap-2 text-gray-900 font-bold mt-4 pt-4 border-t border-gray-50">
                                                                <Phone className="w-4 h-4 text-green-600" /> 
                                                                <span>{address.phoneNumber}</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="space-y-5 px-1"
                                                    >
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${errors.fullName ? 'text-red-500' : 'text-gray-400'}`}>Full Name *</label>
                                                                <input 
                                                                    type="text" 
                                                                    name="fullName"
                                                                    value={formData.fullName}
                                                                    onChange={handleFormChange}
                                                                    className={`w-full bg-white border-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none ${
                                                                        errors.fullName ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-100 focus:border-green-500'
                                                                    }`}
                                                                    placeholder="Receiver's name"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${errors.phoneNumber ? 'text-red-500' : 'text-gray-400'}`}>Phone Number *</label>
                                                                <input 
                                                                    type="tel" 
                                                                    name="phoneNumber"
                                                                    value={formData.phoneNumber}
                                                                    onChange={handleFormChange}
                                                                    className={`w-full bg-white border-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none ${
                                                                        errors.phoneNumber ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-100 focus:border-green-500'
                                                                    }`}
                                                                    placeholder="10-digit mobile"
                                                                    maxLength="10"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${errors.street ? 'text-red-500' : 'text-gray-400'}`}>Street / Area *</label>
                                                                <input 
                                                                    type="text" 
                                                                    name="street"
                                                                    value={formData.street}
                                                                    onChange={handleFormChange}
                                                                    className={`w-full bg-white border-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none ${
                                                                        errors.street ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-100 focus:border-green-500'
                                                                    }`}
                                                                    placeholder="House, Street, Area"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Alternate Phone</label>
                                                                <input 
                                                                    type="tel" 
                                                                    name="alternatePhone"
                                                                    value={formData.alternatePhone}
                                                                    onChange={handleFormChange}
                                                                    className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-green-500 transition-all outline-none"
                                                                    placeholder="Optional"
                                                                    maxLength="10"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${errors.pincode ? 'text-red-500' : 'text-gray-400'}`}>Pincode *</label>
                                                                <input 
                                                                    type="text" 
                                                                    name="pincode"
                                                                    value={formData.pincode}
                                                                    onChange={handleFormChange}
                                                                    className={`w-full bg-white border-2 ${
                                                                        errors.pincode || pincodeValid === 'invalid' ? 'border-red-500' : pincodeValid === 'valid' ? 'border-green-500' : 'border-gray-100'
                                                                    } rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-green-500 transition-all outline-none`}
                                                                    placeholder="6-digit"
                                                                    maxLength="6"
                                                                />
                                                                {pincodeValid === 'invalid' && <p className="text-[10px] text-red-500 font-black tracking-widest uppercase mt-1 ml-1">Non-serviceable</p>}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Locality</label>
                                                                <input 
                                                                    type="text" 
                                                                    name="locality"
                                                                    value={formData.locality}
                                                                    onChange={handleFormChange}
                                                                    className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-green-500 transition-all outline-none"
                                                                    placeholder="Neighborhood"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Landmark</label>
                                                            <input 
                                                                type="text" 
                                                                name="landmark"
                                                                value={formData.landmark}
                                                                onChange={handleFormChange}
                                                                className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:border-green-500 transition-all outline-none"
                                                                placeholder="E.g. Near Big Temple"
                                                            />
                                                        </div>
                                                        {address && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowForm(false);
                                                                }}
                                                                className="flex items-center gap-2 text-xs font-black text-green-600 hover:text-green-700 uppercase tracking-widest pt-2 outline-none"
                                                            >
                                                                ← USE SAVED ADDRESS
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-6 border-t border-gray-100 shrink-0 bg-white">
                            <button
                                onClick={handleSend}
                                disabled={loading || isFetchingAddress}
                                className="w-full py-4.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-[0_12px_40px_-12px_rgba(37,211,102,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                            >
                                {loading ? (
                                    <Loader2 className="w-7 h-7 animate-spin" strokeWidth={3} />
                                ) : (
                                    <>
                                        <Send className="w-6 h-6" fill="currentColor" />
                                        REQUEST ON WHATSAPP
                                    </>
                                )}
                            </button>
                            <div className="flex items-center justify-center gap-2 mt-4 opacity-30">
                                <Package className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure RG Basket Order</span>
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
