import api from './api';

export const browseEvents= (params) => api.get('/browse/events', { params });
export const getEventDetail  = (id)=> api.get(`/browse/events/${id}`);
export const getEventSessions= (id)=> api.get(`/browse/events/${id}/sessions`);
export const getBrowseCities = ()=> api.get('/browse/cities');
export const getBrowseStates  = ()=> api.get('/browse/states'); 