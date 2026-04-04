const { getClient }  = require('../config/redis');
const { getStripe }  = require('../config/stripe');
const {
  callBookSeats, getBookingById, updateStripeSessionId,
} = require('../modules/booking/queries');

const QUEUE_KEY = 'booking:queue';
const JOB_TTL   = 1800; // 30 min

// ── Write a job result to Redis ───────────────────────────────────────────────
async function setJobResult(redis, job_id, payload) {
  await redis.set(`job:${job_id}`, JSON.stringify(payload), 'EX', JOB_TTL);
}

// ── Process a single booking job ──────────────────────────────────────────────
async function processJob(job) {
  const { job_id, user_id, session_id, seat_ids, idem_key } = job;
  const redis = getClient();

  // Mark as processing
  await setJobResult(redis, job_id, { status: 'processing' });

  // 1. Call stored procedure — locks seats & creates Pending booking
  const result = await callBookSeats(user_id, session_id, seat_ids);

  // Seat conflict or validation error — fail cleanly, allow retry
  if (result.result_code === 1 || result.result_code === 2) {
    await setJobResult(redis, job_id, {
      status:  'failed',
      message: result.result_msg,
    });
    if (idem_key) await redis.del(idem_key);
    return;
  }

  // SP transaction error — throw so the worker retries
  if (result.result_code === 3) {
    throw new Error(`SP error: ${result.result_msg}`);
  }

  // 2. Fetch booking & create Stripe Checkout Session
  const booking = await getBookingById(result.booking_id);
  const stripe  = getStripe();

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency:     'inr',
        product_data: {
          name:        booking.event_title,
          description: `${booking.venue_name} • ${new Date(booking.show_date).toDateString()} ${booking.show_time}`,
        },
        unit_amount: Math.round(booking.total_amount * 100),
      },
      quantity: 1,
    }],
    metadata: {
      booking_id: String(result.booking_id),
      user_id:    String(user_id),
    },
    success_url: `${process.env.CLIENT_URL}/booking/confirm?booking_id=${result.booking_id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.CLIENT_URL}/booking/cancel?booking_id=${result.booking_id}`,
    expires_at:  Math.floor(Date.now() / 1000) + 30 * 60,
  });

  // 3. Persist Stripe session ID on booking row
  await updateStripeSessionId(result.booking_id, checkoutSession.id);

  // 4. Mark job as done — frontend polls this
  await setJobResult(redis, job_id, {
    status: 'done',
    data: {
      booking_id:             result.booking_id,
      total_amount:           booking.total_amount,
      stripe_session_id:      checkoutSession.id,
      checkout_url:           checkoutSession.url,
      stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
    },
  });

  // 5. Clean up idempotency key — job is done, allow fresh attempts
  if (idem_key) await redis.del(idem_key);

  console.log(`[BookingWorker] Job ${job_id} done — booking #${result.booking_id}`);
}

// ── Main worker loop ──────────────────────────────────────────────────────────
async function startWorker() {
  const redis = getClient();
  console.log('[BookingWorker] Started — listening on booking:queue');

  while (true) {
    try {
      // BRPOP blocks for up to 5s waiting for next job (no busy loop)
      const entry = await redis.brpop(QUEUE_KEY, 5);
      if (!entry) continue;

      const job = JSON.parse(entry[1]);
      console.log(`[BookingWorker]  Picked up job ${job.job_id}`);

      await processJob(job);

    } catch (err) {
      console.error('[BookingWorker] Error:', err.message, '— retrying in 3s');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

module.exports = {  start: startWorker, stop: async () => console.log('[BookingConsumer] Worker stopped') };