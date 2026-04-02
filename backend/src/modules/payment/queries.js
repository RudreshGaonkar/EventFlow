const { getPool } = require('../../config/db');

const callConfirmBooking = async (booking_id, stripe_payment_intent_id, stripe_signature, amount) => {
  const pool = getPool();

  await pool.execute('SET @result_code = 0, @result_msg = ""');

  await pool.execute(
    'CALL confirm_booking(?, ?, ?, ?, @result_code, @result_msg)',
    [booking_id, stripe_payment_intent_id, stripe_signature, amount]
  );

  const [[out]] = await pool.execute(
    'SELECT @result_code AS result_code, @result_msg AS result_msg'
  );

  return out;
};

const getBookingByStripeSession = async (stripe_session_id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM bookings WHERE stripe_session_id = ? LIMIT 1',
    [stripe_session_id]
  );
  return rows[0] || null;
};

const markBookingFailed = async (booking_id) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      'UPDATE bookings SET booking_status = ? WHERE booking_id = ?',
      ['Cancelled', booking_id]
    );

    await conn.execute(`
      UPDATE session_seats ss
      JOIN booking_seats bs ON ss.session_seat_id = bs.session_seat_id
      SET ss.status = 'Available', ss.locked_until = NULL
      WHERE bs.booking_id = ?
    `, [booking_id]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const getTicketsByBooking = async (booking_id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT
       t.ticket_id, t.ticket_uuid, t.entry_status, t.issued_at,
       s.seat_label, st.tier_name,
       pe.title AS event_title, pe.poster_url,
       v.venue_name, c.city_name,
       es.show_date, es.show_time
     FROM tickets t
     JOIN session_seats ss ON ss.session_seat_id = t.session_seat_id
     JOIN seats s          ON s.seat_id  = ss.seat_id
     JOIN seat_tiers st    ON st.tier_id = s.tier_id
     JOIN event_sessions es ON es.session_id = ss.session_id
     JOIN parent_events pe  ON pe.event_id   = es.event_id
     JOIN venues v          ON v.venue_id    = es.venue_id
     JOIN cities c          ON c.city_id     = v.city_id
     WHERE t.booking_id = ?
     ORDER BY s.seat_label`,
    [booking_id]
  );
  return rows;
};

module.exports = {
  callConfirmBooking,
  getBookingByStripeSession,
  markBookingFailed,
  getTicketsByBooking,
};