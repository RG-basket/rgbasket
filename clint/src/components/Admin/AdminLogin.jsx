import React, { useState } from 'react';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    adminId: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setMessage('Login successful! Redirecting to admin dashboard...');
        localStorage.setItem('adminToken', data.token);
        
        // Redirect to admin dashboard
        setTimeout(() => {
          window.location.href = '/admin-dashboard';
        }, 2000);
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Admin Portal
          </h2>
          <p className="mt-3 text-lg text-gray-300 font-medium">
            Secure Access to Dashboard
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Enter your credentials to continue
          </p>
        </div>
      </div>

      <div className="relative mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 shadow-2xl rounded-3xl py-10 px-8 sm:px-10 transform transition-all duration-300 hover:shadow-2xl">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Admin ID Field */}
            <div className="space-y-4">
              <label htmlFor="adminId" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Admin ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="adminId"
                  name="adminId"
                  type="text"
                  required
                  value={formData.adminId}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-4 text-lg border border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 backdrop-blur-sm text-white placeholder-gray-400 shadow-sm"
                  placeholder="Enter your admin ID"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-4">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-4 text-lg border border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 backdrop-blur-sm text-white placeholder-gray-400 shadow-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-2xl text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In to Dashboard
                  </span>
                )}
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`rounded-2xl p-5 border-l-4 ${
                token 
                  ? 'bg-green-900/30 border-green-400' 
                  : 'bg-red-900/30 border-red-400'
              } backdrop-blur-sm transform transition-all duration-300`}>
                <div className="flex items-start">
                  <div className={`flex-shrink-0 ${
                    token ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {token ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      token ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {message}
                    </p>
                    {token && (
                      <div className="mt-2">
                        <div className="w-full bg-green-900/50 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Security Note */}
            <div className="text-center pt-4">
              <p className="text-xs text-gray-500 flex items-center justify-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Your credentials are encrypted and secure
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="relative mt-12 text-center">
        <p className="text-sm text-gray-600">
          © 2024 Admin Portal • Secure Access System
        </p>
      </div>

      {/* Add custom animations to tailwind config */}
      <style jsx>{`
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