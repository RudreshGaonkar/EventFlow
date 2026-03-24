import api from './api';

export const getStates = () => api.get('/admin/states');
export const addState = (data) => api.post('/admin/states', data);
export const editState = (id, data) => api.put(`/admin/states/${id}`, data);
export const removeState = (id) => api.delete(`/admin/states/${id}`);

export const getCities = (params) => api.get('/admin/cities', { params });
export const addCity = (data) => api.post('/admin/cities', data);
export const editCity = (id, data) => api.put(`/admin/cities/${id}`, data);
export const editCityMultiplier = (id, data) => api.patch(`/admin/cities/${id}/multiplier`, data);
export const removeCity = (id) => api.delete(`/admin/cities/${id}`);

export const getVenues = (params) => api.get('/admin/venues', { params });
export const addVenue = (data) => api.post('/admin/venues', data);
export const editVenue = (id, data) => api.put(`/admin/venues/${id}`, data);
export const deactivateVenue = (id) => api.patch(`/admin/venues/${id}/deactivate`);

export const getUsers = () => api.get('/admin/users');
export const getRoles = () => api.get('/admin/roles');
export const changeUserRole = (id, data) => api.patch(`/admin/users/${id}/role`, data);

export const getStaff = () => api.get('/staff');
export const addStaff = (data) => api.post('/staff', data);
export const toggleStaffActive = (id, data) => api.patch(`/staff/${id}/active`, data);
