const { getClient }  = require('../../config/redis');
const { getStripe }  = require('../../config/stripe');
const { randomUUID } = require('crypto');
const { getPool }    = require('../../config/db');
const {
  getBookingById, getBookingsByUser,
  getBookingSeats, cancelBooking,
  cancelExpiredBookings,
} = require('./queries');

const IDEM_TTL = 300;   // 5 min — duplicate guard
const JOB_TTL  = 1800;  // 30 min — matches Stripe session lifetime

// ── Create Booking (queued) ───────────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const { session_id, seat_ids } = req.body;
    const user_id = req.user.user_id;
    const redis   = getClient();
    const pool    = getPool();

    // 0. Pre-booking verification: Is the booking window open?
    const [sessionData] = await pool.execute(`
      SELECT 
        es.show_date, 
        pe.listing_days_ahead,
        DATEDIFF(es.show_date, CURDATE()) as days_until_show
      FROM event_sessions es
      JOIN parent_events pe ON pe.event_id = es.event_id
      WHERE es.session_id = ?
    `, [session_id]);

    if (!sessionData.length) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (sessionData[0].days_until_show > sessionData[0].listing_days_ahead) {
      const maxDays = sessionData[0].listing_days_ahead;
      return res.status(400).json({ 
        success: false,
        data: {
          status: 'failed',
          message: `Outside ${maxDays}-day booking window`
        }
      });
    }

    // 1. Idempotency guard — block duplicate rapid submissions
    const seatHash = seat_ids.slice().sort((a, b) => a - b).join('-');
    const idemKey  = `idem:${user_id}:${session_id}:${seatHash}`;
    const isNew    = await redis.set(idemKey, '1', 'NX', 'EX', IDEM_TTL);

    if (!isNew) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate booking request — please wait',
      });
    }

    // 2. Generate a unique job ID for this booking request
    const job_id = randomUUID();

    // 3. Push job payload to Redis queue (always — DB up or down)
    await redis.lpush('booking:queue', JSON.stringify({
      job_id,
      user_id,
      session_id,
      seat_ids,
      idem_key:     idemKey,
      requested_at: Date.now(),
    }));

    // 4. Set initial job status so client can poll
    await redis.set(
      `job:${job_id}`,
      JSON.stringify({ status: 'queued' }),
      'EX', JOB_TTL
    );

    // 5. Return 202 immediately — worker handles the rest
    return res.status(202).json({
      success: true,
      message: 'Booking queued — we are confirming your seats',
      data: { job_id },
    });

  } catch (err) {
    console.error('[Booking] createBooking:', err.message);
    return res.status(500).json({ success: false, message: 'Booking failed' });
  }
};

// ── Poll Job Status ───────────────────────────────────────────────────────────
const getJobStatus = async (req, res) => {
  try {
    const { job_id } = req.params;
    const redis      = getClient();

    const raw = await redis.get(`job:${job_id}`);

    if (!raw) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or expired',
      });
    }

    const job = JSON.parse(raw);
    return res.status(200).json({ success: true, data: job });

  } catch (err) {
    console.error('[Booking] getJobStatus:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch job status' });
  }
};

// ── Get My Bookings ───────────────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const bookings = await getBookingsByUser(req.user.user_id);
    return res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    console.error('[Booking] getMyBookings:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch bookings' });
  }
};

// ── Get Booking Detail ────────────────────────────────────────────────────────
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
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.booking_status.toLowerCase()}`,
      });
    }

    await cancelBooking(booking_id, user_id);

    // Bust seat availability cache for this session
    const redis = getClient();
    await redis.del(`seats:avail:${booking.session_id}`);

    return res.status(200).json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    console.error('[Booking] cancelMyBooking:', err.message);
    return res.status(500).json({ success: false, message: 'Could not cancel booking' });
  }
};

// ── Cron helper ───────────────────────────────────────────────────────────────
const runExpiredBookingCleanup = async () => {
  try {
    const cancelled = await cancelExpiredBookings();
    if (cancelled > 0) {
      console.log(`[Booking] Cleanup: cancelled ${cancelled} expired bookings`);
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
  getJobStatus,
  getMyBookings,
  getBookingDetail,
  cancelMyBooking,
  runExpiredBookingCleanup,
  fetchBookingById,
};