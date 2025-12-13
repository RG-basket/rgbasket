import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';

const InfluencerDashboard = () => {
    const { routeName } = useParams();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        // Poll every 5 seconds to ensure changes reflect quickly after order
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [routeName]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold">
            {error}
        </div>
    );

    // Mock chart data if not provided by backend yet (backend only returns summary stats currently)
    // Ideally backend should return historical data for charts. 
    // For now I'll create a dummy trend based on usage count to show UI.
    const chartData = [
        { name: 'Mon', usage: Math.max(0, stats.usageCount - 20) },
        { name: 'Tue', usage: Math.max(0, stats.usageCount - 15) },
        { name: 'Wed', usage: Math.max(0, stats.usageCount - 10) },
        { name: 'Thu', usage: Math.max(0, stats.usageCount - 5) },
        { name: 'Fri', usage: stats.usageCount },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Welcome, {stats.name} 👋</h1>
                    <p className="text-gray-500">Track your performance and earnings in real-time</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                    >
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Earnings</h3>
                        <p className="text-4xl font-bold text-indigo-600 mt-2">₹{stats.earnings.toFixed(2)}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                    >
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Times Used</h3>
                        <p className="text-4xl font-bold text-green-600 mt-2">{stats.usageCount}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                    >
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Your Code</h3>
                        <div className="mt-2 flex items-center gap-3">
                            <code className="bg-gray-100 px-3 py-1 rounded text-2xl font-mono font-bold text-gray-800">{stats.code}</code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(stats.code);
                                    // Minimal feedback
                                }}
                                className="text-sm text-indigo-500 hover:text-indigo-700 font-medium"
                            >
                                Copy
                            </button>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96"
                >
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Usage Trend</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="usage" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <div className="mt-10 text-center">
                    <p className="text-sm text-gray-400">
                        Share your dashboard link: <span className="text-gray-600 select-all underline cursor-text">{window.location.href}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InfluencerDashboard;
