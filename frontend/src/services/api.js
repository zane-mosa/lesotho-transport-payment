// services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth services
export const authService = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getProfile: () => api.get('/auth/me'),
};

// Payment services
export const paymentService = {
    initiatePayment: (data) => api.post('/payments/initiate', data),
    getHistory: () => api.get('/payments/history'),
    checkStatus: (reference) => api.get(`/payments/status/${reference}`),
};

// Driver services
export const driverService = {
    registerVehicle: (data) => api.post('/driver/register-vehicle', data),
    getDashboard: () => api.get('/driver/dashboard'),
    verifyPayment: (qrData) => api.post('/driver/verify-payment', { qr_data: qrData }),
    getDailyReport: (date) => api.get(`/driver/daily-report${date ? `?date=${date}` : ''}`),
    generateQR: () => api.get('/driver/generate-qr'),
    confirmPayment: (transactionId) => api.post(`/driver/confirm-payment/${transactionId}`),
};

export default api;