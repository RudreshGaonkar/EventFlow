import api from './api';

// States
export const getStates    = ()=> api.get('/admin/states');
export const createState  = (data)=> api.post('/admin/states', data);
export const updateState  = (id, data)   => api.put(`/admin/states/${id}`, data);
export const deleteState  = (id)=> api.delete(`/admin/states/${id}`);

// Cities
export const getCities    = (state_id)   => api.get('/admin/cities', { params: { state_id } });
export const createCity   = (data)       => api.post('/admin/cities', data);
export const updateCity   = (id, data)   => api.put(`/admin/cities/${id}`, data);
export const deleteCity   = (id)=> api.delete(`/admin/cities/${id}`);

// Venues
export const getVenues= (city_id) => api.get('/admin/venues', { params: { city_id } });
export const createVenue     = (data)    => api.post('/admin/venues', data);
export const updateVenue     = (id, data)=> api.put(`/admin/venues/${id}`, data);
// was DELETE /admin/venues/:id, now PATCH /admin/venues/:id/deactivate
export const deactivateVenue = (id)=> api.patch(`/admin/venues/${id}/deactivate`);

// Users
export const getUsers= ()=> api.get('/admin/users');
export const getRoles= ()=> api.get('/admin/roles');
// was PUT, now PATCH
export const changeUserRole  = (id, role_id)  => api.patch(`/admin/users/${id}/role`, { role_id });
// Admin creates a user directly
export const createUser= (data)=> api.post('/admin/users', data);

// Events (uses /events routes)
export const getEvents    = ()=> api.get('/events');
export const createEvent  = (data)=> api.post('/events', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateEvent  = (id, data)   => api.put(`/events/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteEvent  = (id)         => api.delete(`/events/${id}`);

// Sessions (uses /events/:id/sessions)
export const getSessions= (event_id)=> api.get(`/events/${event_id}/sessions`);
export const createSession= (event_id, data)=> api.post(`/events/${event_id}/sessions`, data);
export const updateSessionStatus = (session_id, status)=> api.patch(`/events/sessions/${session_id}/status`, { status });
