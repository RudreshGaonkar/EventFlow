const { getClient } = require('../../config/redis');
const { getRazorpay } = require('../../config/razorpay');
const {
  callBookSeats,
  getBookingById,
  getBookingsByUser,
  getBookingSeats,
  cancelBooking,
  cancelExpiredBookings,
  updateRazorpayOrderId
} = require('./queries');

// Idempotency key TTL — 5 minutes
const IDEM_TTL = 300;

// Booking queue key
const QUEUE_KEY = 'booking:queue';

const createBooking = async (req, res) => {
  try {
    const { session_id, seat_ids } = req.body;
    const user_id = req.user.user_id;
    const redis = getClient();

    // Build idempotency key from user + session + sorted seat list
    const seatHash = seat_ids.slice().sort((a, b) => a - b).join('-');
    const idemKey = 'idem:' + user_id + ':' + session_id + ':' + seatHash;

    // SET NX — only sets if key does not exist
    const isNew = await redis.set(idemKey, '1', 'NX', 'EX', IDEM_TTL);
    if (!isNew) {
      return res.status(409).json({ success: false, message: 'Duplicate booking request — please wait' });
    }

    // Call book_seats stored procedure directly
    const result = await callBookSeats(user_id, session_id, seat_ids);

    if (result.result_code === 1) {
      await redis.del(idemKey);
      return res.status(409).json({ success: false, message: result.result_msg });
    }

    if (result.result_code === 2) {
      await redis.del(idemKey);
      return res.status(400).json({ success: false, message: result.result_msg });
    }

    if (result.result_code === 3) {
      await redis.del(idemKey);
      return res.status(500).json({ success: false, message: result.result_msg });
    }

    // Booking created — now create Razorpay order
    const booking = await getBookingById(result.booking_id);
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: Math.round(booking.total_amount * 100), // paise
      currency: 'INR',
      receipt: 'receipt_' + result.booking_id
    });

    // Store razorpay order id on the booking
    await updateRazorpayOrderId(result.booking_id, order.id);

    return res.status(201).json({
      success: true,
      message: 'Booking created — proceed to payment',
      data: {
        booking_id: result.booking_id,
        total_amount: booking.total_amount,
        razorpay_order_id: order.id,
        razorpay_key_id: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (err) {
    console.error('[Booking] createBooking error:', err.message);
    return res.status(500).json({ success: false, message: 'Booking failed' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await getBookingsByUser(req.user.user_id);
    return res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    console.error('[Booking] getMyBookings error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch bookings' });
  }
};

const getBookingDetail = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const booking = await getBookingById(booking_id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only owner can view their booking
    if (booking.user_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Not your booking' });
    }

    const seats = await getBookingSeats(booking_id);

    return res.status(200).json({ success: true, data: { ...booking, seats } });
  } catch (err) {
    console.error('[Booking] getBookingDetail error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch booking' });
  }
};

const cancelMyBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.user_id;

    const booking = await getBookingById(booking_id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user_id !== user_id) {
      return res.status(403).json({ success: false, message: 'Not your booking' });
    }

    if (booking.booking_status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    if (booking.booking_status === 'Refunded') {
      return res.status(400).json({ success: false, message: 'Booking has already been refunded' });
    }

    await cancelBooking(booking_id, user_id);

    // Invalidate seat cache for this session
    const redis = getClient();
    await redis.del('seats:avail:' + booking.session_id);

    return res.status(200).json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    console.error('[Booking] cancelMyBooking error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not cancel booking' });
  }
};

// Called by cron job — not an HTTP handler
const runExpiredBookingCleanup = async () => {
  try {
    const cancelled = await cancelExpiredBookings();
    if (cancelled > 0) {
      console.log('[Booking] Cleanup cancelled ' + cancelled + ' expired bookings');
    }
  } catch (err) {
    console.error('[Booking] runExpiredBookingCleanup error:', err.message);
  }
};

// Exported for payment module to use — not an HTTP handler
const fetchBookingById = async (booking_id) => {
  try {
    return await getBookingById(booking_id);
  } catch (err) {
    throw new Error('Could not fetch booking: ' + err.message);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelMyBooking,
  runExpiredBookingCleanup,
  fetchBookingById
};
