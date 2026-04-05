import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Edit, RefreshCw, Package, Truck, CheckCircle, XCircle, Clock, MapPin, Plus, Trash2, ExternalLink, CameraOff, Info, User } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminTableDark from './SharedDark/AdminTableDark';
import LocationCaptureModal from './SharedDark/LocationCaptureModal';
import AdminModalDark from './SharedDark/AdminModalDark';
import { tw } from '../../config/tokyoNightTheme';
import { formatWeight } from '../../utils/weightFormatter.js';


const statusIcons = {
  pending: Clock,
  confirmed: Package,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle
};

// Helper function to recalculate totals for any order
const recalculateOrderTotals = (order, serviceAreas = []) => {
  if (!order || !order.items) return order;

  // If serviceAreas are still loading, don't attempt to "correct" or "validate" the order
  // to avoid false warnings based on fallback values.
  const isLoading = !serviceAreas || serviceAreas.length === 0;

  // Calculate subtotal from items (include customization charge)
  const rawSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity) + (item.customizationCharge || 0), 0);
  const subtotal = Math.round(rawSubtotal * 100) / 100;

  // Get discount amount (if any)
  const discountAmount = Math.round((order.discountAmount || 0) * 100) / 100;

  // Calculate net value for shipping (subtotal - discount)
  const netValueForShipping = subtotal - discountAmount;

  // Dynamic Shipping Fee based on Pincode
  const pincode = order.shippingAddress?.pincode;
  const selectedArea = serviceAreas.find(area => area.pincode === pincode && area.isActive);

  // Only apply rules if area found OR we are NOT in loading state
  // If we are loading, we skip calculation to avoid false warnings
  if (isLoading) return order;

  const baseShippingFee = selectedArea ? (selectedArea.deliveryCharge ?? 0) : 29;
  const freeDeliveryThreshold = selectedArea ? (selectedArea.minOrderForFreeDelivery ?? 299) : 299;

  const shippingFee = (order.items.length > 0 && netValueForShipping < freeDeliveryThreshold) ? baseShippingFee : 0;

  // Tip Amount
  const tipAmount = order.tipAmount || 0;

  // Tax (usually 0)
  const tax = order.tax || 0;

  // Calculate final total with exact rounding to match backend
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const roundedShipping = Math.round(shippingFee * 100) / 100;
  const roundedTax = Math.round(tax * 100) / 100;
  const roundedTip = Math.round(tipAmount * 100) / 100;
  const roundedDiscount = Math.round(discountAmount * 100) / 100;

  let totalAmount = roundedSubtotal + roundedShipping + roundedTax + roundedTip - roundedDiscount;
  if (totalAmount < 0) totalAmount = 0;
  totalAmount = Math.round(totalAmount * 100) / 100;

  return {
    ...order,
    subtotal: roundedSubtotal,
    shippingFee: roundedShipping,
    tax: roundedTax,
    discountAmount: roundedDiscount,
    totalAmount
  };
};

// Function to get product image URL safely
const getProductImage = (item) => {
  if (item.image) {
    if (item.image.startsWith('http') || item.image.startsWith('data:')) {
      return item.image;
    }
    // It's a relative path, prepend API URL
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const cleanPath = item.image.startsWith('/') ? item.image.slice(1) : item.image;
    return `${baseUrl}/${cleanPath}`;
  }
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg==';
};

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
  const [showLocationModal, setShowLocationModal] = useState(false); // For viewing existing location
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false); // For capturing new location
  const [captureOrder, setCaptureOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkStatusUpdating, setBulkStatusUpdating] = useState(false);
  const [serverStatusCounts, setServerStatusCounts] = useState({
    all: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0
  });
  const [partners, setPartners] = useState([]);
  const [assigningRider, setAssigningRider] = useState(false);

  const handleSelectOrder = (orderId) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(orders.map(o => o._id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrderIds.length === 0) return;

    if (!confirm(`Are you sure you want to update ${selectedOrderIds.length} orders to ${newStatus}?`)) {
      return;
    }

    try {
      setBulkStatusUpdating(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/admin/orders/bulk-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          status: newStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setSelectedOrderIds([]);
        fetchOrders(page);
      } else {
        toast.error(data.message || 'Failed to update orders');
      }
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast.error('Error updating orders');
    } finally {
      setBulkStatusUpdating(false);
    }
  };

  // Product Search State
  const [products, setProducts] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);
  const navigate = useNavigate();

  const statusColors = {
    pending: 'bg-[#e0af68]/20 text-[#e0af68] border-[#e0af68]/30',
    confirmed: 'bg-[#7aa2f7]/20 text-[#7aa2f7] border-[#7aa2f7]/30',
    processing: 'bg-[#bb9af7]/20 text-[#bb9af7] border-[#bb9af7]/30',
    shipped: 'bg-[#7dcfff]/20 text-[#7dcfff] border-[#7dcfff]/30',
    delivered: 'bg-[#9ece6a]/20 text-[#9ece6a] border-[#9ece6a]/30',
    cancelled: 'bg-[#f7768e]/20 text-[#f7768e] border-[#f7768e]/30'
  };

  const handleSaveLocation = async (data) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/addresses/admin/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Location captured available for next order!');
        setShowCaptureModal(false);
        if (selectedOrder && selectedOrder._id === data.orderId) {
          setSelectedOrder(prev => ({
            ...prev,
            location: result.address.location ? {
              coordinates: {
                latitude: result.address.location.coordinates[1],
                longitude: result.address.location.coordinates[0]
              },
              timestamp: new Date()
            } : prev.location
          }));
        }
        fetchOrders(); // Refresh order list to show the new Location button
      } else {
        toast.error(result.message || 'Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Error saving location');
    }
  };

  // ... rest of code ...






  const fetchOrders = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/admin/orders?page=${pageNumber}&limit=10&search=${searchTerm}&status=${filterStatus}&date=${dateFilter}&deliveryDate=${deliveryDateFilter}`, {
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
        const processedOrders = (data.orders || []).map(order => recalculateOrderTotals(order, serviceAreas));
        setOrders(processedOrders);
        setSelectedOrderIds([]); // Clear selection on new data fetch

        if (data.statusCounts) {
          setServerStatusCounts(data.statusCounts);
        }

        setTotalPages(data.pagination?.pages || 0);
        setTotalOrders(data.pagination?.total || 0);
        setPage(pageNumber);
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
    const timer = setTimeout(() => {
      fetchOrders(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus, dateFilter, deliveryDateFilter, serviceAreas]);

  // Fetch Service Areas
  useEffect(() => {
    const fetchServiceAreas = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/service-areas/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setServiceAreas(data.serviceAreas || []);
        }
      } catch (error) {
        console.error('Error fetching service areas:', error);
      }
    };
    fetchServiceAreas();
  }, []);

  // Fetch Delivery Partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPartners(data.partners || []);
        }
      } catch (error) {
        console.error('Error fetching partners:', error);
      }
    };
    fetchPartners();
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
        fetchOrders(page); // Refresh current page
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

  const handleAssignRider = async (orderId, partnerId) => {
    if (!partnerId) return;
    try {
      setAssigningRider(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/admin/assign-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, partnerId })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Rider assigned successfully!`);
        // Update local state for the selected order if it's open
        if (selectedOrder && selectedOrder._id === orderId) {
          const assignedPartner = partners.find(p => p._id === partnerId);
          setSelectedOrder(prev => ({
            ...prev,
            status: 'shipped',
            deliveryPartner: assignedPartner
          }));
        }
        fetchOrders(page);
      } else {
        toast.error(data.message || 'Failed to assign rider');
      }
    } catch (error) {
      console.error('Error assigning rider:', error);
      toast.error('Error assigning rider');
    } finally {
      setAssigningRider(false);
    }
  };

  const fetchProducts = async () => {
    try {
      if (products.length > 0) return; // Already fetched

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products for search');
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(JSON.parse(JSON.stringify(order)));
    setShowEditModal(true);
    fetchProducts(); // Load products when edit modal opens
  };

  const handleSaveEditedOrder = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      const updatedOrder = recalculateOrderTotals(editingOrder, serviceAreas);

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
        fetchOrders(page); // Refresh current page
      } else {
        throw new Error(data.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error updating order');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('CRITICAL: Permanent Delete?\nThis will revert stock and promo code usage. This action CANNOT be undone.')) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order permanently deleted');
        setOrders(orders.filter(o => o._id !== orderId));
        setShowOrderModal(false); // Assuming setShowOrderModal is the correct one for closing the details modal
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Network Error during deletion');
    }
  };

  const handleDeleteProof = async (orderId) => {
    if (!window.confirm('Delete this proof of delivery image? This will save storage space.')) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-partners/admin/orders/${orderId}/proof`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Proof of delivery deleted');
        // Update local state
        setOrders(orders.map(o => o._id === orderId ? { ...o, proofOfDelivery: { image: '', capturedAt: null } } : o));
        setSelectedOrder({ ...selectedOrder, proofOfDelivery: { image: '', capturedAt: null } });
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Error deleting proof');
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
    const item = updatedItems[index];
    const qty = parseInt(newQuantity);

    // Recalculate customization charge if item is customized
    let newCustomizationCharge = item.customizationCharge || 0;
    if (item.isCustomized) {
      const product = products.find(p => p._id === (item.productId || item.product));
      if (product && product.isCustomizable) {
        // Calculate total grams
        let totalGrams = 0;
        const weightValue = parseFloat(item.weight) || 0;
        if (item.unit === 'kg') {
          totalGrams = weightValue * 1000 * qty;
        } else if (item.unit === 'g') {
          totalGrams = weightValue * qty;
        }

        // Inline calculation logic matching common function
        const sortedCharges = [...(product.customizationCharges || [])].sort((a, b) => b.weight - a.weight);
        let remainingWeight = totalGrams;
        let totalCharge = 0;
        for (const rule of sortedCharges) {
          if (rule.weight <= 0) continue;
          const count = Math.floor(remainingWeight / rule.weight);
          if (count > 0) {
            totalCharge += count * rule.charge;
            remainingWeight -= count * rule.weight;
          }
        }
        newCustomizationCharge = totalCharge;
      }
    }

    updatedItems[index] = {
      ...item,
      quantity: qty,
      customizationCharge: newCustomizationCharge
    };

    setEditingOrder(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleAddItem = (product) => {
    // Default to first weight variant
    const variant = product.weights && product.weights.length > 0 ? product.weights[0] : {};

    // Create new item object matching the order item structure
    const newItem = {
      product: product._id, // Keep for frontend consistency if needed
      productId: product._id, // REQUIRED: This is what the backend expects for validation
      name: product.name,
      image: product.image,
      description: Array.isArray(product.description) ? product.description.join(' ') : (product.description || ''),
      weight: variant.weight || product.weight || '',
      unit: variant.unit || product.unit || '',
      quantity: 1,
      price: variant.offerPrice > 0 ? variant.offerPrice : (variant.price || 0)
    };

    setEditingOrder(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    toast.success('Item added to order');
    setProductSearch(''); // Clear search
    setShowProductResults(false);
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

    // Recalculate order totals to ensure correct values in print
    const order = recalculateOrderTotals(selectedOrder, serviceAreas);

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
          '<td>' +
          '<strong>' + item.name + '</strong>' +
          (item.isCustomized ? '<br><span style="font-size: 11px; color: #10b981; font-weight: 600;">✨ CUSTOMIZED: ' + (item.customizationInstructions || 'N/A') + '</span>' : '') +
          '</td>' +
          '<td>' + formatWeight(item.weight, item.unit) + '</td>' +
          '<td>' + item.quantity + '</td>' +
          '<td>₹' + item.price + (item.customizationCharge > 0 ? `<br><span style="font-size: 10px; color: #10b981;">+ ₹${item.customizationCharge} custom</span>` : '') + '</td>' +
          '<td><strong>₹' + ((item.price * item.quantity) + (item.customizationCharge || 0)).toFixed(2) + '</strong></td>' +
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

  const filteredOrders = orders;

  const getTotalRevenue = () => {
    return filteredOrders
      .filter(order => order.status === 'delivered')
      .reduce((total, order) => total + order.totalAmount, 0);
  };

  const getCurrentOrderTotals = () => {
    if (!editingOrder) return { subtotal: 0, shippingFee: 0, discountAmount: 0, totalAmount: 0 };
    return recalculateOrderTotals(editingOrder, serviceAreas);
  };



  // Status counts for quick filters
  const statusCounts = serverStatusCounts;

  const columns = [
    {
      key: 'selection',
      label: (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={orders.length > 0 && selectedOrderIds.length === orders.length}
            onChange={handleSelectAll}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#7aa2f7] focus:ring-[#7aa2f7] cursor-pointer"
          />
        </div>
      ),
      render: (_, order) => (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedOrderIds.includes(order._id)}
            onChange={() => handleSelectOrder(order._id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#7aa2f7] focus:ring-[#7aa2f7] cursor-pointer"
          />
        </div>
      )
    },
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
      render: (amount, order) => {
        const calculatedOrder = recalculateOrderTotals(order, serviceAreas);
        return <span className={`font-medium ${tw.textPrimary}`}>₹{calculatedOrder.totalAmount?.toFixed(2)}</span>;
      }
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
      key: 'rider',
      label: 'Rider',
      render: (_, order) => (
        <div className="text-xs">
          {order.deliveryPartner ? (
            <div className="flex flex-col">
              <span className={`font-bold ${tw.textPrimary}`}>{order.deliveryPartner.name}</span>
              <span className={tw.textSecondary}>{order.deliveryPartner.phone}</span>
            </div>
          ) : (
            <span className="text-gray-500 italic">Not assigned</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, order) => (
        <div className="flex gap-1 sm:gap-2">
          <AdminButtonDark
            variant="ghost"
            size="sm"
            icon={Eye}
            className="px-2"
            title="View Details"
            onClick={(e) => {
              e.stopPropagation();
              handleViewOrder(order);
            }}
          >
            <span className="hidden sm:inline ml-1">View</span>
          </AdminButtonDark>
          <AdminButtonDark
            variant="ghost"
            size="sm"
            icon={Edit}
            className="px-2"
            title="Edit Order"
            onClick={(e) => {
              e.stopPropagation();
              handleEditOrder(order);
            }}
          >
            <span className="hidden sm:inline ml-1">Edit</span>
          </AdminButtonDark>
          {/* Location Button - Show if order has valid coordinates */}
          {(order.deliveryLocation?.coordinates || order.liveLocation?.coordinates || order.location?.coordinates || order.location?.lat) && (
            <AdminButtonDark
              variant="ghost"
              size="sm"
              icon={MapPin}
              className="px-2"
              onClick={(e) => {
                e.stopPropagation();
                // Prioritize: Verified Delivery Spot > Live GPS > Legacy Capture
                const loc = order.deliveryLocation || order.liveLocation || order.location;
                setSelectedLocation(loc);
                setShowLocationModal(true);
              }}
              title="View Delivery Location"
            >
              <span className="hidden sm:inline ml-1">Pin</span>
            </AdminButtonDark>
          )}
          <AdminButtonDark
            variant="ghost"
            size="sm"
            className="px-2 text-rose-500 hover:bg-rose-500/10"
            icon={Trash2}
            title="Delete Order"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteOrder(order._id);
            }}
          >
            <span className="hidden sm:inline ml-1">Del</span>
          </AdminButtonDark>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>Order Management</h1>
            <p className={`text-xs sm:text-sm ${tw.textSecondary}`}>Manage and track all customer orders</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <AdminButtonDark size="sm" icon={RefreshCw} className="flex-1 sm:flex-none" onClick={() => fetchOrders(page)}>
              Refresh
            </AdminButtonDark>
            <AdminButtonDark size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => navigate('/admin')}>
              Dashboard
            </AdminButtonDark>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className={`p-3 sm:p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26] shadow-lg`}>
            <p className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>{totalOrders}</p>
            <p className={`text-[10px] sm:text-sm ${tw.textSecondary} uppercase font-bold tracking-wider`}>Total Orders</p>
          </div>
          <div className={`p-3 sm:p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26] shadow-lg`}>
            <p className={`text-xl sm:text-2xl font-bold text-yellow-500`}>{statusCounts.pending}</p>
            <p className={`text-[10px] sm:text-sm ${tw.textSecondary} uppercase font-bold tracking-wider`}>Pending</p>
          </div>
          <div className={`p-3 sm:p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26] shadow-lg`}>
            <p className={`text-xl sm:text-2xl font-bold text-green-500`}>{statusCounts.delivered}</p>
            <p className={`text-[10px] sm:text-sm ${tw.textSecondary} uppercase font-bold tracking-wider`}>Delivered</p>
          </div>
          <div className={`p-3 sm:p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26] shadow-lg`}>
            <p className={`text-xl sm:text-2xl font-bold text-[#7dcfff]`}>
              ₹{Math.floor(getTotalRevenue()).toLocaleString()}
            </p>
            <p className={`text-[10px] sm:text-sm ${tw.textSecondary} uppercase font-bold tracking-wider`}>Revenue</p>
          </div>
        </div>

        {/* Status Quick Filters */}
        <div className="flex flex-wrap sm:grid sm:grid-cols-7 gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-none">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'processing', label: 'Proc...' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'delivered', label: 'Done' },
            { key: 'cancelled', label: 'Cancel' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`flex-1 min-w-[80px] p-2.5 sm:p-4 rounded-xl border-2 transition-all ${filterStatus === key
                ? 'border-[#7aa2f7] bg-[#7aa2f7]/20 shadow-[0_0_15px_rgba(122,162,247,0.1)]'
                : `${tw.borderPrimary} hover:border-[#7aa2f7]/50`
                }`}
            >
              <p className={`text-lg sm:text-2xl font-bold ${tw.textPrimary}`}>{statusCounts[key]}</p>
              <p className={`text-[10px] sm:text-sm font-medium ${tw.textSecondary}`}>{label}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className={`${tw.bgSecondary} p-3 sm:p-4 rounded-xl border ${tw.borderPrimary} shadow-md`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className={`block text-[10px] sm:text-sm font-bold uppercase tracking-wider ${tw.textSecondary} mb-1 sm:mb-2`}>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full text-sm ${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg px-3 py-2 cursor-pointer focus:ring-2 focus:ring-[#7aa2f7] transition-all`}
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
              <label className={`block text-[10px] sm:text-sm font-bold uppercase tracking-wider ${tw.textSecondary} mb-1 sm:mb-2`}>Order Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`w-full text-sm ${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7aa2f7] transition-all`}
              />
            </div>

            <div>
              <label className={`block text-[10px] sm:text-sm font-bold uppercase tracking-wider ${tw.textSecondary} mb-1 sm:mb-2`}>Delivery Date</label>
              <input
                type="date"
                value={deliveryDateFilter}
                onChange={(e) => setDeliveryDateFilter(e.target.value)}
                className={`w-full text-sm ${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7aa2f7] transition-all`}
              />
            </div>

            <div>
              <label className={`block text-[10px] sm:text-sm font-bold uppercase tracking-wider ${tw.textSecondary} mb-1 sm:mb-2`}>Search</label>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary}`} />
                <input
                  type="text"
                  placeholder="Order ID, Phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full text-sm pl-10 pr-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg focus:ring-2 focus:ring-[#7aa2f7] transition-all`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedOrderIds.length > 0 && (
          <div className={`${tw.bgSecondary} p-3 sm:p-4 rounded-xl border border-[#7aa2f7]/50 bg-[#7aa2f7]/5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 shadow-lg shadow-blue-500/10`}>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-[#7aa2f7] text-[#1a1b26] px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                {selectedOrderIds.length} Selected
              </div>
              <p className={`text-xs sm:text-sm font-medium ${tw.textPrimary}`}>Update status:</p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
              {[
                { key: 'confirmed', label: 'Confirm', icon: Package },
                { key: 'processing', label: 'Proc...', icon: Package },
                { key: 'shipped', label: 'Ship', icon: Truck },
                { key: 'delivered', label: 'Done', icon: CheckCircle },
                { key: 'cancelled', label: 'X', icon: XCircle }
              ].map((status) => (
                <button
                  key={status.key}
                  disabled={bulkStatusUpdating}
                  onClick={() => handleBulkStatusUpdate(status.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${statusColors[status.key]} hover:brightness-125 active:scale-95 disabled:opacity-50`}
                  title={status.label}
                >
                  <status.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{status.label}</span>
                </button>
              ))}
              <AdminButtonDark
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white text-xs"
                onClick={() => setSelectedOrderIds([])}
              >
                Cancel
              </AdminButtonDark>
            </div>
          </div>
        )}

        {/* Table */}
        <AdminTableDark
          columns={columns}
          data={filteredOrders}
          isLoading={loading}
          serverSidePagination={true}
          totalServerPages={totalPages}
          currentServerPage={page}
          onPageChange={(newPage) => fetchOrders(newPage)}
          onRowClick={(order) => handleViewOrder(order)}
        />

        {/* Order Details Modal */}
        <AdminModalDark
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          title={`Order Details - #${selectedOrder?._id?.slice(-8)}`}
          size="xl"
          footer={
            <div className="flex flex-col gap-4 w-full">
              {/* Status and Rider Assignment */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <div className="flex flex-col w-full sm:flex-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${tw.textSecondary} mb-1 ml-1`}>Update Status</span>
                  <select
                    value={selectedOrder?.status || ''}
                    onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                    disabled={updatingStatus}
                    className={`w-full text-sm ${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#7aa2f7] transition-all`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex flex-col w-full sm:flex-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${tw.textSecondary} mb-1 ml-1`}>Assign Rider</span>
                  <select
                    value={selectedOrder?.deliveryPartner?._id || ''}
                    onChange={(e) => handleAssignRider(selectedOrder._id, e.target.value)}
                    disabled={assigningRider}
                    className={`w-full text-sm ${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#7aa2f7] transition-all`}
                  >
                    <option value="">Select Rider</option>
                    {partners.filter(p => p.isActive).map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#414868]/30">
                <AdminButtonDark
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  className="flex-1 sm:flex-none"
                  onClick={() => handleDeleteOrder(selectedOrder._id)}
                >
                  Delete
                </AdminButtonDark>
                <AdminButtonDark 
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={printOrderBill}
                >
                  Print Bill
                </AdminButtonDark>
                <AdminButtonDark 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setShowOrderModal(false)}
                >
                  Close
                </AdminButtonDark>
              </div>
            </div>
          }
        >
          {selectedOrder && (() => {
            // Recalculate totals for display (in case old orders have wrong totals)
            const displayOrder = recalculateOrderTotals(selectedOrder, serviceAreas);
            const hasWrongTotal = Math.abs(displayOrder.totalAmount - selectedOrder.totalAmount) > 0.01;

            return (
              <div className="space-y-6">
                {/* Warning if totals don't match */}
                {hasWrongTotal && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-500 text-sm font-medium">
                      ⚠️ This order has incorrect totals in the database.
                      Saved: ₹{selectedOrder.totalAmount?.toFixed(2)} |
                      Correct: ₹{displayOrder.totalAmount?.toFixed(2)}
                      <br />
                      <span className="text-xs">Click "Edit" and "Save Changes" to fix this order.</span>
                    </p>
                  </div>
                )}
                {/* Order Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className={`p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26]/30`}>
                    <h3 className={`text-[10px] uppercase font-black tracking-widest ${tw.textSecondary} mb-3 flex items-center gap-2`}>
                      <Info className="w-3.5 h-3.5" /> Order Information
                    </h3>
                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className={tw.textSecondary}>Order ID:</span> 
                        <span className={`${tw.textPrimary} font-mono break-all font-medium`}>{selectedOrder._id}</span>
                      </div>
                      <div className="flex justify-between gap-1">
                        <span className={tw.textSecondary}>Order Date:</span> 
                        <span className={`${tw.textPrimary} font-medium`}>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center gap-1">
                        <span className={tw.textSecondary}>Payment:</span> 
                        <span className={`${tw.textPrimary} font-bold text-[10px] bg-[#414868] px-2 py-0.5 rounded-md`}>
                          {selectedOrder.paymentMethod === 'cash_on_delivery' ? 'COD' : 'ONLINE'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-1">
                        <span className={tw.textSecondary}>Status:</span> 
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusColors[selectedOrder.status]}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26]/30`}>
                    <h3 className={`text-[10px] uppercase font-black tracking-widest ${tw.textSecondary} mb-3 flex items-center gap-2`}>
                      <User className="w-3.5 h-3.5" /> Customer Information
                    </h3>
                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex justify-between gap-1">
                        <span className={tw.textSecondary}>Name:</span> 
                        <span className={`${tw.textPrimary} font-bold`}>{selectedOrder.userInfo?.name || selectedOrder.shippingAddress?.fullName || 'Guest'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className={tw.textSecondary}>Email:</span> 
                        <span className={`${tw.textPrimary} break-all font-medium`}>{selectedOrder.userInfo?.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between gap-1">
                        <span className={tw.textSecondary}>Phone:</span> 
                        <span className={`${tw.textPrimary} font-bold`}>📞 {selectedOrder.userInfo?.phone || selectedOrder.shippingAddress?.phoneNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className={`p-4 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26]/30`}>
                  <h3 className={`text-[10px] uppercase font-black tracking-widest ${tw.textSecondary} mb-3 flex items-center gap-2`}>
                    <Truck className="w-3.5 h-3.5" /> Delivery Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-[#414868]/20 border border-[#414868]/30">
                        <p className={`text-[10px] uppercase font-bold text-yellow-500/80 mb-1`}>Scheduled For</p>
                        <p className={`${tw.textPrimary} font-bold text-base`}>{new Date(selectedOrder.deliveryDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className={`${tw.textPrimary} font-medium mt-1 opacity-80 underline decoration-yellow-500/30`}>Slot: {selectedOrder.timeSlot}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className={`text-[10px] uppercase font-bold ${tw.textSecondary}`}>Shipping Address</p>
                      <div className={`p-3 rounded-lg border ${tw.borderPrimary} bg-white/5 space-y-1`}>
                        <p className={`${tw.textPrimary} font-bold`}>{selectedOrder.shippingAddress.fullName}</p>
                        <p className={tw.textPrimary}>{selectedOrder.shippingAddress.street}</p>
                        <p className={tw.textPrimary}>{selectedOrder.shippingAddress.locality}</p>
                        <p className={`${tw.textPrimary} font-medium`}>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
                        <div className="mt-2 pt-2 border-t border-[#414868]/50 flex flex-wrap gap-x-4 gap-y-1">
                          <p className="text-green-400 font-bold">📞 {selectedOrder.shippingAddress.phoneNumber}</p>
                          {selectedOrder.shippingAddress.alternatePhone && (
                            <p className="text-green-400/80">📞 {selectedOrder.shippingAddress.alternatePhone} (Alt)</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <AdminButtonDark
                          size="sm"
                          variant="outline"
                          icon={MapPin}
                          className="w-full justify-center h-10 shadow-sm"
                          onClick={() => {
                            setCaptureOrder(selectedOrder);
                            setShowCaptureModal(true);
                          }}
                        >
                          Verify Google Maps Pin
                        </AdminButtonDark>
                      </div>
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


                {/* Dual Location Information */}
                {(selectedOrder.liveLocation || selectedOrder.deliveryLocation) && (
                  <div className="space-y-4">
                    {/* 1. Delivery / Shipping GPS (Priority) */}
                    {selectedOrder.deliveryLocation && (
                      <div className={`p-4 rounded-lg border border-[#9ece6a]/30 bg-[#9ece6a]/10`}>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className={`font-medium text-[#9ece6a] flex items-center gap-2`}>
                            <span>🏠</span>
                            Delivery Location (Shipping Spot)
                          </h3>
                          <span className="text-[10px] bg-[#9ece6a] text-[#1a1b26] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {selectedOrder.deliveryLocation.source || 'verified'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className={tw.textSecondary}>Coordinates:</p>
                            <p className={`font-mono text-[#9ece6a] font-medium`}>
                              {selectedOrder.deliveryLocation.coordinates
                                ? `${selectedOrder.deliveryLocation.coordinates.latitude.toFixed(6)}, ${selectedOrder.deliveryLocation.coordinates.longitude.toFixed(6)}`
                                : selectedOrder.deliveryLocation.lat
                                  ? `${selectedOrder.deliveryLocation.lat.toFixed(6)}, ${selectedOrder.deliveryLocation.lng.toFixed(6)}`
                                  : 'N/A'
                              }
                            </p>
                          </div>
                          <div>
                            <p className={tw.textSecondary}>Source:</p>
                            <p className={`font-medium ${tw.textPrimary} uppercase text-xs italic`}>
                              {selectedOrder.deliveryLocation.source === 'admin' ? '📍 Admin Hand-Picked' :
                                selectedOrder.deliveryLocation.source === 'saved' ? '💾 Saved Address' :
                                  selectedOrder.deliveryLocation.source === 'historical' ? '🕒 Previous Order Fallback' : '📡 Live GPS'}
                            </p>
                          </div>
                          <div>
                            <p className={tw.textSecondary}>Captured At:</p>
                            <p className={`font-medium ${tw.textPrimary}`}>
                              {selectedOrder.deliveryLocation.timestamp ? new Date(selectedOrder.deliveryLocation.timestamp).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <a
                            href={`https://www.google.com/maps?q=${selectedOrder.deliveryLocation.coordinates ? selectedOrder.deliveryLocation.coordinates.latitude : selectedOrder.deliveryLocation.lat},${selectedOrder.deliveryLocation.coordinates ? selectedOrder.deliveryLocation.coordinates.longitude : selectedOrder.deliveryLocation.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#9ece6a] text-[#1a1b26] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#b0df7c] transition-colors"
                          >
                            🗺️ Navigate to Delivery Spot
                          </a>
                        </div>
                      </div>
                    )}

                    {/* 2. LIVE Location (At time of order) */}
                    {selectedOrder.liveLocation && selectedOrder.liveLocation.coordinates && (
                      <div className={`p-4 rounded-lg border border-[#7aa2f7]/30 bg-[#7aa2f7]/5`}>
                        <h3 className={`font-medium text-[#7aa2f7] mb-3 flex items-center gap-2`}>
                          <span>📍</span>
                          Customer's Live Position (During Order)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className={tw.textSecondary}>Current GPS:</p>
                            <p className={`font-mono ${tw.textPrimary}`}>
                              {selectedOrder.liveLocation.coordinates.latitude.toFixed(6)}, {selectedOrder.liveLocation.coordinates.longitude.toFixed(6)}
                            </p>
                          </div>
                          <div>
                            <p className={tw.textSecondary}>Device Accuracy:</p>
                            <p className={`font-medium ${tw.textPrimary}`}>
                              ±{selectedOrder.liveLocation.accuracy ? Math.round(selectedOrder.liveLocation.accuracy) + 'm' : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className={tw.textSecondary}>Capture Time:</p>
                            <p className={`font-medium ${tw.textPrimary}`}>
                              {selectedOrder.liveLocation.timestamp ? new Date(selectedOrder.liveLocation.timestamp).toLocaleTimeString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <a
                            href={`https://www.google.com/maps?q=${selectedOrder.liveLocation.coordinates.latitude},${selectedOrder.liveLocation.coordinates.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#7aa2f7] hover:underline flex items-center gap-1"
                          >
                            View Customer's live spot on Map
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}


                {/* Proof of Delivery (POD) Section */}
                {(selectedOrder.proofOfDelivery?.image || selectedOrder.status === 'delivered') && (
                  <div className={`p-4 rounded-lg border ${selectedOrder.proofOfDelivery?.image ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`font-black ${selectedOrder.proofOfDelivery?.image ? 'text-emerald-500' : 'text-gray-400'} flex items-center gap-2 uppercase tracking-widest text-xs italic`}>
                        <span>📸</span>
                        {selectedOrder.proofOfDelivery?.image ? 'Verified Proof of Delivery' : 'Completion Audit (No Image)'}
                      </h3>
                      {selectedOrder.proofOfDelivery?.image && (
                        <button
                          onClick={() => handleDeleteProof(selectedOrder._id)}
                          className="bg-rose-500/10 text-rose-500 p-1.5 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                          title="Delete Proof"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative group">
                        {selectedOrder.proofOfDelivery?.image ? (
                          <>
                            <img
                              src={selectedOrder.proofOfDelivery.image}
                              alt="Proof of Delivery"
                              className="w-full h-48 object-cover rounded-xl border border-emerald-500/20 shadow-lg cursor-zoom-in group-hover:opacity-90 transition-opacity"
                              onClick={() => window.open(selectedOrder.proofOfDelivery.image, '_blank')}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <Eye className="text-white w-8 h-8 drop-shadow-lg" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-48 bg-[#1a1b26] rounded-xl border border-gray-700 flex flex-col items-center justify-center text-gray-600">
                            <CameraOff size={32} className="mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No Image Captured</p>
                            <p className="text-[8px] mt-1 text-gray-700 text-center px-4">Hand-delivered / Security Handover</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center space-y-3">
                        <div className="bg-[#1a1b26] p-3 rounded-xl border border-gray-700/50">
                          <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Captured Timestamp</p>
                          <p className="text-xs text-emerald-400 font-mono font-bold">
                            {selectedOrder.proofOfDelivery?.capturedAt ? new Date(selectedOrder.proofOfDelivery.capturedAt).toLocaleString() : 'N/A (Audited)'}
                          </p>
                        </div>
                        <div className="bg-[#1a1b26] p-3 rounded-xl border border-gray-700/50">
                          <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Status</p>
                          <p className={`text-xs ${selectedOrder.proofOfDelivery?.image ? 'text-emerald-500' : 'text-gray-400'} flex items-center gap-1.5 font-bold`}>
                            {selectedOrder.proofOfDelivery?.image ? <CheckCircle size={14} /> : <Info size={14} />}
                            {selectedOrder.proofOfDelivery?.image ? 'Legitimate Delivery Confirmed' : 'Delivery Audited (No Image)'}
                          </p>
                        </div>

                        {selectedOrder.proofOfDelivery.location?.latitude && (
                          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <p className="text-[10px] text-emerald-400 font-black uppercase mb-1 flex items-center gap-1">
                              <MapPin size={10} /> GPS Audit Spot
                            </p>
                            <a
                              href={`https://www.google.com/maps?q=${selectedOrder.proofOfDelivery.location.latitude},${selectedOrder.proofOfDelivery.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-white hover:underline font-mono"
                            >
                              Coord: {selectedOrder.proofOfDelivery.location.latitude.toFixed(5)}, {selectedOrder.proofOfDelivery.location.longitude.toFixed(5)}
                            </a>
                            <p className={`text-[9px] mt-1 italic font-bold uppercase tracking-wider ${selectedOrder.proofOfDelivery.isForcefullyDelivered ? 'text-amber-500' : 'text-emerald-500/60'}`}>
                              {selectedOrder.proofOfDelivery.isForcefullyDelivered ? '⚠️ FORCEFULLY DELIVERED (OUTSIDE GEOFENCE)' : '✓ Geofence Verified Match'}
                            </p>
                          </div>
                        )}
                        {selectedOrder.proofOfDelivery?.image && (
                          <AdminButtonDark
                            size="sm"
                            variant="outline"
                            icon={ExternalLink}
                            className="w-full justify-center text-[10px] h-10"
                            onClick={() => window.open(selectedOrder.proofOfDelivery.image, '_blank')}
                          >
                            View Full Quality Image
                          </AdminButtonDark>
                        )}
                      </div>
                    </div>
                  </div>
                )}


                {/* Order Items */}
                <div className="space-y-4">
                  <h3 className={`font-bold uppercase tracking-wider text-xs ${tw.textSecondary} flex items-center gap-2`}>
                    <Package className="w-4 h-4" /> Order Items ({selectedOrder.items.length})
                  </h3>
                  
                  {/* Desktop Table View */}
                  <div className={`hidden sm:block rounded-xl border ${tw.borderPrimary} overflow-hidden bg-[#1a1b26]/50`}>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className={`${tw.bgInput} border-b ${tw.borderPrimary}`}>
                          <th className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${tw.textSecondary}`}>Product</th>
                          <th className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${tw.textSecondary}`}>Weight</th>
                          <th className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${tw.textSecondary}`}>Qty</th>
                          <th className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider ${tw.textSecondary}`}>Price</th>
                          <th className={`px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider ${tw.textSecondary}`}>Total</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${tw.borderSecondary}`}>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className="hover:bg-white/5 transition-colors">
                            <td className={`px-4 py-3 text-sm ${tw.textPrimary}`}>
                              <div className="flex items-center gap-3">
                                <img
                                  src={getProductImage(item)}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-[#414868]"
                                />
                                <div>
                                  <p className="font-bold text-sm">{item.name}</p>
                                  {item.isCustomized && (
                                    <p className="text-[10px] text-green-400 font-bold bg-green-400/10 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                                      ✨ CUSTOM: {item.customizationInstructions}
                                    </p>
                                  )}
                                  <p className={`text-[10px] ${tw.textSecondary} line-clamp-1 mt-0.5`}>{item.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className={`px-4 py-3 text-sm font-medium ${tw.textPrimary}`}>{item.weight} {item.unit}</td>
                            <td className={`px-4 py-3 text-sm font-bold ${tw.textPrimary}`}>x{item.quantity}</td>
                            <td className={`px-4 py-3 text-sm ${tw.textPrimary}`}>
                              <div className="font-medium">₹{item.price}</div>
                              {item.customizationCharge > 0 && (
                                <p className="text-[9px] text-green-400 font-bold">+₹{item.customizationCharge} fee</p>
                              )}
                            </td>
                            <td className={`px-4 py-3 text-sm font-bold text-right ${tw.textPrimary}`}>
                              ₹{((item.price * item.quantity) + (item.customizationCharge || 0)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="sm:hidden space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className={`p-3 rounded-xl border ${tw.borderPrimary} bg-[#1a1b26]/50 shadow-sm`}>
                        <div className="flex gap-3">
                          <img
                            src={getProductImage(item)}
                            alt={item.name}
                            className="w-16 h-16 rounded-lg object-cover border border-[#414868]"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold text-sm ${tw.textPrimary} truncate`}>{item.name}</h4>
                            <p className={`text-[10px] ${tw.textSecondary} mb-1 italic`}>{item.weight} {item.unit}</p>
                            <div className="flex justify-between items-end">
                              <div className="text-[10px] space-y-0.5">
                                <p className={tw.textSecondary}>Price: <span className={tw.textPrimary}>₹{item.price}</span></p>
                                <p className={tw.textSecondary}>Qty: <span className={tw.textPrimary}>x{item.quantity}</span></p>
                                {item.customizationCharge > 0 && (
                                  <p className="text-green-400 font-bold">Custom: +₹{item.customizationCharge}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className={`text-xs ${tw.textSecondary} uppercase font-bold tracking-wider mb-0.5`}>Subtotal</p>
                                <p className={`text-sm font-bold text-[#7dcfff]`}>
                                  ₹{((item.price * item.quantity) + (item.customizationCharge || 0)).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            {item.isCustomized && (
                              <div className="mt-2 p-2 rounded-lg bg-green-400/5 border border-green-400/10">
                                <p className="text-[9px] text-green-400 font-bold leading-tight">
                                  ✨ CUSTOM: {item.customizationInstructions}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary Section */}
                  <div className={`mt-6 rounded-xl border-2 ${tw.borderPrimary} bg-[#1a1b26] overflow-hidden shadow-lg`}>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className={tw.textSecondary}>Subtotal</span>
                        <span className={`font-medium ${tw.textPrimary}`}>₹{displayOrder.subtotal?.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className={tw.textSecondary}>Delivery Fee</span>
                        <span className="font-bold text-yellow-500/80">+ ₹{displayOrder.shippingFee?.toFixed(2)}</span>
                      </div>

                      {displayOrder.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-xs sm:text-sm border-t border-dashed border-gray-700 pt-2">
                          <span className="text-green-400 font-bold">Discount ({displayOrder.promoCode})</span>
                          <span className="text-green-400 font-bold">- ₹{displayOrder.discountAmount?.toFixed(2)}</span>
                        </div>
                      )}

                      {displayOrder.tipAmount > 0 && (
                        <div className="flex justify-between items-center text-xs sm:text-sm border-t border-dashed border-gray-700 pt-2">
                          <span className="text-orange-400 font-bold italic flex items-center gap-1">💝 Handling Tip</span>
                          <span className="text-orange-400 font-bold">+ ₹{displayOrder.tipAmount?.toFixed(2)}</span>
                        </div>
                      )}

                      <div className={`flex justify-between items-center p-3 rounded-xl bg-[#7aa2f7]/10 border border-[#7aa2f7]/20 mt-2`}>
                        <div className="flex flex-col">
                          <span className={`text-[10px] uppercase font-black tracking-widest ${tw.textSecondary}`}>Total Payable</span>
                          <span className={`text-[#7aa2f7] text-[10px] font-bold uppercase`}>{selectedOrder.paymentMethod === 'cash_on_delivery' ? 'COD' : 'Paid Online'}</span>
                        </div>
                        <span className={`text-xl sm:text-3xl font-black text-[#7aa2f7] drop-shadow-[0_0_15px_rgba(122,162,247,0.3)]`}>
                          ₹{displayOrder.totalAmount?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
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

                {/* Add Items Section */}
                <div className={`mb-6 relative`}>
                  <label className={`block text-xs ${tw.textSecondary} mb-2`}>Add Products to Order</label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary}`} />
                        <input
                          type="text"
                          placeholder="Search products to add..."
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductResults(true);
                          }}
                          onFocus={() => setShowProductResults(true)}
                          className={`w-full pl-10 pr-4 py-2 ${tw.bgInput} border ${tw.borderPrimary} ${tw.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7]`}
                        />
                      </div>
                    </div>

                    {/* Search Results Dropdown */}
                    {showProductResults && productSearch && (
                      <div className={`absolute z-20 w-full mt-1 max-h-60 overflow-y-auto ${tw.bgSecondary} border ${tw.borderPrimary} rounded-lg shadow-xl`}>
                        {products
                          .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                          .map(product => {
                            const variant = product.weights?.[0] || {};
                            const price = variant.offerPrice || variant.price || 0;
                            return (
                              <div
                                key={product._id}
                                className={`p-3 hover:bg-[#7aa2f7]/10 cursor-pointer border-b ${tw.borderPrimary} last:border-0 flex items-center justify-between group`}
                                onClick={() => handleAddItem(product)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded overflow-hidden bg-gray-800 flex-shrink-0 border ${tw.borderPrimary}`}>
                                    {product.image ? (
                                      <img src={product.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-5 h-5 m-auto text-gray-500" />
                                    )}
                                  </div>
                                  <div>
                                    <p className={`text-sm font-medium ${tw.textPrimary} group-hover:text-[#7aa2f7] transition-colors`}>{product.name}</p>
                                    <p className={`text-xs ${tw.textSecondary}`}>
                                      {variant.weight} {variant.unit} • ₹{price}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-[#7aa2f7] p-1.5 rounded-full bg-[#7aa2f7]/10 hover:bg-[#7aa2f7] hover:text-white transition-all">
                                  <Plus className="w-4 h-4" />
                                </div>
                              </div>
                            );
                          })}
                        {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                          <div className={`p-4 text-center text-sm ${tw.textSecondary}`}>
                            No products found
                          </div>
                        )}
                      </div>
                    )}
                    {/* Backdrop to close results */}
                    {showProductResults && (
                      <div
                        className="fixed inset-0 z-10 bg-transparent"
                        onClick={() => setShowProductResults(false)}
                      />
                    )}
                  </div>
                </div>

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
                        {item.isCustomized && (
                          <p className="text-xs text-green-400 font-bold mt-1 flex items-center gap-1">
                            <span>✨</span> Customized: {item.customizationInstructions || 'No instructions'}
                          </p>
                        )}
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
                            ₹{((item.price * item.quantity) + (item.customizationCharge || 0)).toFixed(2)}
                          </div>
                          {item.customizationCharge > 0 && (
                            <div className="text-[10px] text-green-400 font-bold">+₹{item.customizationCharge} custom</div>
                          )}
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
                    <span className={tw.textSecondary}>Items ({editingOrder.items.length})</span>
                    <span className={tw.textPrimary}>₹{getCurrentOrderTotals().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={tw.textSecondary}>Delivery Fee</span>
                    <span className={tw.textPrimary}>+ ₹{getCurrentOrderTotals().shippingFee.toFixed(2)}</span>
                  </div>
                  {getCurrentOrderTotals().discountAmount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount {editingOrder.promoCode ? `(${editingOrder.promoCode})` : ''}</span>
                      <span>- ₹{getCurrentOrderTotals().discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-gray-600 pt-2 mt-2 font-bold text-lg">
                    <span className={tw.textPrimary}>Total Amount</span>
                    <span className="text-[#7aa2f7]">₹{getCurrentOrderTotals().totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="bg-gray-800/50 px-3 py-2 rounded-lg mt-2">
                    <p className="text-xs text-gray-400">
                      {getCurrentOrderTotals().shippingFee === 0
                        ? '✓ Free delivery (order ≥ ₹299 after discount)'
                        : '₹29 delivery fee (order < ₹299 after discount)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AdminModalDark>
        )}

        <AdminModalDark
          isOpen={showLocationModal}
          onClose={() => {
            setShowLocationModal(false);
            setSelectedLocation(null);
          }}
          title="📍 Delivery Location"
        >
          {selectedLocation && (
            <div className="space-y-6">
              {/* Coordinates */}
              <div className={`p-4 rounded-lg ${tw.bgCard} border ${tw.borderPrimary}`}>
                <h3 className={`text-sm font-semibold ${tw.textSecondary} mb-2`}>GPS Coordinates</h3>
                <div className="flex items-center gap-2">
                  <code className={`text-lg font-mono ${tw.textPrimary} bg-[#1a1b26] px-3 py-2 rounded`}>
                    {(selectedLocation.coordinates?.latitude || selectedLocation.lat)?.toFixed(6)}, {(selectedLocation.coordinates?.longitude || selectedLocation.lng)?.toFixed(6)}
                  </code>
                  <button
                    onClick={() => {
                      const lat = selectedLocation.coordinates?.latitude || selectedLocation.lat;
                      const lng = selectedLocation.coordinates?.longitude || selectedLocation.lng;
                      navigator.clipboard.writeText(`${lat}, ${lng}`);
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
                  href={`https://www.google.com/maps?q=${selectedLocation.coordinates?.latitude || selectedLocation.lat},${selectedLocation.coordinates?.longitude || selectedLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#9ece6a] hover:bg-[#9ece6a]/80 text-[#1a1b26] font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  View on Google Maps
                </a>
              </div>
            </div>
          )}
        </AdminModalDark>

        {/* Capture Location Modal */}
        <LocationCaptureModal
          isOpen={showCaptureModal}
          onClose={() => setShowCaptureModal(false)}
          order={captureOrder}
          onSave={handleSaveLocation}
        />
      </div>
    </AdminLayoutDark>
  );
};

export default AdminOrdersDark;