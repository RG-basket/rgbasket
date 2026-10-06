import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPlay, FiPause, FiPlus, FiTrash2, FiEdit2, FiRotateCcw, FiZap,
    FiClock, FiRepeat, FiShuffle, FiList, FiCheckCircle, FiAlertCircle,
    FiImage, FiExternalLink, FiUploadCloud, FiMoon,
    FiLayers, FiChevronDown, FiChevronUp, FiSmartphone,
    FiTrendingUp, FiActivity, FiX, FiCalendar
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';

// Helper to format remaining seconds into "14m 32s" or "2h 15m"
const formatCountdown = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '--';
    if (seconds <= 0) return 'Due now (dispatching...)';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

// Quick interval options
const INTERVAL_OPTIONS = [
    { label: '15 Minutes', value: 15 },
    { label: '30 Minutes', value: 30 },
    { label: '1 Hour', value: 60 },
    { label: '2 Hours', value: 120 },
    { label: '3 Hours', value: 180 },
    { label: '4 Hours', value: 240 },
    { label: '6 Hours', value: 360 },
    { label: '12 Hours', value: 720 },
    { label: '24 Hours (Daily)', value: 1440 },
];

const PRESET_ROUTES = [
    { label: 'Home Page', value: '/' },
    { label: 'All Products', value: '/products' },
    { label: 'Vegetables & Fruits', value: '/category/fruits-vegetables' },
    { label: 'Dairy & Breakfast', value: '/category/dairy-breakfast' },
    { label: 'Snacks & Beverages', value: '/category/snacks-beverages' },
    { label: 'Shopping Cart', value: '/cart' },
    { label: 'My Orders', value: '/orders' },
];

const AdminNotificationBatchesDark = () => {
    const { API_URL } = useAppContext();
    const [batches, setBatches] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCountdown, setActiveCountdown] = useState({});

    // Modals state
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [logsModalOpen, setLogsModalOpen] = useState(false);
    const [activeLogsBatch, setActiveLogsBatch] = useState(null);

    // Start / Schedule Modal state
    const [startModalOpen, setStartModalOpen] = useState(false);
    const [selectedBatchForStart, setSelectedBatchForStart] = useState(null);
    const [startModeChoice, setStartModeChoice] = useState('immediate'); // 'immediate' | 'interval' | 'scheduled'
    const [scheduledDateInput, setScheduledDateInput] = useState('');
    const [startingBatch, setStartingBatch] = useState(false);

    // Editor Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formInterval, setFormInterval] = useState(60);
    const [formCustomInterval, setFormCustomInterval] = useState('');
    const [formOrderMode, setFormOrderMode] = useState('sequential');
    const [formRepeatMode, setFormRepeatMode] = useState(true);
    const [formQuietHours, setFormQuietHours] = useState({ enabled: true, startHour: 22, endHour: 7 });
    const [formStartMode, setFormStartMode] = useState('immediate');
    const [formScheduledDate, setFormScheduledDate] = useState('');
    const [formItems, setFormItems] = useState([]);
    const [previewItemIndex, setPreviewItemIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState(null);

    // Fetch batches & templates
    const fetchBatches = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_URL}/api/admin/notifications/batches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setBatches(res.data.batches);
                // Initialize countdown map
                const countdowns = {};
                res.data.batches.forEach(b => {
                    if (b.isActive && b.secondsUntilNextRun !== null) {
                        countdowns[b._id] = b.secondsUntilNextRun;
                    }
                });
                setActiveCountdown(countdowns);
            }
        } catch (err) {
            console.error('Failed to load batches:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_URL}/api/admin/notifications/batches/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setTemplates(res.data.templates);
            }
        } catch (err) {
            console.error('Failed to load templates:', err);
        }
    };

    useEffect(() => {
        fetchBatches();
        fetchTemplates();
    }, []);

    // 1-second interval timer for live countdowns
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveCountdown(prev => {
                const next = { ...prev };
                let needsRefresh = false;
                Object.keys(next).forEach(id => {
                    if (next[id] > 0) {
                        next[id] -= 1;
                    } else if (next[id] === 0) {
                        needsRefresh = true;
                    }
                });
                if (needsRefresh) {
                    fetchBatches();
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Open Start / Schedule Modal for a batch
    const handleOpenStartModal = (batch) => {
        setSelectedBatchForStart(batch);
        setStartModeChoice(batch.startMode || 'immediate');

        // Prepopulate scheduled time to next hour
        const d = new Date(Date.now() + 60 * 60 * 1000);
        const pad = n => String(n).padStart(2, '0');
        const defaultDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

        setScheduledDateInput(
            batch.scheduledStartTime
                ? new Date(batch.scheduledStartTime).toISOString().slice(0, 16)
                : defaultDateStr
        );
        setStartModalOpen(true);
    };

    // Quick Date setter helper for modal
    const setQuickDate = (minutesToAdd, targetHour = null) => {
        const d = new Date();
        if (targetHour !== null) {
            d.setDate(d.getDate() + 1);
            d.setHours(targetHour, 0, 0, 0);
        } else {
            d.setMinutes(d.getMinutes() + minutesToAdd);
        }
        const pad = n => String(n).padStart(2, '0');
        setScheduledDateInput(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    };

    // Confirm Start or Schedule action
    const handleConfirmStart = async () => {
        if (!selectedBatchForStart) return;

        if (startModeChoice === 'scheduled') {
            if (!scheduledDateInput) {
                toast.error('Please choose a scheduled start date and time');
                return;
            }
            const targetTime = new Date(scheduledDateInput);
            if (targetTime <= new Date()) {
                toast.error('Scheduled start time must be in the future');
                return;
            }
        }

        setStartingBatch(true);
        const toastId = toast.loading(
            startModeChoice === 'immediate'
                ? 'Launching campaign & dispatching notification #1 now...'
                : (startModeChoice === 'scheduled' ? 'Scheduling campaign...' : 'Activating campaign...')
        );

        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.patch(
                `${API_URL}/api/admin/notifications/batches/${selectedBatchForStart._id}/toggle`,
                {
                    startMode: startModeChoice,
                    scheduledStartTime: startModeChoice === 'scheduled' ? new Date(scheduledDateInput).toISOString() : null
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.dismiss(toastId);
            if (res.data.success) {
                toast.success(res.data.message);
                setStartModalOpen(false);
                fetchBatches();
            }
        } catch (err) {
            toast.dismiss(toastId);
            toast.error(err.response?.data?.message || 'Failed to start campaign');
        } finally {
            setStartingBatch(false);
        }
    };

    // Pause Active Batch
    const handlePause = async (batchId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.patch(
                `${API_URL}/api/admin/notifications/batches/${batchId}/toggle`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                toast.success(res.data.message || 'Campaign paused');
                fetchBatches();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to pause campaign');
        }
    };

    // Immediate manual trigger for test
    const handleFireNow = async (batchId, batchName) => {
        const confirmFire = window.confirm(`⚡ Immediately dispatch next notification from "${batchName}" to all users right now?`);
        if (!confirmFire) return;

        const toastId = toast.loading('Dispatching next notification in batch...');
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(
                `${API_URL}/api/admin/notifications/batches/${batchId}/fire-now`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.dismiss(toastId);
            if (res.data.success) {
                toast.success(res.data.message || 'Notification dispatched successfully!');
                fetchBatches();
            }
        } catch (err) {
            toast.dismiss(toastId);
            toast.error(err.response?.data?.message || 'Failed to dispatch notification');
        }
    };

    // Reset sequence & counters
    const handleReset = async (batchId, batchName) => {
        const confirmReset = window.confirm(`Reset sequence & sent counts for "${batchName}" back to #1?`);
        if (!confirmReset) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(
                `${API_URL}/api/admin/notifications/batches/${batchId}/reset`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                toast.success('Batch sequence reset to start!');
                fetchBatches();
            }
        } catch (err) {
            toast.error('Failed to reset batch');
        }
    };

    // Delete batch
    const handleDelete = async (batchId, batchName) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete campaign "${batchName}"?`);
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.delete(
                `${API_URL}/api/admin/notifications/batches/${batchId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                toast.success('Batch campaign deleted');
                fetchBatches();
            }
        } catch (err) {
            toast.error('Failed to delete batch');
        }
    };

    // Create from Template
    const handleCreateFromTemplate = async (templateKey) => {
        const toastId = toast.loading('Creating campaign from template...');
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(
                `${API_URL}/api/admin/notifications/batches/create-from-template`,
                { templateKey },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.dismiss(toastId);
            if (res.data.success) {
                toast.success('Batch campaign created from template!');
                setTemplateModalOpen(false);
                fetchBatches();
            }
        } catch (err) {
            toast.dismiss(toastId);
            toast.error('Failed to create from template');
        }
    };

    // Open Editor for New Batch
    const handleOpenCreate = () => {
        setEditingBatch(null);
        setFormName('');
        setFormDescription('');
        setFormInterval(60);
        setFormCustomInterval('');
        setFormOrderMode('sequential');
        setFormRepeatMode(true);
        setFormQuietHours({ enabled: true, startHour: 22, endHour: 7 });
        setFormStartMode('immediate');
        setFormScheduledDate('');
        setFormItems([
            {
                id: 'item-1',
                title: 'Fresh Morning Essentials! 🌅🥛',
                body: 'Fresh milk, bread and eggs delivered in 15 mins to your doorstep.',
                imageUrl: '',
                targetPath: '/category/dairy-breakfast',
                tag: 'Morning'
            },
            {
                id: 'item-2',
                title: 'Crisp Farm Vegetables Just Arrived! 🥦🍅',
                body: 'Direct from local farms: crunchy cucumbers, farm-fresh spinach & juicy tomatoes.',
                imageUrl: '',
                targetPath: '/category/fruits-vegetables',
                tag: 'Fresh Farm'
            }
        ]);
        setPreviewItemIndex(0);
        setEditorOpen(true);
    };

    // Open Editor for Editing Batch
    const handleOpenEdit = (batch) => {
        setEditingBatch(batch);
        setFormName(batch.name || '');
        setFormDescription(batch.description || '');
        setFormInterval(batch.intervalMinutes || 60);
        setFormCustomInterval('');
        setFormOrderMode(batch.orderMode || 'sequential');
        setFormRepeatMode(batch.repeatMode !== undefined ? batch.repeatMode : true);
        setFormQuietHours(batch.quietHours || { enabled: true, startHour: 22, endHour: 7 });
        setFormStartMode(batch.startMode || 'immediate');
        setFormScheduledDate(
            batch.scheduledStartTime ? new Date(batch.scheduledStartTime).toISOString().slice(0, 16) : ''
        );
        setFormItems((batch.items || []).map(i => ({ ...i })));
        setPreviewItemIndex(0);
        setEditorOpen(true);
    };

    // Add empty notification item to editor
    const handleAddItem = () => {
        const newItem = {
            id: `item-${Date.now()}`,
            title: '',
            body: '',
            imageUrl: '',
            targetPath: '/',
            tag: 'General'
        };
        setFormItems(prev => [...prev, newItem]);
        setPreviewItemIndex(formItems.length);
    };

    // Quick add 5 empty slots
    const handleAddMultipleSlots = (count = 5) => {
        const newSlots = Array.from({ length: count }, (_, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            title: '',
            body: '',
            imageUrl: '',
            targetPath: '/',
            tag: 'General'
        }));
        setFormItems(prev => [...prev, ...newSlots]);
        toast.success(`Added ${count} notification slots to queue`);
    };

    // Update item field
    const handleItemChange = (index, field, value) => {
        setFormItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    // Remove item
    const handleRemoveItem = (index) => {
        if (formItems.length <= 1) {
            toast.error('Campaign must have at least 1 notification item');
            return;
        }
        setFormItems(prev => prev.filter((_, idx) => idx !== index));
        if (previewItemIndex >= formItems.length - 1) {
            setPreviewItemIndex(Math.max(0, formItems.length - 2));
        }
    };

    // Move item up / down in sequence
    const handleMoveItem = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= formItems.length) return;
        setFormItems(prev => {
            const copy = [...prev];
            const temp = copy[index];
            copy[index] = copy[targetIndex];
            copy[targetIndex] = temp;
            return copy;
        });
        setPreviewItemIndex(targetIndex);
    };

    // Handle Image Upload for an item
    const handleItemImageUpload = async (index, file) => {
        if (!file || !file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }
        const formData = new FormData();
        formData.append('image', file);
        setUploadingIndex(index);
        const toastId = toast.loading('Uploading banner...');
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(
                `${API_URL}/api/admin/notifications/upload-image`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } }
            );
            toast.dismiss(toastId);
            if (res.data.success) {
                handleItemChange(index, 'imageUrl', res.data.imageUrl);
                toast.success('Banner uploaded!');
            }
        } catch (err) {
            toast.dismiss(toastId);
            toast.error('Failed to upload image');
        } finally {
            setUploadingIndex(null);
        }
    };

    // Save Batch
    const handleSaveBatch = async (e) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error('Please enter a campaign name');
            return;
        }

        const validItems = formItems.filter(i => i.title.trim() && i.body.trim());
        if (validItems.length === 0) {
            toast.error('Please add at least 1 notification with a Title and Message');
            return;
        }

        const effectiveInterval = formCustomInterval ? parseInt(formCustomInterval) : formInterval;
        if (!effectiveInterval || effectiveInterval < 1) {
            toast.error('Interval must be at least 1 minute');
            return;
        }

        setSaving(true);
        const payload = {
            name: formName.trim(),
            description: formDescription.trim(),
            intervalMinutes: effectiveInterval,
            orderMode: formOrderMode,
            repeatMode: formRepeatMode,
            quietHours: formQuietHours,
            startMode: formStartMode,
            scheduledStartTime: formStartMode === 'scheduled' && formScheduledDate ? new Date(formScheduledDate).toISOString() : null,
            items: validItems
        };

        try {
            const token = localStorage.getItem('adminToken');
            if (editingBatch) {
                const res = await axios.put(
                    `${API_URL}/api/admin/notifications/batches/${editingBatch._id}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data.success) {
                    toast.success('Batch campaign updated!');
                    setEditorOpen(false);
                    fetchBatches();
                }
            } else {
                const res = await axios.post(
                    `${API_URL}/api/admin/notifications/batches`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data.success) {
                    toast.success('Batch campaign created!');
                    setEditorOpen(false);
                    fetchBatches();
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save batch');
        } finally {
            setSaving(false);
        }
    };

    // Active item being previewed
    const activePreviewItem = formItems[previewItemIndex] || formItems[0] || {
        title: 'Your Notification Title',
        body: 'Your notification message description will appear here.',
        imageUrl: '',
        targetPath: '/'
    };

    return (
        <div className="space-y-6">
            {/* Header with Title & Action Buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 bg-[#24283b] border border-[#292e42] rounded-2xl shadow-xl">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 bg-[#7aa2f7]/15 text-[#7aa2f7] rounded-xl border border-[#7aa2f7]/30">
                            <FiClock className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl md:text-2xl font-black text-[#c0caf5] tracking-tight">
                            Auto-Pilot Batch Scheduler
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Automated Push
                        </span>
                    </div>
                    <p className="text-xs md:text-sm text-[#7982a9] mt-1.5 max-w-2xl leading-relaxed">
                        Schedule batches of 10–20+ notifications to automatically fire. Choose to <strong>Start Immediately (fires #1 now)</strong>, run on timer intervals, or <strong>schedule for a specific start date & time</strong>.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={() => setTemplateModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-[#1f2335] hover:bg-[#292e42] border border-[#414868] text-[#c0caf5] text-xs sm:text-sm font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md"
                    >
                        <FiLayers className="w-4 h-4 text-[#bb9af7]" />
                        <span>1-Click Templates</span>
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7aa2f7] to-[#bb9af7] hover:from-[#89b4fa] hover:to-[#c6a0f6] text-[#1a1b26] text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        <FiPlus className="w-4 h-4" />
                        <span>Create New Batch</span>
                    </button>
                </div>
            </div>

            {/* Campaign Summary Counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="p-4 bg-[#24283b] border border-[#292e42] rounded-2xl">
                    <div className="flex items-center justify-between text-[#7982a9] text-xs font-semibold">
                        <span>Total Batches</span>
                        <FiList className="w-4 h-4 text-[#7aa2f7]" />
                    </div>
                    <div className="text-2xl font-black text-[#c0caf5] mt-1.5">{batches.length}</div>
                    <div className="text-[11px] text-[#565f89] mt-0.5">Campaign queues created</div>
                </div>

                <div className="p-4 bg-[#24283b] border border-[#292e42] rounded-2xl">
                    <div className="flex items-center justify-between text-[#7982a9] text-xs font-semibold">
                        <span>Active Schedulers</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-1.5">
                        {batches.filter(b => b.isActive).length}
                    </div>
                    <div className="text-[11px] text-[#565f89] mt-0.5">
                        {batches.filter(b => b.status === 'scheduled').length > 0
                            ? `${batches.filter(b => b.status === 'scheduled').length} Scheduled / ${batches.filter(b => b.status === 'running').length} Running`
                            : 'Firing automatically'}
                    </div>
                </div>

                <div className="p-4 bg-[#24283b] border border-[#292e42] rounded-2xl">
                    <div className="flex items-center justify-between text-[#7982a9] text-xs font-semibold">
                        <span>Total Dispatched</span>
                        <FiTrendingUp className="w-4 h-4 text-[#bb9af7]" />
                    </div>
                    <div className="text-2xl font-black text-[#c0caf5] mt-1.5">
                        {batches.reduce((acc, b) => acc + (b.stats?.totalDispatched || 0), 0)}
                    </div>
                    <div className="text-[11px] text-[#565f89] mt-0.5">Automated push alerts sent</div>
                </div>

                <div className="p-4 bg-[#24283b] border border-[#292e42] rounded-2xl">
                    <div className="flex items-center justify-between text-[#7982a9] text-xs font-semibold">
                        <span>Sleep Protection</span>
                        <FiMoon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-sm font-black text-[#c0caf5] mt-2">10 PM – 7 AM IST</div>
                    <div className="text-[11px] text-amber-400/80 mt-0.5">Quiet hours enabled</div>
                </div>
            </div>

            {/* Batch Campaigns List */}
            {loading ? (
                <div className="p-12 text-center bg-[#24283b] border border-[#292e42] rounded-2xl">
                    <div className="w-8 h-8 border-3 border-[#7aa2f7] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-[#7982a9] font-medium">Loading automated batch campaigns...</p>
                </div>
            ) : batches.length === 0 ? (
                <div className="p-10 md:p-14 text-center bg-[#24283b] border border-[#292e42] rounded-2xl">
                    <div className="w-16 h-16 bg-[#1f2335] text-[#7aa2f7] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#414868]">
                        <FiClock className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-[#c0caf5]">No Automated Batches Yet</h3>
                    <p className="text-xs sm:text-sm text-[#7982a9] max-w-md mx-auto mt-1.5 mb-6">
                        Set up a queue of 10 to 20 notifications, choose a timer interval, and start immediately or schedule for a specific date/time.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => setTemplateModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-[#1f2335] hover:bg-[#292e42] border border-[#414868] text-[#c0caf5] text-xs font-bold transition-all"
                        >
                            Load Ready-Made Presets
                        </button>
                        <button
                            onClick={handleOpenCreate}
                            className="px-4 py-2 rounded-xl bg-[#7aa2f7] text-[#1a1b26] font-extrabold text-xs transition-all hover:bg-[#89b4fa]"
                        >
                            + Build From Scratch
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {batches.map((batch) => {
                        const countdown = activeCountdown[batch._id];
                        const totalItems = batch.items?.length || 0;
                        const currentIndex = batch.currentIndex || 0;
                        const progressPct = totalItems > 0 ? Math.min(100, Math.round(((currentIndex) / totalItems) * 100)) : 0;

                        return (
                            <div
                                key={batch._id}
                                className={`p-5 md:p-6 bg-[#24283b] border transition-all rounded-2xl shadow-lg ${
                                    batch.isActive
                                        ? (batch.status === 'scheduled' ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-[#7aa2f7]/50 ring-1 ring-[#7aa2f7]/20')
                                        : 'border-[#292e42]'
                                }`}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Left: Info & Badges */}
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <h3 className="text-base md:text-lg font-extrabold text-[#c0caf5]">
                                                {batch.name}
                                            </h3>

                                            {/* Status Badge */}
                                            {batch.isActive ? (
                                                batch.status === 'scheduled' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                                        <FiCalendar className="w-3 h-3 text-blue-400" />
                                                        SCHEDULED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                        RUNNING
                                                    </span>
                                                )
                                            ) : batch.status === 'completed' ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                                    COMPLETED
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30">
                                                    PAUSED
                                                </span>
                                            )}

                                            {/* Configuration Badges */}
                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#1a1b26] text-[#7aa2f7] border border-[#292e42] flex items-center gap-1">
                                                <FiClock className="w-3 h-3" />
                                                Every {batch.intervalMinutes >= 60 ? `${batch.intervalMinutes / 60}h` : `${batch.intervalMinutes}m`}
                                            </span>

                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#1a1b26] text-[#bb9af7] border border-[#292e42] flex items-center gap-1">
                                                {batch.orderMode === 'random' ? <FiShuffle className="w-3 h-3" /> : <FiList className="w-3 h-3" />}
                                                {batch.orderMode === 'random' ? 'Random Shuffle' : 'Sequential Order'}
                                            </span>

                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#1a1b26] text-[#e0af68] border border-[#292e42] flex items-center gap-1">
                                                <FiRepeat className="w-3 h-3" />
                                                {batch.repeatMode ? 'Repeating Loop' : 'Run Once'}
                                            </span>

                                            {batch.quietHours?.enabled && (
                                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#1a1b26] text-[#565f89] border border-[#292e42] flex items-center gap-1">
                                                    <FiMoon className="w-3 h-3 text-amber-400" />
                                                    Quiet Hours
                                                </span>
                                            )}
                                        </div>

                                        {batch.description && (
                                            <p className="text-xs text-[#7982a9] max-w-3xl">
                                                {batch.description}
                                            </p>
                                        )}

                                        {/* Progress Bar & Next Run Timer */}
                                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
                                            {/* Progress */}
                                            <div className="flex-1 max-w-sm">
                                                <div className="flex justify-between text-[11px] text-[#7982a9] font-medium mb-1">
                                                    <span>Queue Progress</span>
                                                    <span className="text-[#c0caf5] font-bold">
                                                        {batch.orderMode === 'sequential' ? `${currentIndex} of ${totalItems} Sent` : `${totalItems} Items Loaded`}
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-[#1a1b26] rounded-full overflow-hidden border border-[#292e42]">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#7aa2f7] to-[#bb9af7] transition-all duration-500 rounded-full"
                                                        style={{ width: `${progressPct}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Countdown & Next Run */}
                                            <div className="flex items-center gap-3">
                                                {batch.isActive ? (
                                                    <div className={`px-3 py-1.5 bg-[#1a1b26] border rounded-xl flex items-center gap-2 ${
                                                        batch.status === 'scheduled' ? 'border-blue-500/40 text-blue-300' : 'border-emerald-500/30 text-emerald-400'
                                                    }`}>
                                                        <span className={`w-2 h-2 rounded-full ${
                                                            batch.status === 'scheduled' ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400 animate-ping'
                                                        }`}></span>
                                                        <span className="text-[11px] text-[#7982a9]">
                                                            {batch.status === 'scheduled' ? 'Starts In:' : 'Next Push:'}
                                                        </span>
                                                        <span className={`text-xs font-mono font-bold ${
                                                            batch.status === 'scheduled' ? 'text-blue-300' : 'text-emerald-400'
                                                        }`}>
                                                            {formatCountdown(countdown)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-1.5 bg-[#1a1b26] border border-[#292e42] rounded-xl text-[11px] text-[#565f89]">
                                                        Timer Paused
                                                    </div>
                                                )}

                                                {batch.status === 'scheduled' && batch.nextRunAt && (
                                                    <div className="text-[11px] text-blue-400/90 font-medium">
                                                        Target: {new Date(batch.nextRunAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ({new Date(batch.nextRunAt).toLocaleDateString()})
                                                    </div>
                                                )}

                                                {batch.status !== 'scheduled' && batch.stats?.lastDispatchedTitle && (
                                                    <div className="hidden md:block text-[11px] text-[#565f89] truncate max-w-xs" title={batch.stats.lastDispatchedTitle}>
                                                        Last: <span className="text-[#7aa2f7] font-medium">"{batch.stats.lastDispatchedTitle}"</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap pt-2 lg:pt-0 border-t lg:border-t-0 border-[#292e42]">
                                        {/* Play / Pause / Start Button */}
                                        {batch.isActive ? (
                                            <button
                                                onClick={() => handlePause(batch._id)}
                                                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30"
                                                title="Pause Scheduler"
                                            >
                                                <FiPause className="w-3.5 h-3.5" />
                                                <span>Pause</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleOpenStartModal(batch)}
                                                className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm"
                                                title="Start immediately or schedule for a specific time"
                                            >
                                                <FiPlay className="w-3.5 h-3.5" />
                                                <span>Start / Schedule</span>
                                            </button>
                                        )}

                                        {/* Fire Next Immediately */}
                                        <button
                                            onClick={() => handleFireNow(batch._id, batch.name)}
                                            className="px-3.5 py-2 rounded-xl bg-[#7aa2f7]/15 hover:bg-[#7aa2f7]/25 text-[#7aa2f7] border border-[#7aa2f7]/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                                            title="Fire the next scheduled notification right now without waiting for timer"
                                        >
                                            <FiZap className="w-3.5 h-3.5 text-[#e0af68]" />
                                            <span>Fire Next Now</span>
                                        </button>

                                        {/* Edit Button */}
                                        <button
                                            onClick={() => handleOpenEdit(batch)}
                                            className="p-2 rounded-xl bg-[#1f2335] hover:bg-[#292e42] text-[#c0caf5] border border-[#414868] transition-all"
                                            title="Edit campaign & manage notification items"
                                        >
                                            <FiEdit2 className="w-4 h-4" />
                                        </button>

                                        {/* Logs Button */}
                                        <button
                                            onClick={() => {
                                                setActiveLogsBatch(batch);
                                                setLogsModalOpen(true);
                                            }}
                                            className="p-2 rounded-xl bg-[#1f2335] hover:bg-[#292e42] text-[#c0caf5] border border-[#414868] transition-all"
                                            title="View delivery audit logs"
                                        >
                                            <FiActivity className="w-4 h-4 text-[#bb9af7]" />
                                        </button>

                                        {/* Reset Sequence */}
                                        <button
                                            onClick={() => handleReset(batch._id, batch.name)}
                                            className="p-2 rounded-xl bg-[#1f2335] hover:bg-[#292e42] text-[#7982a9] hover:text-[#c0caf5] border border-[#414868] transition-all"
                                            title="Reset sequence index back to #1"
                                        >
                                            <FiRotateCcw className="w-4 h-4" />
                                        </button>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(batch._id, batch.name)}
                                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                                            title="Delete batch campaign"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ==================================================== */}
            {/* START IMMEDIATELY OR SCHEDULE MODAL */}
            {/* ==================================================== */}
            <AnimatePresence>
                {startModalOpen && selectedBatchForStart && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-[#1a1b26] border border-[#292e42] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-5 border-b border-[#292e42] bg-[#24283b] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                                        <FiPlay className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-black text-[#c0caf5]">
                                            Launch Batch Campaign
                                        </h3>
                                        <p className="text-xs text-[#7982a9]">
                                            "{selectedBatchForStart.name}" ({selectedBatchForStart.items?.length || 0} notifications)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStartModalOpen(false)}
                                    className="p-2 rounded-xl bg-[#1a1b26] text-[#7982a9] hover:text-white"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Options */}
                            <div className="p-5 sm:p-6 space-y-4">
                                <p className="text-xs text-[#7982a9] font-medium">
                                    Choose how and when this batch should begin delivering notifications:
                                </p>

                                {/* Option 1: Start Immediately (Recommended) */}
                                <div
                                    onClick={() => setStartModeChoice('immediate')}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        startModeChoice === 'immediate'
                                            ? 'bg-[#7aa2f7]/10 border-[#7aa2f7] ring-1 ring-[#7aa2f7]/30'
                                            : 'bg-[#24283b] border-[#292e42] hover:border-[#414868]'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="radio"
                                            name="startChoice"
                                            checked={startModeChoice === 'immediate'}
                                            onChange={() => setStartModeChoice('immediate')}
                                            className="mt-1 accent-[#7aa2f7] cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs sm:text-sm font-black text-[#c0caf5] flex items-center gap-1.5">
                                                    <FiZap className="text-[#e0af68]" />
                                                    Start Immediately (Fire #1 Now)
                                                </h4>
                                                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                    Recommended
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#7982a9] mt-1 leading-relaxed">
                                                Dispatches notification <strong>#1 right now</strong> to all users. Next notification (#2) will automatically be queued for dispatch in <strong>{selectedBatchForStart.intervalMinutes} minutes</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Option 2: Schedule for Specific Start Date & Time */}
                                <div
                                    onClick={() => setStartModeChoice('scheduled')}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        startModeChoice === 'scheduled'
                                            ? 'bg-[#bb9af7]/10 border-[#bb9af7] ring-1 ring-[#bb9af7]/30'
                                            : 'bg-[#24283b] border-[#292e42] hover:border-[#414868]'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="radio"
                                            name="startChoice"
                                            checked={startModeChoice === 'scheduled'}
                                            onChange={() => setStartModeChoice('scheduled')}
                                            className="mt-1 accent-[#bb9af7] cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <h4 className="text-xs sm:text-sm font-black text-[#c0caf5] flex items-center gap-1.5">
                                                <FiCalendar className="text-[#bb9af7]" />
                                                Schedule Specific Start Date & Time
                                            </h4>
                                            <p className="text-xs text-[#7982a9] mt-1 leading-relaxed">
                                                The batch stays queued and begins firing notification #1 at your exact chosen launch time.
                                            </p>

                                            {/* Date Time Picker Inputs */}
                                            {startModeChoice === 'scheduled' && (
                                                <div className="mt-3.5 space-y-2.5 pt-3 border-t border-[#414868]/40" onClick={e => e.stopPropagation()}>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-[#7aa2f7] mb-1">
                                                            Select Start Date & Time (IST)
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            value={scheduledDateInput}
                                                            onChange={e => setScheduledDateInput(e.target.value)}
                                                            className="w-full px-3 py-2 bg-[#1a1b26] border border-[#7aa2f7] rounded-xl text-xs text-[#c0caf5] font-semibold outline-none"
                                                        />
                                                    </div>

                                                    {/* Quick Time Shortcuts */}
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[10px] text-[#565f89] font-bold">Quick:</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuickDate(15)}
                                                            className="px-2 py-0.5 rounded-md bg-[#1a1b26] hover:bg-[#292e42] text-[10px] font-bold text-[#bb9af7] border border-[#414868]"
                                                        >
                                                            +15 Mins
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuickDate(30)}
                                                            className="px-2 py-0.5 rounded-md bg-[#1a1b26] hover:bg-[#292e42] text-[10px] font-bold text-[#bb9af7] border border-[#414868]"
                                                        >
                                                            +30 Mins
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuickDate(60)}
                                                            className="px-2 py-0.5 rounded-md bg-[#1a1b26] hover:bg-[#292e42] text-[10px] font-bold text-[#bb9af7] border border-[#414868]"
                                                        >
                                                            +1 Hour
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuickDate(0, 8)}
                                                            className="px-2 py-0.5 rounded-md bg-[#1a1b26] hover:bg-[#292e42] text-[10px] font-bold text-[#7aa2f7] border border-[#414868]"
                                                        >
                                                            Tomorrow 8:00 AM
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuickDate(0, 17)}
                                                            className="px-2 py-0.5 rounded-md bg-[#1a1b26] hover:bg-[#292e42] text-[10px] font-bold text-[#7aa2f7] border border-[#414868]"
                                                        >
                                                            Tomorrow 5:00 PM
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Option 3: Wait 1 interval before first send */}
                                <div
                                    onClick={() => setStartModeChoice('interval')}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                        startModeChoice === 'interval'
                                            ? 'bg-[#7aa2f7]/10 border-[#7aa2f7] ring-1 ring-[#7aa2f7]/30'
                                            : 'bg-[#24283b] border-[#292e42] hover:border-[#414868]'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="radio"
                                            name="startChoice"
                                            checked={startModeChoice === 'interval'}
                                            onChange={() => setStartModeChoice('interval')}
                                            className="mt-1 accent-[#7aa2f7] cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <h4 className="text-xs sm:text-sm font-black text-[#c0caf5] flex items-center gap-1.5">
                                                <FiClock className="text-[#7aa2f7]" />
                                                Start After 1 Interval ({selectedBatchForStart.intervalMinutes} mins)
                                            </h4>
                                            <p className="text-xs text-[#7982a9] mt-1 leading-relaxed">
                                                Activates the batch in the background. The first notification will fire once <strong>{selectedBatchForStart.intervalMinutes} minutes</strong> have passed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-5 border-t border-[#292e42] bg-[#24283b] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setStartModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-[#1a1b26] hover:bg-[#1f2335] text-[#7982a9] hover:text-white border border-[#292e42] text-xs font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmStart}
                                    disabled={startingBatch}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50 flex items-center gap-2"
                                >
                                    {startingBatch ? (
                                        <span>Processing...</span>
                                    ) : startModeChoice === 'immediate' ? (
                                        <>
                                            <FiZap />
                                            <span>Launch & Fire #1 Now</span>
                                        </>
                                    ) : startModeChoice === 'scheduled' ? (
                                        <>
                                            <FiCalendar />
                                            <span>Confirm Schedule</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiPlay />
                                            <span>Activate Campaign</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ==================================================== */}
            {/* 1-CLICK TEMPLATES MODAL */}
            {/* ==================================================== */}
            <AnimatePresence>
                {templateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-[#1a1b26] border border-[#292e42] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-5 md:p-6 border-b border-[#292e42] flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg md:text-xl font-black text-[#c0caf5] flex items-center gap-2">
                                        <FiLayers className="text-[#bb9af7]" />
                                        Ready-Made High-Conversion Templates
                                    </h3>
                                    <p className="text-xs text-[#7982a9] mt-0.5">
                                        Instant schedules with 10–12 catchily written grocery alerts pre-configured.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setTemplateModalOpen(false)}
                                    className="p-2 rounded-xl bg-[#24283b] text-[#7982a9] hover:text-white"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-5 md:p-6 overflow-y-auto space-y-4 flex-1">
                                {templates.map(tpl => (
                                    <div
                                        key={tpl.key}
                                        className="p-5 bg-[#24283b] border border-[#292e42] hover:border-[#7aa2f7]/50 rounded-2xl transition-all space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h4 className="font-extrabold text-[#c0caf5] text-base">{tpl.name}</h4>
                                                <p className="text-xs text-[#7982a9] mt-0.5">{tpl.description}</p>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#7aa2f7]/15 text-[#7aa2f7] border border-[#7aa2f7]/30 shrink-0">
                                                {tpl.items?.length} Notifications
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-[#565f89]">
                                            <span>⏱️ Every {tpl.intervalMinutes / 60}h</span>
                                            <span>•</span>
                                            <span>🔢 Sequential</span>
                                            <span>•</span>
                                            <span>🔁 Auto-Loop</span>
                                            <span>•</span>
                                            <span>🌙 Quiet Hours Guard</span>
                                        </div>

                                        {/* Sample Items Preview */}
                                        <div className="p-3 bg-[#1a1b26] rounded-xl border border-[#292e42] space-y-1.5 text-xs">
                                            <span className="text-[10px] font-bold text-[#565f89] uppercase tracking-wider block">
                                                Sample Messages in Batch:
                                            </span>
                                            {tpl.items?.slice(0, 3).map((item, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[#7982a9]">
                                                    <span className="text-[#bb9af7] font-bold">#{i + 1}</span>
                                                    <span className="text-[#c0caf5] font-medium truncate">{item.title}</span>
                                                </div>
                                            ))}
                                            {tpl.items?.length > 3 && (
                                                <div className="text-[11px] text-[#565f89] italic">
                                                    + {tpl.items.length - 3} more notifications in schedule
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleCreateFromTemplate(tpl.key)}
                                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7aa2f7] to-[#bb9af7] hover:from-[#89b4fa] hover:to-[#c6a0f6] text-[#1a1b26] font-extrabold text-xs transition-all shadow-md"
                                        >
                                            Load This Template as New Campaign
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ==================================================== */}
            {/* FULL BATCH CAMPAIGN EDITOR DRAWER / MODAL */}
            {/* ==================================================== */}
            <AnimatePresence>
                {editorOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            className="w-full max-w-5xl bg-[#1a1b26] border border-[#292e42] rounded-3xl shadow-2xl flex flex-col h-[92vh] overflow-hidden"
                        >
                            {/* Editor Top Bar */}
                            <div className="p-4 sm:p-6 border-b border-[#292e42] bg-[#24283b] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#7aa2f7]/20 text-[#7aa2f7] rounded-xl border border-[#7aa2f7]/30">
                                        <FiClock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-xl font-black text-[#c0caf5]">
                                            {editingBatch ? `Edit Batch: ${editingBatch.name}` : 'Create Automated Batch Campaign'}
                                        </h3>
                                        <p className="text-xs text-[#7982a9]">
                                            Configure timer interval, loop routing, and stack 10 to 20+ messages into the queue.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditorOpen(false)}
                                    className="p-2 rounded-xl bg-[#1a1b26] text-[#7982a9] hover:text-white border border-[#292e42]"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Editor Body */}
                            <form onSubmit={handleSaveBatch} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                                {/* Campaign General Settings */}
                                <div className="p-4 sm:p-5 bg-[#24283b] border border-[#292e42] rounded-2xl space-y-4">
                                    <h4 className="text-xs font-bold text-[#7aa2f7] uppercase tracking-wider flex items-center gap-2">
                                        <FiClock /> 1. Campaign Schedule & Settings
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[#7982a9] mb-1.5">
                                                Campaign Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formName}
                                                onChange={e => setFormName(e.target.value)}
                                                placeholder="e.g. Daily Grocery Habit Reminders"
                                                className="w-full px-3.5 py-2.5 bg-[#1a1b26] border border-[#414868] focus:border-[#7aa2f7] rounded-xl text-sm text-[#c0caf5] outline-none font-medium"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[#7982a9] mb-1.5">
                                                Internal Description (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={formDescription}
                                                onChange={e => setFormDescription(e.target.value)}
                                                placeholder="e.g. 12 items for daily meal planning"
                                                className="w-full px-3.5 py-2.5 bg-[#1a1b26] border border-[#414868] focus:border-[#7aa2f7] rounded-xl text-sm text-[#c0caf5] outline-none font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Interval & Order Mode */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        {/* Timer Interval */}
                                        <div>
                                            <label className="block text-xs font-bold text-[#7982a9] mb-1.5">
                                                Dispatch Time Interval
                                            </label>
                                            <select
                                                value={formInterval}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value);
                                                    setFormInterval(val);
                                                    setFormCustomInterval('');
                                                }}
                                                className="w-full px-3 py-2.5 bg-[#1a1b26] border border-[#414868] rounded-xl text-xs sm:text-sm text-[#c0caf5] outline-none font-medium"
                                            >
                                                {INTERVAL_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                                <option value="custom">Custom Minutes...</option>
                                            </select>
                                            {formInterval === 'custom' && (
                                                <input
                                                    type="number"
                                                    value={formCustomInterval}
                                                    onChange={e => setFormCustomInterval(e.target.value)}
                                                    placeholder="Enter minutes (e.g. 45)"
                                                    className="w-full mt-2 px-3 py-2 bg-[#1a1b26] border border-[#7aa2f7] rounded-xl text-xs text-[#c0caf5] outline-none"
                                                    min="1"
                                                />
                                            )}
                                        </div>

                                        {/* Sequence vs Random */}
                                        <div>
                                            <label className="block text-xs font-bold text-[#7982a9] mb-1.5">
                                                Delivery Order Mode
                                            </label>
                                            <div className="grid grid-cols-2 gap-1.5 bg-[#1a1b26] p-1 rounded-xl border border-[#414868]">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormOrderMode('sequential')}
                                                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        formOrderMode === 'sequential'
                                                            ? 'bg-[#7aa2f7] text-[#1a1b26] shadow'
                                                            : 'text-[#7982a9] hover:text-white'
                                                    }`}
                                                >
                                                    Sequential (1→2→3)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormOrderMode('random')}
                                                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        formOrderMode === 'random'
                                                            ? 'bg-[#7aa2f7] text-[#1a1b26] shadow'
                                                            : 'text-[#7982a9] hover:text-white'
                                                    }`}
                                                >
                                                    Random Shuffle
                                                </button>
                                            </div>
                                        </div>

                                        {/* Repeat / Loop */}
                                        <div>
                                            <label className="block text-xs font-bold text-[#7982a9] mb-1.5">
                                                Repeat / Looping
                                            </label>
                                            <div className="grid grid-cols-2 gap-1.5 bg-[#1a1b26] p-1 rounded-xl border border-[#414868]">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormRepeatMode(true)}
                                                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        formRepeatMode
                                                            ? 'bg-[#bb9af7] text-[#1a1b26] shadow'
                                                            : 'text-[#7982a9] hover:text-white'
                                                    }`}
                                                >
                                                    🔁 Loop Forever
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormRepeatMode(false)}
                                                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        !formRepeatMode
                                                            ? 'bg-[#bb9af7] text-[#1a1b26] shadow'
                                                            : 'text-[#7982a9] hover:text-white'
                                                    }`}
                                                >
                                                    1️⃣ Run Once
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Launch Timing Pre-configuration */}
                                    <div className="p-3 bg-[#1a1b26] border border-[#292e42] rounded-xl space-y-2">
                                        <label className="block text-xs font-bold text-[#7aa2f7] uppercase tracking-wider">
                                            Default Launch Behavior
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs font-bold ${
                                                formStartMode === 'immediate' ? 'bg-[#7aa2f7]/15 border-[#7aa2f7] text-[#c0caf5]' : 'border-[#292e42] text-[#7982a9]'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="formStartMode"
                                                    checked={formStartMode === 'immediate'}
                                                    onChange={() => setFormStartMode('immediate')}
                                                    className="accent-[#7aa2f7]"
                                                />
                                                <span>⚡ Start Immediately (Fire #1)</span>
                                            </label>

                                            <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs font-bold ${
                                                formStartMode === 'interval' ? 'bg-[#7aa2f7]/15 border-[#7aa2f7] text-[#c0caf5]' : 'border-[#292e42] text-[#7982a9]'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="formStartMode"
                                                    checked={formStartMode === 'interval'}
                                                    onChange={() => setFormStartMode('interval')}
                                                    className="accent-[#7aa2f7]"
                                                />
                                                <span>⏱️ First send in 1 interval</span>
                                            </label>

                                            <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs font-bold ${
                                                formStartMode === 'scheduled' ? 'bg-[#bb9af7]/15 border-[#bb9af7] text-[#c0caf5]' : 'border-[#292e42] text-[#7982a9]'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="formStartMode"
                                                    checked={formStartMode === 'scheduled'}
                                                    onChange={() => setFormStartMode('scheduled')}
                                                    className="accent-[#bb9af7]"
                                                />
                                                <span>📅 Pre-Schedule Date & Time</span>
                                            </label>
                                        </div>

                                        {formStartMode === 'scheduled' && (
                                            <div className="pt-2">
                                                <input
                                                    type="datetime-local"
                                                    value={formScheduledDate}
                                                    onChange={e => setFormScheduledDate(e.target.value)}
                                                    className="w-full px-3 py-2 bg-[#1f2335] border border-[#bb9af7] rounded-xl text-xs text-[#c0caf5] outline-none font-semibold"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Quiet Hours Switch */}
                                    <div className="flex items-center justify-between p-3 bg-[#1a1b26] border border-[#292e42] rounded-xl text-xs">
                                        <div className="flex items-center gap-2">
                                            <FiMoon className="w-4 h-4 text-amber-400" />
                                            <div>
                                                <span className="font-bold text-[#c0caf5]">
                                                    Quiet Hours Protection (10:00 PM – 7:00 AM IST)
                                                </span>
                                                <p className="text-[11px] text-[#565f89]">
                                                    Never disturb customers while they sleep. Automatic morning wake-up resumption.
                                                </p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formQuietHours.enabled}
                                            onChange={e => setFormQuietHours(prev => ({ ...prev, enabled: e.target.checked }))}
                                            className="w-4 h-4 accent-[#7aa2f7] cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* ==================================================== */}
                                {/* Notification Items Queue & Mobile Push Preview */}
                                {/* ==================================================== */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Left 7 cols: Notification Items List */}
                                    <div className="lg:col-span-8 space-y-4">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div>
                                                <h4 className="text-xs font-bold text-[#7aa2f7] uppercase tracking-wider flex items-center gap-2">
                                                    <FiList /> 2. Notification Items Queue ({formItems.length} items)
                                                </h4>
                                                <p className="text-[11px] text-[#565f89]">
                                                    Fill in 10 to 20+ messages that will fire one by one automatically.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddMultipleSlots(5)}
                                                    className="px-2.5 py-1.5 rounded-lg bg-[#24283b] hover:bg-[#292e42] border border-[#414868] text-[11px] font-bold text-[#bb9af7]"
                                                >
                                                    + Add 5 Slots
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleAddItem}
                                                    className="px-3 py-1.5 rounded-lg bg-[#7aa2f7] hover:bg-[#89b4fa] text-[#1a1b26] text-xs font-extrabold flex items-center gap-1 shadow"
                                                >
                                                    <FiPlus className="w-3.5 h-3.5" />
                                                    Add Item
                                                </button>
                                            </div>
                                        </div>

                                        {/* Items List */}
                                        <div className="space-y-3.5">
                                            {formItems.map((item, index) => (
                                                <div
                                                    key={item.id || index}
                                                    onClick={() => setPreviewItemIndex(index)}
                                                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                                        previewItemIndex === index
                                                            ? 'bg-[#24283b] border-[#7aa2f7] ring-1 ring-[#7aa2f7]/30'
                                                            : 'bg-[#1f2335] border-[#292e42] hover:border-[#414868]'
                                                    }`}
                                                >
                                                    {/* Item Header */}
                                                    <div className="flex items-center justify-between gap-2 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-lg bg-[#1a1b26] text-[#7aa2f7] font-black text-xs flex items-center justify-center border border-[#414868]">
                                                                #{index + 1}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={item.tag || ''}
                                                                onChange={e => handleItemChange(index, 'tag', e.target.value)}
                                                                placeholder="Tag (e.g. Morning / Deals)"
                                                                className="px-2 py-0.5 bg-[#1a1b26] border border-[#292e42] rounded text-[11px] font-semibold text-[#bb9af7] outline-none max-w-[130px]"
                                                                onClick={e => e.stopPropagation()}
                                                            />
                                                            {item.sentCount > 0 && (
                                                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                                                                    Sent {item.sentCount}x
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Re-order & Remove Controls */}
                                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMoveItem(index, -1)}
                                                                disabled={index === 0}
                                                                className="p-1 rounded bg-[#1a1b26] text-[#7982a9] hover:text-white disabled:opacity-30"
                                                                title="Move Up"
                                                            >
                                                                <FiChevronUp className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMoveItem(index, 1)}
                                                                disabled={index === formItems.length - 1}
                                                                className="p-1 rounded bg-[#1a1b26] text-[#7982a9] hover:text-white disabled:opacity-30"
                                                                title="Move Down"
                                                            >
                                                                <FiChevronDown className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="p-1 rounded bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                                                                title="Remove Item"
                                                            >
                                                                <FiTrash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Title & Body */}
                                                    <div className="space-y-2.5" onClick={e => e.stopPropagation()}>
                                                        <div>
                                                            <input
                                                                type="text"
                                                                value={item.title}
                                                                onChange={e => handleItemChange(index, 'title', e.target.value)}
                                                                placeholder="Notification Title (e.g. Flash Deal Live! ⚡)"
                                                                className="w-full px-3 py-2 bg-[#1a1b26] border border-[#414868] focus:border-[#7aa2f7] rounded-xl text-xs sm:text-sm font-bold text-[#c0caf5] outline-none"
                                                                required
                                                            />
                                                        </div>

                                                        <div>
                                                            <textarea
                                                                value={item.body}
                                                                onChange={e => handleItemChange(index, 'body', e.target.value)}
                                                                placeholder="Notification Message / Body..."
                                                                rows={2}
                                                                className="w-full px-3 py-2 bg-[#1a1b26] border border-[#414868] focus:border-[#7aa2f7] rounded-xl text-xs text-[#c0caf5] outline-none font-medium resize-none"
                                                                required
                                                            />
                                                        </div>

                                                        {/* Route & Banner Image */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <select
                                                                    value={item.targetPath}
                                                                    onChange={e => handleItemChange(index, 'targetPath', e.target.value)}
                                                                    className="w-full px-2.5 py-1.5 bg-[#1a1b26] border border-[#414868] rounded-lg text-xs text-[#7982a9] outline-none"
                                                                >
                                                                    {PRESET_ROUTES.map(r => (
                                                                        <option key={r.value} value={r.value}>
                                                                            Route: {r.label} ({r.value})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="flex items-center gap-1.5">
                                                                <input
                                                                    type="text"
                                                                    value={item.imageUrl}
                                                                    onChange={e => handleItemChange(index, 'imageUrl', e.target.value)}
                                                                    placeholder="Optional Banner Image URL"
                                                                    className="flex-1 px-2.5 py-1.5 bg-[#1a1b26] border border-[#414868] rounded-lg text-xs text-[#c0caf5] outline-none"
                                                                />
                                                                <label className="p-1.5 bg-[#1a1b26] border border-[#414868] rounded-lg hover:border-[#7aa2f7] cursor-pointer text-[#7aa2f7]" title="Upload Banner Image">
                                                                    <FiUploadCloud className="w-4 h-4" />
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        onChange={e => handleItemImageUpload(index, e.target.files[0])}
                                                                    />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right 4 cols: Live Mobile Push Mockup */}
                                    <div className="lg:col-span-4 space-y-4">
                                        <div className="sticky top-2">
                                            <h4 className="text-xs font-bold text-[#7aa2f7] uppercase tracking-wider mb-2 flex items-center gap-2">
                                                <FiSmartphone /> Live Push Preview (#{(previewItemIndex + 1)})
                                            </h4>
                                            <p className="text-[11px] text-[#565f89] mb-3">
                                                Click any notification item in the queue to preview what customers see on their phone.
                                            </p>

                                            {/* Phone Screen Mockup */}
                                            <div className="w-full bg-[#0f111a] p-4 rounded-3xl border-2 border-[#292e42] shadow-2xl space-y-4">
                                                {/* Top status bar mockup */}
                                                <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold px-1">
                                                    <span>12:45</span>
                                                    <span>5G • 85%</span>
                                                </div>

                                                {/* Push Notification Card Mockup */}
                                                <div className="p-3.5 bg-[#1f2335]/95 backdrop-blur-md border border-[#414868]/60 rounded-2xl shadow-xl space-y-2">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <div className="flex items-center gap-1.5 font-bold text-[#c0caf5]">
                                                            <div className="w-4 h-4 bg-gradient-to-br from-[#7aa2f7] to-[#bb9af7] rounded flex items-center justify-center text-[9px] font-black text-[#1a1b26]">
                                                                RG
                                                            </div>
                                                            <span>RG Basket</span>
                                                        </div>
                                                        <span className="text-[10px] text-[#565f89]">now</span>
                                                    </div>

                                                    <div>
                                                        <h5 className="text-xs font-black text-white leading-tight">
                                                            {activePreviewItem.title || 'Notification Title'}
                                                        </h5>
                                                        <p className="text-[11px] text-[#a9b1d6] mt-0.5 leading-snug">
                                                            {activePreviewItem.body || 'Notification message description goes here.'}
                                                        </p>
                                                    </div>

                                                    {activePreviewItem.imageUrl && (
                                                        <div className="w-full h-28 rounded-xl overflow-hidden bg-black/40 border border-white/10 mt-1">
                                                            <img
                                                                src={activePreviewItem.imageUrl}
                                                                alt="Banner Preview"
                                                                className="w-full h-full object-cover"
                                                                onError={e => { e.currentTarget.style.display = 'none'; }}
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="pt-1 flex items-center justify-between text-[10px] text-[#7aa2f7] border-t border-white/5">
                                                        <span>Opens: {activePreviewItem.targetPath || '/'}</span>
                                                        <span>Tap to view →</span>
                                                    </div>
                                                </div>

                                                <div className="text-center text-[10px] text-[#565f89]">
                                                    Simulated Android & iOS Lock Screen
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Editor Bottom Actions */}
                            <div className="p-4 sm:p-5 border-t border-[#292e42] bg-[#24283b] flex items-center justify-between">
                                <span className="text-xs text-[#7982a9] font-medium">
                                    Total Items in Batch: <strong className="text-[#c0caf5]">{formItems.length}</strong>
                                </span>

                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setEditorOpen(false)}
                                        className="px-4 py-2 rounded-xl bg-[#1a1b26] hover:bg-[#1f2335] text-[#7982a9] hover:text-white border border-[#292e42] text-xs font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveBatch}
                                        disabled={saving}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7aa2f7] to-[#bb9af7] hover:from-[#89b4fa] hover:to-[#c6a0f6] text-[#1a1b26] text-xs font-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50"
                                    >
                                        {saving ? 'Saving Campaign...' : (editingBatch ? 'Save Changes' : 'Create & Save Batch')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ==================================================== */}
            {/* DELIVERY AUDIT LOGS MODAL */}
            {/* ==================================================== */}
            <AnimatePresence>
                {logsModalOpen && activeLogsBatch && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-[#1a1b26] border border-[#292e42] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-5 border-b border-[#292e42] bg-[#24283b] flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-[#c0caf5] flex items-center gap-2">
                                        <FiActivity className="text-[#bb9af7]" />
                                        Delivery Audit Logs: {activeLogsBatch.name}
                                    </h3>
                                    <p className="text-xs text-[#7982a9] mt-0.5">
                                        Recent automated dispatches and devices reached.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setLogsModalOpen(false)}
                                    className="p-2 rounded-xl bg-[#1a1b26] text-[#7982a9] hover:text-white"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-5 overflow-y-auto space-y-3 flex-1">
                                {(!activeLogsBatch.dispatchLogs || activeLogsBatch.dispatchLogs.length === 0) ? (
                                    <div className="text-center py-8 text-xs text-[#7982a9]">
                                        No dispatches recorded yet for this batch. Once the timer fires or you click "Fire Next Now", delivery logs will show here.
                                    </div>
                                ) : (
                                    activeLogsBatch.dispatchLogs.map((log, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3.5 bg-[#24283b] border border-[#292e42] rounded-xl flex items-start justify-between gap-3 text-xs"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                                    <h5 className="font-bold text-[#c0caf5]">{log.title}</h5>
                                                </div>
                                                <p className="text-[11px] text-[#7982a9] line-clamp-1">{log.body}</p>
                                                <div className="text-[10px] text-[#565f89]">
                                                    {new Date(log.sentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                    {log.devicesReached} devices
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminNotificationBatchesDark;
