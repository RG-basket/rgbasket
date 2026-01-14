import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Edit, RefreshCw, Package, Truck, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminTableDark from './SharedDark/AdminTableDark';
import AdminModalDark from './SharedDark/AdminModalDark';
import { tw } from '../../config/tokyoNightTheme';

const AdminOrdersDark = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deliveryDateFilter, setDeliveryDateFilter] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const navigate = useNavigate();

  const statusColors = {
    pending: 'bg-[#e0af68]/20 text-[#e0af68] border-[#e0af68]/30',
    confirmed: 'bg-[#7aa2f7]/20 text-[#7aa2f7] border-[#7aa2f7]/30',
    processing: 'bg-[#bb9af7]/20 text-[#bb9af7] border-[#bb9af7]/30',
    shipped: 'bg-[#7dcfff]/20 text-[#7dcfff] border-[#7dcfff]/30',
    delivered: 'bg-[#9ece6a]/20 text-[#9ece6a] border-[#9ece6a]/30',
    cancelled: 'bg-[#f7768e]/20 text-[#f7768e] border-[#f7768e]/30'
  };

  const statusIcons = {
    pending: Clock,
    confirmed: Package,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle,
    cancelled: XCircle
  };

  // Function to get product image URL safely
  const getProductImage = (item) => {
    if (item.image) {
      if (item.image.startsWith('http')) {
        return item.image;
      }
      return item.image;
    }
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg==';
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
        toast.success(`Loaded ${data.orders?.length || 0} orders`);
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(`Error: ${error.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
      } else {
        toast.error(data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error updating order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(JSON.parse(JSON.stringify(order)));
    setShowEditModal(true);
  };

  const handleSaveEditedOrder = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const subtotal = editingOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shippingFee = editingOrder.shippingFee || 29;
      const tax = editingOrder.tax || 0;
      const totalAmount = subtotal + shippingFee + tax;

      const updatedOrder = {
        ...editingOrder,
        subtotal,
        totalAmount,
        items: editingOrder.items
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/admin/orders/${editingOrder._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedOrder)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Order updated successfully');
        setShowEditModal(false);
        setEditingOrder(null);
        fetchOrders();
      } else {
        throw new Error(data.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error updating order');
    }
  };

  const handleRemoveItem = (index) => {
    if (editingOrder.items.length <= 1) {
      toast.error('Order must have at least one item');
      return;
    }

    const updatedItems = editingOrder.items.filter((_, i) => i !== index);
    setEditingOrder(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleUpdateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    const updatedItems = [...editingOrder.items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: parseInt(newQuantity)
    };

    setEditingOrder(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleUpdateItemPrice = (index, newPrice) => {
    if (newPrice < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    const updatedItems = [...editingOrder.items];
    updatedItems[index] = {
      ...updatedItems[index],
      price: parseFloat(newPrice)
    };

    setEditingOrder(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const printOrderBill = () => {
    if (!selectedOrder) return;

    const printWindow = window.open('', '_blank');
    const order = selectedOrder;

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
    
    .card-title svg {
      width: 14px;
      height: 14px;
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
    
    .items-table tr:last-child td {
      border-bottom: none;
    }
    
    .items-table tr:hover {
      background: #f8fafc;
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
    
    .footer p {
      margin-bottom: 4px;
    }
    
    .contact-info {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 10px;
      font-size: 11px;
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
      transition: all 0.2s;
    }
    
    .print-btn {
      background: #059669;
      color: white;
    }
    
    .print-btn:hover {
      background: #047857;
      transform: translateY(-1px);
    }
    
    .close-btn {
      background: #64748b;
      color: white;
      margin-left: 10px;
    }
    
    .close-btn:hover {
      background: #475569;
      transform: translateY(-1px);
    }
    
    @media print {
      body { 
        margin: 0; 
        background: white;
      }
      .no-print { display: none; }
      .invoice-container {
        box-shadow: none;
        border-radius: 0;
      }
    }
    
    @media (max-width: 768px) {
      body { margin: 10px; }
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
      .content { padding: 20px; }
      .header { padding: 20px; }
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
          <div class="info-item"><span class="info-label">Order ID:</span><span class="info-value">${order._id.slice(-8)}</span></div>
          <div class="info-item"><span class="info-label">Date:</span><span class="info-value">${new Date(order.createdAt).toLocaleDateString()}</span></div>
          <div class="info-item"><span class="info-label">Status:</span><span class="info-value"><span class="status-badge status-${order.status}">${order.status}</span></span></div>
          <div class="info-item"><span class="info-label">Payment:</span><span class="info-value">${order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}</span></div>
        </div>

        <div class="info-card">
          <div class="card-title">CUSTOMER INFORMATION</div>
          <div class="info-item"><span class="info-label">Name:</span><span class="info-value">${order.userInfo?.name || order.shippingAddress?.fullName || 'Guest'}</span></div>
          <div class="info-item"><span class="info-label">Email:</span><span class="info-value">${order.userInfo?.email || 'N/A'}</span></div>
          <div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${order.userInfo?.phone || order.shippingAddress?.phoneNumber || 'N/A'}</span></div>
        </div>
      </div>

      <div class="grid-3">
        <div class="info-card">
          <div class="card-title">DELIVERY DATE</div>
          <div style="text-align: center; padding: 10px 0;">
            <div style="font-size: 16px; font-weight: 600; color: #059669;">${new Date(order.deliveryDate).toLocaleDateString()}</div>
            <div style="font-size: 12px; color: #64748b;">${order.timeSlot}</div>
          </div>
        </div>

        <div class="info-card">
          <div class="card-title">DELIVERY ADDRESS</div>
          <div style="font-size: 12px; line-height: 1.4;">
            ${order.shippingAddress.street}, ${order.shippingAddress.locality}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
            ${order.shippingAddress.pincode}
          </div>
        </div>

        <div class="info-card">
          <div class="card-title">CONTACT</div>
          <div style="font-size: 12px; line-height: 1.4;">
            <strong>${order.shippingAddress.phoneNumber}</strong>
            ${order.shippingAddress.alternatePhone ? '<br>Alt: ' + order.shippingAddress.alternatePhone : ''}
          </div>
        </div>
      </div>

      ${order.instruction ? `
        <div class="info-card" style="margin-bottom: 25px;">
          <div class="card-title">📝 DELIVERY INSTRUCTION</div>
          <div style="font-size: 13px; font-style: italic; color: #d97706; background: #fffbeb; padding: 10px; border-radius: 6px; border: 1px solid #fcd34d;">
            "${order.instruction}"
          </div>
        </div>
      ` : ''}

      ${order.selectedGift ? `
        <div class="info-card" style="margin-bottom: 25px; border: 2px solid #10b981;">
          <div class="card-title" style="color: #10b981;">🎁 FREE GIFT SELECTED</div>
          <div style="font-size: 14px; font-weight: 800; color: #059669; background: #ecfdf5; padding: 12px; border-radius: 6px;">
            "${order.selectedGift}"
          </div>
        </div>
      ` : `
        <!-- DEBUG: No selectedGift found in order object -->
      `}



      ${(order.location && (order.location.coordinates || (order.location.lat && order.location.lng))) ? `
        <div class="info-card" style="grid-column: span 3;">
          <div class="card-title">📍 DELIVERY LOCATION (GPS)</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; font-size: 12px;">
            <div>
              <div style="color: #64748b; margin-bottom: 4px;">Coordinates:</div>
              <div style="font-weight: 600; color: #059669;">
                ${order.location.coordinates
          ? `${order.location.coordinates.latitude.toFixed(6)}, ${order.location.coordinates.longitude.toFixed(6)}`
          : `${order.location.lat.toFixed(6)}, ${order.location.lng.toFixed(6)}`
        }
              </div>
            </div>
            <div>
              <div style="color: #64748b; margin-bottom: 4px;">Accuracy:</div>
              <div style="font-weight: 600;">${order.location.accuracy ? Math.round(order.location.accuracy) + 'm' : 'N/A'}</div>
            </div>
            <div>
              <div style="color: #64748b; margin-bottom: 4px;">Captured:</div>
              <div style="font-weight: 600;">${order.location.timestamp ? new Date(order.location.timestamp).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
          <div style="margin-top: 12px;">
            <a 
              href="https://www.google.com/maps?q=${order.location.coordinates ? order.location.coordinates.latitude : order.location.lat},${order.location.coordinates ? order.location.coordinates.longitude : order.location.lng}" 
              target="_blank"
              style="display: inline-block; background: #059669; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600;">
              🗺️ View on Google Maps
            </a>
          </div>
        </div>
        ` : ''}


      <div class="items-section">
        <div class="section-title">ORDER ITEMS (${order.items.length})</div>
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
            ${order.items.map(item =>
          '<tr>' +
          '<td><strong>' + item.name + '</strong><br><span style="font-size: 11px; color: #64748b;">' + item.description + '</span></td>' +
          '<td>' + item.weight + (item.unit ? ' ' + item.unit : '') + '</td>' +
          '<td>' + item.quantity + '</td>' +
          '<td>₹' + item.price + '</td>' +
          '<td><strong>₹' + (item.price * item.quantity).toFixed(2) + '</strong></td>' +
          '</tr>'
        ).join('')}
          </tbody>
        </table>
      </div>

      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>₹${order.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Shipping Fee:</span>
          <span>₹${order.shippingFee.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Tax:</span>
          <span>₹${order.tax.toFixed(2)}</span>
        </div>
        ${order.discountAmount > 0 ? `
        <div class="total-row" style="color: #10b981;">
          <span>Discount (${order.promoCode || 'PROMO'}):</span>
          <span>-₹${order.discountAmount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="total-row final">
          <span>TOTAL AMOUNT:</span>
          <span>₹${order.totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Thank you for shopping with RG Basket!</strong></p>
      <p>Your fresh groceries are on the way</p>
      <div class="contact-info">
        <span>📧 rgbasket.com@gmail.com</span>
        <span>💬 WhatsApp: +91 9078771530</span>
      </div>
      <p style="margin-top: 10px;">Generated on: ${new Date().toLocaleString()}</p>
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

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) {
      return false;
    }

    if (dateFilter) {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      if (orderDate !== dateFilter) {
        return false;
      }
    }

    if (deliveryDateFilter) {
      const deliveryDate = new Date(order.deliveryDate).toISOString().split('T')[0];
      if (deliveryDate !== deliveryDateFilter) {
        return false;
      }
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order._id.toLowerCase().includes(searchLower) ||
        (order.shippingAddress?.street?.toLowerCase() || '').includes(searchLower) ||
        (order.userInfo?.name?.toLowerCase() || '').includes(searchLower) ||
        (order.shippingAddress?.fullName?.toLowerCase() || '').includes(searchLower)
      );
    }

    return true;
  });

  const getTotalRevenue = () => {
    return filteredOrders
      .filter(order => order.status === 'delivered')
      .reduce((total, order) => total + order.totalAmount, 0);
  };

  const getCurrentOrderTotals = () => {
    if (!editingOrder) return { subtotal: 0, totalAmount: 0 };
    const subtotal = editingOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = editingOrder.shippingFee || 29;
    const tax = editingOrder.tax || 0;
    const totalAmount = subtotal + shippingFee + tax;
    return { subtotal, totalAmount };
  };

  // Status counts for quick filters
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  const columns = [
    {
      key: '_id',
      label: 'Order ID',
      render: (id, order) => (
        <div className="flex items-center gap-2">
          <span className={`font-mono text-xs ${tw.textSecondary}`}>#{id?.slice(-8)}</span>
          {order.instruction && (
            <span className="text-yellow-500" title="Has Delivery Instruction">
              📝
            </span>
          )}
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (_, order) => (
        <div>
          <p className={`font-medium ${tw.textPrimary}`}>
            {order.userInfo?.name || order.shippingAddress?.fullName || 'Guest'}
          </p>
          <p className={`text-xs ${tw.textSecondary}`}>
            {order.userInfo?.email || 'N/A'}
          </p>
        </div>
      )
    },
    {
      key: 'items',
      label: 'Items',
      render: (_, order) => (
        <span className={`text-sm ${tw.textPrimary}`}>
          {order.items?.length || 0} items
        </span>
      )
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      render: (amount) => <span className={`font-medium ${tw.textPrimary}`}>₹{amount?.toFixed(2)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => {
        const IconComponent = statusIcons[status];
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
            <IconComponent className="w-3 h-3" />
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'deliveryDate',
      label: 'Delivery',
      render: (_, order) => (
        <div className="text-sm">
          <p className={tw.textPrimary}>{new Date(order.deliveryDate).toLocaleDateString()}</p>
          <p className={tw.textSecondary}>{order.timeSlot}</p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, order) => (
        <div className="flex gap-2">
          <AdminButtonDark
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={(e) => {
              e.stopPropagation();
              handleViewOrder(order);
            }}
          >
            View
          </AdminButtonDark>
          <AdminButtonDark
            variant="ghost"
            size="sm"
            icon={Edit}
            onClick={(e) => {
              e.stopPropagation();
              handleEditOrder(order);
            }}
          >
            Edit
          </AdminButtonDark>
          {/* Location Button - Only show if order has location data */}
          {order.location && order.location.coordinates && (
            <AdminButtonDark
              variant="ghost"
              size="sm"
              icon={MapPin}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedLocation(order.location);
                setShowLocationModal(true);
              }}
              title="View Delivery Location"
            >
              Location
            </AdminButtonDark>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <AdminLayoutDark>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#7aa2f7] border-t-transparent mx-auto mb-4"></div>
            <p className={`text-lg ${tw.textSecondary}`}>Loading orders...</p>
          </div>
        </div>
      </AdminLayoutDark>
    );
  }

  return (
    <AdminLayoutDark>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Order Management</h1>
            <p className={`text-sm ${tw.textSecondary}`}>Manage and track all customer orders</p>
          </div>
          <div className="flex gap-3">
            <AdminButtonDark icon={RefreshCw} onClick={fetchOrders}>
              Refresh
            </AdminButtonDark>
            <AdminButtonDark variant="outline" onClick={() => navigate('/admin')}>
              Back to Dashboard
            </AdminButtonDark>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26]`}>
            <p className={`text-2xl font-bold ${tw.textPrimary}`}>{orders.length}</p>
            <p className={`text-sm ${tw.textSecondary}`}>Total Orders</p>
          </div>
          <div className={`p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26]`}>
            <p className={`text-2xl font-bold ${tw.textPrimary}`}>{statusCounts.pending}</p>
            <p className={`text-sm ${tw.textSecondary}`}>Pending</p>
          </div>
          <div className={`p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26]`}>
            <p className={`text-2xl font-bold ${tw.textPrimary}`}>{statusCounts.delivered}</p>
            <p className={`text-sm ${tw.textSecondary}`}>Delivered</p>
          </div>
          <div className={`p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26]`}>
            <p className={`text-2xl font-bold text-[#9ece6a]`}>
              ₹{getTotalRevenue().toLocaleString()}
            </p>
            <p className={`text-sm ${tw.textSecondary}`}>Total Revenue</p>
          </div>
        </div>

        {/* Status Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'processing', label: 'Processing' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`p-4 rounded-xl border-2 transition-all ${filterStatus === key
                ? 'border-[#7aa2f7] bg-[#7aa2f7]/20'
                : `${tw.borderPrimary} hover:border-[#7aa2f7]/50`
                }`}
            >
              <p className={`text-2xl font-bold ${tw.textPrimary}`}>{statusCounts[key]}</p>
              <p className={`text-sm ${tw.textSecondary}`}>{label}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className={`${tw.bgSecondary} p-4 rounded-xl border ${tw.borderPrimary}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium ${tw.textSecondary} mb-2`}>Status Filter</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full ${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7aa2f7]`}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${tw.textSecondary} mb-2`}>Order Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`w-full ${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7aa2f7]`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${tw.textSecondary} mb-2`}>Delivery Date</label>
              <input
                type="date"
                value={deliveryDateFilter}
                onChange={(e) => setDeliveryDateFilter(e.target.value)}
                className={`w-full ${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7aa2f7]`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${tw.textSecondary} mb-2`}>Search</label>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary}`} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7]`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <AdminTableDark
          columns={columns}
          data={filteredOrders}
          isLoading={loading}
          emptyMessage="No orders found matching your filters"
          onRowClick={(order) => handleViewOrder(order)}
        />

        {/* Order Details Modal */}
        <AdminModalDark
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          title={`Order Details - #${selectedOrder?._id?.slice(-8)}`}
          size="xl"
          footer={
            <div className="flex justify-between items-center w-full">
              <div className="flex gap-2">
                <select
                  value={selectedOrder?.status || ''}
                  onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                  disabled={updatingStatus}
                  className={`${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7aa2f7]`}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-3">
                <AdminButtonDark onClick={printOrderBill}>
                  Print Bill
                </AdminButtonDark>
                <AdminButtonDark variant="outline" onClick={() => setShowOrderModal(false)}>
                  Close
                </AdminButtonDark>
              </div>
            </div>
          }
        >
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-4 rounded-lg border ${tw.borderPrimary}`}>
                  <h3 className={`font-medium ${tw.textPrimary} mb-3`}>Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className={tw.textSecondary}>Order ID:</span> <span className={tw.textPrimary}>{selectedOrder._id}</span></p>
                    <p><span className={tw.textSecondary}>Order Date:</span> <span className={tw.textPrimary}>{new Date(selectedOrder.createdAt).toLocaleString()}</span></p>
                    <p><span className={tw.textSecondary}>Status:</span> <span className={`px-2 py-1 rounded-full text-xs ${statusColors[selectedOrder.status]}`}>{selectedOrder.status}</span></p>
                    <p><span className={tw.textSecondary}>Payment:</span> <span className={tw.textPrimary}>{selectedOrder.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Online Payment'}</span></p>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${tw.borderPrimary}`}>
                  <h3 className={`font-medium ${tw.textPrimary} mb-3`}>Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className={tw.textSecondary}>Name:</span> <span className={tw.textPrimary}>{selectedOrder.userInfo?.name || selectedOrder.shippingAddress?.fullName || 'Guest'}</span></p>
                    <p><span className={tw.textSecondary}>Email:</span> <span className={tw.textPrimary}>{selectedOrder.userInfo?.email || 'N/A'}</span></p>
                    <p><span className={tw.textSecondary}>Phone:</span> <span className={tw.textPrimary}>{selectedOrder.userInfo?.phone || selectedOrder.shippingAddress?.phoneNumber || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className={`p-4 rounded-lg border ${tw.borderPrimary}`}>
                <h3 className={`font-medium ${tw.textPrimary} mb-3`}>Delivery Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className={tw.textSecondary}>Delivery Date:</span> <span className={tw.textPrimary}>{new Date(selectedOrder.deliveryDate).toLocaleDateString()}</span></p>
                    <p><span className={tw.textSecondary}>Time Slot:</span> <span className={tw.textPrimary}>{selectedOrder.timeSlot}</span></p>
                  </div>
                  <div>
                    <p className={tw.textSecondary}>Delivery Address:</p>
                    <p className={tw.textPrimary}>{selectedOrder.shippingAddress.street}</p>
                    <p className={tw.textPrimary}>{selectedOrder.shippingAddress.locality}</p>
                    <p className={tw.textPrimary}>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
                    <p className={tw.textPrimary}>📞 {selectedOrder.shippingAddress.phoneNumber}</p>
                    {selectedOrder.shippingAddress.alternatePhone && (
                      <p className={tw.textPrimary}>📞 {selectedOrder.shippingAddress.alternatePhone} (Alt)</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Instruction */}
              {selectedOrder.instruction && (
                <div className={`p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10`}>
                  <h3 className={`font-medium text-yellow-500 mb-2 flex items-center gap-2`}>
                    <span>📝</span> Delivery Instruction
                  </h3>
                  <p className={`text-sm ${tw.textPrimary} italic`}>
                    "{selectedOrder.instruction}"
                  </p>
                </div>
              )}

              {/* Free Gift Offer */}
              {selectedOrder.selectedGift && (
                <div className={`p-4 rounded-lg border border-[#9ece6a]/30 bg-[#9ece6a]/10`}>
                  <h3 className={`font-medium text-[#9ece6a] mb-2 flex items-center gap-2`}>
                    <span>🎁</span> Free Gift Offer
                  </h3>
                  <p className={`text-sm font-bold ${tw.textPrimary}`}>
                    "{selectedOrder.selectedGift}"
                  </p>
                </div>
              )}


              {/* Geolocation Information */}
              {selectedOrder.location && (selectedOrder.location.coordinates || (selectedOrder.location.lat && selectedOrder.location.lng)) && (
                <div className={`p-4 rounded-lg border border-[#7aa2f7]/30 bg-[#7aa2f7]/10`}>
                  <h3 className={`font-medium text-[#7aa2f7] mb-3 flex items-center gap-2`}>
                    <span>📍</span>
                    Delivery Location (GPS)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className={tw.textSecondary}>Coordinates:</p>
                      <p className={`font-mono text-[#7aa2f7] font-medium`}>
                        {selectedOrder.location.coordinates
                          ? `${selectedOrder.location.coordinates.latitude.toFixed(6)}, ${selectedOrder.location.coordinates.longitude.toFixed(6)}`
                          : `${selectedOrder.location.lat.toFixed(6)}, ${selectedOrder.location.lng.toFixed(6)}`
                        }
                      </p>
                    </div>
                    <div>
                      <p className={tw.textSecondary}>Accuracy:</p>
                      <p className={`font-medium ${tw.textPrimary}`}>
                        {selectedOrder.location.accuracy ? Math.round(selectedOrder.location.accuracy) + 'm' : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className={tw.textSecondary}>Captured:</p>
                      <p className={`font-medium ${tw.textPrimary}`}>
                        {selectedOrder.location.timestamp ? new Date(selectedOrder.location.timestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <a
                      href={`https://www.google.com/maps?q=${selectedOrder.location.coordinates ? selectedOrder.location.coordinates.latitude : selectedOrder.location.lat},${selectedOrder.location.coordinates ? selectedOrder.location.coordinates.longitude : selectedOrder.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#7aa2f7] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#658cdf] transition-colors"
                    >
                      🗺️ View on Google Maps
                    </a>
                  </div>
                </div>
              )}


              {/* Order Items */}
              <div>
                <h3 className={`font-medium ${tw.textPrimary} mb-3`}>Order Items ({selectedOrder.items.length})</h3>
                <div className={`rounded-lg border ${tw.borderPrimary} overflow-hidden`}>
                  <table className="w-full">
                    <thead className={tw.bgInput}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${tw.textSecondary}`}>Product</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${tw.textSecondary}`}>Weight</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${tw.textSecondary}`}>Qty</th>
                        <th className={`px-4 py-3 text-left text-xs font-medium ${tw.textSecondary}`}>Price</th>
                        <th className={`px-4 py-3 text-right text-xs font-medium ${tw.textSecondary}`}>Total</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${tw.borderSecondary}`}>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className={`px-4 py-3 text-sm ${tw.textPrimary}`}>
                            <div className="flex items-center gap-3">
                              <img
                                src={getProductImage(item)}
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover border border-gray-600"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg==';
                                }}
                              />
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className={`text-xs ${tw.textSecondary}`}>{item.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-sm ${tw.textPrimary}`}>{item.weight} {item.unit}</td>
                          <td className={`px-4 py-3 text-sm ${tw.textPrimary}`}>{item.quantity}</td>
                          <td className={`px-4 py-3 text-sm ${tw.textPrimary}`}>₹{item.price}</td>
                          <td className={`px-4 py-3 text-sm font-medium text-right ${tw.textPrimary}`}>
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className={tw.bgInput}>
                      <tr>
                        <td colSpan="4" className={`px-4 py-3 text-sm font-bold text-right ${tw.textPrimary}`}>Total Amount</td>
                        <td className={`px-4 py-3 text-sm font-bold text-right text-[#7aa2f7]`}>
                          ₹{selectedOrder.totalAmount?.toFixed(2)}
                        </td>
                      </tr>
                      {selectedOrder.discountAmount > 0 && (
                        <tr>
                          <td colSpan="4" className={`px-4 py-2 text-sm text-right text-green-400`}>Discount ({selectedOrder.promoCode})</td>
                          <td className={`px-4 py-2 text-sm text-right text-green-400`}>
                            -₹{selectedOrder.discountAmount?.toFixed(2)}
                          </td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </AdminModalDark>

        {/* Edit Order Modal */}
        {showEditModal && editingOrder && (
          <AdminModalDark
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title={`Edit Order - #${editingOrder._id?.slice(-8)}`}
            size="xl"
            footer={
              <div className="flex justify-end gap-3">
                <AdminButtonDark variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </AdminButtonDark>
                <AdminButtonDark onClick={handleSaveEditedOrder}>
                  Save Changes
                </AdminButtonDark>
              </div>
            }
          >
            <div className="space-y-6">
              <div className={`p-4 rounded-lg border ${tw.borderPrimary}`}>
                <h3 className={`font-medium ${tw.textPrimary} mb-3`}>Order Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className={tw.textSecondary}>Order ID:</span> <span className={tw.textPrimary}>{editingOrder._id}</span></p>
                    <p><span className={tw.textSecondary}>Customer:</span> <span className={tw.textPrimary}>{editingOrder.userInfo?.name || editingOrder.shippingAddress?.fullName || 'Guest'}</span></p>
                  </div>
                  <div>
                    <p><span className={tw.textSecondary}>Delivery Date:</span> <span className={tw.textPrimary}>{new Date(editingOrder.deliveryDate).toLocaleDateString()}</span></p>
                    <p><span className={tw.textSecondary}>Time Slot:</span> <span className={tw.textPrimary}>{editingOrder.timeSlot}</span></p>
                  </div>
                </div>
              </div>

              {/* Delivery Instruction in Edit Modal */}
              {editingOrder.instruction && (
                <div className={`p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10`}>
                  <h3 className={`font-medium text-yellow-500 mb-2 flex items-center gap-2`}>
                    <span>📝</span> Delivery Instruction
                  </h3>
                  <p className={`text-sm ${tw.textPrimary} italic`}>
                    "{editingOrder.instruction}"
                  </p>
                </div>
              )}

              <div className={`p-4 rounded-lg border ${tw.borderPrimary}`}>
                <h3 className={`font-medium ${tw.textPrimary} mb-4`}>Order Items</h3>
                <div className="space-y-4">
                  {editingOrder.items.map((item, index) => (
                    <div key={index} className={`flex items-center gap-4 p-4 border ${tw.borderPrimary} rounded-lg`}>
                      <img
                        src={getProductImage(item)}
                        alt={item.name}
                        className="w-16 h-16 rounded object-cover border border-gray-600"
                      />
                      <div className="flex-1">
                        <h4 className={`font-medium ${tw.textPrimary}`}>{item.name}</h4>
                        <p className={`text-sm ${tw.textSecondary}`}>{item.description}</p>
                        <p className={`text-sm ${tw.textSecondary}`}>{item.weight} {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <label className={`block text-xs ${tw.textSecondary} mb-1`}>Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQuantity(index, e.target.value)}
                            className={`w-20 px-2 py-1 border ${tw.borderPrimary} ${tw.bgInput} ${tw.textPrimary} rounded text-sm`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs ${tw.textSecondary} mb-1`}>Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleUpdateItemPrice(index, e.target.value)}
                            className={`w-24 px-2 py-1 border ${tw.borderPrimary} ${tw.bgInput} ${tw.textPrimary} rounded text-sm`}
                          />
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${tw.textPrimary}`}>
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </div>
                          <div className={`text-xs ${tw.textSecondary}`}>Total</div>
                        </div>
                        {editingOrder.items.length > 1 && (
                          <AdminButtonDark
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            Remove
                          </AdminButtonDark>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${tw.borderPrimary}`}>
                <h3 className={`font-medium ${tw.textPrimary} mb-3`}>Updated Pricing Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={tw.textSecondary}>Subtotal:</span>
                    <span className={tw.textPrimary}>₹{getCurrentOrderTotals().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={tw.textSecondary}>Shipping Fee:</span>
                    <span className={tw.textPrimary}>₹{editingOrder.shippingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={tw.textSecondary}>Tax:</span>
                    <span className={tw.textPrimary}>₹{editingOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-lg">
                    <span className={tw.textPrimary}>Total Amount:</span>
                    <span className="text-[#7aa2f7]">₹{getCurrentOrderTotals().totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </AdminModalDark>
        )}

        {/* Location Modal */}
        <AdminModalDark
          isOpen={showLocationModal}
          onClose={() => {
            setShowLocationModal(false);
            setSelectedLocation(null);
          }}
          title="📍 Delivery Location"
        >
          {selectedLocation && selectedLocation.coordinates && (
            <div className="space-y-6">
              {/* Coordinates */}
              <div className={`p-4 rounded-lg ${tw.bgCard} border ${tw.borderPrimary}`}>
                <h3 className={`text-sm font-semibold ${tw.textSecondary} mb-2`}>GPS Coordinates</h3>
                <div className="flex items-center gap-2">
                  <code className={`text-lg font-mono ${tw.textPrimary} bg-[#1a1b26] px-3 py-2 rounded`}>
                    {selectedLocation.coordinates.latitude.toFixed(6)}, {selectedLocation.coordinates.longitude.toFixed(6)}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${selectedLocation.coordinates.latitude}, ${selectedLocation.coordinates.longitude}`
                      );
                      toast.success('Coordinates copied!');
                    }}
                    className="px-3 py-2 bg-[#7aa2f7] text-white rounded hover:bg-[#7aa2f7]/80 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              {/* Accuracy & Timestamp */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${tw.bgCard} border ${tw.borderPrimary}`}>
                  <h3 className={`text-sm font-semibold ${tw.textSecondary} mb-2`}>Accuracy</h3>
                  <p className={`text-xl font-bold ${tw.textPrimary}`}>
                    {selectedLocation.accuracy ? `${Math.round(selectedLocation.accuracy)}m` : 'N/A'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${tw.bgCard} border ${tw.borderPrimary}`}>
                  <h3 className={`text-sm font-semibold ${tw.textSecondary} mb-2`}>Captured</h3>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {selectedLocation.timestamp
                      ? new Date(selectedLocation.timestamp).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {/* Google Maps Button */}
              <div className="flex justify-center">
                <a
                  href={`https://www.google.com/maps?q=${selectedLocation.coordinates.latitude},${selectedLocation.coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#9ece6a] hover:bg-[#9ece6a]/80 text-[#1a1b26] font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  View on Google Maps
                </a>
              </div>
              {/* Map Preview (Optional) */}
              <div className={`p-4 rounded-lg ${tw.bgCard} border ${tw.borderPrimary}`}>
                <h3 className={`text-sm font-semibold ${tw.textSecondary} mb-3`}>Map Preview</h3>
                <iframe
                  width="100%"
                  height="300"
                  frameBorder="0"
                  style={{ border: 0, borderRadius: '8px' }}
                  src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${selectedLocation.coordinates.latitude},${selectedLocation.coordinates.longitude}&zoom=15`}
                  allowFullScreen
                ></iframe>
                <p className="text-xs text-gray-500 mt-2">
                  Note: Replace YOUR_GOOGLE_MAPS_API_KEY with your actual Google Maps API key for map preview
                </p>
              </div>
            </div>
          )}
        </AdminModalDark>
      </div>
    </AdminLayoutDark>
  );
};

export default AdminOrdersDark;