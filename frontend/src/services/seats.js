import api from './api';

export const getTiers = () => api.get('/seats/tiers');
export const getSessionSeatMap = (sessionId) => api.get(`/seats/session/${sessionId}`);
export const getVenueSeats = (venueId) => api.get(`/seats/venue/${venueId}`);
export const addSeat = (venueId, data) => api.post(`/seats/venue/${venueId}/seat`, data);
export const addBulkSeats = (venueId, data) => api.post(`/seats/venue/${venueId}/seats/bulk`, data);
