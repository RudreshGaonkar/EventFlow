import api from './api';

export const verifyPayment = (data) => api.post('/payment/verify', data);
export const handleFailure = (data) => api.post('/payment/failure', data);
export const getPaymentStatus = (bookingId) => api.get(`/payment/status/${bookingId}`);
