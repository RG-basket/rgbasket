import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export const useNetworkStatus = () => {
    const [status, setStatus] = useState({
        connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
        connectionType: 'unknown'
    });

    useEffect(() => {
        let handler;

        const updateStatus = async () => {
            let isConnected = navigator.onLine;
            let type = 'web';

            if (Capacitor.isNativePlatform()) {
                try {
                    const currentStatus = await Network.getStatus();
                    isConnected = currentStatus.connected;
                    type = currentStatus.connectionType;
                } catch (e) {
                    console.warn("Capacitor Network plugin failed, falling back to web API", e);
                }
            }

            console.log(`🌐 Network Check: ${isConnected ? 'ONLINE' : 'OFFLINE'} (${type})`);
            setStatus({ connected: isConnected, connectionType: type });
        };

        // Listen for events
        const handleOnline = () => {
            console.log("🟢 Browser signaled ONLINE");
            setStatus(prev => ({ ...prev, connected: true }));
        };
        const handleOffline = () => {
            console.log("🔴 Browser signaled OFFLINE");
            setStatus(prev => ({ ...prev, connected: false }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (Capacitor.isNativePlatform()) {
            handler = Network.addListener('networkStatusChange', (status) => {
                console.log('📱 Native status changed:', status);
                setStatus(status);
            });
        }

        // Run initial check
        updateStatus();

        return () => {
            if (handler) handler.then(h => h.remove());
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return status;
};
