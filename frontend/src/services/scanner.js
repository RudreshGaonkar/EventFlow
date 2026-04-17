import api from './api';

export const validateTicket = (ticket_uuid, session_id) =>
  api.post('/scanner/validate', { ticket_uuid, session_id });