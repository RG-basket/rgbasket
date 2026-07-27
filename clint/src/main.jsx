import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext.jsx';

import axios from 'axios';
import { attemptSilentRefresh } from './utils/authHelper';

// Global request/response interceptor for native window.fetch
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('userToken');
  let token = adminToken || userToken;

  // Initialize headers if not present
  if (!options.headers) {
    options.headers = {};
  }

  if (token) {
    options.headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };
  }

  try {
    let response = await originalFetch(url, options);

    // If unauthorized (401), try to refresh session and retry once
    const urlString = typeof url === 'string' ? url : (url instanceof Request ? url.url : '');
    if (
      response.status === 401 && 
      !urlString.includes('/api/auth/google') && 
      !options._skipRefresh
    ) {
      console.warn('[Fetch Interceptor] Unauthorized (401). Attempting silent session refresh...');
      const newToken = await attemptSilentRefresh();
      if (newToken) {
        // Update auth header with new token
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        };
        // Flag to prevent infinite retry loops
        options._skipRefresh = true;
        return originalFetch(url, options);
      }
    }
    return response;
  } catch (error) {
    return Promise.reject(error);
  }
};

// Global request interceptor for Axios
axios.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('userToken');
  const token = adminToken || userToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Global response interceptor for Axios to handle 401s and retry
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if it's 401, not already retried, not auth endpoint, and not explicitly skipped
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes('/api/auth/google') &&
      !originalRequest._skipRefreshInterceptor
    ) {
      originalRequest._retry = true;
      console.warn('[Axios Interceptor] Unauthorized (401). Attempting silent session refresh...');
      
      const newToken = await attemptSilentRefresh();
      if (newToken) {
        // Update header and retry
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </StrictMode>
);