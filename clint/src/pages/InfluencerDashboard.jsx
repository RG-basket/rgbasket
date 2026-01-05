import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiTrendingUp, FiShoppingBag, FiCopy, FiCheckCircle,
    FiDollarSign, FiMessageSquare, FiInfo, FiExternalLink, FiAward, FiShare2,
    FiCreditCard, FiArrowRight, FiClock, FiX
} from 'react-icons/fi';

const InfluencerDashboard = () => {
    const { routeName } = useParams();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    // Withdrawal Management
    const [showConfirm, setShowConfirm] = useState(false);
    const [withdrawnAmount, setWithdrawnAmount] = useState(() => {
        return Number(localStorage.getItem(`withdrawn_${routeName}`)) || 0;
    });
    const [withdrawHistory, setWithdrawHistory] = useState(() => {
        const saved = localStorage.getItem(`history_${routeName}`);
        return saved ? JSON.parse(saved) : [];
    });

    const fetchStats = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/promo/influencer/${routeName}`);
            const data = await response.json();

            if (data.success) {
                setStats(data.data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, [routeName]);

    const handleCopy = () => {
        navigator.clipboard.writeText(stats.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const confirmWithdrawal = () => {
        const currentAvailable = stats.earnings - withdrawnAmount;
        if (currentAvailable <= 0) return;

        const newWithdrawnTotal = withdrawnAmount + currentAvailable;
        const newRecord = {
            amount: currentAvailable,
            date: new Date().toLocaleString(),
            id: Date.now()
        };

        const updatedHistory = [newRecord, ...withdrawHistory];

        // Save to LocalStorage
        localStorage.setItem(`withdrawn_${routeName}`, newWithdrawnTotal);
        localStorage.setItem(`history_${routeName}`, JSON.stringify(updatedHistory));

        // Update State
        setWithdrawnAmount(newWithdrawnTotal);
        setWithdrawHistory(updatedHistory);
        setShowConfirm(false);

        // Open WhatsApp
        const message = `Hello RG Basket Team! 👋\n\nI am requesting a withdrawal for my influencer account:\n\n👤 Name: ${stats.name}\n🎫 Code: ${stats.code}\n💰 Withdrawal Amount: ₹${currentAvailable}\n📈 Lifetime Earnings: ₹${stats.earnings}\n\nPlease process my withdrawal. Thank you!`;
        const whatsappUrl = `https://wa.me/919078771530?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-10 w-10 border-4 border-[#26544a] border-t-transparent rounded-full"
            />
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-red-100 text-center max-w-sm w-full">
                <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl text-red-500">❌</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-sm text-gray-500 mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="w-full bg-[#26544a] text-white py-3 rounded-xl font-bold hover:bg-[#1f433b] transition-colors">
                    Retry Connection
                </button>
            </div>
        </div>
    );

    const availableEarnings = Math.floor(Math.max(0, stats.earnings - withdrawnAmount));
    const totalLifetimeEarnings = Math.floor(stats.earnings);

    return (
        <div className="min-h-screen bg-[#f8fafc] selection:bg-emerald-100 text-gray-900 pb-10">
            {/* Top Branding Line */}
            <div className="h-1 bg-[#26544a]" />

            <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                {/* Header Section */}
                <header className="mb-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#26544a] rounded-full mb-4 border border-emerald-100">
                            <FiAward className="text-sm" />
                            <span className="text-[10px] font-black tracking-widest uppercase">Verified Partner</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#26544a] mb-2">
                            {stats.name.split(' ')[0]}'s Portal
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">
                            Manage your earnings & assets
                        </p>
                    </motion.div>
                </header>

                {/* THE WALLET CARD */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mb-6 overflow-hidden bg-gradient-to-br from-[#26544a] to-[#1a3831] p-6 md:p-8 rounded-[2rem] shadow-2xl text-white group"
                >
                    {/* Decorative Elements */}
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/15 transition-all" />

                    <div className="relative flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm border border-white/20">
                                    <FiCreditCard className="text-2xl" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Available to Withdraw</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-white/60">Lifetime Earnings:</p>
                                        <span className="text-xs font-black text-emerald-300">₹{totalLifetimeEarnings.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-1">Account</p>
                                <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[9px] font-black border border-emerald-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> VERIFIED
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter italic">₹{availableEarnings.toLocaleString()}</h2>
                                    <span className="text-emerald-300/60 text-xs font-bold uppercase">Current</span>
                                </div>
                                <p className="text-[10px] text-white/50 font-medium mt-2">Payout updates instantly after every order delivery.</p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => availableEarnings > 0 && setShowConfirm(true)}
                                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-sm uppercase transition-all shadow-xl ${availableEarnings > 0
                                    ? "bg-white text-[#26544a] shadow-black/20"
                                    : "bg-white/10 text-white/30 cursor-not-allowed shadow-none border border-white/5"
                                    }`}
                            >
                                <FiMessageSquare className="text-xl" />
                                {availableEarnings > 0 ? "Request Payout" : "Wallet Empty"}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Secondary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Conversions Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                <FiShoppingBag className="text-xl" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Success Orders</p>
                                <h4 className="text-2xl font-black text-gray-900">{stats.usageCount}</h4>
                            </div>
                        </div>
                        <div className="text-blue-600 bg-blue-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <FiTrendingUp />
                        </div>
                    </motion.div>

                    {/* Promo Code Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all"
                    >
                        <div className="flex flex-col">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Promo Code</p>
                            <h4 className="text-2xl font-black text-[#26544a] font-mono tracking-widest uppercase">{stats.code}</h4>
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`p-3 rounded-2xl transition-all ${copied === true ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                        >
                            {copied === true ? <FiCheckCircle className="text-xl" /> : <FiCopy className="text-xl" />}
                        </button>
                    </motion.div>
                </div>

                {/* Withdrawal History Section */}
                <AnimatePresence>
                    {withdrawHistory.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden mb-6"
                        >
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <FiClock className="text-amber-500" /> Recent Payouts
                                </h3>
                                <span className="text-[10px] font-bold text-gray-400">HISTORY</span>
                            </div>
                            <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                                {withdrawHistory.map((item) => (
                                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-emerald-600 font-bold">₹</div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 italic">₹{Math.floor(item.amount)}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{item.date}</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase">Settled</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Dashboard Help */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mb-6"
                >
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <FiInfo className="text-emerald-600" /> Partner Guidelines
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: 'Payouts', desc: 'Resets to 0 after every withdrawal request.', icon: '💳' },
                            { title: 'Tracking', desc: 'Earnings track only delivered orders.', icon: '📊' },
                            { title: 'Support', desc: 'Contact admin via WhatsApp for help.', icon: '⚙️' }
                        ].map((tip, i) => (
                            <div key={i} className="flex md:flex-col gap-4 md:gap-2">
                                <div className="w-10 h-10 shrink-0 bg-gray-50 rounded-xl flex items-center justify-center text-lg">{tip.icon}</div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-900 mb-0.5">{tip.title}</p>
                                    <p className="text-xs text-gray-500 leading-tight">{tip.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Footer */}
                <footer>
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex-1 w-full truncate text-center md:text-left">
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Secure Portal Access</p>
                            <p className="text-xs font-mono text-gray-400 truncate">{window.location.host}/influencer/{routeName}</p>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                setCopied('link');
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className="w-full md:w-auto bg-gray-50 text-[#26544a] px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all border border-gray-100 font-bold"
                        >
                            {copied === 'link' ? 'Link Copied!' : 'Copy Dashboard Link'}
                        </button>
                    </div>
                </footer>
            </div>

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfirm(false)}
                            className="absolute inset-0 bg-[#26544a]/20 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
                        >
                            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16" />

                            <div className="relative">
                                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl text-emerald-600 mb-6">
                                    <FiDollarSign />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Confirm Payout?</h3>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
                                    Are you sure you want to withdraw <span className="text-[#26544a] font-bold">₹{availableEarnings.toLocaleString()}</span>?
                                    Your dashboard balance will reset to 0 and we'll notify the team.
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        className="py-4 rounded-2xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmWithdrawal}
                                        className="py-4 rounded-2xl bg-[#26544a] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-[#1f433b] transition-colors"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InfluencerDashboard;



