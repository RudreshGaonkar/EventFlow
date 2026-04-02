const { getClient }  = require('../../config/redis');
const { getStripe }  = require('../../config/stripe');
const {
  callBookSeats,
  getBookingById,
  getBookingsByUser,
  getBookingSeats,
  cancelBooking,
  cancelExpiredBookings,
  updateStripeSessionId,
} = require('./queries');

const IDEM_TTL = 300;

// ── Create Booking + Stripe Checkout Session ──────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const { session_id, seat_ids } = req.body;
    const user_id = req.user.user_id;
    const redis   = getClient();

    // Idempotency — prevent duplicate submissions
    const seatHash = seat_ids.slice().sort((a, b) => a - b).join('-');
    const idemKey  = `idem:${user_id}:${session_id}:${seatHash}`;
    const isNew    = await redis.set(idemKey, '1', 'NX', 'EX', IDEM_TTL);

    if (!isNew) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate booking request — please wait',
      });
    }

    // Call stored procedure — locks seats & creates Pending booking
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

    // Fetch booking details for Stripe
    const booking = await getBookingById(result.booking_id);
    const stripe  = getStripe();

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: booking.event_title,
            description: `${booking.venue_name} • ${new Date(booking.show_date).toDateString()} ${booking.show_time}`,
          },
          unit_amount: Math.round(booking.total_amount * 100), // paise
        },
        quantity: 1,
      }],
      metadata: {
        booking_id: String(result.booking_id),
        user_id:    String(user_id),
      },
      success_url: `${process.env.CLIENT_URL}/booking/confirm?booking_id=${result.booking_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.CLIENT_URL}/booking/cancel?booking_id=${result.booking_id}`,
      expires_at:  Math.floor(Date.now() / 1000) + 15 * 60, // 15 min — matches seat lock
    });

    // Store stripe session id on booking
    await updateStripeSessionId(result.booking_id, checkoutSession.id);

    return res.status(201).json({
      success: true,
      message: 'Booking created — proceed to payment',
      data: {
        booking_id:result.booking_id,
        total_amount:booking.total_amount,
        stripe_session_id:  checkoutSession.id,
        stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
        checkout_url:checkoutSession.url,
      },
    });

  } catch (err) {
    console.error('[Booking] createBooking:', err.message);
    return res.status(500).json({ success: false, message: 'Booking failed' });
  }
};

// ── My Bookings ───────────────────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const bookings = await getBookingsByUser(req.user.user_id);
    return res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    console.error('[Booking] getMyBookings:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch bookings' });
  }
};

// ── Booking Detail ────────────────────────────────────────────────────────────
const getBookingDetail = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const booking = await getBookingById(booking_id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Not your booking' });
    }

    const seats = await getBookingSeats(booking_id);
    return res.status(200).json({ success: true, data: { ...booking, seats } });
  } catch (err) {
    console.error('[Booking] getBookingDetail:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch booking' });
  }
};

// ── Cancel Booking ────────────────────────────────────────────────────────────
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
    if (['Cancelled', 'Refunded'].includes(booking.booking_status)) {
      return res.status(400).json({ success: false, message: `Booking is already ${booking.booking_status.toLowerCase()}` });
    }

    await cancelBooking(booking_id, user_id);

    // Invalidate seat cache
    const redis = getClient();
    await redis.del(`seats:avail:${booking.session_id}`);

    return res.status(200).json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    console.error('[Booking] cancelMyBooking:', err.message);
    return res.status(500).json({ success: false, message: 'Could not cancel booking' });
  }
};

// ── Cron job helper ───────────────────────────────────────────────────────────
const runExpiredBookingCleanup = async () => {
  try {
    const cancelled = await cancelExpiredBookings();
    if (cancelled > 0) {
      console.log(`[Booking] Cleanup cancelled ${cancelled} expired bookings`);
    }
  } catch (err) {
    console.error('[Booking] runExpiredBookingCleanup:', err.message);
  }
};

// ── Used by payment module ────────────────────────────────────────────────────
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
  fetchBookingById,
};