const { getPool } = require('../../config/db');

const callConfirmBooking = async (booking_id, razorpay_payment_id, razorpay_signature, amount) => {
  const pool = getPool();
  const conn = await pool.getConnection();

  console.log('[callConfirmBooking] Got dedicated connection');
  console.log('[callConfirmBooking] Params:', { booking_id, razorpay_payment_id, razorpay_signature: razorpay_signature?.slice(0, 30) + '...', amount });

  try {
    await conn.execute('SET @result_code = 0, @result_msg = ""');

    await conn.execute(
      'CALL confirm_booking(?, ?, ?, ?, @result_code, @result_msg)',
      [booking_id, razorpay_payment_id, razorpay_signature, amount]
    );

    const [[out]] = await conn.execute(
      'SELECT @result_code AS result_code, @result_msg AS result_msg'
    );
    console.log('[callConfirmBooking] OUT params:', out);
    return out;
  } catch (err) {
    console.error('[callConfirmBooking] SQL error:', err.message);
    throw err;
  } finally {
    conn.release();
    console.log('[callConfirmBooking] Connection released');
  }
};

const getBookingByRazorpayOrder = async (razorpay_order_id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM bookings WHERE razorpay_order_id = ? LIMIT 1',
    [razorpay_order_id]
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
       t.ticket_pdf_url,
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
  getBookingByRazorpayOrder,
  markBookingFailed,
  getTicketsByBooking,
};