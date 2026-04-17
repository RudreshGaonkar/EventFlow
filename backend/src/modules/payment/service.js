const crypto = require('crypto');
const { generateAndUploadTickets }   = require('../tickets/service');
const { generateAndUploadReceipt }   = require('../registration/service');
const { confirmPaidRegistrationById } = require('../registration/queries');
const {
  callConfirmBooking,
  getBookingByRazorpayOrder,
  markBookingFailed,
  getTicketsByBooking,
} = require('./queries');

// ── POST /api/payment/verify (Razorpay synchronous verification) ───────────────
const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    booking_id,         // sent by frontend from job poll result
    registration_id,    // set for paid-registration flow
    amount,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing Razorpay parameters' });
  }

  // ── HMAC SHA-256 Signature Verification ──────────────────────────────────────
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generated = hmac.digest('hex');

  if (generated !== razorpay_signature) {
    console.error('[Payment] Razorpay signature mismatch for order', razorpay_order_id);
    return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature' });
  }

  console.log('[Payment] Signature verified for order', razorpay_order_id);

  try {
    // ── ROUTE 1: Paid Registration ────────────────────────────────────────────
    if (registration_id) {
      const affected = await confirmPaidRegistrationById(
        registration_id,
        razorpay_order_id,
        Number(amount)
      );
      if (!affected) {
        return res.status(404).json({ success: false, message: 'Pending registration not found' });
      }
      console.log(`[Payment] Registration #${registration_id} confirmed`);
      // Fire-and-forget receipt generation
      generateAndUploadReceipt(Number(registration_id)).catch(err =>
        console.error('[Payment] Receipt generation failed:', err.message)
      );
      return res.status(200).json({
        success: true,
        message: 'Registration payment confirmed',
        data: { registration_id },
      });
    }

    // ── ROUTE 2: Seat Booking ─────────────────────────────────────────────────
    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'booking_id or registration_id is required' });
    }

    const result = await callConfirmBooking(
      Number(booking_id),
      razorpay_payment_id,
      razorpay_signature,
      Number(amount)
    );

    if (result.result_code !== 0) {
      console.error(`[Payment] confirm_booking SP failed for booking #${booking_id}:`, result.result_msg);
      return res.status(500).json({ success: false, message: result.result_msg });
    }

    console.log(`[Payment] Booking #${booking_id} confirmed`);
    // Fire-and-forget ticket generation
    generateAndUploadTickets(Number(booking_id)).catch(err =>
      console.error('[Payment] Ticket generation failed:', err.message)
    );

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed — tickets are being generated',
      data: { booking_id },
    });

  } catch (err) {
    console.error('[Payment] verifyPayment error:', err.message);
    return res.status(500).json({ success: false, message: 'Payment processing failed' });
  }
};

// ── GET /api/payment/tickets/:booking_id ──────────────────────────────────────
const getBookingTickets = async (req, res) => {
  try {
    const { booking_id } = req.params;

    // Verify the booking belongs to the requesting user
    const booking = await getBookingByRazorpayOrder(
      req.query.razorpay_order_id || ''
    );

    const tickets = await getTicketsByBooking(booking_id);

    if (!tickets.length) {
      return res.status(404).json({ success: false, message: 'No tickets found' });
    }

    return res.status(200).json({ success: true, data: tickets });
  } catch (err) {
    console.error('[Payment] getBookingTickets:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch tickets' });
  }
};

module.exports = { verifyPayment, getBookingTickets };