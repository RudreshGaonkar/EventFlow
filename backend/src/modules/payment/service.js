const { getStripe }= require('../../config/stripe');
const {
  callConfirmBooking,
  getBookingByStripeSession,
  markBookingFailed,
  getTicketsByBooking,
} = require('./queries');

// ── Stripe Webhook ────────────────────────────────────────────────────────────
const handleWebhook = async (req, res) => {
  const stripe    = getStripe();
  const sig= req.headers['stripe-signature'];
  const secret    = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('[Payment] Webhook signature failed:', err.message);
    return res.status(400).json({ success: false, message: 'Webhook signature invalid' });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session   = event.data.object;
        const booking_id = parseInt(session.metadata?.booking_id);

        if (!booking_id) {
          console.warn('[Payment] No booking_id in metadata');
          break;
        }

        const result = await callConfirmBooking(
          booking_id,
          session.payment_intent,   // stripe_payment_intent_id
          sig,                      // stripe_signature
          session.amount_total / 100
        );

        if (result.result_code === 0) {
          console.log(`[Payment] Booking ${booking_id} confirmed ✅`);
        } else {
          console.error(`[Payment] confirm_booking failed for ${booking_id}:`, result.result_msg);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session    = event.data.object;
        const booking_id = parseInt(session.metadata?.booking_id);

        if (!booking_id) break;

        await markBookingFailed(booking_id);
        console.log(`[Payment] Booking ${booking_id} expired — seats released`);
        break;
      }

      default:
        // Ignore all other events
        break;
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('[Payment] Webhook handler error:', err.message);
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// ── Get tickets for a confirmed booking (called from frontend) ─────────────────
const getBookingTickets = async (req, res) => {
  try {
    const { booking_id } = req.params;

    // Only owner can fetch their tickets
    const booking = await getBookingByStripeSession(
      req.query.stripe_session_id || ''
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

module.exports = { handleWebhook, getBookingTickets };