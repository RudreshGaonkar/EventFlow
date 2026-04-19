const { getClient }     = require('../config/redis');
const { getRazorpay }   = require('../config/razorpay');
const {
  callBookSeats, getBookingById, updateRazorpayOrderId,
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

  // 2. Fetch booking & create Razorpay Order
  const booking  = await getBookingById(result.booking_id);
  const razorpay = getRazorpay();

  const order = await razorpay.orders.create({
    amount:   Math.round(booking.total_amount * 100), // paise
    currency: 'INR',
    receipt:  `booking_${result.booking_id}`,
    notes: {
      booking_id: String(result.booking_id),
      user_id:    String(user_id),
      event:      booking.event_title,
    },
  });

  // 3. Persist Razorpay order ID on booking row
  await updateRazorpayOrderId(result.booking_id, order.id);

  // 4. Mark job as done — frontend polls this
  await setJobResult(redis, job_id, {
    status: 'done',
    data: {
      booking_id:             result.booking_id,
      total_amount:           booking.total_amount,
      razorpay_order_id:      order.id,
      razorpay_key:           process.env.RAZORPAY_TEST_KEY,
      event_title:            booking.event_title,
      description:            `${booking.venue_name} • ${new Date(booking.show_date).toDateString()} ${booking.show_time}`,
    },
  });

  // 5. Clean up idempotency key — job is done, allow fresh attempts
  if (idem_key) await redis.del(idem_key);

  console.log(`[BookingWorker] Job ${job_id} done — booking #${result.booking_id} — Razorpay order ${order.id}`);
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
      console.error('\n========================================');
      console.error('[BookingWorker] CRITICAL SP ROLLBACK ERROR:');
      console.error(err); 
      console.error('========================================\n');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

module.exports = {  start: startWorker, stop: async () => console.log('[BookingConsumer] Worker stopped') };