const crypto = require('crypto');
const { getClient } = require('../../config/redis');
const { fetchBookingById } = require('../booking/service');
const { callConfirmBooking, getPaymentByBookingId, markBookingFailed } = require('./queries');

// Verify Razorpay HMAC-SHA256 signature
const verifySignature = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === razorpay_signature;
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;
    const user_id = req.user.user_id;

    // Verify HMAC signature before any DB write
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Fetch booking and verify ownership
    const booking = await fetchBookingById(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user_id !== user_id) {
      return res.status(403).json({ success: false, message: 'Not your booking' });
    }

    // Check booking is still Pending
    if (booking.booking_status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Booking is no longer pending' });
    }

    // Check payment not already processed
    const existingPayment = await getPaymentByBookingId(booking_id);
    if (existingPayment && existingPayment.payment_status === 'Success') {
      return res.status(409).json({ success: false, message: 'Payment already processed' });
    }

    // Push to Redis queue for consumer worker to process
    const redis = getClient();
    const payload = JSON.stringify({
      booking_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: booking.total_amount,
      session_id: booking.session_id,
      user_id
    });

    await redis.lpush('booking:queue', payload);

    return res.status(200).json({
      success: true,
      message: 'Payment verified — booking is being confirmed'
    });
  } catch (err) {
    console.error('[Payment] verifyPayment error:', err.message);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

const handlePaymentFailure = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const user_id = req.user.user_id;

    const booking = await fetchBookingById(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user_id !== user_id) {
      return res.status(403).json({ success: false, message: 'Not your booking' });
    }
    if (booking.booking_status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Booking is no longer pending' });
    }

    await markBookingFailed(booking_id);

    // Invalidate seat cache so freed seats show immediately
    const redis = getClient();
    await redis.del('seats:avail:' + booking.session_id);

    return res.status(200).json({ success: true, message: 'Booking cancelled due to payment failure' });
  } catch (err) {
    console.error('[Payment] handlePaymentFailure error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not process payment failure' });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.user_id;

    const booking = await fetchBookingById(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user_id !== user_id) {
      return res.status(403).json({ success: false, message: 'Not your booking' });
    }

    const payment = await getPaymentByBookingId(booking_id);

    return res.status(200).json({
      success: true,
      data: {
        booking_status: booking.booking_status,
        payment: payment || null
      }
    });
  } catch (err) {
    console.error('[Payment] getPaymentStatus error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch payment status' });
  }
};

// Exported for booking consumer — not an HTTP handler
const confirmBooking = async (booking_id, razorpay_payment_id, razorpay_signature, amount) => {
  try {
    const result = await callConfirmBooking(booking_id, razorpay_payment_id, razorpay_signature, amount);
    return result;
  } catch (err) {
    throw new Error('Could not confirm booking: ' + err.message);
  }
};

module.exports = {
  verifyPayment,
  handlePaymentFailure,
  getPaymentStatus,
  confirmBooking
};
