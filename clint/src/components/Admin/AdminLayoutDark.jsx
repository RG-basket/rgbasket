import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Package, ShoppingCart, Users, Settings,
    Calendar, MapPin, ChevronLeft, ChevronRight, LogOut,
    Bell, Search, Menu, X, Tag, Image as ImageIcon
} from 'lucide-react';
import { FaGift } from 'react-icons/fa';



import { tokyoNight, tw } from '../../config/tokyoNightTheme';

const AdminLayoutDark = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        {
            path: '/admin/products',
            icon: Package,
            label: 'Products',
            children: [
                { path: '/admin/products', label: 'All Products' },
                { path: '/admin/products/bulk-edit', label: 'Bulk Price Editor' }
            ]
        },
        { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/offers', icon: FaGift, label: 'Gift Offers' },
        { path: '/admin/promocodes', icon: Tag, label: 'Promo Codes' },
        { path: '/admin/banners', icon: ImageIcon, label: 'Banners' },



        {
            label: 'Servicibility',
            icon: Calendar,
            children: [
                { path: '/admin/slots', label: 'Delivery Slots' },
                { path: '/admin/product-slots', label: 'Product Availability' },
                { path: '/admin/servicibility', label: 'Service Areas' },
                { path: '/admin/categories', label: 'Categories' }
            ]
        },
        { path: '/admin/settings', icon: Settings, label: 'Settings' }
    ];

    const isActive = (path, exact = false) => {
        if (exact) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className={`min-h-screen ${tw.bgPrimary} ${tw.textPrimary} font-sans selection:bg-[#7aa2f7] selection:text-[#1a1b26]`}>
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full ${tw.bgSecondary} border-r ${tw.borderPrimary} transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'
                    } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-xl`}
            >
                {/* Logo */}
                <div className={`h-16 flex items-center justify-between px-4 border-b ${tw.borderPrimary}`}>
                    {sidebarOpen ? (
                        <Link to="/admin" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#7aa2f7] to-[#bb9af7] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <span className="text-[#1a1b26] font-bold text-lg">RG</span>
                            </div>
                            <span className={`font-bold text-xl ${tw.textPrimary}`}>Admin</span>
                        </Link>
                    ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-[#7aa2f7] to-[#bb9af7] rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                            <span className="text-[#1a1b26] font-bold text-lg">RG</span>
                        </div>
                    )}

                    {/* Toggle Button - Desktop */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`hidden lg:flex items-center justify-center w-6 h-6 rounded ${tw.hoverElevated} ${tw.textSecondary} transition-colors`}
                    >
                        {sidebarOpen ? (
                            <ChevronLeft className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>

                    {/* Close Button - Mobile */}
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className={`lg:hidden flex items-center justify-center w-6 h-6 rounded ${tw.hoverElevated} ${tw.textSecondary}`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)] scrollbar-thin scrollbar-thumb-[#414868] scrollbar-track-transparent">
                    {navItems.map((item, index) => {
                        if (item.children) {
                            return (
                                <div key={index} className="space-y-1">
                                    <div
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${tw.textSecondary} font-medium ${sidebarOpen ? '' : 'justify-center'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        {sidebarOpen && <span className="text-sm">{item.label}</span>}
                                    </div>
                                    {sidebarOpen && (
                                        <div className="ml-8 space-y-1 border-l border-[#414868] pl-2">
                                            {item.children.map((child, childIndex) => (
                                                <Link
                                                    key={childIndex}
                                                    to={child.path}
                                                    className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isActive(child.path)
                                                        ? `bg-[#7aa2f7]/10 ${tw.accentBlue} font-medium`
                                                        : `${tw.textSecondary} ${tw.hoverElevated} hover:text-[#c0caf5]`
                                                        }`}
                                                >
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={index}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive(item.path, item.exact)
                                    ? `bg-[#7aa2f7]/10 ${tw.accentBlue} font-medium shadow-[0_0_15px_rgba(122,162,247,0.1)]`
                                    : `${tw.textSecondary} ${tw.hoverElevated} hover:text-[#c0caf5]`
                                    } ${sidebarOpen ? '' : 'justify-center'}`}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive(item.path, item.exact) ? tw.accentBlue : ''}`} />
                                {sidebarOpen && <span className="text-sm">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${tw.borderPrimary} ${tw.bgSecondary}`}>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${tw.accentRed} hover:bg-[#f7768e]/10 transition-colors w-full ${sidebarOpen ? '' : 'justify-center'
                            }`}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div
                className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
                    }`}
            >
                {/* Top Header */}
                <header className={`h-16 ${tw.bgSecondary} border-b ${tw.borderPrimary} sticky top-0 z-30 shadow-md`}>
                    <div className="h-full px-4 lg:px-6 flex items-center justify-between">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className={`lg:hidden flex items-center justify-center w-10 h-10 rounded-lg ${tw.hoverElevated} ${tw.textSecondary}`}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Search Bar */}
                        <div className="hidden md:flex items-center flex-1 max-w-md">
                            <div className="relative w-full group">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textSecondary} group-focus-within:${tw.accentBlue} transition-colors`} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className={`w-full pl-10 pr-4 py-2 ${tw.bgInput} border ${tw.borderSecondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7aa2f7] focus:border-transparent ${tw.textPrimary} placeholder-[#565f89] transition-all`}
                                />
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            {/* Notifications */}
                            <button className={`relative flex items-center justify-center w-10 h-10 rounded-lg ${tw.hoverElevated} ${tw.textSecondary} hover:text-[#c0caf5] transition-colors`}>
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-[#f7768e] rounded-full shadow-[0_0_8px_#f7768e]"></span>
                            </button>

                            {/* Admin Profile */}
                            <div className={`flex items-center gap-3 pl-3 border-l ${tw.borderSecondary}`}>
                                <div className="hidden sm:block text-right">
                                    <p className={`text-sm font-medium ${tw.textPrimary}`}>Admin</p>
                                    <p className={`text-xs ${tw.textSecondary}`}>Administrator</p>
                                </div>
                                <div className="w-10 h-10 bg-gradient-to-br from-[#7aa2f7] to-[#bb9af7] rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <span className="text-[#1a1b26] font-medium text-sm">A</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayoutDark;
