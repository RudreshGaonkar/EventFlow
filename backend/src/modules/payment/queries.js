const { getPool } = require('../../config/db');

// Call confirm_booking stored procedure
const callConfirmBooking = async (booking_id, razorpay_payment_id, razorpay_signature, amount) => {
  try {
    const pool = getPool();

    await pool.execute('SET @result_code = 0, @result_msg = ""');

    await pool.execute(
      'CALL confirm_booking(?, ?, ?, ?, @result_code, @result_msg)',
      [booking_id, razorpay_payment_id, razorpay_signature, amount]
    );

    const [[outParams]] = await pool.execute(
      'SELECT @result_code AS result_code, @result_msg AS result_msg'
    );

    return outParams;
  } catch (err) {
    throw new Error('DB error in callConfirmBooking: ' + err.message);
  }
};

// Get payment record by booking ID
const getPaymentByBookingId = async (booking_id) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE booking_id = ?',
      [booking_id]
    );
    return rows[0] || null;
  } catch (err) {
    throw new Error('DB error in getPaymentByBookingId: ' + err.message);
  }
};

// Mark booking as failed when payment fails
const markBookingFailed = async (booking_id) => {
  try {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Set booking to Cancelled
      await conn.execute(
        'UPDATE bookings SET booking_status = ? WHERE booking_id = ?',
        ['Cancelled', booking_id]
      );

      // Release locked seats back to Available
      await conn.execute(
        'UPDATE session_seats ss JOIN booking_seats bs ON ss.session_seat_id = bs.session_seat_id SET ss.status = ?, ss.locked_until = NULL WHERE bs.booking_id = ?',
        ['Available', booking_id]
      );

      // Insert failed payment record
      await conn.execute(
        'INSERT INTO payments (booking_id, amount, payment_status) VALUES (?, 0, ?)',
        [booking_id, 'Failed']
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    throw new Error('DB error in markBookingFailed: ' + err.message);
  }
};

module.exports = {
  callConfirmBooking,
  getPaymentByBookingId,
  markBookingFailed
};
