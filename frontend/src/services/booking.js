import api from './api';

export const createBooking = (data) => api.post('/booking', data);
export const getMyBookings = () => api.get('/booking/my');
export const getBookingDetail = (id) => api.get(`/booking/${id}`);
export const cancelBooking = (id) => api.patch(`/booking/${id}/cancel`);
