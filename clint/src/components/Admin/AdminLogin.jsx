import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AdminLogin = () => {
  const { user, isLoggedIn } = useAppContext();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && localStorage.getItem('adminToken')) {
      if (user?.role === 'admin') {
        setLoginSuccess(true);
        setMessage('Access granted! Redirecting to admin dashboard...');
        const timer = setTimeout(() => {
          navigate('/portal-dashboard');
        }, 1500);
        return () => clearTimeout(timer);
      } else {
        setLoginSuccess(false);
        setMessage('Access Denied: You do not have administrator permissions.');
      }
    }
  }, [isLoggedIn, user, navigate]);

  const handleDecoySubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage('');
    
    try {
      // Send credentials directly to the tripwire honeypot backend
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
        adminId,
        password
      });
      
      // The honeypot ALWAYS returns 401, but in case of anomaly:
      if (response.data.success) {
        setMessage('Login successful.');
      } else {
        setMessage(response.data.message || 'Invalid credentials. Attempt logged.');
      }
    } catch (error) {
      // Catching the expected 401 Unauthorized tripwire response
      const errMsg = error.response?.data?.message || 'Invalid credentials. Attempt logged.';
      setMessage(errMsg);
      toast.error('Access Denied');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-900/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-900/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-900/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo Section */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-2xl flex items-center justify-center mb-6 border border-blue-400/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Admin Portal
          </h2>
          <p className="mt-3 text-lg text-gray-300 font-medium">
            Secure Access Control
          </p>
        </div>
      </div>

      <div className="relative mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-2xl rounded-3xl py-10 px-8 sm:px-10 transform transition-all duration-300 hover:shadow-2xl">
          
          <form onSubmit={handleDecoySubmit} className="space-y-6">
            <div>
              <label htmlFor="adminId" className="block text-sm font-medium text-gray-300">
                Admin ID / Username
              </label>
              <div className="mt-1">
                <input
                  id="adminId"
                  name="adminId"
                  type="text"
                  required
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="e.g., admin_main"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Security Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 transform active:scale-[0.98]"
              >
                {submitLoading ? 'Verifying credentials...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 rounded-2xl p-4 border-l-4 ${loginSuccess
                ? 'bg-green-900/30 border-green-400 text-green-300'
                : 'bg-red-900/30 border-red-400 text-red-300'
              } backdrop-blur-sm text-sm font-medium transform transition-all duration-300`}>
              {message}
            </div>
          )}

          {/* Decoy Navigation Links */}
          <div className="mt-8 flex justify-between items-center text-xs text-gray-500 border-t border-gray-700/50 pt-4">
            <button
              onClick={() => navigate('/')}
              className="hover:text-gray-300 hover:underline transition-colors flex items-center"
            >
              ← Back to Main Site
            </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="relative mt-12 text-center">
        <p className="text-sm text-gray-600">
          © 2026 Admin Portal • Secure Access System
        </p>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;