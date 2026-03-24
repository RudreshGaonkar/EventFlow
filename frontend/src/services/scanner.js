import api from './api';

export const validateTicket = (ticket_uuid) => api.post('/scanner/validate', { ticket_uuid });
