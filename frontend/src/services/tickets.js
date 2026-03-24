import api from './api';

export const getMyTickets = (bookingId) => api.get(`/tickets/booking/${bookingId}`);
export const getTicketDetail = (ticketId) => api.get(`/tickets/${ticketId}`);
