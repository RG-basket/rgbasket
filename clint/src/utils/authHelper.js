// clint/src/utils/authHelper.js
import axios from 'axios';
import { auth } from '../Firebase.js';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { getBrowserFingerprint } from './fingerprint';

// Helper to wait for Firebase Auth to initialize in the browser
const getFirebaseUserWeb = () => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
    // Fallback timeout in case auth doesn't initialize
    setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, 4000);
  });
};

/**
 * Attempts to silently refresh the session by fetching a new Firebase ID token
 * and exchanging it for a backend JWT session token.
 * 
 * @returns {Promise<string|null>} The new session token, or null if refresh failed.
 */
export const attemptSilentRefresh = async () => {
  // Only attempt refresh if the user is supposed to be logged in
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    console.log('[SilentRefresh] User is not logged in. Skipping refresh.');
    return null;
  }

  try {
    console.log('[SilentRefresh] Starting silent token refresh...');

    let idToken = null;
    let googleId = null;
    let name = null;
    let email = null;
    let photo = null;

    if (Capacitor.isNativePlatform()) {
      // 🚀 Native Platform: capacitor-firebase-authentication
      try {
        const tokenResult = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
        idToken = tokenResult?.token;

        const nativeUserResult = await FirebaseAuthentication.getCurrentUser();
        const nativeUser = nativeUserResult?.user;
        if (nativeUser) {
          googleId = nativeUser.uid;
          name = nativeUser.displayName;
          email = nativeUser.email;
          photo = nativeUser.photoUrl;
        }
      } catch (nativeError) {
        console.error('[SilentRefresh] Error retrieving native Firebase token:', nativeError);
      }
    } else {
      // 🌐 Web Platform: firebase web SDK
      const firebaseUser = await getFirebaseUserWeb();
      if (firebaseUser) {
        idToken = await firebaseUser.getIdToken(true); // force refresh
        googleId = firebaseUser.uid;
        name = firebaseUser.displayName;
        email = firebaseUser.email;
        photo = firebaseUser.photoURL;
      }
    }

    if (!idToken) {
      console.warn('[SilentRefresh] Failed to retrieve fresh Firebase ID token.');
      return null;
    }

    // Load existing user details from local storage as fallback
    const savedUserStr = localStorage.getItem('user');
    let savedUser = {};
    if (savedUserStr) {
      try {
        savedUser = JSON.parse(savedUserStr);
      } catch (e) {
        console.error('[SilentRefresh] Error parsing saved user from localStorage:', e);
      }
    }

    const deviceId = savedUser.deviceId || localStorage.getItem('deviceId') || getBrowserFingerprint();

    // Prepare payload for backend google auth endpoint
    const payload = {
      googleId: googleId || savedUser.googleId || savedUser._id,
      idToken,
      name: name || savedUser.name || '',
      email: email || savedUser.email || '',
      photo: photo || savedUser.photo || '',
      deviceId
    };

    if (!payload.googleId) {
      console.warn('[SilentRefresh] googleId is missing. Cannot verify auth.');
      return null;
    }

    // Call the backend endpoint to login / exchange token
    const API_URL = import.meta.env.VITE_API_URL;
    const response = await axios.post(`${API_URL}/api/auth/google`, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      // Avoid recursive interceptor loop by setting a custom option
      _skipRefreshInterceptor: true 
    });

    if (response.data && response.data.token) {
      const sessionToken = response.data.token;
      const backendUser = response.data.user;

      const userProfile = {
        ...backendUser,
        id: backendUser._id
      };

      // Update local storage
      localStorage.setItem('user', JSON.stringify(userProfile));
      localStorage.setItem('isLoggedIn', 'true');

      if (backendUser.role === 'admin') {
        localStorage.setItem('adminToken', sessionToken);
      } else {
        localStorage.removeItem('adminToken');
      }
      localStorage.setItem('userToken', sessionToken);

      console.log('[SilentRefresh] Token refreshed successfully.');

      // Dispatch event to synchronize context states in React components
      window.dispatchEvent(new CustomEvent('session-refreshed', { 
        detail: { userProfile, sessionToken } 
      }));

      return sessionToken;
    }
  } catch (error) {
    console.error('[SilentRefresh] Silent token refresh failed:', error);
  }

  return null;
};
