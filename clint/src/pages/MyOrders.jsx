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
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-3">
            <div className="order-2 sm:order-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-0">My Orders</h1>
              <p className="text-gray-600 text-sm sm:text-base sm:hidden">
                Track and manage your orders
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchUserOrders}
              className="order-1 sm:order-2 bg-[#26544a] hover:bg-[#1e423a] text-white px-3 py-1.5 rounded-lg transition-all duration-200 font-medium text-sm flex items-center space-x-1"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </motion.button>
          </div>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto hidden sm:block">
            Track and manage all your orders in one place
          </p>
        </div>

        {/* Status Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Filter by Status</h2>
            <div className="text-xs sm:text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {statusCounts.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleStatusFilter(filter.value)}
                className={`relative p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${selectedStatus === filter.value
                  ? 'bg-white text-gray-900 shadow-md sm:shadow-lg border border-[#26544a]'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                  }`}
              >
                <div className="flex flex-col items-center">
                  <span className="font-semibold">{filter.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full mt-1 ${selectedStatus === filter.value
                    ? 'bg-[#26544a] text-white'
                    : 'bg-gray-300 text-gray-700'
                    }`}>
                    {filter.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 text-center max-w-md mx-auto"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl sm:text-3xl">
                {selectedStatus === 'all' ? '📦' : getStatusIcon(selectedStatus)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
              {selectedStatus === 'all' ? 'No Orders Yet' : `No ${selectedStatus} Orders`}
            </h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              {selectedStatus === 'all'
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                : `You don't have any ${selectedStatus} orders at the moment.`
              }
            </p>
            {selectedStatus !== 'all' && (
              <button
                onClick={() => handleStatusFilter('all')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base mb-3 mr-3"
              >
                View All Orders
              </button>
            )}
            <button
              onClick={() => navigate('/products')}
              className="bg-[#26544a] hover:bg-[#1e423a] text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base"
            >
              Start Shopping
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4 sm:space-y-6">

            {/* Summary Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-r from-[#26544a] to-[#1e423a] rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white"
            >
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                    {selectedStatus === 'all' ? 'Order Summary' : `${getDisplayStatus(selectedStatus)} Orders`}
                  </h2>
                  <p className="text-green-100 opacity-90 text-sm">
                    {selectedStatus === 'all'
                      ? `You have ${orders.length} order${orders.length > 1 ? 's' : ''} in total`
                      : `Showing ${filteredOrders.length} ${selectedStatus} order${filteredOrders.length > 1 ? 's' : ''}`
                    }
                  </p>
                </div>
                <div className="mt-3 md:mt-0 bg-green-950 bg-opacity-10 rounded-lg sm:rounded-xl px-4 py-2 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold">{filteredOrders.length}</div>
                    <div className="text-green-100 text-xs sm:text-sm opacity-90">
                      {selectedStatus === 'all' ? 'Total Orders' : 'Filtered Orders'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Orders List */}
            <div className="space-y-4 sm:space-y-6">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order._id || `order-${index}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                >

                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-sm border border-gray-200">
                          <span className="text-xl sm:text-2xl">{getStatusIcon(order.status)}</span>
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-gray-900">
                            Order #{order._id ? order._id.slice(-8).toUpperCase() : `ORDER-${index + 1}`}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm mt-1">
                            Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'Date not available'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center mt-2 sm:mt-0">
                        <span className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${getOrderStatusColor(order.status)}`}>
                          {getDisplayStatus(order.status)}
                        </span>
                        <div className="text-right">
                          <div className="text-lg sm:text-xl font-bold text-[#26544a]">
                            ₹{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
                          </div>
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 mt-2 justify-start sm:justify-end">
                            {/* Print Bill Button - Only show when order is delivered */}
                            {order.status === 'delivered' && (
                              <button
                                onClick={() => printOrderBill(order)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1"
                              >
                                <span>🖨️</span>
                                <span>Print Bill</span>
                              </button>
                            )}

                            {/* Mark as Delivered Button - Only show for out for delivery (shipped) orders */}
                            {(order.status === 'shipped' || order.status === 'out for delivery') && (
                              <button
                                onClick={() => handleMarkAsDelivered(order)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200"
                              >
                                Mark as Delivered
                              </button>
                            )}

                            {/* Cancel Order Button - Only show for cancellable orders */}
                            {canCancelOrder(order) && (
                              <button
                                onClick={() => handleCancelOrder(order)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200"
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Order Items */}
                      <div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                          Order Items ({order.items?.length || 0})
                        </h4>
                        <div className="space-y-3">
                          {order.items?.map((item, itemIndex) => (
                            <motion.div
                              key={itemIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: itemIndex * 0.1 }}
                              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 hover:bg-white transition-colors duration-200"
                            >
                              {/* Product Image */}
                              <div className="flex-shrink-0">
                                <img
                                  src={getProductImage(item)}
                                  alt={item.name}
                                  className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-gray-300"
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg==';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                  {item.name || 'Unnamed Product'}
                                </h5>
                                <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2">
                                  {item.description || 'No description'}
                                </p>
                                <div className="flex items-center space-x-2 sm:space-x-3 mt-1 text-xs text-gray-500">
                                  <span>Weight: {item.weight || 'N/A'}</span>
                                  <span>•</span>
                                  <span>Qty: {item.quantity || 1}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-gray-600 text-xs sm:text-sm">
                                  ₹{item.price ? item.price.toFixed(2) : '0.00'} × {item.quantity || 1}
                                </div>
                                <div className="font-bold text-[#26544a] text-sm sm:text-base">
                                  ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="space-y-4 sm:space-y-6">
                        {/* Pricing Summary */}
                        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                          <h5 className="font-semibold text-gray-900 text-sm sm:text-base mb-3">Order Summary</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-medium">₹{order.subtotal ? order.subtotal.toFixed(2) : '0.00'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                              <span className="text-gray-600">Shipping Fee</span>
                              <span className="font-medium">₹{order.shippingFee ? order.shippingFee.toFixed(2) : '29.00'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                              <span className="text-gray-600">Tax</span>
                              <span className="font-medium">₹{order.tax ? order.tax.toFixed(2) : '0.00'}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 mt-2">
                              <div className="flex justify-between items-center font-bold text-sm sm:text-base">
                                <span className="text-gray-900">Total Amount</span>
                                <span className="text-[#26544a]">₹{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Delivery Information */}
                        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                          <h5 className="font-semibold text-gray-900 text-sm sm:text-base mb-3">Delivery Information</h5>
                          <div className="space-y-3">
                            <div>
                              <span className="text-gray-600 text-xs sm:text-sm block mb-1">Payment Method</span>
                              <span className="font-medium text-gray-900 text-sm capitalize">
                                {order.paymentMethod ? order.paymentMethod.replace(/_/g, ' ') : 'Cash on Delivery'}
                              </span>
                            </div>

                            {order.deliveryDate && (
                              <div>
                                <span className="text-gray-600 text-xs sm:text-sm block mb-1">Delivery Schedule</span>
                                <div className="font-medium text-gray-900 text-sm">
                                  {new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                  <br />
                                  <span className="text-[#26544a] text-xs">{order.timeSlot}</span>
                                </div>
                              </div>
                            )}

                            {order.shippingAddress && (
                              <div>
                                <span className="text-gray-600 text-xs sm:text-sm block mb-1">Shipping Address</span>
                                <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-300 text-xs sm:text-sm">
                                  <p className="font-medium text-gray-900">
                                    {order.shippingAddress.fullName || 'No name provided'}
                                  </p>
                                  <p className="text-gray-600">
                                    {order.shippingAddress.street}
                                  </p>
                                  <p className="text-gray-600">
                                    {order.shippingAddress.locality && `${order.shippingAddress.locality}, `}
                                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                  </p>
                                  <p className="text-gray-600 mt-1">
                                    📞 {order.shippingAddress.phoneNumber || order.shippingAddress.phone || 'No phone'}
                                  </p>
                                  {order.shippingAddress.alternatePhone && (
                                    <p className="text-gray-600">
                                      📞 {order.shippingAddress.alternatePhone} (Alternate)
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {order.instruction && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <span className="text-gray-600 text-xs sm:text-sm block mb-1 flex items-center gap-1">
                                  <span>📝</span> Delivery Instruction
                                </span>
                                <p className="text-gray-800 text-sm bg-yellow-50 p-2 rounded border border-yellow-100 italic">
                                  "{order.instruction}"
                                </p>
                              </div>
                            )}

                            {order.selectedGift && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <span className="text-green-600 text-xs sm:text-sm block mb-1 flex items-center gap-1 font-bold">
                                  <span>🎁</span> Free Gift Offer
                                </span>
                                <p className="text-green-800 text-sm bg-green-50 p-2 rounded border border-green-100 font-bold">
                                  "{order.selectedGift}"
                                </p>
                              </div>
                            )}

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delivery Confirmation Modal */}
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

                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">
                  Confirm Delivery
                </h3>

                <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6">
                  Have you received your order? This action cannot be undone.
                </p>

                <div className="bg-amber-100/50 backdrop-blur-sm border border-amber-200/50 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6">
                  <p className="text-amber-800 font-medium text-xs sm:text-sm">
                    ⚠️ Please confirm only if you have physically received the order.
                  </p>
                </div>

                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={cancelDeliveryConfirmation}
                    disabled={updatingOrder}
                    className="flex-1 bg-gray-500/80 hover:bg-gray-600/80 text-white py-2 sm:py-2.5 px-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 backdrop-blur-sm text-xs sm:text-sm"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmDelivery}
                    disabled={updatingOrder}
                    className="flex-1 bg-green-600/80 hover:bg-green-700/80 text-white py-2 sm:py-2.5 px-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center backdrop-blur-sm text-xs sm:text-sm"
                  >
                    {updatingOrder ? (
                      <>
                        <div className="w-3 h-3 border-b-2 border-white rounded-full mr-1 sm:mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Yes, Received'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Order Confirmation Modal */}
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

                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1 sm:mb-2">
                  Cancel Order
                </h3>

                <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6">
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>

                <div className="bg-red-100/50 backdrop-blur-sm border border-red-200/50 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6">
                  <p className="text-red-800 font-medium text-xs sm:text-sm">
                    ⚠️ Order cancellation is only available for pending and confirmed orders.
                  </p>
                </div>

                {/* Cancel Reason Input */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-left text-gray-700 text-sm font-medium mb-2">
                    Reason for cancellation (optional):
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please provide a reason for cancellation..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                    rows="3"
                  />
                </div>

                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={cancelCancelConfirmation}
                    disabled={updatingOrder}
                    className="flex-1 bg-gray-500/80 hover:bg-gray-600/80 text-white py-2 sm:py-2.5 px-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 backdrop-blur-sm text-xs sm:text-sm"
                  >
                    Keep Order
                  </button>

                  <button
                    onClick={confirmCancelOrder}
                    disabled={updatingOrder}
                    className="flex-1 bg-red-600/80 hover:bg-red-700/80 text-white py-2 sm:py-2.5 px-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center backdrop-blur-sm text-xs sm:text-sm"
                  >
                    {updatingOrder ? (
                      <>
                        <div className="w-3 h-3 border-b-2 border-white rounded-full mr-1 sm:mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Review Popup Modal */}
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
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>

              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-yellow-100 shadow-inner">
                  <span className="text-3xl sm:text-4xl">⭐</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Enjoy your order?
                </h3>

                <p className="text-gray-600 text-sm sm:text-base mb-6">
                  We're so glad you received your groceries! Would you mind taking a moment to rate us on Google? It helps us serve you better.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      window.open('https://www.google.com/maps/place/Rg+basket/@20.4407632,85.9023337,17z/data=!4m8!3m7!1s0x3a190d3d6443bf9f:0xc369f29ef6c8baed!8m2!3d20.4407632!4d85.9023337!9m1!1b1!16s%2Fg%2F11yr2bt9mb?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D', '_blank');
                      setShowReviewPopup(false);
                    }}
                    className="w-full bg-[#26544a] hover:bg-[#1e423a] text-white py-3 px-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <span>Rate us on Google</span>
                    <span>🌟</span>
                  </button>

                  <button
                    onClick={() => setShowReviewPopup(false)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 px-4 rounded-xl font-semibold transition-all duration-200"
                  >
                    Maybe later
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-medium">
                  Team RG Basket
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyOrders;