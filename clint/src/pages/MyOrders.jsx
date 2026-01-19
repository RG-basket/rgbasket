import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  const navigate = useNavigate();

  // Order status options for filtering
  const statusFilters = [
    { value: 'all', label: 'All Orders', count: 0, color: 'bg-gray-500' },
    { value: 'confirmed', label: 'Confirmed', count: 0, color: 'bg-blue-500' },
    { value: 'out for delivery', label: 'Out for Delivery', count: 0, color: 'bg-indigo-500' },
    { value: 'delivered', label: 'Delivered', count: 0, color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', count: 0, color: 'bg-red-500' }
  ];

  // Fetch user orders
  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser?.id || currentUser?._id;

      if (!userId) {
        throw new Error('Please login to view your orders');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/user/${userId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }

    } catch (err) {
      setError(err.message || 'Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOrders();
  }, []);

  // Update filtered orders when status filter or orders change
  useEffect(() => {
    if (selectedStatus === 'all') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => {
        if (selectedStatus === 'out for delivery') {
          return order.status === 'shipped';
        }
        return order.status === selectedStatus;
      });
      setFilteredOrders(filtered);
    }
  }, [selectedStatus, orders]);

  // Auto-expand orders that are "out for delivery"
  useEffect(() => {
    if (orders.length > 0) {
      const activeOrders = orders.filter(o => o.status === 'shipped' || o.status === 'out for delivery');
      if (activeOrders.length > 0) {
        setExpandedOrders(prev => {
          const next = { ...prev };
          activeOrders.forEach(order => {
            next[order._id] = true;
          });
          return next;
        });
      }
    }
  }, [orders]);

  // Update status counts
  const getStatusCounts = () => {
    return statusFilters.map(filter => {
      let count = 0;

      if (filter.value === 'all') {
        count = orders.length;
      } else if (filter.value === 'out for delivery') {
        count = orders.filter(order => order.status === 'shipped').length;
      } else {
        count = orders.filter(order => order.status === filter.value).length;
      }

      return {
        ...filter,
        count
      };
    });
  };

  const getOrderStatusColor = (status) => {
    const displayStatus = status === 'shipped' ? 'out for delivery' : status;

    const colors = {
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      'out for delivery': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      shipped: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border border-green-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200'
    };
    return colors[displayStatus] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getStatusIcon = (status) => {
    const displayStatus = status === 'shipped' ? 'out for delivery' : status;

    const icons = {
      confirmed: '✅',
      'out for delivery': '🚚',
      shipped: '🚚',
      delivered: '📦',
      cancelled: '❌'
    };
    return icons[displayStatus] || '📋';
  };

  const getDisplayStatus = (status) => {
    if (status === 'shipped') {
      return 'Out for Delivery';
    }
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  };

  // Check if order can be cancelled
  const canCancelOrder = (order) => {
    const cancellableStatuses = ['pending', 'confirmed'];
    return cancellableStatuses.includes(order.status);
  };

  // Handle cancel order
  const handleCancelOrder = (order) => {
    setOrderToCancel(order);
    setCancelReason('');
    setShowCancelConfirm(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      setUpdatingOrder(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${orderToCancel._id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancelReason: cancelReason || 'Cancelled by user'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.status}`);
      }

      await response.json();
      await fetchUserOrders();

      setError('');
      setShowCancelConfirm(false);
      setOrderToCancel(null);
      setCancelReason('');

    } catch (err) {
      setError('Failed to cancel order. Please try again.');
    } finally {
      setUpdatingOrder(false);
    }
  };

  const cancelCancelConfirmation = () => {
    setShowCancelConfirm(false);
    setOrderToCancel(null);
    setCancelReason('');
  };

  // Get product image URL safely
  const getProductImage = (item) => {
    if (item.image) {
      // If image is already a full URL, use it directly
      if (item.image.startsWith('http')) {
        return item.image;
      }
      // If it's a path, add the server URL
      return item.image;
    }
    // Fallback placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg==';
  };

  const handleMarkAsDelivered = (order) => {
    setOrderToDeliver(order);
    setShowDeliveryConfirm(true);
  };

  const confirmDelivery = async () => {
    if (!orderToDeliver) return;

    try {
      setUpdatingOrder(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${orderToDeliver._id}/delivered`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to update order: ${response.status}`);
      }

      await response.json();
      await fetchUserOrders();

      setError('');
      setShowDeliveryConfirm(false);
      setOrderToDeliver(null);

      // Show Google Review Popup after successful delivery confirmation
      setTimeout(() => {
        setShowReviewPopup(true);
      }, 500);

    } catch (err) {
      setError('Failed to update order status. Please try again.');
    } finally {
      setUpdatingOrder(false);
    }
  };

  const cancelDeliveryConfirmation = () => {
    setShowDeliveryConfirm(false);
    setOrderToDeliver(null);
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const printOrderBill = (order) => {
    if (!order) return;

    const printWindow = window.open('', '_blank');

    const billHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Order Bill - ${order._id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body { 
      font-family: 'Inter', sans-serif; 
      margin: 15px; 
      color: #1f2937;
      background: #f8fafc;
      line-height: 1.5;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    
    .header { 
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 25px 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 300;
    }
    
    .content {
      padding: 25px 30px;
    }
    
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 25px;
    }
    
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }
    
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #059669;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .info-item {
      margin-bottom: 6px;
      font-size: 13px;
    }
    
    .info-label {
      font-weight: 500;
      color: #64748b;
      display: inline-block;
      width: 100px;
    }
    
    .info-value {
      color: #1f2937;
      font-weight: 400;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-confirmed { background: #dbeafe; color: #1e40af; }
    .status-processing { background: #e9d5ff; color: #7e22ce; }
    .status-shipped { background: #c7d2fe; color: #3730a3; }
    .status-delivered { background: #d1fae5; color: #065f46; }
    .status-cancelled { background: #fecaca; color: #991b1b; }
    
    .items-section {
      margin: 25px 0;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #059669;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .items-table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 13px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .items-table th { 
      background: #059669;
      color: white;
      font-weight: 600;
      padding: 12px 10px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .items-table td { 
      padding: 12px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .total-section {
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    
    .total-row.final {
      border-top: 2px solid #e2e8f0;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 16px;
      font-weight: 700;
      color: #059669;
    }
    
    .footer { 
      text-align: center; 
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    
    .no-print { 
      text-align: center; 
      margin-top: 25px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    
    .print-btn, .close-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .print-btn {
      background: #059669;
      color: white;
    }
    
    .close-btn {
      background: #64748b;
      color: white;
      margin-left: 10px;
    }
    
    @media print {
      body { margin: 0; background: white; }
      .no-print { display: none; }
      .invoice-container { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>RG BASKET INVOICE</h1>
      <p>Fresh Groceries Delivered to Your Doorstep</p>
    </div>

    <div class="content">
      <div class="grid-2">
        <div class="info-card">
          <div class="card-title">ORDER INFORMATION</div>
          <div class="info-item"><span class="info-label">Order ID:</span><span class="info-value">${order._id.slice(-8).toUpperCase()}</span></div>
          <div class="info-item"><span class="info-label">Date:</span><span class="info-value">${new Date(order.createdAt).toLocaleDateString()}</span></div>
          <div class="info-item"><span class="info-label">Status:</span><span class="info-value"><span class="status-badge status-${order.status}">${order.status}</span></span></div>
          <div class="info-item"><span class="info-label">Payment:</span><span class="info-value">${order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}</span></div>
        </div>

        <div class="info-card">
          <div class="card-title">CUSTOMER INFORMATION</div>
          <div class="info-item"><span class="info-label">Name:</span><span class="info-value">${order.userInfo?.name || order.shippingAddress?.fullName || 'Guest'}</span></div>
          <div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${order.userInfo?.phone || order.shippingAddress?.phoneNumber || 'N/A'}</span></div>
        </div>
      </div>

      <div class="items-section">
        <div class="section-title">ORDER ITEMS</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Weight</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.weight} ${item.unit || ''}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td><strong>₹${(item.price * item.quantity).toFixed(2)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="total-section">
        <div class="total-row"><span>Subtotal:</span><span>₹${order.subtotal.toFixed(2)}</span></div>
        <div class="total-row"><span>Shipping Fee:</span><span>₹${order.shippingFee.toFixed(2)}</span></div>
        ${order.discountAmount > 0 ? `<div class="total-row" style="color: #059669;"><span>Discount:</span><span>-₹${order.discountAmount.toFixed(2)}</span></div>` : ''}
        <div class="total-row final"><span>TOTAL AMOUNT:</span><span>₹${order.totalAmount.toFixed(2)}</span></div>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for shopping with RG Basket!</p>
      <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>

    <div class="no-print">
      <button class="print-btn" onclick="window.print()">🖨️ Print Bill</button>
      <button class="close-btn" onclick="window.close()">✕ Close</button>
    </div>
  </div>
</body>
</html>`;

    printWindow.document.write(billHtml);
    printWindow.document.close();
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-12 w-12 border-b-2 border-[#26544a] mx-auto mb-3"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-base font-medium"
          >
            Loading your orders...
          </motion.p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <span className="text-xl">⚠️</span>
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg font-semibold text-gray-800 mb-2"
          >
            Something went wrong
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 mb-4 text-sm"
          >
            {error}
          </motion.p>
          <div className="space-y-2">
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={fetchUserOrders}
              className="bg-[#26544a] hover:bg-[#1e423a] text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm w-full"
            >
              Try Again
            </motion.button>
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => navigate('/products')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm w-full"
            >
              Go Shopping
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gray-50/50 py-4"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Compact Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Orders</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              History & Tracking
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fetchUserOrders}
            className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-emerald-600 hover:bg-emerald-50 transition-all"
            title="Refresh Orders"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.button>
        </div>

        {/* Premium Status Pill Filter */}
        <div className="flex overflow-x-auto gap-2 pb-6 no-scrollbar -mx-4 px-4 scroll-smooth">
          {statusCounts.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleStatusFilter(filter.value)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${selectedStatus === filter.value
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100'
                : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-200'
                }`}
            >
              <span>{filter.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${selectedStatus === filter.value ? 'bg-white/20' : 'bg-gray-100'}`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="text-5xl mb-4">🛒</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Orders Found</h3>
            <p className="text-gray-500 text-xs mb-8">Ready to start your grocery haul?</p>
            <button onClick={() => navigate('/products')} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all">Start Shopping</button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const orderId = order._id || `order-${index}`;
              const isExpanded = expandedOrders[orderId];

              return (
                <motion.div
                  key={orderId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    onClick={() => toggleOrderExpansion(orderId)}
                    className="p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-4 select-none active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${getOrderStatusColor(order.status).split(' ')[0]}`}>
                        {getStatusIcon(order.status)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
                          #{orderId.slice(-8).toUpperCase()}
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${getOrderStatusColor(order.status)}`}>
                            {getDisplayStatus(order.status)}
                          </span>
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} • {order.items?.length} Items
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none">Total Paid</p>
                        <p className="text-lg font-black text-emerald-700 leading-tight mt-1">₹{order.totalAmount?.toFixed(2)}</p>
                      </div>
                      <div className={`p-2 rounded-xl transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  {!isExpanded && (
                    <div className="px-4 pb-4 flex sm:hidden justify-between items-center border-t border-gray-50 pt-3">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Tap to view details</span>
                      <span className="text-sm font-black text-emerald-600">₹{order.totalAmount?.toFixed(2)}</span>
                    </div>
                  )}

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'circOut' }}
                        className="overflow-hidden border-t border-gray-100 bg-gray-50/30"
                      >
                        <div className="p-4 sm:p-6 space-y-6">
                          <div className="flex flex-wrap gap-2">
                            {order.status === 'delivered' && (
                              <button onClick={() => printOrderBill(order)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all">
                                <span>🖨️</span> Print Invoice
                              </button>
                            )}
                            {(order.status === 'shipped' || order.status === 'out for delivery') && (
                              <button onClick={() => handleMarkAsDelivered(order)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-100 active:scale-95 transition-all">
                                ✓ Confirm Receipt
                              </button>
                            )}
                            {canCancelOrder(order) && (
                              <button onClick={() => handleCancelOrder(order)} className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold active:scale-95 transition-all">
                                ✕ Cancel Order
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Bag Items</h4>
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm hover:border-emerald-100 transition-all">
                                  <img src={getProductImage(item)} className="w-14 h-14 rounded-xl object-cover border border-gray-50" onError={(e) => e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg=='} />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-[13px] font-bold text-gray-800 truncate">{item.name}</h5>
                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">{item.weight} • {item.quantity} Qty</p>
                                    <p className="text-xs font-black text-emerald-600 mt-1">₹{item.price?.toFixed(2)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Payment Summary</h4>
                                <div className="flex justify-between text-xs font-bold text-gray-500">
                                  <span>Subtotal</span>
                                  <span>₹{order.subtotal?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-gray-500">
                                  <span>Delivery Fee</span>
                                  <span className="text-emerald-500">₹{order.shippingFee?.toFixed(2)}</span>
                                </div>
                                <div className="pt-3 border-t border-dashed border-gray-100 flex justify-between items-center font-black text-gray-900">
                                  <span className="text-sm">Paid via {order.paymentMethod?.replace(/_/g, ' ')}</span>
                                  <span className="text-lg text-emerald-700">₹{order.totalAmount?.toFixed(2)}</span>
                                </div>
                              </div>

                              {order.shippingAddress && (
                                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Delivery To</h4>
                                  <p className="text-xs font-bold text-gray-800">{order.shippingAddress.fullName}</p>
                                  <p className="text-[11px] text-gray-500 font-medium mt-1 leading-relaxed">
                                    {order.shippingAddress.street}, {order.shippingAddress.city} <br />
                                    {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                  </p>
                                  <p className="text-[11px] font-black text-emerald-600 mt-2">📞 {order.shippingAddress.phoneNumber}</p>
                                </div>
                              )}

                              {order.instruction && (
                                <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
                                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">Instruction</p>
                                  <p className="text-xs text-amber-800 font-medium italic">"{order.instruction}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDeliveryConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/5 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-6 border border-white/20"
            >
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-white/30">
                  <span className="text-lg sm:text-xl">📦</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">Confirm Delivery</h3>
                <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6">Have you received your order? This action cannot be undone.</p>
                <div className="bg-amber-100/50 backdrop-blur-sm border border-amber-200/50 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6">
                  <p className="text-amber-800 font-medium text-xs sm:text-sm">⚠️ Please confirm only if you have physically received the order.</p>
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                  <button onClick={cancelDeliveryConfirmation} disabled={updatingOrder} className="flex-1 bg-gray-500/80 hover:bg-gray-600/80 text-white py-2 sm:py-2.5 px-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 text-xs sm:text-sm">Cancel</button>
                  <button onClick={confirmDelivery} disabled={updatingOrder} className="flex-1 bg-green-600/80 hover:bg-green-700/80 text-white py-2 sm:py-2.5 px-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center disabled:opacity-50 text-xs sm:text-sm">
                    {updatingOrder ? <div className="w-3 h-3 border-b-2 border-white rounded-full animate-spin" /> : 'Yes, Received'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/5 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-6 border border-white/20"
            >
              <div className="text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-white/30">
                  <span className="text-lg sm:text-xl">❌</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">Cancel Order</h3>
                <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6">Are you sure you want to cancel this order?</p>
                <div className="mb-4 sm:mb-6">
                  <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" rows="3" />
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                  <button onClick={cancelCancelConfirmation} disabled={updatingOrder} className="flex-1 bg-gray-500/80 hover:bg-gray-600/80 text-white py-2 rounded-lg font-medium transition-all text-xs sm:text-sm">Keep Order</button>
                  <button onClick={confirmCancelOrder} disabled={updatingOrder} className="flex-1 bg-red-600/80 hover:bg-red-700/80 text-white py-2 rounded-lg font-bold flex items-center justify-center disabled:opacity-50 text-xs sm:text-sm">
                    {updatingOrder ? <div className="w-3 h-3 border-b-2 border-white rounded-full animate-spin" /> : 'Confirm Cancel'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-[60]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full p-6 sm:p-8 border border-gray-100 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-yellow-100 shadow-inner">
                  <span className="text-3xl">⭐</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Enjoy your order?</h3>
                <p className="text-gray-600 text-sm mb-6">Rate us on Google to help us serve you better!</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { window.open('https://www.google.com/maps/place/Rg+basket/@20.4407632,85.9023337,17z/data=!4m8!3m7!1s0x3a190d3d6443bf9f:0xc369f29ef6c8baed!8m2!3d20.4407632!4d85.9023337!9m1!1b1!16s%2Fg%2F11yr2bt9mb?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D', '_blank'); setShowReviewPopup(false); }} className="w-full bg-[#26544a] text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">Rate us on Google 🌟</button>
                  <button onClick={() => setShowReviewPopup(false)} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold">Maybe later</button>
                </div>
                <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-medium">Team RG Basket</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyOrders;