import api from './api';

export const getRentableVenues = (params) => api.get('/rental/venues', { params });
export const submitRentalRequest = (body) => api.post('/rental/requests', body);
export const getMyRentalRequests = () => api.get('/rental/organizer/requests');
export const getOwnerRentalRequests = () => api.get('/rental/owner/requests');
export const updateRentalRequestStatus = (id, status) => api.patch(`/rental/requests/${id}/status`, { status });
