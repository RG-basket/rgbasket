import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext.jsx';

import axios from 'axios';

// Global request interceptor for native window.fetch
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('userToken');
  const token = adminToken || userToken;

  if (token) {
    options.headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };
  }
  return originalFetch(url, options);
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </StrictMode>
);