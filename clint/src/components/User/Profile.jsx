import React, { useState, useEffect } from 'react';
import { useAppContext } from "../../context/AppContext.jsx";
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  History, 
  ChevronRight, 
  LogOut, 
  Headphones, 
  ShieldCheck, 
  User,
  Edit3,
  Gift,
  Copy,
  Mail,
  BadgeCheck,
  Smartphone,
  Share2,
  MapPin,
  ShoppingBag,
  Calendar,
  ArrowLeft,
  Info,
  Zap,
  Users,
  Coins,
  RefreshCw
} from 'lucide-react';

const Profile = () => {
  const { user, setUser, logout, rewardSettings, updateUserProfile, refreshUserCoins } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [isEditing, setIsEditing] = useState(false);
  const [showRules, setShowRules] = useState(location.state?.openRules || false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '',
    address: '' 
  });

  useEffect(() => {
    refreshUserCoins();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({ 
        name: user.name || '', 
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await updateUserProfile(user.id, { 
        name: formData.name, 
        phone: formData.phone, 
        address: formData.address 
      });
      
      if (response.success) {
        setIsEditing(false);
        toast.success('Profile updated! ✨');
      } else {
        toast.error(response.message || 'Update failed');
      }
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const shareReferral = () => {
    const shareData = {
      title: 'RG Basket Referral',
      text: `Join me on RG Basket! Use my code ${user.referralCode} to get ${rewardSettings?.refereeBonusCoins || 300} coins on your first order. Download now!`,
      url: window.location.origin + `?ref=${user.referralCode}`
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(user.referralCode);
      toast.success('Code copied to clipboard! 📋');
    }
  };

  if (!user) return null;

  const referralAmount = rewardSettings?.referralRewardCoins || 500;
  const friendBonus = rewardSettings?.refereeBonusCoins || 300;
  const minReferralOrder = rewardSettings?.minOrderForReferral || 299;
  const joinDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'Recently';

  /* -------------------------------------------------------------------------- */
  /*                              COMPONENTS                                    */
  /* -------------------------------------------------------------------------- */

  const RuleRow = ({ label, value }) => (
    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-tight py-2 border-b border-gray-100/50 last:border-0 w-full">
      <span className="text-gray-400">{label}</span>
      <span className="text-emerald-700 font-black">{value}</span>
    </div>
  );

  const CompactItem = ({ icon: Icon, label, sublabel, onClick, variant = "default" }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        variant === "danger" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"
      }`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 text-left">
        <span className={`block text-sm font-black uppercase tracking-tight ${variant === "danger" ? "text-red-600" : "text-emerald-950"}`}>
          {label}
        </span>
        {sublabel && <p className="text-[9px] text-gray-400 font-bold uppercase truncate">{sublabel}</p>}
      </div>
      <ChevronRight size={14} className="text-gray-300" />
    </button>
  );

  const ActionCard = ({ icon: Icon, label, sublabel, onClick, variant = "default", color = "emerald" }) => (
    <motion.button
      whileHover={{ y: -2, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex flex-col items-start gap-3 w-full p-6 bg-white border border-gray-100 rounded-3xl transition-all text-left shadow-sm group`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
        variant === "danger" ? "bg-red-50 text-red-500" : `bg-${color}-50 text-${color}-600 group-hover:bg-${color}-600 group-hover:text-white`
      }`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <span className={`block text-base font-black uppercase tracking-tight ${variant === "danger" ? "text-red-600" : "text-emerald-950"}`}>
          {label}
        </span>
        {sublabel && <p className="text-xs text-gray-400 font-bold uppercase mt-1 leading-tight">{sublabel}</p>}
      </div>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-[#FBFDFB] font-site text-emerald-950">

      {/* ======================================================================== */}
      {/* 1. MOBILE VIEW (Ultra Compact)                                          */}
      {/* ======================================================================== */}
      <div className="md:hidden pb-28 pt-8">
        {/* Header - Row Layout */}
        <div className="px-6 pb-6 border-b border-gray-50 bg-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-inner">
                {user.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover" /> : <User className="text-emerald-200 w-8 h-8" />}
              </div>
              <button onClick={() => setIsEditing(true)} className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1.5 rounded-lg border-2 border-white shadow-lg">
                <Edit3 size={12} />
              </button>
            </div>
            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black text-emerald-950 truncate uppercase">{user.name}</h1>
                <BadgeCheck size={14} className="text-emerald-500" fill="currentColor" />
              </div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest truncate mb-2">{user.email}</p>
              
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  <Calendar size={10} /> Joined {joinDate}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-1 text-[8px] font-black text-gray-500 uppercase bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                    <Smartphone size={10} /> {user.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 mt-5 space-y-4">
          {/* Wallet Bar */}
          <div className="bg-emerald-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Coins size={80} className="text-white" />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white"><Wallet size={20} /></div>
              <div>
                <p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest mb-1">Coins Wallet</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white leading-none">{user.rgCoins || 0}</h2>
                  <button 
                    onClick={() => { refreshUserCoins(); toast.success('Balance updated'); }} 
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-emerald-100"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => navigate('/orders')} className="relative z-10 px-3 py-1.5 bg-white text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">History</button>
          </div>

          {/* Compact Referral */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 flex items-center gap-3 text-white shadow-lg shadow-orange-100">
            <Gift size={22} className="flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-[10px] font-black uppercase leading-tight opacity-90">Invite & Earn {referralAmount}</h3>
              <p className="text-xs font-black tracking-[0.2em]">{user.referralCode}</p>
            </div>
            <button onClick={shareReferral} className="p-2.5 bg-white text-orange-600 rounded-xl active:scale-90 shadow-sm"><Share2 size={16} /></button>
          </div>

          {/* Action List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-2">
            <CompactItem icon={History} label="Order History" onClick={() => navigate('/orders')} />
            {user.address && <CompactItem icon={MapPin} label="Saved Address" sublabel={user.address} onClick={() => setIsEditing(true)} />}
            
            {/* Expandable Rules (Mobile) */}
            <div className="border-b border-gray-50 last:border-0">
              <button 
                onClick={() => setShowRules(!showRules)}
                className="flex items-center gap-4 w-full p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50 text-amber-600">
                  <Info size={18} />
                </div>
                <span className="flex-1 text-left text-sm font-black uppercase tracking-tight text-emerald-950">RG Coin Rules</span>
                <motion.div animate={{ rotate: showRules ? 180 : 0 }}>
                  <ChevronRight size={14} className="text-gray-300" />
                </motion.div>
              </button>
              <AnimatePresence>
                {showRules && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-gray-50/50"
                  >
                    <div className="p-6 space-y-6">
                      {/* Order Rewards */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap size={14} className="text-emerald-600" />
                          <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Every Order Earns</h4>
                        </div>
                        <RuleRow label="Your Cashback" value={`${rewardSettings?.orderRewardPercent || 1}% Back`} />
                        <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed">
                          Enjoy {rewardSettings?.orderRewardPercent || 1}% back on every purchase as a thank you. Coins are added as soon as your order is delivered.
                        </p>
                      </div>

                      {/* Referral Rewards */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Users size={14} className="text-amber-600" />
                          <h4 className="text-[11px] font-black text-amber-700 uppercase tracking-widest">Share the Joy</h4>
                        </div>
                        <RuleRow label="You Receive" value={`+${referralAmount} Coins`} />
                        <RuleRow label="Friend Receives" value={`+${friendBonus} Coins`} />
                        <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed">
                          Invite a friend and you both get a gift! Reward is released after their first delivered order of ₹{minReferralOrder}+.
                        </p>
                      </div>

                      {/* Usage & Limits */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Coins size={14} className="text-blue-600" />
                          <h4 className="text-[11px] font-black text-blue-700 uppercase tracking-widest">How to Save</h4>
                        </div>
                        <RuleRow label="Simple Value" value={`Save ₹1 per ${rewardSettings?.conversionRate || 10} Coins`} />
                        <RuleRow label="Enjoy Savings on" value={`Orders over ₹${rewardSettings?.minOrderForRedemption || 200}`} />
                        <RuleRow label="Max Savings" value={`₹${rewardSettings?.maxRedemptionRupees || 25} per order`} />
                        <p className="text-[9px] text-gray-400 font-bold uppercase leading-relaxed">
                          Redeem your coins for instant discounts at checkout. We love seeing you save!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <CompactItem icon={Headphones} label="Support" onClick={() => navigate('/complaint')} />
            <CompactItem icon={ShieldCheck} label="Legal & Privacy" onClick={() => navigate('/privacy')} />
            <CompactItem icon={LogOut} label="Logout" variant="danger" onClick={logout} />
          </div>

          <button onClick={() => navigate('/')} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 mt-4 shadow-xl shadow-gray-200">
            <ShoppingBag size={18} /> Continue Shopping
          </button>
        </div>
      </div>


      {/* ======================================================================== */}
      {/* 2. DESKTOP VIEW (Premium Dashboard)                                     */}
      {/* ======================================================================== */}
      <div className="hidden md:block pb-12 pt-12">
        <div className="max-w-6xl mx-auto px-8">
          
          <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                  <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                      <ArrowLeft size={20} />
                  </button>
                  <h1 className="text-4xl font-black tracking-tighter">My Account</h1>
              </div>
              <button onClick={() => navigate('/')} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2">
                  <ShoppingBag size={18} /> Continue Shopping
              </button>
          </div>

          <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-5 space-y-6">
                  {/* Desktop Identity Card */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-emerald-900/5 border border-emerald-50 overflow-hidden relative group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 transition-colors" />
                      <div className="relative z-10 flex gap-6">
                          <div className="relative">
                              <div className="w-28 h-28 rounded-[2.2rem] overflow-hidden bg-emerald-50 border-4 border-white shadow-xl">
                                  {user.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-emerald-500 text-white font-black text-3xl">{user.name?.charAt(0).toUpperCase()}</div>}
                              </div>
                              <button onClick={() => setIsEditing(true)} className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-2.5 rounded-2xl shadow-xl border-4 border-white hover:bg-emerald-700"><Edit3 size={18} /></button>
                          </div>
                          <div className="flex-1 min-w-0 py-2">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h2 className="text-2xl font-black text-emerald-950 uppercase">{user.name}</h2>
                                  <BadgeCheck size={20} className="text-emerald-500 flex-shrink-0" fill="currentColor" />
                                </div>
                                <button 
                                  onClick={() => { refreshUserCoins(); toast.success('Wallet synced'); }}
                                  className="p-2 hover:bg-emerald-50 rounded-xl transition-all text-emerald-600 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-emerald-100"
                                  title="Sync Wallet Balance"
                                >
                                  <RefreshCw size={14} />
                                </button>
                              </div>
                              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest truncate mb-4">{user.email}</p>
                              <div className="flex flex-wrap gap-3">
                                  <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/50 uppercase"><Calendar size={12} /> Joined {joinDate}</div>
                                  {user.phone && <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 uppercase"><Smartphone size={12} /> {user.phone}</div>}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Desktop Wallet Card */}
                  <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full -mr-32 -mt-32 blur-[100px] opacity-40" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black rounded-full -ml-16 -mb-16 blur-[60px] opacity-20" />
                      <div className="relative z-10">
                          <div className="flex justify-between items-start mb-12">
                              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg"><Wallet size={28} /></div>
                              <div className="flex flex-col items-end">
                                <p className="text-sm font-black tracking-tight uppercase">RG Premium Member</p>
                                <button 
                                  onClick={() => { refreshUserCoins(); toast.success('Wallet synced'); }}
                                  className="mt-2 p-2 hover:bg-white/10 rounded-xl transition-all text-emerald-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/10"
                                >
                                  <RefreshCw size={12} /> Sync Wallet
                                </button>
                              </div>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[11px] font-black text-emerald-100 uppercase tracking-[0.2em]">Available Balance</p>
                              <div className="flex items-baseline gap-2">
                                  <h3 className="text-6xl font-black tracking-tighter">{user.rgCoins || 0}</h3>
                                  <span className="text-lg font-black text-emerald-100/80">Coins</span>
                              </div>
                          </div>
                          <button onClick={() => navigate('/orders')} className="mt-10 w-full py-4 bg-white text-emerald-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-50 shadow-xl">Transaction History</button>
                      </div>
                  </div>

                  {/* Desktop Rules Section */}
                  <div className="bg-white rounded-[2.5rem] p-8 border border-emerald-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Info size={24} />
                        </div>
                        <h3 className="text-base font-black uppercase tracking-widest text-emerald-950">RG Coin Guidelines</h3>
                      </div>
                      
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Zap size={16} className="text-emerald-600" />
                            <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">Every Purchase is a Gift</span>
                          </div>
                          <RuleRow label="Your Cashback" value={`${rewardSettings?.orderRewardPercent || 1}% Back`} />
                          <p className="text-[11px] text-gray-400 font-bold uppercase leading-relaxed ml-6">
                            Enjoy {rewardSettings?.orderRewardPercent || 1}% back as a thank you for every order. Coins arrive as soon as your order is successfully <span className="text-emerald-600">delivered</span>.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-amber-600" />

                            <span className="text-xs font-black uppercase text-amber-700 tracking-wider">Share the Joy</span>
                          </div>
                          <RuleRow label="You Receive" value={`+${referralAmount} Coins`} />
                          <RuleRow label="Friend Receives" value={`+${friendBonus} Coins`} />
                          <p className="text-[11px] text-gray-400 font-bold uppercase leading-relaxed ml-6">
                            Refer friends and you both get a gift! Reward is released once your friend completes their <span className="text-amber-600">first order of ₹{minReferralOrder}+</span>.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Coins size={16} className="text-blue-600" />
                            <span className="text-xs font-black uppercase text-blue-700 tracking-wider">Your Savings, Your Way</span>
                          </div>
                          <RuleRow label="Simple Value" value={`Save ₹1 for every ${rewardSettings?.conversionRate || 10} Coins`} />
                          <RuleRow label="Min Order to use" value={`₹${rewardSettings?.minOrderForRedemption || 200}`} />
                          <RuleRow label="Max Savings" value={`₹${rewardSettings?.maxRedemptionRupees || 25} per order`} />
                          <p className="text-[11px] text-gray-400 font-bold uppercase leading-relaxed ml-6">
                            Redeem your hard-earned coins for instant savings during checkout. We love seeing you save more!
                          </p>
                        </div>
                      </div>
                  </div>
              </div>

              <div className="col-span-7 space-y-8">
                  {/* Desktop Refer Card */}
                  <div className="bg-white rounded-[2.5rem] p-8 border border-emerald-100 shadow-xl shadow-emerald-900/5 relative overflow-hidden group">
                      <div className="relative z-10 flex items-center gap-8">
                          <div className="w-20 h-20 rounded-[1.8rem] bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg"><Gift size={40} /></div>
                          <div className="flex-1">
                              <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight mb-2">Refer & Earn {referralAmount} Coins!</h3>
                              <p className="text-sm text-gray-500 font-medium leading-relaxed">Invite friends to RG Basket. Get coins in your wallet after their first order!</p>
                          </div>
                          <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 bg-emerald-50/50 p-2 rounded-2xl border border-emerald-100">
                                  <div className="px-5 py-3 font-black text-lg text-emerald-600 tracking-[0.2em] uppercase">{user.referralCode}</div>
                                  <button onClick={shareReferral} className="bg-emerald-600 text-white p-3.5 rounded-xl hover:bg-emerald-700 shadow-md"><Share2 size={20} /></button>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <ActionCard icon={History} label="Order History" sublabel="Track past orders" onClick={() => navigate('/orders')} color="blue" />
                      <ActionCard icon={Headphones} label="Support Center" sublabel="Raise tickets" onClick={() => navigate('/complaint')} color="rose" />
                      <ActionCard icon={ShieldCheck} label="Privacy & Legal" sublabel="Data privacy" onClick={() => navigate('/privacy')} color="indigo" />
                      <ActionCard icon={LogOut} label="Log out" sublabel="Sign out" onClick={logout} variant="danger" />
                  </div>

                  {user.address && (
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-start gap-4">
                          <MapPin size={24} className="text-gray-400 mt-1" />
                          <div className="flex-1 min-w-0">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Permanent Address</h4>
                              <p className="text-sm font-bold text-emerald-950 italic leading-relaxed">"{user.address}"</p>
                          </div>
                          <button onClick={() => setIsEditing(true)} className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline">Edit</button>
                      </div>
                  )}
              </div>
          </div>
        </div>
      </div>

      {/* Shared Modal (Works for both) */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="absolute inset-0 bg-emerald-950/50 backdrop-blur-md" />
            <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3.5rem] p-8 sm:p-12 shadow-2xl overflow-hidden" >
              <div className="w-16 h-1 bg-gray-100 rounded-full mx-auto mb-10 sm:hidden" />
              <h2 className="text-2xl font-black text-emerald-950 mb-10 text-center uppercase tracking-tight">Update Account</h2>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Full Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4.5 text-base font-black text-emerald-950 outline-none shadow-inner" placeholder="Full name" required /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Phone Number</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4.5 text-base font-black text-emerald-950 outline-none shadow-inner" placeholder="Mobile no." /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">Address</label><textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows="2" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4.5 text-base font-black text-emerald-950 outline-none shadow-inner resize-none" placeholder="Shipping address" /></div>
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-100">{loading ? 'Saving...' : 'Save Changes'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
