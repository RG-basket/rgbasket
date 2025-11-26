import React from 'react';

const UserInfo = ({ user }) => {
    if (!user) return null;

    return (
        <div className="mb-4 sm:mb-6 p-3 bg-white rounded-lg sm:rounded-xl border border-green-200">
            <p className="text-xs sm:text-sm font-medium text-green-700 mb-2">ORDERING AS</p>
            <div className="flex items-center space-x-2 sm:space-x-3">
                {user.photo ? (
                    <img
                    />
                ) : (
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
                        <span className="text-green-600 font-medium text-sm">
                            {user.name?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user.name}</p>
                    <p className="text-gray-500 text-xs sm:text-sm truncate">{user.email}</p>
                </div>
            </div>
        </div>
    );
};

export default UserInfo;
