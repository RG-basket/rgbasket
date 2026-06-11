import React from 'react';
import { ShieldAlert, RefreshCw, ShoppingBag, Truck } from 'lucide-react';

const MaintenancePage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-[#f4fbf7] to-gray-50 text-slate-800 flex flex-col items-center justify-center relative overflow-hidden px-4 select-none">
            {/* Background glowing blurred halos in theme colors */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-100/60 rounded-full filter blur-[80px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-lime-100/60 rounded-full filter blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2f0e7_1px,transparent_1px),linear-gradient(to_bottom,#e2f0e7_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-40 pointer-events-none" />

            {/* Container */}
            <div className="w-full max-w-md z-10 text-center flex flex-col items-center">
                {/* Logo / Icon container */}
                <div className="relative mb-6">
                    {/* Glowing outer shadow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 to-lime-400 rounded-3xl opacity-20 blur-lg animate-pulse pointer-events-none" />
                    
                    {/* Glass Container */}
                    <div className="relative w-24 h-24 bg-white border border-emerald-100 rounded-3xl flex items-center justify-center shadow-xl">
                        <div className="relative">
                            {/* Rotating Gear SVG in green */}
                            <svg className="w-14 h-14 text-emerald-600 animate-spin" style={{ animationDuration: '10s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.936 6.936 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                            {/* Pulsing inner dot */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-lime-500 rounded-full animate-ping pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-emerald-600 to-lime-600 bg-clip-text text-transparent">
                    App Under Maintenance
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-gray-500 font-medium max-w-sm px-2 mb-8 leading-relaxed">
                    We are performing a quick system update to improve your experience and make the app run even better.
                </p>

                {/* Status card */}
                <div className="w-full bg-white/80 border border-emerald-100/40 rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-md text-left space-y-4 mb-8">
                    <h3 className="text-emerald-700 font-bold flex items-center gap-1.5 border-b border-gray-100 pb-2 text-xs uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4 text-emerald-600" /> App Status
                    </h3>
                    
                    <div className="flex gap-3 text-xs sm:text-sm">
                        <ShoppingBag className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-gray-800">New Orders</p>
                            <p className="text-gray-500 mt-0.5 leading-relaxed">Temporarily paused. You won't be able to place new orders right now, but the app will be back online very shortly.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 text-xs sm:text-sm">
                        <Truck className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-gray-800">Already Placed Orders</p>
                            <p className="text-gray-500 mt-0.5 leading-relaxed">Safe and on the way! If you have already placed an order, our team is delivering it as scheduled without any delay.</p>
                        </div>
                    </div>
                </div>

                {/* Polling loading indicator */}
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50/50 border border-emerald-100 px-3.5 py-1.5 rounded-full shadow-inner">
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" /> Auto-reconnecting...
                </div>
            </div>

            {/* Trademark */}
            <div className="absolute bottom-6 text-[10px] text-gray-400 font-semibold tracking-wider">
                © {new Date().getFullYear()} RG BASKET. ALL RIGHTS RESERVED.
            </div>
        </div>
    );
};

export default MaintenancePage;
