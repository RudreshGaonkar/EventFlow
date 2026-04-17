const db = require('../../config/db');

const validateTicket = async (ticket_uuid, staff_id) => {
  await db.query(
    'CALL validate_ticket(?, ?, @result_code, @result_msg)',
    [ticket_uuid, staff_id]
  );

  const [[out]] = await db.query(
    'SELECT @result_code AS result_code, @result_msg AS result_msg'
  );

  return out;
};

// Returns metadata about a ticket for display, plus the session_id it belongs to
// so the service layer can enforce strict session matching.
const getTicketPreview = async (ticket_uuid) => {
  const [rows] = await db.query(
    `SELECT
       t.ticket_uuid,
       t.entry_status,
       es.session_id,
       pe.title       AS event_title,
       pe.event_type,
       v.venue_name,
       es.show_date,
       es.show_time,
       st.tier_name,
       s.seat_label,
       u.full_name     AS attendee_name
     FROM tickets t
     JOIN session_seats  ss ON ss.session_seat_id = t.session_seat_id
     JOIN seats          s  ON s.seat_id           = ss.seat_id
     JOIN seat_tiers     st ON st.tier_id          = s.tier_id
     JOIN event_sessions es ON es.session_id        = ss.session_id
     JOIN parent_events  pe ON pe.event_id          = es.event_id
     JOIN venues         v  ON v.venue_id           = es.venue_id
     JOIN bookings       b  ON b.booking_id         = t.booking_id
     JOIN users          u  ON u.user_id            = b.user_id
     WHERE t.ticket_uuid = ?`,
    [ticket_uuid]
  );
  return rows[0] || null;
};

module.exports = { validateTicket, getTicketPreview };
