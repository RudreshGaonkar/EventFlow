import api from './api';

export const browseEvents = (params) => api.get('/events/browse', { params });
export const getEvents = () => api.get('/events');
export const getEvent = (id) => api.get(`/events/${id}`);
export const getCast = (id) => api.get(`/events/${id}/cast`);
export const getSessions = (id) => api.get(`/events/${id}/sessions`);
export const getEventReviews = (id) => api.get(`/events/${id}/reviews`);
export const getSessionReviews = (id) => api.get(`/events/sessions/${id}/reviews`);
export const addReview = (data) => api.post('/events/reviews', data);
export const addEvent = (data) => api.post('/events', data);
export const editEvent = (id, data) => api.put(`/events/${id}`, data);
export const addSession = (eventId, data) => api.post(`/events/${eventId}/sessions`, data);
export const editSessionStatus = (sessionId, data) => api.patch(`/events/sessions/${sessionId}/status`, data);
