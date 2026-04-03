import api from './api';

export const registerForEvent  = (event_id, data)  => api.post(`/registration/${event_id}`, data);
export const getMyRegistrations = ()=> api.get('/registration/my');
export const getRegistration   = (id)=> api.get(`/registration/${id}`);
export const cancelRegistration = (id)=> api.delete(`/registration/${id}`);