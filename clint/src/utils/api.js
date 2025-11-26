import { sanitizeInput } from './security';

// Get auth token securely
export const getAuthToken = () => {
  try {
    return localStorage.getItem(import.meta.env.VITE_ADMIN_TOKEN_KEY || 'adminAuthToken');
  } catch (error) {
    console.error('Error accessing token:', error);
    return null;
  }
};

// Secure API wrapper
export const secureFetch = async (url, options = {}) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL ;
  const token = getAuthToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // Handle unauthorized
    if (response.status === 401) {
      localStorage.removeItem(import.meta.env.VITE_ADMIN_TOKEN_KEY || 'adminAuthToken');
      window.location.href = '/admin/login';
      throw new Error('Authentication failed');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};