import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. Please check your connection and try again.';
    } else if (!error.response && error.request) {
      message = 'Unable to reach the server. Please check your internet connection.';
    }

    const errorData = error.response?.data || {
      success: false,
      message,
      errors: [],
    };
    return Promise.reject(errorData);
  }
);

export default api;
