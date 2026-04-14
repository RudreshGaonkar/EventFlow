const { getStripe } = require('../../config/stripe');
const { generateAndUploadTickets }     = require('../tickets/service');
const { generateAndUploadReceipt }     = require('../registration/service');
const { confirmPaidRegistration }       = require('../registration/queries');
const {
  callConfirmBooking,
  getBookingByStripeSession,
  markBookingFailed,
  getTicketsByBooking,
} = require('./queries');

// ── Stripe Webhook ────────────────────────────────────────────────────────────
const handleWebhook = async (req, res) => {
  console.log('[Webhook] ──── Webhook received ────');
  console.log('[Webhook] Body type:', typeof req.body, '| Buffer?', Buffer.isBuffer(req.body));

  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('[Webhook] Signature header present:', !!sig);
  console.log('[Webhook] Secret starts with:', secret?.slice(0, 10) + '...');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
    console.log('[Webhook] Signature verified — event type:', event.type);
  } catch (err) {
    console.error('[Webhook] Signature FAILED:', err.message);
    return res.status(400).json({ success: false, message: 'Webhook signature invalid' });
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session  = event.data.object;
        const metaType = session.metadata?.type;

        console.log('[Webhook] checkout.session.completed — metadata:', session.metadata);
        console.log('[Webhook] Detected metadata.type:', metaType || '(none — treating as booking)');

        // ── ROUTE 1: Registration Payment ────────────────────────────────────
        if (metaType === 'registration') {
          const registration_id = parseInt(session.metadata?.registration_id);
          console.log('[Webhook] ➔ Registration route — registration_id:', registration_id);

          if (!registration_id) {
            console.warn('[Webhook] No registration_id in metadata — skipping');
            break;
          }

          const affected = await confirmPaidRegistration(session.id, session.amount_total / 100);
          if (!affected) {
            console.warn('[Webhook] confirmPaidRegistration: no pending registration found for session', session.id);
          } else {
            console.log(`[Webhook] Registration ${registration_id} confirmed`);
            // Fire-and-forget receipt generation — non-blocking
            generateAndUploadReceipt(registration_id).catch(err =>
              console.error('[Webhook] Receipt generation failed for registration', registration_id, '—', err.message)
            );
          }
          break;
        }

        // ── ROUTE 2: Seat Booking Payment (default) ───────────────────────────
        const booking_id = parseInt(session.metadata?.booking_id);
        console.log('[Webhook] ➔ Booking route — booking_id:', booking_id, '| payment_intent:', session.payment_intent);
        console.log('[Webhook] amount_total:', session.amount_total, '| divided:', session.amount_total / 100);

        if (!booking_id) {
          console.warn('[Webhook] No booking_id in metadata — skipping');
          break;
        }

        console.log('[Webhook] Calling callConfirmBooking...');
        const result = await callConfirmBooking(
          booking_id,
          session.payment_intent,
          sig,
          session.amount_total / 100
        );

        console.log('[Webhook] callConfirmBooking returned:', result);

        if (result.result_code === 0) {
          console.log(`[Webhook] Booking ${booking_id} confirmed`);
          // Fire-and-forget PDF generation — non-blocking
          generateAndUploadTickets(booking_id).catch(err =>
            console.error('[Webhook] Ticket PDF generation failed for booking', booking_id, '—', err.message)
          );
        } else {
          console.error(`[Webhook] confirm_booking SP failed for ${booking_id}:`, result.result_msg);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const booking_id = parseInt(session.metadata?.booking_id);

        console.log('[Webhook] checkout.session.expired — booking_id:', booking_id);

        if (!booking_id) break;

        await markBookingFailed(booking_id);
        console.log(`[Webhook] Booking ${booking_id} expired — seats released`);
        break;
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
        break;
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('[Webhook] Handler error:', err.message, err.stack);
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