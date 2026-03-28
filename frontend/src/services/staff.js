import api from './api';

export const getAllStaff = () => api.get('/staff');
export const addStaff = (data) => api.post('/staff', data);
export const toggleStaffActive = (user_id, is_active) => api.patch(`/staff/${user_id}/active`, { is_active });
export const assignStaffVenue = (user_id, venue_id) => api.patch(`/staff/${user_id}/venue`, { venue_id });