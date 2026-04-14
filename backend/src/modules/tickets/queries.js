const { getPool } = require('../../config/db');

// Get all tickets for a booking — full JOIN hierarchy required by pdfGenerator.js
const getTicketsByBooking = async (booking_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT 
         t.ticket_id, t.ticket_uuid, t.entry_status, t.issued_at, t.ticket_pdf_url,
         s.seat_label, 
         st.tier_name, 
         st.base_price AS price_paid, 
         pe.title AS event_title, 
         v.venue_name, 
         c.city_name,
         es.show_date, 
         es.show_time
       FROM tickets t 
       JOIN session_seats ss         ON t.session_seat_id = ss.session_seat_id 
       JOIN seats s                  ON ss.seat_id = s.seat_id 
       JOIN seat_tiers st            ON s.tier_id = st.tier_id 
       LEFT JOIN event_sessions es   ON es.session_id = ss.session_id
       LEFT JOIN parent_events pe    ON pe.event_id = es.event_id
       LEFT JOIN venues v            ON v.venue_id = es.venue_id
       LEFT JOIN cities c            ON c.city_id = v.city_id
       WHERE t.booking_id = ?
       ORDER BY s.seat_label`,
      [booking_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getTicketsByBooking: ' + err.message);
  }
};

// Get single ticket by ticket ID
const getTicketById = async (ticket_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT t.*, s.seat_label, st.tier_name, b.user_id, b.session_id, es.show_date, es.show_time, pe.title AS event_title, v.venue_name, c.city_name FROM tickets t JOIN bookings b ON t.booking_id = b.booking_id JOIN session_seats ss ON t.session_seat_id = ss.session_seat_id JOIN seats s ON ss.seat_id = s.seat_id JOIN seat_tiers st ON s.tier_id = st.tier_id JOIN event_sessions es ON b.session_id = es.session_id JOIN parent_events pe ON es.event_id = pe.event_id JOIN venues v ON es.venue_id = v.venue_id JOIN cities c ON v.city_id = c.city_id WHERE t.ticket_id = ?',
      [ticket_id]
    );
    return rows[0] || null;
  } catch (err) {
    throw new Error('DB error in getTicketById: ' + err.message);
  }
};

// Get ticket by QR code — used by staff to validate
const getTicketByQRCode = async (qr_code) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT t.*, s.seat_label, st.tier_name, b.user_id, b.session_id, es.show_date, es.show_time, pe.title AS event_title, v.venue_name FROM tickets t JOIN bookings b ON t.booking_id = b.booking_id JOIN session_seats ss ON t.session_seat_id = ss.session_seat_id JOIN seats s ON ss.seat_id = s.seat_id JOIN seat_tiers st ON s.tier_id = st.tier_id JOIN event_sessions es ON b.session_id = es.session_id JOIN parent_events pe ON es.event_id = pe.event_id JOIN venues v ON es.venue_id = v.venue_id WHERE t.qr_code = ?',
      [qr_code]
    );
    return rows[0] || null;
  } catch (err) {
    throw new Error('DB error in getTicketByQRCode: ' + err.message);
  }
};

// Store PDF url and public_id on ticket after upload
const updateTicketPDF = async (ticket_id, ticket_pdf_url, pdf_public_id) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE tickets SET ticket_pdf_url = ?, pdf_public_id = ? WHERE ticket_id = ?',
      [ticket_pdf_url, pdf_public_id, ticket_id]
    );
  } catch (err) {
    throw new Error('DB error in updateTicketPDF: ' + err.message);
  }
};

module.exports = {
  getTicketsByBooking,
  getTicketById,
  getTicketByQRCode,
  updateTicketPDF
};
