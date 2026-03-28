import api from './api';

// Venue Owner
export const getMyVenues   = ()=> api.get('/venue-owner/my-venues');
export const createMyVenue = (data)=> api.post('/venue-owner/my-venues', data);
export const updateMyVenue = (id, data)  => api.put(`/venue-owner/my-venues/${id}`, data);
export const getMyStaff    = ()=> api.get('/venue-owner/my-staff');

// Admin
export const getPendingVenues  = ()   => api.get('/venue-owner/pending');
export const approveVenue= (id) => api.patch(`/venue-owner/pending/${id}/approve`);
export const rejectVenue= (id) => api.patch(`/venue-owner/pending/${id}/reject`);
export const getCities = () => api.get('/venue-owner/cities');