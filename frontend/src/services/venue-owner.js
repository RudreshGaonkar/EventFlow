import api from './api';

// Venues
export const getMyVenues     = ()         => api.get('/venue-owner/my-venues');
export const createMyVenue   = (data)     => api.post('/venue-owner/my-venues', data);
export const updateMyVenue   = (id, data) => api.put(`/venue-owner/my-venues/${id}`, data);

// Seats
export const getVenueSeats   = (venueId)          => api.get(`/venue-owner/my-venues/${venueId}/seats`);
export const addVenueSeats   = (venueId, data)    => api.post(`/venue-owner/my-venues/${venueId}/seats`, data);
export const toggleVenueSeat = (seatId, is_active) => api.patch(`/venue-owner/my-venues/seats/${seatId}`, { is_active });

// Staff
export const getMyStaff = () => api.get('/venue-owner/my-staff');

// Cities
export const getCities = () => api.get('/venue-owner/cities');

// Admin approval (used by VenuesTab.jsx in admin panel)
export const getPendingVenues = ()   => api.get('/venue-owner/pending');
export const approveVenue     = (id) => api.patch(`/venue-owner/pending/${id}/approve`);
export const rejectVenue      = (id) => api.patch(`/venue-owner/pending/${id}/reject`);