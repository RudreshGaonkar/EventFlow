import api from './api';

// ── My Events ────────────────────────────────────────────────────────────────
export const getMyEvents    = ()=> api.get('/events');
export const createMyEvent  = (data)=> api.post('/events', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateMyEvent  = (id, data)    => api.put(`/events/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deactivateMyEvent = (id)=> api.patch(`/events/${id}/deactivate`);

// ── Sessions ─────────────────────────────────────────────────────────────────
export const getMySessions       = (event_id)           => api.get(`/events/${event_id}/sessions`);
export const createMySession     = (event_id, data)     => api.post(`/events/${event_id}/sessions`, data);
export const updateSessionStatus = (session_id, status) => api.patch(`/events/sessions/${session_id}/status`, { status });
export const updateSessionMultiplier = (session_id, demand_multiplier) => api.patch(`/events/sessions/${session_id}/multiplier`, { demand_multiplier });

// ── People (cast/crew pool) ───────────────────────────────────────────────────
export const getPeople    = ()=> api.get('/events/people/all');
export const createPerson = (data)=> api.post('/events/people', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updatePerson = (id, data)  => api.put(`/events/people/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ── Cast & Crew (per event) ───────────────────────────────────────────────────
export const getCast      = (event_id)        => api.get(`/events/${event_id}/cast`);
export const addCast      = (event_id, data)  => api.post(`/events/${event_id}/cast`, data);
export const removeCast   = (event_person_id) => api.delete(`/events/cast/${event_person_id}`);

// ── Venues (needed for session form) ─────────────────────────────────────────
export const getVenues    = ()  => api.get('/admin/venues/list');
