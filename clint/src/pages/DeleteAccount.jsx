import React from 'react';
import { useAppContext } from '../context/AppContext';
import { FaTrashAlt, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const DeleteAccount = () => {
    const { isLoggedIn, loginWithGoogle, deleteAccount, loading, user } = useAppContext();

    const handleDelete = async () => {
        await deleteAccount();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-red-600 p-8 text-center text-white">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <FaTrashAlt size={28} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">Delete Account</h1>
                    <p className="text-red-100 text-sm font-medium mt-1">Data Removal Request</p>
                </div>

                <div className="p-8">
                    {!isLoggedIn ? (
                        <div className="text-center space-y-6">
                            <p className="text-gray-600 text-sm leading-relaxed">
                                To protect your privacy and security, please sign in with your Google account first to verify ownership of the data you wish to delete.
                            </p>
                            <button
                                onClick={loginWithGoogle}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
                            >
                                <img 
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                                    alt="Google" 
                                    className="w-5 h-5 bg-white p-0.5 rounded-full" 
                                />
                                <span>Sign in to verify</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <img src={user?.photo} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                                <div>
                                    <p className="font-bold text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500 font-medium">{user?.email}</p>
                                </div>
                            </div>

                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3">
                                <FaExclamationTriangle className="text-red-600 mt-1 flex-shrink-0" size={16} />
                                <div className="space-y-1">
                                    <p className="text-red-800 text-xs font-black uppercase tracking-wider">Warning</p>
                                    <p className="text-red-700 text-[13px] font-medium leading-relaxed">
                                        This will permanently delete your profile, order history, RG Coins, and saved addresses. This action cannot be reversed.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className={`w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-[0.98] shadow-lg ${
                                    loading 
                                    ? "bg-gray-400 cursor-not-allowed" 
                                    : "bg-red-600 hover:bg-red-700 shadow-red-100"
                                }`}
                            >
                                {loading ? "Deleting data..." : "Confirm Account Deletion"}
                            </button>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                        <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm font-bold">
                            <FaArrowLeft size={12} />
                            <span>Back to Home</span>
                        </Link>
                    </div>
                </div>
            </div>
            
            <p className="mt-8 text-center text-[11px] text-gray-400 max-w-sm leading-relaxed font-medium">
                Compliant with Google Play Data Safety Policy. <br/>
                All associated data will be permanently removed from our servers within 30 days of your request.
            </p>
        </div>
    );
};

export default DeleteAccount;
