import React, { useState, useEffect } from 'react';
import { 
    X, Plus, Trash2, Search, User, Phone, MapPin, Calendar, 
    Clock, DollarSign, Sparkles, ShoppingBag, CheckCircle, 
    MessageCircle, AlertCircle, RefreshCw, Send, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminModalDark from './SharedDark/AdminModalDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import { tw } from '../../config/tokyoNightTheme';

const DEFAULT_SLOTS = [
    'Morning - First Half (7:00 AM - 8:30 AM)',
    'Morning - Second Half (8:30 AM - 10:00 AM)',
    'Evening - First Half (5:00 PM - 6:30 PM)',
    'Evening - Second Half (6:30 PM - 8:00 PM)',
    'Express / Instant Delivery'
];

const AdminCreateOrderModalDark = ({ isOpen, onClose, onOrderCreated }) => {
    // Mode: 'existing_user' | 'new_customer'
    const [customerMode, setCustomerMode] = useState('existing_user');

    // User search & selection
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Customer & Shipping details
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    const [street, setStreet] = useState('');
    const [locality, setLocality] = useState('Cuttack');
    const [city, setCity] = useState('Cuttack');
    const [state, setState] = useState('Odisha');
    const [pincode, setPincode] = useState('753001');
    const [landmark, setLandmark] = useState('');

    // Delivery Schedule
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [timeSlot, setTimeSlot] = useState(DEFAULT_SLOTS[0]);

    // Order Items
    // Item structure: { id, productId, name, price, quantity, unit, isSpecialRequest, instructions }
    const [items, setItems] = useState([
        {
            id: 'item_1',
            productId: '',
            name: '',
            price: '',
            quantity: 1,
            unit: '1 unit',
            isSpecialRequest: true,
            instructions: ''
        }
    ]);

    // Catalog products for search
    const [catalogProducts, setCatalogProducts] = useState([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [productSearchIndex, setProductSearchIndex] = useState(null); // which item row is selecting a product
    const [productSearchTerm, setProductSearchTerm] = useState('');

    // Order Financials & Settings
    const [shippingFee, setShippingFee] = useState(29);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
    const [status, setStatus] = useState('confirmed');
    const [instruction, setInstruction] = useState('Customer ordered via WhatsApp');

    // Submission & Success state
    const [submitting, setSubmitting] = useState(false);
    const [createdOrderResult, setCreatedOrderResult] = useState(null);

    // Load catalog products for picker
    useEffect(() => {
        if (!isOpen) return;
        const fetchCatalog = async () => {
            try {
                setLoadingCatalog(true);
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products?limit=100`);
                if (res.ok) {
                    const data = await res.json();
                    setCatalogProducts(data.products || data || []);
                }
            } catch (err) {
                console.warn('Failed to load store catalog:', err);
            } finally {
                setLoadingCatalog(false);
            }
        };
        fetchCatalog();
    }, [isOpen]);

    // User search debounce
    useEffect(() => {
        if (!userSearchTerm || customerMode !== 'existing_user') {
            setUserSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setIsSearchingUsers(true);
                const token = localStorage.getItem('adminToken');
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/admin/users?search=${encodeURIComponent(userSearchTerm)}&limit=8`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.ok) {
                    const data = await res.json();
                    setUserSearchResults(data.users || []);
                }
            } catch (err) {
                console.error('Error searching users:', err);
            } finally {
                setIsSearchingUsers(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [userSearchTerm, customerMode]);

    // Select existing user handler
    const handleSelectUser = (u) => {
        setSelectedUser(u);
        setCustomerName(u.name || '');
        setCustomerPhone(u.phone || u.addresses?.[0]?.phoneNumber || '');
        setCustomerEmail(u.email || '');

        // Pre-fill address if available
        if (u.addresses && u.addresses.length > 0) {
            const addr = u.addresses.find(a => a.isDefault) || u.addresses[0];
            setStreet(addr.street || '');
            setLocality(addr.locality || 'Cuttack');
            setCity(addr.city || 'Cuttack');
            setState(addr.state || 'Odisha');
            setPincode(addr.pincode || '753001');
            setLandmark(addr.landmark || '');
        }
        setUserSearchResults([]);
    };

    // Add Special Request Item Row
    const addSpecialRequestItem = () => {
        setItems(prev => [
            ...prev,
            {
                id: `special_${Date.now()}_${prev.length}`,
                productId: '',
                name: '',
                price: '',
                quantity: 1,
                unit: '1 unit',
                isSpecialRequest: true,
                instructions: ''
            }
        ]);
    };

    // Add Catalog Item
    const addCatalogProductItem = (prod) => {
        setItems(prev => [
            ...prev,
            {
                id: `catalog_${prod._id}_${Date.now()}`,
                productId: prod._id,
                name: prod.name,
                price: prod.price || prod.discountPrice || 0,
                quantity: 1,
                unit: `${prod.weight || 1} ${prod.unit || 'unit'}`,
                isSpecialRequest: false,
                image: prod.image || prod.images?.[0] || '',
                instructions: ''
            }
        ]);
        setProductSearchIndex(null);
        setProductSearchTerm('');
    };

    // Update item field
    const updateItem = (index, field, value) => {
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Remove item
    const removeItem = (index) => {
        if (items.length === 1) {
            toast.error('Order must contain at least one item');
            return;
        }
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // Calculate Subtotal & Total
    const subtotal = items.reduce((sum, item) => {
        const p = Number(item.price) || 0;
        const q = Number(item.quantity) || 1;
        return sum + (p * q);
    }, 0);

    const calculatedTotal = Math.max(0, subtotal + (Number(shippingFee) || 0) - (Number(discountAmount) || 0));

    // Submit Order
    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
        if (!cleanPhone || cleanPhone.length < 10) {
            toast.error('Please enter a valid 10-digit WhatsApp phone number');
            return;
        }

        if (!customerName.trim()) {
            toast.error('Customer name is required');
            return;
        }

        if (!street.trim()) {
            toast.error('Street/Address is required');
            return;
        }

        // Validate items
        const invalidItem = items.find(it => !it.name.trim() || Number(it.price) <= 0);
        if (invalidItem) {
            toast.error('Please enter a valid item name and price for all items');
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem('adminToken');

            const payload = {
                userId: selectedUser ? (selectedUser._id || selectedUser.googleId) : undefined,
                customerName: customerName.trim(),
                customerPhone: cleanPhone,
                customerEmail: customerEmail.trim(),
                shippingAddress: {
                    fullName: customerName.trim(),
                    phoneNumber: cleanPhone,
                    street: street.trim(),
                    locality: locality.trim() || 'Cuttack',
                    city: city.trim() || 'Cuttack',
                    state: state.trim() || 'Odisha',
                    pincode: pincode.trim() || '753001',
                    landmark: landmark.trim()
                },
                items: items.map(it => ({
                    productId: it.productId || `custom_${Date.now()}`,
                    name: it.name.trim(),
                    price: Number(it.price) || 0,
                    quantity: Number(it.quantity) || 1,
                    unit: it.unit || '1 unit',
                    weight: it.unit || '1 unit',
                    isSpecialRequest: Boolean(it.isSpecialRequest),
                    instructions: it.instructions || '',
                    image: it.image || ''
                })),
                shippingFee: Number(shippingFee) || 0,
                discountAmount: Number(discountAmount) || 0,
                paymentMethod,
                deliveryDate,
                timeSlot,
                instruction: instruction.trim(),
                status
            };

            const apiBase = import.meta.env.VITE_API_URL || '';
            let res;
            try {
                res = await fetch(`${apiBase}/api/orders/admin/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            } catch (fetchErr) {
                console.warn('Primary fetch failed, checking local server...', fetchErr);
            }

            // Fallback to local server (http://localhost:5000) if remote server returned 404 (not yet deployed) or network error
            if ((!res || res.status === 404) && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && apiBase !== 'http://localhost:5000') {
                console.warn('Remote server returned 404 for create-order. Falling back to local backend http://localhost:5000...');
                res = await fetch(`http://localhost:5000/api/orders/admin/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('Order placed successfully!');
                setCreatedOrderResult(data.order);
                if (onOrderCreated) {
                    onOrderCreated(data.order);
                }
            } else {
                toast.error(data.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            toast.error('Network error creating order');
        } finally {
            setSubmitting(false);
        }
    };

    // Reset Form
    const handleReset = () => {
        setSelectedUser(null);
        setUserSearchTerm('');
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setStreet('');
        setLandmark('');
        setShippingFee(29);
        setDiscountAmount(0);
        setItems([{
            id: 'item_1',
            productId: '',
            name: '',
            price: '',
            quantity: 1,
            unit: '1 unit',
            isSpecialRequest: true,
            instructions: ''
        }]);
        setCreatedOrderResult(null);
    };

    // Generate WhatsApp Receipt Share Message
    const openWhatsAppReceipt = () => {
        if (!createdOrderResult) return;
        const ord = createdOrderResult;
        const itemsList = ord.items.map((it, idx) => 
            `${idx + 1}. *${it.name}* (${it.weight || it.unit}) x ${it.quantity} = ₹${it.price * it.quantity}`
        ).join('\n');

        const dateStr = new Date(ord.deliveryDate).toLocaleDateString('en-IN');
        const text = `*RG BASKET - ORDER CONFIRMED* 🛒
━━━━━━━━━━━━━━━━━━━━━
*Order ID:* #${ord._id?.slice(-8).toUpperCase()}
*Customer:* ${ord.userInfo?.name || 'Customer'}
*Delivery Date:* ${dateStr}
*Time Slot:* ${ord.timeSlot}

*Items Ordered:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━━
*Subtotal:* ₹${ord.subtotal}
*Delivery Fee:* ₹${ord.shippingFee}
${ord.discountAmount > 0 ? `*Discount:* -₹${ord.discountAmount}\n` : ''}*TOTAL AMOUNT:* ₹${ord.totalAmount}
*Payment:* ${ord.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery (COD)' : ord.paymentMethod.toUpperCase()}

*Delivery Address:*
${ord.shippingAddress?.street}, ${ord.shippingAddress?.locality}, ${ord.shippingAddress?.city} - ${ord.shippingAddress?.pincode}

Thank you for shopping with *RG Basket*! 🌾`;

        const phone = (ord.userInfo?.phone || ord.shippingAddress?.phoneNumber || '').replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
    };

    return (
        <AdminModalDark
            isOpen={isOpen}
            onClose={() => {
                handleReset();
                onClose();
            }}
            title={createdOrderResult ? "Order Confirmed!" : "Create Order (WhatsApp / Custom)"}
            size="xl"
            footer={
                createdOrderResult ? (
                    <div className="flex justify-between items-center w-full">
                        <button
                            type="button"
                            onClick={() => {
                                handleReset();
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1a1b26] text-[#7aa2f7] border border-[#414868] hover:bg-[#24283b] transition-all"
                        >
                            + Create Another Order
                        </button>
                        <div className="flex items-center gap-2">
                            <AdminButtonDark
                                variant="outline"
                                onClick={() => {
                                    handleReset();
                                    onClose();
                                }}
                            >
                                Close
                            </AdminButtonDark>
                            <button
                                type="button"
                                onClick={openWhatsAppReceipt}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#25D366] text-black shadow-lg shadow-green-500/20 hover:bg-[#20ba5a] transition-all"
                            >
                                <MessageCircle className="w-4 h-4" /> Share on WhatsApp
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center w-full">
                        <div className="text-sm font-bold text-emerald-400">
                            Total: ₹{calculatedTotal.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center gap-2">
                            <AdminButtonDark
                                variant="outline"
                                onClick={onClose}
                                disabled={submitting}
                            >
                                Cancel
                            </AdminButtonDark>
                            <AdminButtonDark
                                variant="primary"
                                onClick={handleSubmit}
                                isLoading={submitting}
                                icon={ShoppingBag}
                            >
                                Place & Confirm Order
                            </AdminButtonDark>
                        </div>
                    </div>
                )
            }
        >
            {/* SUCCESS SCREEN */}
            {createdOrderResult ? (
                <div className="p-6 text-center space-y-5">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                        <CheckCircle className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                        <h3 className={`text-xl font-bold ${tw.textPrimary}`}>Order Placed Successfully!</h3>
                        <p className={`text-sm ${tw.textSecondary}`}>
                            Order ID: <span className="font-mono font-bold text-white">#{createdOrderResult._id?.slice(-8).toUpperCase()}</span>
                        </p>
                        {createdOrderResult.userOrderNumber && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#7aa2f7]/20 text-[#7aa2f7] border border-[#7aa2f7]/40 mt-1">
                                {createdOrderResult.userOrderNumber}th Order of this Customer
                            </span>
                        )}
                    </div>

                    <div className="max-w-md mx-auto p-4 rounded-xl bg-[#1a1b26] border border-[#414868]/40 text-left text-xs space-y-2">
                        <div className="flex justify-between text-[#c0caf5]">
                            <span>Customer:</span>
                            <strong className="text-white">{createdOrderResult.userInfo?.name} ({createdOrderResult.userInfo?.phone})</strong>
                        </div>
                        <div className="flex justify-between text-[#c0caf5]">
                            <span>Items:</span>
                            <strong className="text-white">{createdOrderResult.items?.length} items</strong>
                        </div>
                        <div className="flex justify-between text-[#c0caf5]">
                            <span>Total Amount:</span>
                            <strong className="text-emerald-400 text-sm font-bold">₹{createdOrderResult.totalAmount}</strong>
                        </div>
                        <div className="flex justify-between text-[#c0caf5]">
                            <span>Slot:</span>
                            <strong className="text-white">{createdOrderResult.timeSlot}</strong>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={openWhatsAppReceipt}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#25D366] text-black shadow-lg shadow-green-500/30 hover:bg-[#20ba5a] transition-all"
                        >
                            <MessageCircle className="w-4 h-4" /> Send Instant Bill to Customer on WhatsApp
                        </button>
                    </div>
                </div>
            ) : (
                /* ORDER CREATION FORM */
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* SECTION 1: CUSTOMER SELECTION */}
                    <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#414868]/40 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className={`text-sm font-bold uppercase tracking-wider ${tw.textPrimary} flex items-center gap-2`}>
                                <User className="w-4 h-4 text-[#7aa2f7]" /> 1. Customer Information
                            </h3>
                            <div className="flex items-center gap-1 bg-[#13141f] p-1 rounded-lg border border-[#414868]/40">
                                <button
                                    type="button"
                                    onClick={() => setCustomerMode('existing_user')}
                                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                        customerMode === 'existing_user'
                                            ? 'bg-[#7aa2f7] text-[#1a1b26]'
                                            : 'text-[#9ab1fe] hover:text-white'
                                    }`}
                                >
                                    Registered User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomerMode('new_customer');
                                        setSelectedUser(null);
                                    }}
                                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                        customerMode === 'new_customer'
                                            ? 'bg-[#25D366] text-[#1a1b26]'
                                            : 'text-[#9ab1fe] hover:text-white'
                                    }`}
                                >
                                    WhatsApp / New
                                </button>
                            </div>
                        </div>

                        {/* Search Registered User */}
                        {customerMode === 'existing_user' && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary}`} />
                                    <input
                                        type="text"
                                        placeholder="Search user by name, phone, or email..."
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white focus:ring-2 focus:ring-[#7aa2f7]`}
                                    />
                                    {isSearchingUsers && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-[#7aa2f7] border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Autocomplete Results */}
                                {userSearchResults.length > 0 && (
                                    <div className="max-h-48 overflow-y-auto rounded-lg bg-[#24283b] border border-[#414868] divide-y divide-[#414868]/40 custom-scrollbar shadow-xl">
                                        {userSearchResults.map((u) => (
                                            <div
                                                key={u._id}
                                                onClick={() => handleSelectUser(u)}
                                                className="p-2.5 hover:bg-[#7aa2f7]/15 cursor-pointer flex items-center justify-between transition-colors"
                                            >
                                                <div>
                                                    <p className="font-bold text-white text-xs">{u.name}</p>
                                                    <p className="text-[11px] text-[#7aa2f7]">{u.phone || 'No phone'} • {u.email}</p>
                                                </div>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                                                    {u.orderCount || u.orders?.length || 0} orders
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedUser && (
                                    <div className="p-2.5 rounded-lg bg-[#7aa2f7]/10 border border-[#7aa2f7]/30 flex items-center justify-between text-xs">
                                        <span className="text-white font-medium">
                                            Selected: <strong>{selectedUser.name}</strong> ({selectedUser.phone || selectedUser.email})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedUser(null)}
                                            className="text-red-400 hover:underline font-bold"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Customer Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#565f89] mb-1">Customer Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Ramesh Sahoo"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white focus:ring-2 focus:ring-[#7aa2f7]`}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1 flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" /> WhatsApp Phone *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="10-digit number"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className={`w-full px-3 py-2 text-sm ${tw.bgInput} border border-emerald-500/50 rounded-lg text-white focus:ring-2 focus:ring-emerald-400`}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#565f89] mb-1">Email (Optional)</label>
                                <input
                                    type="email"
                                    placeholder="customer@gmail.com"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white focus:ring-2 focus:ring-[#7aa2f7]`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: DELIVERY ADDRESS & SCHEDULE */}
                    <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#414868]/40 space-y-4">
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${tw.textPrimary} flex items-center gap-2`}>
                            <MapPin className="w-4 h-4 text-emerald-400" /> 2. Delivery Address & Slot
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold uppercase text-[#565f89] mb-1">Street / House / Flat *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="House No, Apartment, Road..."
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white focus:ring-2 focus:ring-[#7aa2f7]`}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#565f89] mb-1">Locality / Area</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dolumundai, Badambadi, CDA"
                                    value={locality}
                                    onChange={(e) => setLocality(e.target.value)}
                                    className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white focus:ring-2 focus:ring-[#7aa2f7]`}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#565f89] mb-1">Landmark (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Near temple, opposite school..."
                                    value={landmark}
                                    onChange={(e) => setLandmark(e.target.value)}
                                    className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white focus:ring-2 focus:ring-[#7aa2f7]`}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#565f89] mb-1">City & Pincode</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white`}
                                    />
                                    <input
                                        type="text"
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                        className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#565f89] mb-1">Delivery Date & Slot</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        required
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                        className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white focus:ring-2 focus:ring-[#7aa2f7]`}
                                    />
                                    <select
                                        value={timeSlot}
                                        onChange={(e) => setTimeSlot(e.target.value)}
                                        className={`w-full px-2 py-2 text-xs ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white focus:ring-2 focus:ring-[#7aa2f7]`}
                                    >
                                        {DEFAULT_SLOTS.map((slot) => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: ORDER ITEMS BUILDER (SPECIAL REQUEST + CATALOG) */}
                    <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#414868]/40 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#414868]/30 pb-3">
                            <div>
                                <h3 className={`text-sm font-bold uppercase tracking-wider ${tw.textPrimary} flex items-center gap-2`}>
                                    <ShoppingBag className="w-4 h-4 text-[#bb9af7]" /> 3. Order Items ({items.length})
                                </h3>
                                <p className="text-xs text-[#565f89]">Add special WhatsApp requested items with custom price, or pick store catalog items.</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={addSpecialRequestItem}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all shadow-sm"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> + Special Request Item
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setProductSearchIndex(productSearchIndex === -1 ? null : -1)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#7aa2f7]/20 text-[#7aa2f7] border border-[#7aa2f7]/40 hover:bg-[#7aa2f7]/30 transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" /> + From Catalog
                                </button>
                            </div>
                        </div>

                        {/* Catalog Product Quick Selector Drawer */}
                        {productSearchIndex !== null && (
                            <div className="p-3 rounded-xl bg-[#24283b] border border-[#7aa2f7]/40 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#7aa2f7] flex items-center gap-1">
                                        <Search className="w-3 h-3" /> Select Store Product to Add:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setProductSearchIndex(null)}
                                        className="text-xs text-[#565f89] hover:text-white"
                                    >
                                        ✕ Close
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Type product name to filter store catalog..."
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs bg-[#1a1b26] border border-[#414868] rounded text-white"
                                />
                                <div className="max-h-40 overflow-y-auto divide-y divide-[#414868]/40 custom-scrollbar">
                                    {catalogProducts
                                        .filter(p => !productSearchTerm || p.name?.toLowerCase().includes(productSearchTerm.toLowerCase()))
                                        .slice(0, 15)
                                        .map((p) => (
                                            <div
                                                key={p._id}
                                                onClick={() => addCatalogProductItem(p)}
                                                className="p-2 hover:bg-[#7aa2f7]/15 cursor-pointer flex justify-between items-center text-xs text-white"
                                            >
                                                <span>{p.name} ({p.weight} {p.unit})</span>
                                                <span className="font-bold text-emerald-400">₹{p.price}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                        {/* Item Rows */}
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    className={`p-3 rounded-xl border ${
                                        item.isSpecialRequest 
                                            ? 'bg-emerald-500/5 border-emerald-500/30' 
                                            : 'bg-[#13141f] border-[#414868]/40'
                                    } space-y-2`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-[#565f89]">#{idx + 1}</span>
                                            {item.isSpecialRequest ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3 text-emerald-400" /> Special Request Item
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                                    Catalog Item
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            className="text-red-400/70 hover:text-red-400 p-1"
                                            title="Remove Item"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                        <div className="sm:col-span-5">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Item Name (e.g. Alphonso Mango 5kg Box)"
                                                value={item.name}
                                                onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                                className={`w-full px-3 py-1.5 text-xs ${tw.bgInput} border ${tw.borderPrimary} rounded text-white`}
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <input
                                                type="text"
                                                placeholder="Unit (1 kg, 500g)"
                                                value={item.unit}
                                                onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                                                className={`w-full px-2 py-1.5 text-xs ${tw.bgInput} border ${tw.borderPrimary} rounded text-white`}
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#565f89]">₹</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    required
                                                    placeholder="Price"
                                                    value={item.price}
                                                    onChange={(e) => updateItem(idx, 'price', e.target.value)}
                                                    className={`w-full pl-5 pr-2 py-1.5 text-xs ${tw.bgInput} border ${tw.borderPrimary} rounded text-white font-bold`}
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-1">
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                className={`w-full px-2 py-1.5 text-xs ${tw.bgInput} border ${tw.borderPrimary} rounded text-white text-center font-bold`}
                                            />
                                        </div>

                                        <div className="sm:col-span-2 flex items-center justify-end font-mono font-bold text-emerald-400 text-xs">
                                            ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}
                                        </div>
                                    </div>

                                    {item.isSpecialRequest && (
                                        <input
                                            type="text"
                                            placeholder="Special instruction for this item (e.g. ripe only, specific brand)..."
                                            value={item.instructions || ''}
                                            onChange={(e) => updateItem(idx, 'instructions', e.target.value)}
                                            className="w-full px-2.5 py-1 text-[11px] bg-[#1a1b26] border border-[#414868]/30 rounded text-[#9ab1fe] placeholder-[#565f89]"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 4: PAYMENT & TOTALS */}
                    <div className="p-4 rounded-xl bg-[#1a1b26] border border-[#414868]/40 space-y-4">
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${tw.textPrimary} flex items-center gap-2`}>
                            <DollarSign className="w-4 h-4 text-yellow-400" /> 4. Pricing, Payment & Status
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#565f89] mb-1">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white focus:ring-2 focus:ring-[#7aa2f7]`}
                                >
                                    <option value="cash_on_delivery">Cash on Delivery (COD)</option>
                                    <option value="upi">UPI / WhatsApp Pay</option>
                                    <option value="online">Paid Online</option>
                                    <option value="card">Card Payment</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#565f89] mb-1">Initial Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white focus:ring-2 focus:ring-[#7aa2f7]`}
                                >
                                    <option value="confirmed">Confirmed (Direct)</option>
                                    <option value="processing">Processing</option>
                                    <option value="pending">Pending Review</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase text-[#565f89] mb-1">Delivery Fee (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={shippingFee}
                                    onChange={(e) => setShippingFee(e.target.value)}
                                    className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white font-bold`}
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-[11px] font-bold uppercase text-[#565f89] mb-1">Admin Notes / Instructions</label>
                                <input
                                    type="text"
                                    value={instruction}
                                    onChange={(e) => setInstruction(e.target.value)}
                                    placeholder="e.g. WhatsApp customer, asked to call before delivery"
                                    className={`w-full px-3 py-2 text-sm ${tw.bgInput} border ${tw.borderPrimary} rounded-lg text-white`}
                                />
                            </div>
                        </div>

                        {/* Bill Breakdown Box */}
                        <div className="p-3.5 rounded-xl bg-[#13141f] border border-[#414868]/40 space-y-1.5 text-xs">
                            <div className="flex justify-between text-[#c0caf5]">
                                <span>Items Subtotal:</span>
                                <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="flex justify-between text-[#c0caf5]">
                                <span>Delivery Fee:</span>
                                <strong>₹{Number(shippingFee || 0).toLocaleString('en-IN')}</strong>
                            </div>
                            {Number(discountAmount) > 0 && (
                                <div className="flex justify-between text-green-400">
                                    <span>Discount:</span>
                                    <strong>-₹{Number(discountAmount).toLocaleString('en-IN')}</strong>
                                </div>
                            )}
                            <div className="border-t border-[#414868]/40 pt-2 flex justify-between text-sm font-bold text-white">
                                <span>Final Payable Total:</span>
                                <span className="font-mono text-emerald-400 text-base">₹{calculatedTotal.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </AdminModalDark>
    );
};

export default AdminCreateOrderModalDark;
