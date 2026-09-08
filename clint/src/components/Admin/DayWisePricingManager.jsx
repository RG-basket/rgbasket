import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Save, X, AlertCircle, Search, Filter, RefreshCw, 
  CheckCircle, AlertTriangle, Package, ChevronDown, ChevronRight, 
  Sparkles, Sliders, ArrowRight, RotateCcw, Copy, Tag, Percent, 
  Info, Layers, Check, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminLayoutDark from './AdminLayoutDark';
import AdminButtonDark from './SharedDark/AdminButtonDark';
import AdminInputDark from './SharedDark/AdminInputDark';
import { tw } from '../../config/tokyoNightTheme';
import { DAYS_OF_WEEK, hasDayWisePricing } from '../../utils/pricingUtils';

// Modal for editing full 7-day weekly schedule for a single product/variant
const WeeklyScheduleModal = ({ isOpen, onClose, product, variantIndex, onSaveSchedule }) => {
  if (!isOpen || !product) return null;

  const variant = product.weights?.[variantIndex] || product.weights?.[0] || {};
  const baseOfferPrice = Number(variant.offerPrice) || Number(variant.price) || 0;
  const basePrice = Number(variant.price) || baseOfferPrice;

  const [schedule, setSchedule] = useState(() => {
    const initial = {};
    DAYS_OF_WEEK.forEach(({ key }) => {
      const existing = variant.dailyPrices?.[key];
      initial[key] = {
        price: existing?.price !== undefined ? existing.price : '',
        offerPrice: existing?.offerPrice !== undefined ? existing.offerPrice : ''
      };
    });
    return initial;
  });

  const handlePriceChange = (dayKey, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
  };

  // Preset: Fish Market (Discount on Sunday, Wednesday, Friday)
  const applyFishMarketPreset = (discountPct = 10) => {
    const factor = (100 - discountPct) / 100;
    const discountedOffer = Math.round(baseOfferPrice * factor);

    setSchedule(prev => ({
      ...prev,
      sunday: { price: basePrice, offerPrice: discountedOffer },
      wednesday: { price: basePrice, offerPrice: discountedOffer },
      friday: { price: basePrice, offerPrice: discountedOffer }
    }));
    toast.success(`Applied ${discountPct}% off for Sunday, Wednesday & Friday!`);
  };

  // Preset: Weekend Special (Saturday & Sunday)
  const applyWeekendPreset = (discountPct = 5) => {
    const factor = (100 - discountPct) / 100;
    const discountedOffer = Math.round(baseOfferPrice * factor);

    setSchedule(prev => ({
      ...prev,
      saturday: { price: basePrice, offerPrice: discountedOffer },
      sunday: { price: basePrice, offerPrice: discountedOffer }
    }));
    toast.success(`Applied ${discountPct}% off for Saturday & Sunday!`);
  };

  // Preset: Copy Base Price to all days
  const applyCopyBase = () => {
    const updated = {};
    DAYS_OF_WEEK.forEach(({ key }) => {
      updated[key] = { price: basePrice, offerPrice: baseOfferPrice };
    });
    setSchedule(updated);
    toast.success('Base prices copied to all days');
  };

  // Preset: Clear all overrides
  const applyClearAll = () => {
    const updated = {};
    DAYS_OF_WEEK.forEach(({ key }) => {
      updated[key] = { price: '', offerPrice: '' };
    });
    setSchedule(updated);
    toast.success('Cleared all day overrides (falls back to base price)');
  };

  const handleSave = () => {
    // Format dailyPrices object: remove empty entries or clean numbers
    const cleanedDailyPrices = {};
    DAYS_OF_WEEK.forEach(({ key }) => {
      const entry = schedule[key];
      const hasOffer = entry?.offerPrice !== '' && entry?.offerPrice !== null && entry?.offerPrice !== undefined;
      const hasNormal = entry?.price !== '' && entry?.price !== null && entry?.price !== undefined;

      if (hasOffer || hasNormal) {
        cleanedDailyPrices[key] = {
          offerPrice: hasOffer ? Number(entry.offerPrice) : Number(entry.price || baseOfferPrice),
          price: hasNormal ? Number(entry.price) : Number(basePrice)
        };
      }
    });

    onSaveSchedule(cleanedDailyPrices);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className={`${tw.cardBg} border ${tw.border} rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${tw.border} flex items-center justify-between bg-slate-900/50`}>
          <div>
            <h3 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
              <Calendar className="w-5 h-5 text-blue-400" />
              Weekly Day Pricing Schedule
            </h3>
            <p className={`text-xs ${tw.textSecondary} mt-0.5`}>
              {product.name} &bull; <span className="font-semibold text-blue-300">{variant.weight} {variant.unit}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg ${tw.hoverBg} text-gray-400 hover:text-white transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Base Price Reference Banner */}
        <div className="px-6 py-3 bg-blue-950/30 border-b border-blue-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-200 font-medium">Base Default Prices:</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-300">
              MRP: <strong className="text-white">₹{basePrice}</strong>
            </span>
            <span className="text-emerald-400">
              Offer: <strong className="text-emerald-300">₹{baseOfferPrice}</strong>
            </span>
            <span className="text-gray-400 text-[11px]">
              (Applies to any day without an override)
            </span>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className={`px-6 py-2.5 border-b ${tw.border} bg-slate-900/30 flex items-center gap-2 overflow-x-auto text-xs`}>
          <span className="text-gray-400 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Presets:
          </span>
          <button
            onClick={() => applyFishMarketPreset(10)}
            className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg shrink-0 transition-colors font-medium"
          >
            🐟 Fish Market (Sun/Wed/Fri -10%)
          </button>
          <button
            onClick={() => applyWeekendPreset(5)}
            className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg shrink-0 transition-colors font-medium"
          >
            🌟 Weekend (-5%)
          </button>
          <button
            onClick={applyCopyBase}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 rounded-lg shrink-0 transition-colors"
          >
            📋 Copy Base
          </button>
          <button
            onClick={applyClearAll}
            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg shrink-0 transition-colors"
          >
            🧹 Clear All
          </button>
        </div>

        {/* 7-Day Schedule Inputs */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const dayData = schedule[key] || {};
            const currentOffer = dayData.offerPrice !== '' ? Number(dayData.offerPrice) : null;
            const hasOverride = currentOffer !== null;
            const diffFromBase = hasOverride ? currentOffer - baseOfferPrice : 0;

            return (
              <div 
                key={key} 
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  hasOverride 
                    ? 'bg-blue-950/20 border-blue-800/50' 
                    : 'bg-slate-900/40 border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 sm:w-44">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    hasOverride 
                      ? 'bg-blue-500 text-white shadow-xs' 
                      : 'bg-slate-800 text-gray-400'
                  }`}>
                    {label.substring(0, 3)}
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-gray-200 block">{label}</span>
                    <span className="text-[11px] text-gray-500">
                      {hasOverride ? (
                        diffFromBase < 0 ? (
                          <span className="text-emerald-400 font-medium">₹{Math.abs(diffFromBase)} lower</span>
                        ) : diffFromBase > 0 ? (
                          <span className="text-amber-400 font-medium">₹{diffFromBase} higher</span>
                        ) : (
                          <span className="text-gray-400">Same as base</span>
                        )
                      ) : (
                        'Uses base price'
                      )}
                    </span>
                  </div>
                </div>

                {/* Inputs */}
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <div className="w-32">
                    <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                      Offer Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder={`₹${baseOfferPrice}`}
                      value={dayData.offerPrice}
                      onChange={(e) => handlePriceChange(key, 'offerPrice', e.target.value)}
                      className={`w-full px-3 py-1.5 text-sm bg-slate-800 border rounded-lg text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500 ${
                        hasOverride ? 'border-blue-500/60 bg-blue-950/30' : 'border-slate-700'
                      }`}
                    />
                  </div>

                  <div className="w-32">
                    <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                      MRP (₹) <span className="text-gray-500 font-normal">opt.</span>
                    </label>
                    <input
                      type="number"
                      placeholder={`₹${basePrice}`}
                      value={dayData.price}
                      onChange={(e) => handlePriceChange(key, 'price', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  {hasOverride && (
                    <button
                      type="button"
                      title="Clear this day override"
                      onClick={() => handlePriceChange(key, 'offerPrice', '')}
                      className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors mt-4 sm:mt-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${tw.border} bg-slate-900/50 flex items-center justify-between`}>
          <span className="text-xs text-gray-400">
            Changes will be queued until you click "Save All Changes".
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm rounded-xl ${tw.hoverBg} text-gray-300 hover:text-white transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Apply to Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal for Bulk Applying Day Rates across multiple selected products
const BulkDayPricingModal = ({ isOpen, onClose, selectedCount, onApplyBulk }) => {
  if (!isOpen) return null;

  const [selectedDays, setSelectedDays] = useState({
    sunday: true,
    monday: false,
    tuesday: false,
    wednesday: true,
    thursday: false,
    friday: true,
    saturday: false
  });

  const [ruleType, setRuleType] = useState('percent_off'); // 'percent_off', 'flat_off', 'fixed_price', 'clear'
  const [ruleValue, setRuleValue] = useState(10);

  const toggleDay = (key) => {
    setSelectedDays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectFishDays = () => {
    setSelectedDays({
      sunday: true,
      monday: false,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: true,
      saturday: false
    });
  };

  const selectAllDays = () => {
    setSelectedDays({
      sunday: true,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true
    });
  };

  const handleApply = () => {
    const activeDays = Object.keys(selectedDays).filter(k => selectedDays[k]);
    if (activeDays.length === 0) {
      toast.error('Please select at least one day.');
      return;
    }

    onApplyBulk({
      days: activeDays,
      ruleType,
      ruleValue: Number(ruleValue) || 0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className={`${tw.cardBg} border ${tw.border} rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${tw.border} flex items-center justify-between bg-slate-900/50`}>
          <div>
            <h3 className={`text-lg font-bold ${tw.textPrimary} flex items-center gap-2`}>
              <Sparkles className="w-5 h-5 text-amber-400" />
              Bulk Apply Day Rates
            </h3>
            <p className={`text-xs ${tw.textSecondary} mt-0.5`}>
              Apply dynamic day pricing to <span className="text-blue-300 font-semibold">{selectedCount} selected products</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg ${tw.hoverBg} text-gray-400 hover:text-white transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Select Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                1. Select Days to Target
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={selectFishDays} 
                  className="text-blue-400 hover:underline"
                >
                  Fish Days (Sun/Wed/Fri)
                </button>
                <span className="text-gray-600">&bull;</span>
                <button 
                  type="button" 
                  onClick={selectAllDays} 
                  className="text-blue-400 hover:underline"
                >
                  All Days
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map(({ key, short }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  className={`p-2 rounded-xl text-center border font-bold text-xs transition-all ${
                    selectedDays[key]
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-gray-400 hover:border-slate-600'
                  }`}
                >
                  {short}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Action */}
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
              2. Price Adjustment Rule
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setRuleType('percent_off')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  ruleType === 'percent_off'
                    ? 'bg-blue-950/40 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-gray-300 hover:border-slate-600'
                }`}
              >
                <span className="block font-bold text-white mb-0.5">% Off Base Offer</span>
                e.g. 10% lower on fish days
              </button>

              <button
                type="button"
                onClick={() => setRuleType('flat_off')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  ruleType === 'flat_off'
                    ? 'bg-blue-950/40 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-gray-300 hover:border-slate-600'
                }`}
              >
                <span className="block font-bold text-white mb-0.5">Flat ₹ Off Base</span>
                e.g. ₹40 lower on fish days
              </button>

              <button
                type="button"
                onClick={() => setRuleType('fixed_price')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  ruleType === 'fixed_price'
                    ? 'bg-blue-950/40 border-blue-500 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-gray-300 hover:border-slate-600'
                }`}
              >
                <span className="block font-bold text-white mb-0.5">Set Fixed Price (₹)</span>
                e.g. Exactly ₹299
              </button>

              <button
                type="button"
                onClick={() => setRuleType('clear')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  ruleType === 'clear'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-gray-300 hover:border-slate-600'
                }`}
              >
                <span className="block font-bold text-white mb-0.5">Reset to Base Price</span>
                Removes day overrides
              </button>
            </div>

            {ruleType !== 'clear' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-300 font-medium">
                  {ruleType === 'percent_off' && 'Discount Percentage (%):'}
                  {ruleType === 'flat_off' && 'Amount to Subtract (₹):'}
                  {ruleType === 'fixed_price' && 'New Fixed Offer Price (₹):'}
                </span>
                <input
                  type="number"
                  min="0"
                  value={ruleValue}
                  onChange={(e) => setRuleValue(e.target.value)}
                  className="w-28 px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-blue-500 text-right font-bold"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${tw.border} bg-slate-900/50 flex items-center justify-end gap-3`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm rounded-xl ${tw.hoverBg} text-gray-300 hover:text-white transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Apply to {selectedCount} Products
          </button>
        </div>
      </div>
    </div>
  );
};

const DayWisePricingManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Filters & Views
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'configured', 'unconfigured'
  const [viewMode, setViewMode] = useState('dayFocus'); // 'dayFocus' or 'weeklyMatrix'
  const [selectedDay, setSelectedDay] = useState('sunday'); // For dayFocus mode

  // Selection & Bulk
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Single product schedule modal
  const [modalProduct, setModalProduct] = useState(null);
  const [modalVariantIndex, setModalVariantIndex] = useState(0);

  // Local pending changes: { [productId]: { weights: [...] } }
  const [pendingChanges, setPendingChanges] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
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
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Helper to get active product state (original + pending changes)
  const getActiveProduct = (product) => {
    const pending = pendingChanges[product._id];
    if (pending && pending.weights) {
      return {
        ...product,
        weights: pending.weights
      };
    }
    return product;
  };

  // Inline Day Price Change (for dayFocus mode or weeklyMatrix mode)
  const handleInlineDayPriceChange = (product, variantIndex, dayKey, field, value) => {
    const activeProduct = getActiveProduct(product);
    const updatedWeights = (activeProduct.weights || []).map((w, idx) => {
      if (idx !== variantIndex) return w;

      const currentDailyPrices = { ...(w.dailyPrices || {}) };
      const currentDayEntry = { ...(currentDailyPrices[dayKey] || {}) };

      if (value === '' || value === null || value === undefined) {
        delete currentDayEntry[field];
        if (Object.keys(currentDayEntry).length === 0) {
          delete currentDailyPrices[dayKey];
        } else {
          currentDailyPrices[dayKey] = currentDayEntry;
        }
      } else {
        currentDayEntry[field] = Number(value);
        currentDailyPrices[dayKey] = currentDayEntry;
      }

      return {
        ...w,
        dailyPrices: currentDailyPrices
      };
    });

    setPendingChanges(prev => ({
      ...prev,
      [product._id]: {
        ...prev[product._id],
        weights: updatedWeights
      }
    }));
  };

  // Save Schedule for a product from the Weekly Modal
  const handleSaveScheduleFromModal = (newDailyPrices) => {
    if (!modalProduct) return;
    const activeProduct = getActiveProduct(modalProduct);

    const updatedWeights = (activeProduct.weights || []).map((w, idx) => {
      if (idx !== modalVariantIndex) return w;
      return {
        ...w,
        dailyPrices: newDailyPrices
      };
    });

    setPendingChanges(prev => ({
      ...prev,
      [modalProduct._id]: {
        ...prev[modalProduct._id],
        weights: updatedWeights
      }
    }));

    toast.success(`Updated schedule for ${modalProduct.name}`);
  };

  // Bulk Apply Day Rates across selected products
  const handleApplyBulk = ({ days, ruleType, ruleValue }) => {
    const selectedList = products.filter(p => selectedProductIds.has(p._id));
    const newChanges = { ...pendingChanges };

    selectedList.forEach(product => {
      const activeProduct = getActiveProduct(product);
      const updatedWeights = (activeProduct.weights || []).map(variant => {
        const baseOffer = Number(variant.offerPrice) || Number(variant.price) || 0;
        const basePrice = Number(variant.price) || baseOffer;
        const currentDailyPrices = { ...(variant.dailyPrices || {}) };

        days.forEach(dayKey => {
          if (ruleType === 'clear') {
            delete currentDailyPrices[dayKey];
          } else {
            let targetOffer = baseOffer;
            if (ruleType === 'percent_off') {
              targetOffer = Math.round(baseOffer * ((100 - ruleValue) / 100));
            } else if (ruleType === 'flat_off') {
              targetOffer = Math.max(0, baseOffer - ruleValue);
            } else if (ruleType === 'fixed_price') {
              targetOffer = ruleValue;
            }

            currentDailyPrices[dayKey] = {
              offerPrice: targetOffer,
              price: basePrice
            };
          }
        });

        return {
          ...variant,
          dailyPrices: currentDailyPrices
        };
      });

      newChanges[product._id] = {
        ...newChanges[product._id],
        weights: updatedWeights
      };
    });

    setPendingChanges(newChanges);
    setSelectedProductIds(new Set());
    toast.success(`Applied day pricing rules to ${selectedList.length} products!`);
  };

  // Save all pending changes to backend
  const handleSaveAll = async () => {
    const productIdsToSave = Object.keys(pendingChanges);
    if (productIdsToSave.length === 0) return;

    setSaving(true);
    const token = localStorage.getItem('adminToken');
    let successCount = 0;
    let failCount = 0;

    try {
      for (const productId of productIdsToSave) {
        const changes = pendingChanges[productId];
        if (!changes || !changes.weights) continue;

        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/products/${productId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ weights: changes.weights })
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
          console.error(`Failed to update product ${productId}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully saved day pricing for ${successCount} products!`);
        setPendingChanges({});
        await fetchProducts();
      }

      if (failCount > 0) {
        toast.error(`Failed to update ${failCount} products.`);
      }
    } catch (err) {
      console.error('Error saving day rates:', err);
      toast.error('An error occurred while saving day rates.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Discard all unsaved day pricing changes?')) {
      setPendingChanges({});
      toast.success('Changes discarded');
    }
  };

  // Selection toggle
  const toggleSelectProduct = (productId) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleSelectAllFiltered = (filtered) => {
    if (selectedProductIds.size === filtered.length && filtered.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filtered.map(p => p._id)));
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const activeProduct = getActiveProduct(product);

      // Search match
      const matchesSearch = !searchQuery || 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category match
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      // Status match
      const isConfigured = hasDayWisePricing(activeProduct);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'configured' && isConfigured) ||
        (statusFilter === 'unconfigured' && !isConfigured);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, pendingChanges, searchQuery, selectedCategory, statusFilter]);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  // Identify fish-related category if exists for quick filter pill
  const fishCategory = categories.find(c => /fish|seafood|marine/i.test(c.name))?.name;

  return (
    <AdminLayoutDark>
      <div className="space-y-6 pb-20">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>Day-Wise Dynamic Pricing</h1>
                <p className={`text-xs ${tw.textSecondary} mt-0.5`}>
                  Configure automated day-specific pricing (e.g. Fish rates on Sunday, Wednesday, and Friday)
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            {hasPendingChanges && (
              <AdminButtonDark
                variant="secondary"
                onClick={handleDiscard}
                disabled={saving}
                className="text-xs"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Discard ({Object.keys(pendingChanges).length})
              </AdminButtonDark>
            )}

            <AdminButtonDark
              variant="primary"
              onClick={handleSaveAll}
              disabled={!hasPendingChanges || saving}
              className={`text-xs flex items-center gap-1.5 ${
                hasPendingChanges ? 'animate-pulse' : ''
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes {hasPendingChanges ? `(${Object.keys(pendingChanges).length})` : ''}
                </>
              )}
            </AdminButtonDark>

            <button
              onClick={fetchProducts}
              disabled={loading}
              className={`p-2 rounded-xl border ${tw.border} ${tw.hoverBg} text-gray-400 hover:text-white transition-colors`}
              title="Refresh Products"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className={`${tw.cardBg} border ${tw.border} rounded-2xl p-4 space-y-3.5 shadow-sm`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-gray-300 focus:outline-hidden focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-gray-300 focus:outline-hidden focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="configured">📅 Has Day Pricing</option>
                <option value="unconfigured">Standard Base Price Only</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('dayFocus')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'dayFocus'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Day View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('weeklyMatrix')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'weeklyMatrix'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Weekly Matrix
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Filter Bar: Quick Category Pills & Day Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/60">
            {/* Quick Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mr-1">
                Quick Category:
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-slate-900/60 text-gray-400 border border-slate-800 hover:text-white'
                }`}
              >
                All
              </button>
              {fishCategory && (
                <button
                  onClick={() => setSelectedCategory(fishCategory)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                    selectedCategory === fishCategory
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-emerald-950/20 text-emerald-400/80 border border-emerald-900/40 hover:text-emerald-300'
                  }`}
                >
                  🐟 {fishCategory}
                </button>
              )}
            </div>

            {/* If in dayFocus mode: show Day of Week pills */}
            {viewMode === 'dayFocus' && (
              <div className="flex items-center gap-1 overflow-x-auto">
                <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mr-1 shrink-0">
                  Select Day:
                </span>
                {DAYS_OF_WEEK.map(({ key, short }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      selectedDay === key
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                        : 'bg-slate-900 text-gray-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {short}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Items Floating Action Bar */}
        {selectedProductIds.size > 0 && (
          <div className="bg-blue-950/80 border border-blue-800 text-blue-200 px-5 py-3 rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-md sticky top-4 z-20 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                {selectedProductIds.size}
              </div>
              <div>
                <span className="font-bold text-sm text-white block">
                  {selectedProductIds.size} product{selectedProductIds.size > 1 ? 's' : ''} selected
                </span>
                <span className="text-[11px] text-blue-300">
                  Ready for batch day rate updates
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedProductIds(new Set())}
                className="px-3 py-1.5 text-xs text-gray-300 hover:text-white"
              >
                Clear Selection
              </button>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Bulk Apply Day Rates
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className={`${tw.cardBg} border ${tw.border} rounded-2xl overflow-hidden shadow-sm`}>
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className={`text-sm ${tw.textSecondary}`}>Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <Package className="w-10 h-10 text-gray-600 mb-3" />
              <p className={`text-base font-semibold ${tw.textPrimary}`}>No products found</p>
              <p className={`text-xs ${tw.textSecondary} mt-1 max-w-sm`}>
                Try adjusting your search query, category filter, or status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${tw.border} bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-gray-400`}>
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={() => toggleSelectAllFiltered(filteredProducts)}
                        className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-4 min-w-[220px]">Product & Variant</th>
                    <th className="p-4 min-w-[130px]">Base Prices</th>

                    {/* View Mode Columns */}
                    {viewMode === 'dayFocus' ? (
                      <>
                        <th className="p-4 min-w-[160px] bg-blue-950/30 text-blue-300">
                          <span className="capitalize">{selectedDay}</span> Offer Price (₹)
                        </th>
                        <th className="p-4 min-w-[150px] bg-blue-950/30 text-blue-300">
                          <span className="capitalize">{selectedDay}</span> MRP (₹)
                        </th>
                        <th className="p-4 min-w-[120px]">Price Delta</th>
                      </>
                    ) : (
                      DAYS_OF_WEEK.map(({ key, short }) => (
                        <th key={key} className="p-3 text-center min-w-[100px] border-l border-slate-800/80">
                          {short} (₹)
                        </th>
                      ))
                    )}

                    <th className="p-4 w-28 text-right">Schedule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredProducts.map(product => {
                    const activeProduct = getActiveProduct(product);
                    const isSelected = selectedProductIds.has(product._id);
                    const isDirty = Boolean(pendingChanges[product._id]);
                    const hasPricingConfigured = hasDayWisePricing(activeProduct);

                    return (activeProduct.weights || [{}]).map((variant, variantIndex) => {
                      const baseOffer = Number(variant.offerPrice) || Number(variant.price) || 0;
                      const basePrice = Number(variant.price) || baseOffer;

                      // Day data for dayFocus mode
                      const dayEntry = variant.dailyPrices?.[selectedDay];
                      const dayOffer = dayEntry?.offerPrice !== undefined && dayEntry?.offerPrice !== null
                        ? dayEntry.offerPrice
                        : '';
                      const dayMRP = dayEntry?.price !== undefined && dayEntry?.price !== null
                        ? dayEntry.price
                        : '';
                      const hasDayOverride = dayOffer !== '';
                      const delta = hasDayOverride ? Number(dayOffer) - baseOffer : 0;

                      return (
                        <tr
                          key={`${product._id}_${variantIndex}`}
                          className={`transition-colors ${
                            isSelected 
                              ? 'bg-blue-950/20' 
                              : isDirty 
                              ? 'bg-amber-950/10' 
                              : 'hover:bg-slate-900/40'
                          }`}
                        >
                          {/* Checkbox (only show for primary variant row) */}
                          <td className="p-4 text-center">
                            {variantIndex === 0 && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectProduct(product._id)}
                                className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            )}
                          </td>

                          {/* Product Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {variantIndex === 0 && (
                                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center p-1">
                                  {product.images?.[0] ? (
                                    <img src={product.images[0]} alt="" className="w-full h-full object-contain" />
                                  ) : (
                                    <Package className="w-4 h-4 text-gray-500" />
                                  )}
                                </div>
                              )}
                              <div className={variantIndex > 0 ? 'pl-13' : ''}>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-200">{product.name}</p>
                                  {isDirty && (
                                    <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-[11px] mt-0.5">
                                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-gray-300 font-semibold">
                                    {variant.weight} {variant.unit}
                                  </span>
                                  <span>&bull;</span>
                                  <span>{product.category}</span>
                                  {hasPricingConfigured && (
                                    <span className="text-blue-400 font-medium">📅 Day Active</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Base Prices */}
                          <td className="p-4 text-gray-300">
                            <div>
                              <span className="text-emerald-400 font-bold">₹{baseOffer}</span>
                              <span className="text-gray-500 line-through ml-1.5">₹{basePrice}</span>
                            </div>
                            <span className="text-[10px] text-gray-500">Default base rate</span>
                          </td>

                          {/* Day Focus View Columns */}
                          {viewMode === 'dayFocus' ? (
                            <>
                              <td className="p-4 bg-blue-950/10">
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                                  <input
                                    type="number"
                                    placeholder={String(baseOffer)}
                                    value={dayOffer}
                                    onChange={(e) => handleInlineDayPriceChange(product, variantIndex, selectedDay, 'offerPrice', e.target.value)}
                                    className={`w-full pl-7 pr-3 py-1.5 text-xs bg-slate-900 border rounded-lg text-white font-semibold focus:outline-hidden focus:border-blue-500 ${
                                      hasDayOverride ? 'border-blue-500/80 bg-blue-950/30' : 'border-slate-800 text-gray-300'
                                    }`}
                                  />
                                </div>
                              </td>

                              <td className="p-4 bg-blue-950/10">
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                                  <input
                                    type="number"
                                    placeholder={String(basePrice)}
                                    value={dayMRP}
                                    onChange={(e) => handleInlineDayPriceChange(product, variantIndex, selectedDay, 'price', e.target.value)}
                                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-gray-300 focus:outline-hidden focus:border-blue-500"
                                  />
                                </div>
                              </td>

                              <td className="p-4">
                                {hasDayOverride ? (
                                  delta < 0 ? (
                                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                                      <ArrowDownRight className="w-3.5 h-3.5" /> -₹{Math.abs(delta)}
                                    </span>
                                  ) : delta > 0 ? (
                                    <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                                      <ArrowUpRight className="w-3.5 h-3.5" /> +₹{delta}
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 text-[11px]">Matches base</span>
                                  )
                                ) : (
                                  <span className="text-gray-500 text-[11px]">— Default</span>
                                )}
                              </td>
                            </>
                          ) : (
                            /* Weekly Matrix Columns */
                            DAYS_OF_WEEK.map(({ key }) => {
                              const entry = variant.dailyPrices?.[key];
                              const dayVal = entry?.offerPrice !== undefined && entry?.offerPrice !== null
                                ? entry.offerPrice
                                : '';
                              const hasDayVal = dayVal !== '';

                              return (
                                <td key={key} className="p-2 text-center border-l border-slate-800/80">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      placeholder={String(baseOffer)}
                                      value={dayVal}
                                      onChange={(e) => handleInlineDayPriceChange(product, variantIndex, key, 'offerPrice', e.target.value)}
                                      className={`w-20 px-2 py-1 text-center text-xs bg-slate-900 border rounded-md text-white font-semibold focus:outline-hidden focus:border-blue-500 ${
                                        hasDayVal ? 'border-blue-500/80 bg-blue-950/30' : 'border-slate-800 text-gray-400'
                                      }`}
                                    />
                                  </div>
                                </td>
                              );
                            })
                          )}

                          {/* Action / Edit Full Schedule */}
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setModalProduct(activeProduct);
                                setModalVariantIndex(variantIndex);
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                              title="Edit all 7 days for this item"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              7 Days
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Single Product Weekly Schedule Modal */}
      {modalProduct && (
        <WeeklyScheduleModal
          isOpen={Boolean(modalProduct)}
          onClose={() => setModalProduct(null)}
          product={modalProduct}
          variantIndex={modalVariantIndex}
          onSaveSchedule={handleSaveScheduleFromModal}
        />
      )}

      {/* Bulk Apply Modal */}
      {isBulkModalOpen && (
        <BulkDayPricingModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          selectedCount={selectedProductIds.size}
          onApplyBulk={handleApplyBulk}
        />
      )}
    </AdminLayoutDark>
  );
};

export default DayWisePricingManager;
