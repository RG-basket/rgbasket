import React from 'react';
import { Loader2 } from 'lucide-react';
import { tw } from '../../../config/tokyoNightTheme';

const AdminButtonDark = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    icon: Icon,
    className = '',
    type = 'button'
}) => {
    const variants = {
        primary: `bg-[#7aa2f7] text-[#1a1b26] hover:bg-[#7aa2f7]/90 shadow-lg shadow-blue-500/20`,
        secondary: `${tw.bgSecondary} ${tw.textPrimary} border ${tw.borderPrimary} hover:bg-[#414868]`,
        outline: `bg-transparent border ${tw.borderPrimary} ${tw.textPrimary} hover:bg-[#414868]/50`,
        ghost: `bg-transparent ${tw.textSecondary} hover:bg-[#414868]/30 hover:text-[#c0caf5]`,
        danger: `bg-[#f7768e] text-white hover:bg-[#f7768e]/90 shadow-lg shadow-red-500/20`,
        success: `bg-[#9ece6a] text-[#1a1b26] hover:bg-[#9ece6a]/90 shadow-lg shadow-green-500/20`
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`
                relative flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-95
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!isLoading && Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
};

export default AdminButtonDark;
