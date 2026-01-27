import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { tw } from '../../../config/tokyoNightTheme';

const StatsCardDark = ({ title, value, icon: Icon, trend, trendValue, color = 'blue', className = '' }) => {
    const colorMap = {
        blue: { bg: 'bg-[#7aa2f7]/10', text: 'text-[#7aa2f7]', border: 'border-[#7aa2f7]/20' },
        green: { bg: 'bg-[#9ece6a]/10', text: 'text-[#9ece6a]', border: 'border-[#9ece6a]/20' },
        purple: { bg: 'bg-[#bb9af7]/10', text: 'text-[#bb9af7]', border: 'border-[#bb9af7]/20' },
        orange: { bg: 'bg-[#ff9e64]/10', text: 'text-[#ff9e64]', border: 'border-[#ff9e64]/20' },
        yellow: { bg: 'bg-[#e0af68]/10', text: 'text-[#e0af68]', border: 'border-[#e0af68]/20' },
    };

    const theme = colorMap[color] || colorMap.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${tw.bgSecondary} rounded-xl p-6 border ${tw.borderPrimary} shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[#7aa2f7]/50 group ${className}`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${theme.bg} ${theme.text} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-[#9ece6a]' : 'text-[#f7768e]'
                        }`}>
                        {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>

            <h3 className={`${tw.textSecondary} text-sm font-medium mb-1`}>{title}</h3>
            <p className={`${tw.textPrimary} text-2xl font-bold tracking-tight`}>{value}</p>

            {/* Background decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} blur-[60px] rounded-full opacity-20 -mr-16 -mt-16 pointer-events-none`} />
        </motion.div>
    );
};

export default StatsCardDark;
