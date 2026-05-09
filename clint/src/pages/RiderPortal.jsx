import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, MapPin, CheckCircle, Package, LogOut, Check, Navigation, Target, Eye, ChevronDown, ChevronUp, Clock, Phone, Smartphone, Database, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import toast from 'react-hot-toast';

const RiderPortal = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [pin, setPin] = useState('');
    const [partner, setPartner] = useState(null);
    const [activeTab, setActiveTab] = useState('available'); // 'available' or 'my_orders'
    const [availableOrders, setAvailableOrders] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true); // For initial sync
    const [orderActionLoading, setOrderActionLoading] = useState(null); // Track specific order being accepted
    const [statusUpdating, setStatusUpdating] = useState(false); // For online/offline toggle
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [historicalLocations, setHistoricalLocations] = useState({}); // { userId: locationData }
    const [proofImage, setProofImage] = useState(null); // File object
    const [uploadingProof, setUploadingProof] = useState(false);
    const [showDisclosure, setShowDisclosure] = useState(false);
    const [visibleMyOrdersCount, setVisibleMyOrdersCount] = useState(10);


    // Check Local Storage on mount
    useEffect(() => {
        const savedPartner = localStorage.getItem('deliveryPartner');
        if (savedPartner) {
            const parsed = JSON.parse(savedPartner);
            if (parsed.portalToken === token) {
                setPartner(parsed);
            } else {
                localStorage.removeItem('deliveryPartner');
            }
        }

        // Prominent Disclosure Check
        const disclosureAccepted = localStorage.getItem('locationDisclosureAccepted');
        if (!disclosureAccepted) {
            setShowDisclosure(true);
        }
    }, [token]);


    // Fetch orders when partner is logged in
    useEffect(() => {
        if (partner) {
            fetchOrders();
            const orderInterval = setInterval(fetchOrders, 30000);

            // Live Tracking Heartbeat - ONLY if rider has active orders
            const heartbeatInterval = setInterval(() => {
                if (partner.isActive && myOrders.length > 0 && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/update-live-ping`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                partnerId: partner._id,
                                latitude: pos.coords.latitude,
                                longitude: pos.coords.longitude
                            })
                        }).catch(e => console.error('Heartbeat failed', e));
                    }, null, { enableHighAccuracy: true });
                }
            }, 30000);

            return () => {
                clearInterval(orderInterval);
                clearInterval(heartbeatInterval);
            };
        }
    }, [partner]);

    const fetchOrders = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const resAvail = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/available-orders/${partner._id}`);
            const dataAvail = await resAvail.json();
            if (dataAvail.success) setAvailableOrders(dataAvail.orders);

            const resMy = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/my-orders/${partner._id}`);
            const dataMy = await resMy.json();
            if (dataMy.success) setMyOrders(dataMy.orders);

            if (isManual) toast.success('Orders updated');
        } catch (err) {
            console.error(err);
            if (isManual) toast.error('Failed to refresh');
        } finally {
            if (isManual) setRefreshing(false);
            setInitialLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ portalToken: token, loginPin: pin })
            });
            const data = await res.json();
            if (data.success) {
                setPartner(data.partner);
                localStorage.setItem('deliveryPartner', JSON.stringify(data.partner));
                toast.success('Login successful');
            } else {
                toast.error(data.message || 'Login failed');
            }
        } catch (err) {
            toast.error('Network error');
        }
        setLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('deliveryPartner');
        setPartner(null);
        setPin('');
    };

    const handleToggleStatus = async () => {
        try {
            setStatusUpdating(true);
            const newStatus = !partner.isActive;
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/toggle-status/${partner._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                const updated = { ...partner, isActive: newStatus };
                setPartner(updated);
                await Preferences.set({ key: 'deliveryPartner', value: JSON.stringify(updated) });
                toast.success(newStatus ? 'You are now Active' : 'You are now Inactive');
            }
        } catch (err) {
            toast.error('Error updating status');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        try {
            setOrderActionLoading(orderId);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/accept-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partnerId: partner._id, orderId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Order Accepted successfully');
                fetchOrders();
            } else {
                toast.error(data.message || 'Failed to accept order');
            }
        } catch (err) {
            toast.error('Error accepting order');
        } finally {
            setOrderActionLoading(null);
        }
    };

    // Distance calculation helper (Haversine formula)
    const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in meters
    };

    // Super-Robust GPS helper with Retries and Active Warming
    const getCurrentGPSLocation = async (retryCount = 3) => {
        const getPos = (highAccuracy) => new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error('NO_SUPPORT'));

            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(pos),
                (err) => reject(err),
                {
                    enableHighAccuracy: highAccuracy,
                    timeout: highAccuracy ? 10000 : 6000,
                    maximumAge: 0 // Force fresh signal every time
                }
            );
        });

        let lastErr;
        // Try High Accuracy first with multiple retries
        for (let i = 0; i < retryCount; i++) {
            try {
                console.log(`🛰️ GPS Attempt ${i + 1} (High Accuracy)...`);
                return await getPos(true);
            } catch (err) {
                lastErr = err;
                // Code 1 = Permission Denied. No point in retrying.
                if (err.code === 1) break;

                // For other errors (Timeout/Position Unavailable), wait and retry
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        // Final "Never Fail" Fallback: Network Location
        try {
            console.log('📡 GPS Final Fallback (Network Location)...');
            return await getPos(false);
        } catch (err) {
            throw lastErr || err;
        }
    };

    const handleCompleteOrder = async (orderId) => {
        const order = myOrders.find(o => o._id === orderId);
        if (!order) return;

        setUploadingProof(true);

        // --- ANTI-CHEAT GEOFENCING CHECK ---
        const checkGeofence = async () => {
            const hasLoc = order.deliveryLocation?.coordinates?.latitude;
            const histLoc = historicalLocations[order.user]?.coordinates;
            const targetLoc = hasLoc ? order.deliveryLocation.coordinates : (histLoc || null);

            try {
                // UI feedback so rider knows the system is working hard
                const scanToast = toast.loading('🛰️ Locking GPS signal...', { duration: 20000 });
                const position = await getCurrentGPSLocation();
                toast.dismiss(scanToast);

                if (!targetLoc) {
                    return { position, forced: false };
                }

                const rawDistance = getDistanceInMeters(
                    position.coords.latitude,
                    position.coords.longitude,
                    targetLoc.latitude,
                    targetLoc.longitude
                );

                // FARE-CHECK LOGIC: Subtract accuracy error from distance
                // If phone says "I am 550m away but my error margin is 60m", 
                // we treat it as 490m (SAFE). This gives riders the benefit of the doubt.
                const accuracy = position.coords.accuracy || 0;
                const fairDistance = Math.max(0, rawDistance - accuracy);

                console.log(`📍 GPS Audit: Raw=${Math.round(rawDistance)}m, Accuracy=${Math.round(accuracy)}m, Fair=${Math.round(fairDistance)}m`);

                if (fairDistance > 500) { // Still too far even with error margin
                    const force = window.confirm(`GPS Check: You are ${Math.round(fairDistance)}m away from the customer's doorstep. If you are actually at the door, click OK to mark as "Force Delivered" for Admin review.`);
                    if (force) {
                        return { position, forced: true };
                    } else {
                        return false;
                    }
                } else {
                    // Within 500m (or close enough given GPS error)
                    return { position, forced: false };
                }
            } catch (err) {
                toast.dismiss();
                let msg = 'GPS Signal Weak! ';
                if (err.code === 1) msg = 'Location Permission Blocked! Please enable it in browser settings.';
                else if (err.code === 3) msg = 'GPS Signal Timeout. Move to an open area (balcony/street) and try again.';
                else msg = 'Location hardware error. Try toggling your phone GPS off and on.';

                toast.error(msg, { duration: 6000 });
                return false;
            }
        };

        const geofenceResult = await checkGeofence();
        if (!geofenceResult) {
            setUploadingProof(false);
            return;
        }

        const { position: geofencePosition, forced: isForced } = geofenceResult;
        // ------------------------------------

        if (!window.confirm('Mark this order as DELIVERED?')) {
            setUploadingProof(false);
            return;
        }

        const formData = new FormData();
        formData.append('orderId', orderId);
        formData.append('partnerId', partner._id);
        formData.append('proofImage', proofImage);
        formData.append('isForcefullyDelivered', isForced);

        // Include the location captured during verification
        if (geofencePosition) {
            formData.append('latitude', geofencePosition.coords.latitude);
            formData.append('longitude', geofencePosition.coords.longitude);
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/complete-order`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Order delivered successfully!');
                setProofImage(null);
                fetchOrders();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error('Network error during delivery upload');
        } finally {
            setUploadingProof(false);
        }
    };

    const handleCaptureLocation = async (orderId, isVerified = false) => {
        if (isVerified && !window.confirm('Are you exactly at the customer\'s doorstep? This will save this spot as their PERMANENT home location for all future orders.')) {
            return;
        }

        setFetchingLocation(true);
        try {
            const position = await getCurrentGPSLocation(true);
            const { latitude, longitude, accuracy } = position.coords;

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/update-location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partnerId: partner._id,
                    orderId,
                    latitude,
                    longitude,
                    accuracy,
                    isVerified
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(isVerified ? '✅ CUSTOMER HOME VERIFIED!' : 'Location captured!');
                fetchOrders();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error('GPS Signal Error. Please try again in 5 seconds.');
        } finally {
            setFetchingLocation(false);
        }
    };

    const getHistoricalLocation = async (userId) => {
        if (historicalLocations[userId]) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/customer-location-history/${userId}`);
            const data = await res.json();
            if (data.success) {
                setHistoricalLocations(prev => ({ ...prev, [userId]: data.deliveryLocation }));
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    };

    const openInMaps = (lat, lng) => {
        if (!lat || !lng) return;
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    };

    if (!partner) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-200">
                    <div className="flex justify-center mb-6">
                        <div className="bg-emerald-100 p-4 rounded-full">
                            <Truck className="w-12 h-12 text-emerald-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-center text-gray-800 mb-2">Rider Portal</h2>
                    <p className="text-gray-500 text-center text-sm mb-6">Authorized Access Only</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Secure PIN</label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full px-4 py-4 text-center text-3xl font-black tracking-[1em] border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-gray-300"
                                maxLength="6"
                                placeholder="..."
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl hover:bg-emerald-700 active:scale-95 transition shadow-lg shadow-emerald-200"
                        >
                            {loading ? 'Authenticating...' : 'Enter Portal'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (initialLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                    <Truck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600 w-8 h-8" />
                </div>
                <h2 className="mt-8 text-xl font-black text-gray-800 tracking-tight">Syncing Portal...</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 max-w-[200px] leading-relaxed">Fetching orders and updating your status</p>
                <div className="mt-12 flex gap-1.5">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-0"></div>
                    <div className="w-2 h-2 bg-emerald-600/60 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-emerald-600/30 rounded-full animate-bounce delay-300"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white text-gray-800 p-4 shadow-sm border-b sticky top-0 z-20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-600 p-1.5 rounded-lg">
                        <Truck className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-black tracking-tight">RG <span className="text-emerald-600">Rider</span></h1>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => fetchOrders(true)}
                        disabled={refreshing}
                        className="p-2 hover:bg-gray-100 text-gray-600 rounded-full transition active:rotate-180 duration-500"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={handleLogout} className="p-2 hover:bg-gray-100 text-gray-600 rounded-full transition">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Profile & Status Card */}
            <div className="p-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xl">
                            {partner.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="font-black text-gray-800 leading-tight">{partner.name}</h2>
                            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Rider ID: {partner._id.substring(partner._id.length - 6)}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={`text-[10px] font-black mb-1 uppercase tracking-wider ${partner.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {partner.isActive ? 'Ready to work' : 'Offline'}
                        </span>
                        <label className={`relative inline-flex items-center cursor-pointer ${statusUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input type="checkbox" className="sr-only peer" checked={partner.isActive} onChange={handleToggleStatus} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                            {statusUpdating && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
                                </div>
                            )}
                        </label>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-4 mb-4 gap-2">
                <button
                    onClick={() => setActiveTab('available')}
                    className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${activeTab === 'available' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-gray-500 border border-gray-200'
                        }`}
                >
                    NEW ({availableOrders.length})
                </button>
                <button
                    onClick={() => setActiveTab('my_orders')}
                    className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${activeTab === 'my_orders' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-gray-500 border border-gray-200'
                        }`}
                >
                    MY LIST ({myOrders.length})
                </button>
            </div>

            {/* Order List */}
            <div className="px-4 space-y-4">
                {activeTab === 'available' ? (
                    availableOrders.length > 0 ? (
                        availableOrders.map(order => (
                            <div key={order._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-bl-xl tracking-wider">
                                    {order.paymentMethod.replace('_', ' ').toUpperCase()}
                                </div>
                                <div className="mb-4">
                                    <h3 className="font-black text-gray-800 text-lg">Order #{order._id.substring(order._id.length - 6)}</h3>
                                    <p className="text-gray-400 text-xs font-medium flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="text-gray-600 text-sm space-y-2 mb-4">
                                    <div className="flex items-start gap-2">
                                        <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 mt-0.5"><MapPin size={16} /></div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{order.shippingAddress?.locality}</p>
                                            <p className="text-gray-400 text-[10px] font-medium leading-tight">
                                                {order.shippingAddress?.street}, {order.shippingAddress?.city} - {order.shippingAddress?.pincode}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-amber-50 p-1.5 rounded-lg text-amber-600"><Package size={16} /></div>
                                        <p className="text-xs font-bold text-gray-600">{order.items?.length || 0} Products • ₹{order.totalAmount}</p>
                                    </div>
                                </div>
                                {partner.isActive ? (
                                    <button
                                        onClick={() => handleAcceptOrder(order._id)}
                                        disabled={orderActionLoading === order._id}
                                        className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl hover:bg-emerald-700 flex justify-center items-center gap-2 transition disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        {orderActionLoading === order._id ? (
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Check size={18} /> ACCEPT SHIPMENT
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="bg-gray-100 text-gray-400 text-center py-4 rounded-xl font-bold text-sm">
                                        GO ACTIVE TO ACCEPT
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 flex flex-col items-center">
                            <div className="bg-gray-100 p-6 rounded-full mb-4">
                                <Truck className="w-12 h-12 text-gray-300" />
                            </div>
                            <h3 className="font-black text-gray-400">NO NEW ORDERS</h3>
                            <p className="text-gray-300 text-xs font-bold uppercase tracking-widest mt-1">Waiting for fresh arrivals</p>
                        </div>
                    )
                ) : (
                    myOrders.length > 0 ? (
                        <div className="space-y-6">
                            {Object.entries(
                                myOrders.slice(0, visibleMyOrdersCount).reduce((groups, order) => {
                                    const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    });
                                    if (!groups[date]) groups[date] = [];
                                    groups[date].push(order);
                                    return groups;
                                }, {})
                            ).map(([date, orders]) => (
                                <div key={date} className="space-y-3">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{date}</span>
                                        <div className="h-[1px] flex-1 bg-gray-200"></div>
                                    </div>

                                    {orders.map(order => {
                                        const isExpanded = expandedOrder === order._id;
                                        const hasLoc = order.deliveryLocation?.coordinates?.latitude;
                                        const histLoc = historicalLocations[order.user];
                                        const finalLoc = hasLoc ? order.deliveryLocation.coordinates : (histLoc?.coordinates || null);
                                        const isHistorical = !hasLoc && !!histLoc;

                                        return (
                                            <div key={order._id} className={`bg-white rounded-2xl shadow-sm border transition-all ${order.status === 'delivered' ? 'border-emerald-200 opacity-80' : 'border-gray-200'}`}>
                                                <div className="p-5" onClick={() => {
                                                    setExpandedOrder(isExpanded ? null : order._id);
                                                    if (!hasLoc) getHistoricalLocation(order.user);
                                                }}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="font-black text-gray-800">Order #{order._id.substring(order._id.length - 6)}</h3>
                                                            <div className="flex gap-2 mt-1">
                                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                                    }`}>
                                                                    {order.status}
                                                                </span>
                                                                {order.paymentMethod === 'cash_on_delivery' && <span className="bg-rose-100 text-rose-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">COD</span>}
                                                            </div>
                                                        </div>
                                                        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                                    </div>

                                                    <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <div className="bg-white p-2 rounded-lg text-emerald-600 shadow-sm"><Phone size={14} /></div>
                                                                <p className="text-sm font-black text-gray-800">{order.shippingAddress?.fullName}</p>
                                                            </div>
                                                            <a href={`tel:${order.shippingAddress?.phoneNumber}`} className="bg-emerald-600 text-white p-2 rounded-lg flex items-center gap-2 text-xs font-bold px-3">
                                                                <Smartphone size={14} /> CALL
                                                            </a>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm"><MapPin size={14} /></div>
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-700">{order.shippingAddress?.locality}</p>
                                                                <p className="text-[10px] text-gray-500 font-medium">{order.shippingAddress?.street}, {order.shippingAddress?.city} - {order.shippingAddress?.pincode}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {!isExpanded && (
                                                        <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Click to expand details • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            <p className="text-lg font-black text-emerald-700">₹{order.totalAmount}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Expanded Detail Section */}
                                                {isExpanded && (
                                                    <div className="px-5 pb-5 pt-0 border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        {/* Order Items */}
                                                        <div className="mt-4">
                                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Package size={12} /> Items to Pack</h4>
                                                            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                                                                {order.items?.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                                                                        <div className="flex items-center gap-2">
                                                                            <img src={item.image} alt="" className="w-8 h-8 rounded object-cover border bg-white" />
                                                                            <div>
                                                                                <p className="text-[11px] font-black text-gray-800 leading-tight">{item.name}</p>
                                                                                <p className="text-[9px] text-gray-400 font-bold">{item.weight}{item.unit} x {item.quantity}</p>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-xs font-black text-gray-700">₹{item.price * item.quantity}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Bill Breakdown */}
                                                        <div className="mt-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Bill Details</h4>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-xs font-medium text-gray-600">
                                                                    <span>Item Subtotal</span>
                                                                    <span>₹{order.subtotal || (order.totalAmount - (order.shippingFee || 0))}</span>
                                                                </div>
                                                                {order.shippingFee > 0 && (
                                                                    <div className="flex justify-between text-xs font-medium text-gray-600">
                                                                        <span>Delivery Fee</span>
                                                                        <span className="text-emerald-600">+ ₹{order.shippingFee}</span>
                                                                    </div>
                                                                )}
                                                                {order.tax > 0 && (
                                                                    <div className="flex justify-between text-xs font-medium text-gray-600">
                                                                        <span>Taxes</span>
                                                                        <span>+ ₹{order.tax}</span>
                                                                    </div>
                                                                )}
                                                                {order.discountAmount > 0 && (
                                                                    <div className="flex justify-between text-xs font-medium text-rose-600">
                                                                        <span>Discount Applied</span>
                                                                        <span>- ₹{order.discountAmount}</span>
                                                                    </div>
                                                                )}
                                                                {order.coinDiscount > 0 && (
                                                                    <div className="flex justify-between text-xs font-medium text-amber-600">
                                                                        <span>RG Coins Used 🪙</span>
                                                                        <span>- ₹{order.coinDiscount}</span>
                                                                    </div>
                                                                )}
                                                                {order.tipAmount > 0 && (
                                                                    <div className="flex justify-between text-xs font-medium text-blue-600">
                                                                        <span>Rider Tip</span>
                                                                        <span>+ ₹{order.tipAmount}</span>
                                                                    </div>
                                                                )}
                                                                <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                                                                    <span className="text-sm font-black text-gray-800">Total Payable</span>
                                                                    <span className="text-lg font-black text-emerald-700">₹{order.totalAmount}</span>
                                                                </div>

                                                                {order.status === 'delivered' && order.coinsEarned > 0 && (
                                                                    <div className="mt-2 pt-2 border-t border-emerald-100 flex justify-between items-center">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-xs">🪙</span>
                                                                            <span className="text-[10px] font-black text-emerald-600 uppercase">User Earned</span>
                                                                        </div>
                                                                        <span className="text-xs font-black text-emerald-600">+{order.coinsEarned} RG Coins</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Delivery Instructions */}
                                                        {order.instruction && (
                                                            <div className="mt-5 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                                                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                                    <span className="text-sm">📝</span> Delivery Instructions
                                                                </h4>
                                                                <p className="text-sm font-bold text-gray-800 leading-relaxed">
                                                                    {order.instruction}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Location Section */}
                                                        <div className="mt-5 space-y-3">
                                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Navigation size={12} /> Precise Location</h4>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <button
                                                                    onClick={() => finalLoc ? openInMaps(finalLoc.latitude, finalLoc.longitude) : handleCaptureLocation(order._id)}
                                                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all group ${finalLoc ? 'border-blue-100 bg-blue-50/30' : 'border-gray-200 hover:border-blue-400'}`}
                                                                >
                                                                    {fetchingLocation ? <Clock className="animate-spin text-blue-600" size={20} /> : <Navigation className={`${finalLoc ? 'text-blue-600' : 'text-gray-300'}`} size={20} />}
                                                                    <span className="text-[10px] font-black uppercase">{finalLoc ? 'Navigation' : 'Needs Location'}</span>
                                                                    {isHistorical && <span className="text-[8px] text-amber-600 font-black uppercase flex items-center gap-0.5"><Database size={8} /> Using History</span>}
                                                                </button>
                                                                <button
                                                                    disabled={fetchingLocation}
                                                                    onClick={() => handleCaptureLocation(order._id)}
                                                                    className="p-3 rounded-xl border border-gray-200 hover:border-emerald-400 bg-white flex flex-col items-center gap-1 transition-all group"
                                                                >
                                                                    <Target className="text-gray-300 group-hover:text-emerald-500" size={20} />
                                                                    <span className="text-[10px] font-black uppercase">Tag Location</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Delivery Action */}
                                                        {order.status !== 'delivered' && (
                                                            <div className="mt-6 flex flex-col gap-3">
                                                                <div className={`rounded-xl p-4 border ${order.paymentMethod === 'cash_on_delivery' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{order.paymentMethod === 'cash_on_delivery' ? 'Collect From Customer' : 'Payment Status'}</span>
                                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${order.paymentMethod === 'cash_on_delivery' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>
                                                                            {order.paymentMethod.replace('_', ' ')}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-xs font-bold text-gray-700">{order.paymentMethod === 'cash_on_delivery' ? 'Cash to be Collected' : 'Already Paid Online'}</span>
                                                                        <span className="text-2xl font-black text-gray-900">₹{order.paymentMethod === 'cash_on_delivery' ? order.totalAmount : 0}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Proof of Delivery Image Upload */}
                                                                <div className="bg-gray-100 p-4 rounded-xl border border-dashed border-gray-300">
                                                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">📸 Proof of Delivery (Optional but Recommended)</label>
                                                                    <div className="flex items-center gap-3">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            capture="environment" // Suggests camera on mobile
                                                                            id={`proof-${order._id}`}
                                                                            className="hidden"
                                                                            onChange={(e) => setProofImage(e.target.files[0])}
                                                                        />
                                                                        <label
                                                                            htmlFor={`proof-${order._id}`}
                                                                            className="flex-1 bg-white border border-gray-200 p-3 rounded-lg text-xs font-bold text-gray-600 text-center cursor-pointer hover:border-emerald-500 hover:text-emerald-600 transition truncate"
                                                                        >
                                                                            {proofImage ? proofImage.name : 'Take Photo / Upload Image'}
                                                                        </label>
                                                                        {proofImage && (
                                                                            <button
                                                                                onClick={() => setProofImage(null)}
                                                                                className="bg-rose-100 text-rose-600 p-3 rounded-lg"
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    disabled={uploadingProof}
                                                                    onClick={() => handleCompleteOrder(order._id)}
                                                                    className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                                                >
                                                                    <CheckCircle size={20} /> {uploadingProof ? 'UPLOADING...' : 'MARK AS DELIVERED'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            {myOrders.length > visibleMyOrdersCount && (
                                <button
                                    onClick={() => setVisibleMyOrdersCount(prev => prev + 10)}
                                    className="w-full py-4 bg-white border border-gray-200 text-emerald-600 font-black text-xs uppercase tracking-widest rounded-2xl shadow-sm hover:bg-emerald-50 transition-colors"
                                >
                                    Load 10 More Orders
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-300">
                            <p className="font-black">YOUR LIST IS EMPTY</p>
                            <p className="text-[10px] uppercase font-bold mt-1">Accept orders from the NEW tab</p>
                        </div>
                    )
                )}
            </div>

            {/* Account Deletion Request (Policy Compliance) */}
            <div className="mt-12 mb-8 px-6 text-center">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-2">
                    Want to stop working with us?
                </p>
                <a
                    href={`mailto:rgbasketbusiness@gmail.com?subject=Rider Account Deletion Request&body=Hello RG Basket Team,%0D%0A%0D%0AI would like to request the permanent deletion of my Rider account and all associated data.%0D%0A%0D%0AMy Details:%0D%0AName: ${partner.name}%0D%0APhone: ${partner.phone}%0D%0ARider ID: ${partner._id}%0D%0A%0D%0AThank you.`}
                    className="inline-block px-6 py-2 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-gray-200"
                >
                    Request Account Deletion
                </a>
                <p className="mt-3 text-[8px] text-gray-300 font-medium uppercase tracking-tight">
                    Your request will be processed within 24-48 hours.
                </p>
            </div>

            {/* Prominent Disclosure Modal */}
            <AnimatePresence>
                {showDisclosure && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck size={32} />
                            </div>
                            <h2 className="text-xl font-black text-center text-gray-900 uppercase tracking-tight mb-2">Location Disclosure</h2>
                            <div className="space-y-4 text-xs text-gray-500 font-bold uppercase tracking-wide leading-relaxed text-center">
                                <p>
                                    RG Basket collects location data to enable <span className="text-emerald-600">Real-time Order Tracking</span> for customers, even when the app is closed or not in use. To enable this, please select <strong>"Allow all the time"</strong> in the next screen.
                                </p>

                                <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3 text-left">
                                    <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                                    <p className="text-[10px]">This data is only used during active deliveries to ensure customers can see their order progress.</p>
                                </div>
                            </div>
                            <div className="mt-8">
                                <button
                                    onClick={() => {
                                        localStorage.setItem('locationDisclosureAccepted', 'true');
                                        setShowDisclosure(false);
                                    }}
                                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100"
                                >
                                    Accept & Continue
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>

    );
};

export default RiderPortal;

