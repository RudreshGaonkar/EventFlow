import api from './api';

export const getTickets = (booking_id) =>
  api.get(`/payment/tickets/${booking_id}`);