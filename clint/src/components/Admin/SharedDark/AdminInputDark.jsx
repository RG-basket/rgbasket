import React from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';
import { tw } from '../../../config/tokyoNightTheme';

const AdminInputDark = ({
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    icon: Icon,
    error,
    className = '',
    required = false,
    ...props
}) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className={`block text-sm font-medium ${tw.textSecondary} mb-1.5`}>
                    {label}
                    {required && <span className="text-[#f7768e] ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className={`h-5 w-5 ${tw.textSecondary}`} />
                    </div>
                )}
                <input
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    className={`
                        block w-full rounded-lg ${tw.bgInput} ${tw.borderPrimary} ${tw.textPrimary}
                        placeholder-[#565f89]
                        ${Icon ? 'pl-10' : 'pl-4'}
                        ${isPassword ? 'pr-10' : 'pr-4'}
                        py-2.5
                        border
                        focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] focus:border-transparent
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200
                        ${error ? 'border-[#f7768e] focus:ring-[#f7768e]' : ''}
                    `}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 right-0 pr-3 flex items-center ${tw.textSecondary} hover:text-[#c0caf5]`}
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                        ) : (
                            <Eye className="h-5 w-5" />
                        )}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-[#f7768e]">{error}</p>
            )}
        </div>
    );
};

export default AdminInputDark;
