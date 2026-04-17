const { getPool } = require('../../config/db');

// Call book_seats stored procedure
const callBookSeats = async (user_id, session_id, seat_ids) => {
  try {
    const pool = getPool();
    // Pass seat_ids as JSON array string
    const seatIdsJson = JSON.stringify(seat_ids);

    await pool.execute('SET @booking_id = 0, @result_code = 0, @result_msg = ""');

    await pool.execute(
      'CALL book_seats(?, ?, ?, @booking_id, @result_code, @result_msg)',
      [user_id, session_id, seatIdsJson]
    );

    const [[outParams]] = await pool.execute(
      'SELECT @booking_id AS booking_id, @result_code AS result_code, @result_msg AS result_msg'
    );

    return outParams;
  } catch (err) {
    throw new Error('DB error in callBookSeats: ' + err.message);
  }
};

// Get a single booking by ID
const getBookingById = async (booking_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT b.*, es.show_date, es.show_time, pe.title AS event_title, v.venue_name FROM bookings b JOIN event_sessions es ON b.session_id = es.session_id JOIN parent_events pe ON es.event_id = pe.event_id JOIN venues v ON es.venue_id = v.venue_id WHERE b.booking_id = ?',
      [booking_id]
    );
    return rows[0] || null;
  } catch (err) {
    throw new Error('DB error in getBookingById: ' + err.message);
  }
};

// Get all bookings for a user
const getBookingsByUser = async (user_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT b.*, es.show_date, es.show_time, pe.title AS event_title, v.venue_name FROM bookings b JOIN event_sessions es ON b.session_id = es.session_id JOIN parent_events pe ON es.event_id = pe.event_id JOIN venues v ON es.venue_id = v.venue_id WHERE b.user_id = ? ORDER BY b.booked_at DESC',
      [user_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getBookingsByUser: ' + err.message);
  }
};

// Get seats for a booking
const getBookingSeats = async (booking_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT bs.*, s.seat_label, st.tier_name FROM booking_seats bs JOIN session_seats ss ON bs.session_seat_id = ss.session_seat_id JOIN seats s ON ss.seat_id = s.seat_id JOIN seat_tiers st ON s.tier_id = st.tier_id WHERE bs.booking_id = ?',
      [booking_id]
    );
    return rows;
  } catch (err) {
    throw new Error('DB error in getBookingSeats: ' + err.message);
  }
};

// Cancel a booking — update status to Cancelled and release seats
const cancelBooking = async (booking_id, user_id) => {
  try {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Update booking status — trigger will log to booking_history
      await conn.execute(
        'UPDATE bookings SET booking_status = ? WHERE booking_id = ? AND user_id = ?',
        ['Cancelled', booking_id, user_id]
      );

      // Release the seats back to Available
      await conn.execute(
        'UPDATE session_seats ss JOIN booking_seats bs ON ss.session_seat_id = bs.session_seat_id SET ss.status = ?, ss.locked_until = NULL WHERE bs.booking_id = ?',
        ['Available', booking_id]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    throw new Error('DB error in cancelBooking: ' + err.message);
  }
};

// Cleanup cron — cancel pending bookings older than 20 minutes
const cancelExpiredBookings = async () => {
  try {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Find expired pending bookings
      const [expired] = await conn.execute(
        'SELECT booking_id, session_id, user_id FROM bookings WHERE booking_status = ? AND booked_at < DATE_SUB(NOW(), INTERVAL 20 MINUTE)',
        ['Pending']
      );

      for (const booking of expired) {
        // Cancel the booking
        await conn.execute(
          'UPDATE bookings SET booking_status = ? WHERE booking_id = ?',
          ['Cancelled', booking.booking_id]
        );

        // Release the seats
        await conn.execute(
          'UPDATE session_seats ss JOIN booking_seats bs ON ss.session_seat_id = bs.session_seat_id SET ss.status = ?, ss.locked_until = NULL WHERE bs.booking_id = ?',
          ['Available', booking.booking_id]
        );
      }

      await conn.commit();
      return expired.length;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    throw new Error('DB error in cancelExpiredBookings: ' + err.message);
  }
};

// Update razorpay_order_id on booking after Razorpay order is created
const updateRazorpayOrderId = async (booking_id, razorpay_order_id) => {
  try {
    const pool = getPool();
    await pool.execute(
      'UPDATE bookings SET razorpay_order_id = ? WHERE booking_id = ?',
      [razorpay_order_id, booking_id]
    );
  } catch (err) {
    throw new Error('DB error in updateRazorpayOrderId: ' + err.message);
  }
};

const getSessionWithSeats = async (session_id) => {
  const pool = getPool();

  const [[session]] = await pool.query(`
    SELECT
      es.session_id, es.show_date, es.show_time,
      es.demand_multiplier, es.total_seats, es.booked_seats, es.status,
      pe.event_id, pe.title AS event_title, pe.poster_url,
      pe.duration_mins, pe.rating, pe.language,
      v.venue_name, v.address,
      c.city_name, c.city_multiplier
    FROM event_sessions es
    JOIN parent_events pe ON pe.event_id = es.event_id
    JOIN venues v         ON v.venue_id  = es.venue_id
    JOIN cities c         ON c.city_id   = v.city_id
    WHERE es.session_id = ?
  `, [session_id]);

  if (!session) return null;

  const [seats] = await pool.query(`
    SELECT
      ss.session_seat_id,
      ss.status          AS seat_status,
      ss.locked_until,
      s.seat_id,
      s.seat_label,
      s.seat_row,
      s.seat_number,
      st.tier_id,
      st.tier_name,
      st.base_price,
      ROUND(st.base_price * c.city_multiplier * es.demand_multiplier, 2) AS final_price
    FROM session_seats ss
    JOIN seats          s  ON s.seat_id   = ss.seat_id
    JOIN seat_tiers     st ON st.tier_id  = s.tier_id
    JOIN event_sessions es ON es.session_id = ss.session_id
    JOIN venues         v  ON v.venue_id  = es.venue_id
    JOIN cities         c  ON c.city_id   = v.city_id
    WHERE ss.session_id = ?
      AND s.is_active   = 1
    ORDER BY st.tier_id ASC, s.seat_row ASC, s.seat_number ASC
  `, [session_id]);

  return { ...session, seats };
};

module.exports = {
  callBookSeats,
  getBookingById,
  getBookingsByUser,
  getBookingSeats,
  cancelBooking,
  cancelExpiredBookings,
  updateRazorpayOrderId, getSessionWithSeats,
};
