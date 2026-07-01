import React, { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { messaging } from '../../Firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { useAppContext } from '../../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';

import NotificationPrompt from './NotificationPrompt';

// ✅ FIXED: No localhost fallback — if VITE_API_URL is missing, we know immediately
// instead of silently sending tokens to a dev machine that ignores them.
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
    console.error('❌ CRITICAL: VITE_API_URL is not set! Push token registration will fail. Check your .env file.');
}

const PushNotificationManager = () => {
    const { user } = useAppContext();

    useEffect(() => {
        if (!user) return;

        if (Capacitor.isNativePlatform()) {
            registerPushNative();
        } else {
            // Check if already granted, if so register. If not, the Prompt component will handle it.
            if (window.Notification && Notification.permission === 'granted') {
                registerPushWeb();
            }
        }
    }, [user]);


    const saveTokenToBackend = async (token, platform = 'web') => {
        const userId = user?.id || user?._id;
        console.log(`📡 Saving token for User: ${userId}`, { token, platform });
        
        if (!userId) {
            console.error('❌ Cannot save token: User ID is missing!');
            return;
        }

        try {
            const response = await axios.patch(`${API_URL}/api/users/${userId}/push-token`, { 
                token,
                platform 
            });
            console.log('✅ Token saved successfully:', response.data);
        } catch (error) {
            console.error('❌ Server Error Details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
        }
    };

    const showBeautifulToast = (title, body, imageUrl, clickAction = '/') => {
        toast.custom((t) => (
            <div
                className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white dark:bg-gray-950 shadow-2xl rounded-2xl pointer-events-auto flex flex-col overflow-hidden border border-gray-100 dark:border-gray-900 transition-all duration-300 cursor-pointer hover:shadow-emerald-100/50`}
                onClick={() => {
                    toast.dismiss(t.id);
                    if (clickAction) {
                        window.location.href = clickAction;
                    }
                }}
            >
                <div className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <span className="text-xl">🛒</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {body}
                        </p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.dismiss(t.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xs font-bold px-2 py-1 shrink-0"
                    >
                        Dismiss
                    </button>
                </div>
                {imageUrl && (
                    <div className="px-4 pb-4">
                        <img 
                            src={imageUrl} 
                            alt="Banner" 
                            className="w-full h-36 object-cover rounded-xl border border-gray-50 dark:border-gray-900 shadow-sm"
                        />
                    </div>
                )}
            </div>
        ), {
            duration: 6000,
            position: 'top-right'
        });
    };

    const registerPushWeb = async () => {
        console.log('🔔 Starting Web Push registration...');
        try {
            const messagingInstance = await messaging();
            if (!messagingInstance) {
                console.warn('⚠️ Messaging instance not available');
                return 'failed';
            }

            const permission = await Notification.requestPermission();
            console.log('🔐 Permission status:', permission);
            
            if (permission === 'granted') {
                console.log('🎯 Registering Service Worker manually...');
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('✅ Service Worker registered:', registration);

                console.log('🎯 Fetching FCM token...');
                const token = await getToken(messagingInstance, {
                    vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
                    serviceWorkerRegistration: registration
                });
                
                if (token) {
                    console.log('🎟️ Token generated:', token);
                    saveTokenToBackend(token, 'web');
                    onMessage(messagingInstance, (payload) => {
                        console.log('Foreground message received:', payload);
                        const title = payload.notification?.title || (payload.data && payload.data.title) || 'RG Basket';
                        const body = payload.notification?.body || (payload.data && payload.data.body) || '';
                        const imageUrl = payload.notification?.image || (payload.data && (payload.data.image || payload.data.imageUrl)) || null;
                        const path = (payload.data && payload.data.path) || '/';
                        showBeautifulToast(title, body, imageUrl, path);
                    });
                } else {
                    console.warn('⚠️ No token generated');
                }
                return 'granted';
            }
            return permission;
        } catch (error) {
            console.error('❌ Web push error:', error);
            return 'error';
        }
    };

    const registerPushNative = async () => {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') return;

        // ✅ FIXED: Remove all previous listeners BEFORE adding new ones.
        // Without this, every time user logs in/out the listeners stack up,
        // causing duplicate token saves and registration events.
        await PushNotifications.removeAllListeners();

        // Setup Listeners BEFORE Registering
        PushNotifications.addListener('registration', (token) => {
            console.log('📱 Android Token Generated:', token.value);
            saveTokenToBackend(token.value, 'android');
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('❌ Push registration error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Native push received:', notification);
            const title = notification.title || 'RG Basket';
            const body = notification.body || '';
            const imageUrl = notification.data?.image || notification.data?.imageUrl || null;
            const path = notification.data?.path || '/';
            showBeautifulToast(title, body, imageUrl, path);
        });

        await PushNotifications.register();

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Native push action performed:', notification);
            const data = notification.notification.data;
            if (data && data.path) {
                // ✅ Use React Router-compatible navigation
                window.location.href = data.path;
            }
        });
    };

    return (
        <>
            {!Capacitor.isNativePlatform() && (
                <NotificationPrompt onEnable={registerPushWeb} />
            )}
        </>
    );
};

export default PushNotificationManager;



