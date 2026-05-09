import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.jsx";
import { FaGift } from "react-icons/fa";

const Login = () => {

  const { loginWithGoogle, loading } = useAppContext();
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    // Check for a captured referral code from URL/localStorage
    const savedCode = localStorage.getItem('pendingReferralCode');
    if (savedCode) {
      setReferralCode(savedCode);
    }
  }, []);

  const handleLogin = () => {
    // If a user manually types/changes the code, update localStorage
    if (referralCode) {
      localStorage.setItem('pendingReferralCode', referralCode.toUpperCase().trim());
    }
    loginWithGoogle();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          Login to RG Basket
        </h2>
        <p className="text-gray-500 text-sm font-medium">
          Freshness delivered to your doorstep.
        </p>
      </div>

      {/* Referral Code Input Area */}
      <div className="space-y-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
        <div className="flex items-center gap-2 text-emerald-700">
          <FaGift className="animate-bounce" size={14} />
          <span className="text-[11px] font-black uppercase tracking-widest">Referral Bonus</span>
        </div>
        
        <div className="relative group">
          <input
            type="text"
            placeholder="Have a referral code? (Optional)"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="w-full bg-white border-2 border-gray-100 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-bold tracking-widest text-gray-800 placeholder:text-gray-300 transition-all outline-none"
          />
          {referralCode && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              APPLIED
            </div>
          )}
        </div>
        <p className="text-[10px] text-emerald-600/70 font-medium px-1">
          Apply a code to get <span className="font-bold">RG Coins</span> after your first order!
        </p>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        aria-label="Sign in with Google"
        className={`w-full flex items-center justify-center gap-3 bg-[#005531] text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-200 ${
          loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#004024] hover:shadow-emerald-300"
        }`}
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        ) : (
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5 bg-white p-0.5 rounded-full" 
          />
        )}
        <span>{loading ? "Establishing connection..." : "Continue with Google"}</span>
      </button>

      <div className="text-center">
        <p className="text-[10px] text-gray-400 font-medium">
          By continuing, you agree to our <Link to="/terms" className="text-emerald-600 hover:underline">Terms</Link> and <Link to="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
};

export default Login;