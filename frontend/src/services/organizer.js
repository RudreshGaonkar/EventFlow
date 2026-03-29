import api from './api';

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

// Events
export const getMyEvents= ()=> api.get('/organizer/events');
export const createMyEvent= (fd)=> api.post('/organizer/events', fd, multipart);
export const updateMyEvent= (id, fd) => api.put(`/organizer/events/${id}`, fd, multipart);
export const deactivateMyEvent = (id)     => api.delete(`/organizer/events/${id}`);

// Sessions
export const getMySessions= (eventId)=> api.get(`/organizer/events/${eventId}/sessions`);
export const createMySession= (eventId, data) => api.post(`/organizer/events/${eventId}/sessions`, data);
export const updateSessionStatus     = (sessionId, status)=> api.patch(`/organizer/sessions/${sessionId}/status`, { status });
export const updateSessionMultiplier = (sessionId, demand_multiplier) => api.patch(`/organizer/sessions/${sessionId}/multiplier`, { demand_multiplier });

// People
export const getPeople    = ()=> api.get('/organizer/people');
export const createPerson = (fd)      => api.post('/organizer/people', fd, multipart);
export const updatePerson = (id, fd)  => api.put(`/organizer/people/${id}`, fd, multipart);

// Cast
export const getCast    = (eventId)=> api.get(`/organizer/events/${eventId}/cast`);
export const addCast    = (eventId, data)  => api.post(`/organizer/events/${eventId}/cast`, data);
export const removeCast = (eventPersonId)  => api.delete(`/organizer/cast/${eventPersonId}`);

// Venues
export const getVenues = () => api.get('/organizer/venues');