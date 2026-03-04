import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBasket, ShieldCheck, MapPin, Truck, Leaf, Heart, Wind, Star } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-white overflow-hidden text-gray-800">
            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-b from-emerald-50/50 to-white">
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold mb-8"
                    >
                        <Wind className="w-4 h-4 animate-pulse" />
                        FRESHNESS REINVENTED
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-[1.1]"
                    >
                        NO FROZEN. <br />
                        <span className="text-emerald-600 underline decoration-emerald-200 underline-offset-8">NO STALE.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium"
                    >
                        Founded in Cuttack, RG Basket was built on a simple promise:
                        To deliver food exactly how nature intended—fresh, chemical-free, and delivered
                        the very same day it leaves the source.
                    </motion.p>
                </div>
            </section>

            {/* Core Philosophy Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-gray-900 leading-tight">
                                    The Chemical-Free <br />
                                    <span className="text-emerald-600">Revolution.</span>
                                </h2>
                                <div className="w-20 h-2 bg-emerald-500 rounded-full" />
                            </div>

                            <p className="text-lg text-gray-600 leading-relaxed">
                                Most "fresh" groceries in supermarkets have been sitting in cold storage for days,
                                losing nutrients and flavor. At <span className="font-bold text-emerald-700">RG Basket</span>,
                                we've flipped the system. We connect Cuttack and Bhubaneswar residents
                                directly to farmers and trusted local hubs.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 group hover:bg-emerald-600 transition-all duration-300">
                                    <Leaf className="w-8 h-8 text-emerald-600 mb-3 group-hover:text-white" />
                                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-white">Organic 1st</h3>
                                    <p className="text-sm text-gray-600 group-hover:text-emerald-50">Priority to chemical-free and organic farming practices.</p>
                                </div>
                                <div className="p-6 bg-lime-50 rounded-2xl border border-lime-100 group hover:bg-lime-600 transition-all duration-300">
                                    <Truck className="w-8 h-8 text-lime-600 mb-3 group-hover:text-white" />
                                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-white">Slot Delivery</h3>
                                    <p className="text-sm text-gray-600 group-hover:text-lime-50">Morning, Noon & Evening slots curated for your convenience.</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="absolute -inset-4 bg-emerald-100/50 rounded-[3rem] blur-xl -z-10 animate-pulse" />
                            <div className="bg-gray-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16" />
                                <h3 className="text-3xl font-black mb-10 leading-tight">Serving Cuttack <br /> with Pride.</h3>

                                <ul className="space-y-8">
                                    <li className="flex gap-5">
                                        <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                            <Star className="text-yellow-400 w-6 h-6 fill-yellow-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl mb-1">Affordable Pricing</h4>
                                            <p className="text-gray-400 text-sm">Fresh shouldn't mean expensive. We offer competitive prices, often lower than major apps.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-5">
                                        <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                            <MapPin className="text-emerald-400 w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl mb-1">Free Delivery</h4>
                                            <p className="text-gray-400 text-sm">On standard orders within our serving zones in Cuttack & Bhubaneswar.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-5">
                                        <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                            <Heart className="text-red-400 w-6 h-6 fill-red-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xl mb-1">Farmer Led</h4>
                                            <p className="text-gray-400 text-sm">Every order supports a local farmer community in the Odisha region.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-20 border-t border-gray-100 bg-gray-50/50">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-400 mb-12 uppercase tracking-[0.2em] relative inline-block">
                        Our Roots in Odisha
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center max-w-4xl mx-auto opacity-50 contrast-125">
                        <div className="font-black text-2xl">STARTUP ODISHA</div>
                        <div className="font-black text-2xl">MSME SECTOR</div>
                        <div className="font-black text-2xl">AGRI-TECH</div>
                        <div className="font-black text-2xl">L-DELIVERY</div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-24 bg-emerald-600 text-white text-center">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Taste the Freshness?</h2>
                    <p className="text-emerald-100 text-xl mb-10 max-w-2xl mx-auto">Experience the "RG Basket Way" of shopping—where quality and community come first.</p>
                    <div className="flex flex-wrap justify-center gap-4 text-white">
                        <a href="/" className="px-10 py-5 bg-white text-emerald-700 rounded-full font-black hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-xl">Shop Now</a>
                        <a href="/contact-us" className="px-10 py-5 bg-emerald-700 text-white rounded-full font-black border border-emerald-500 hover:bg-emerald-800 transition-all shadow-xl">Contact Our Team</a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
