import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, FileText } from 'lucide-react';

const SpecialRequestDetailsModal = ({ isOpen, onClose, product, onProceedToRequest }) => {
    const getProductImage = (prod) => {
        if (!prod) return "https://placehold.co/400x400?text=No+Image";
        if (Array.isArray(prod.images) && prod.images.length > 0 && typeof prod.images[0] === 'string' && prod.images[0].trim() !== '') {
            return prod.images[0];
        }
        if (typeof prod.image === 'string' && prod.image.trim() !== '') {
            return prod.image;
        }
        if (Array.isArray(prod.image) && prod.image.length > 0 && typeof prod.image[0] === 'string' && prod.image[0].trim() !== '') {
            return prod.image[0];
        }
        if (typeof prod.images === 'string' && prod.images.trim() !== '') {
            return prod.images;
        }
        return "https://placehold.co/400x400?text=No+Image";
    };

    const [imgSrc, setImgSrc] = React.useState(() => getProductImage(product));
    const [imageError, setImageError] = React.useState(false);

    React.useEffect(() => {
        setImgSrc(getProductImage(product));
        setImageError(false);
    }, [product]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !product) return null;

    const modalContent = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                />

                {/* Compact Modal Container */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 15 }}
                    transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
                    className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-[390px] w-full max-h-[85vh] flex flex-col relative z-10 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Professional Header */}
                    <div className="py-3 px-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                                <Info className="w-3.5 h-3.5" />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 leading-tight">
                                    Special Request Details
                                </h2>
                                <p className="text-[10px] text-gray-500 font-medium">
                                    Pre-order & Customization Information
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors border border-gray-200 shadow-xs"
                            aria-label="Close"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-3.5 overflow-y-auto space-y-3 text-gray-700 custom-scrollbar text-xs">
                        {/* Compact Product Header Card */}
                        <div className="flex items-center gap-3 bg-gray-50/90 p-2.5 rounded-xl border border-gray-100">
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 p-1 shrink-0 shadow-xs">
                                <img
                                    src={imageError ? "https://placehold.co/400x400?text=No+Image" : imgSrc}
                                    alt={product.name}
                                    onError={() => setImageError(true)}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 bg-emerald-100 rounded uppercase tracking-wider mb-0.5">
                                    {product.category || 'Special Order'}
                                </span>
                                <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight truncate">
                                    {product.name}
                                </h3>
                                <div className="mt-0.5 flex items-center gap-1.5">
                                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                                        Price on Request
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Admin Configured Special Request Info / Instructions */}
                        <div className={`p-3 rounded-xl border shadow-xs ${
                            product.specialRequestInfo && product.specialRequestInfo.trim()
                                ? 'bg-amber-50/60 border-amber-200/80'
                                : 'bg-gray-50/80 border-gray-200/80'
                        }`}>
                            <div className="flex items-center gap-1.5 mb-1.5 font-bold text-xs">
                                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${
                                    product.specialRequestInfo && product.specialRequestInfo.trim()
                                        ? 'text-amber-700'
                                        : 'text-gray-500'
                                }`} />
                                <span className={
                                    product.specialRequestInfo && product.specialRequestInfo.trim()
                                        ? 'text-amber-900'
                                        : 'text-gray-700'
                                }>
                                    Instructions & Guidelines
                                </span>
                            </div>
                            <div className="text-[11px] leading-relaxed whitespace-pre-line font-medium">
                                {product.specialRequestInfo && product.specialRequestInfo.trim() ? (
                                    <span className="text-gray-700">{product.specialRequestInfo.trim()}</span>
                                ) : (
                                    <span className="text-gray-400 italic">No instructions added yet</span>
                                )}
                            </div>
                        </div>

                        {/* How Special Request Works - Clean & Professional */}
                        <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-0.5">
                                How It Works
                            </h4>
                            <div className="space-y-1.5 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                                <div className="flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                        1
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-800 text-[11px] leading-tight">Place Special Request</p>
                                        <p className="text-[10px] text-gray-500 leading-snug">Submit your required quantity, cutting instructions, and delivery address.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 pt-1.5 border-t border-gray-100">
                                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                        2
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-800 text-[11px] leading-tight">Processing & Verification</p>
                                        <p className="text-[10px] text-gray-500 leading-snug">Our team will contact you directly to confirm availability, final weight, and processing details.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 pt-1.5 border-t border-gray-100">
                                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                        3
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-800 text-[11px] leading-tight">Delivered Fresh</p>
                                        <p className="text-[10px] text-gray-500 leading-snug">Your special order is freshly procured, prepared to your requirements, and delivered.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compact Footer Actions */}
                    <div className="p-3 border-t border-gray-100 bg-gray-50/90 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 font-bold text-xs hover:bg-gray-100 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                if (onProceedToRequest) {
                                    onProceedToRequest();
                                }
                            }}
                            className="flex-1 h-9 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-[#25D366] text-white hover:bg-[#128C7E] shadow-sm active:scale-[0.98]"
                        >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span>Request on WhatsApp</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default SpecialRequestDetailsModal;
