import React, { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { messaging } from '../../Firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { App } from '@capacitor/app';

import NotificationPrompt from './NotificationPrompt';

const PushNotificationManager = () => {
    const { user } = useAppContext();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
                        alert(`🔔 ${payload.notification?.title}\n\n${payload.notification?.body}`);
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
            alert(`🔔 ${notification.title}\n\n${notification.body}`);
        });

        await PushNotifications.register();

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Native push action performed:', notification);
            const data = notification.notification.data;
            if (data && data.path) {
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



