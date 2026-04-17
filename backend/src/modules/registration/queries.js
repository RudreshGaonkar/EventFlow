const { getPool } = require('../../config/db');

// ── Register (calls stored procedure) ────────────────────────────────────────
const callRegisterProc = async ({
  user_id, event_id, session_id,
  participant_type, college_name,
  team_name, team_size,
}) => {
  const pool = getPool();

  await pool.execute(
    'CALL register_for_event(?, ?, ?, ?, ?, ?, ?, @reg_id, @code, @msg)',
    [
      user_id,
      event_id,
      session_id       ?? null,
      participant_type,
      college_name     ?? null,
      team_name        ?? null,
      team_size        ?? null,
    ]
  );

  const [[out]] = await pool.execute(
    'SELECT @reg_id AS registration_id, @code AS result_code, @msg AS result_msg'
  );
  return out;
};

// ── Confirm paid registration after Razorpay verify ─────────────────────────
const confirmPaidRegistration = async (razorpay_order_id, amount_paid) => {
  const pool = getPool();
  const [result] = await pool.execute(
    `UPDATE event_registrations
     SET    status            = 'Confirmed',
            amount_paid       = ?,
            razorpay_order_id = ?
     WHERE  razorpay_order_id = ? AND status = 'Pending'`,
    [amount_paid, razorpay_order_id, razorpay_order_id]
  );
  return result.affectedRows;
};

// ── Confirm paid registration by registration_id (sync verify flow) ───────────
const confirmPaidRegistrationById = async (registration_id, razorpay_order_id, amount_paid) => {
  const pool = getPool();
  const [result] = await pool.execute(
    `UPDATE event_registrations
     SET    status            = 'Confirmed',
            amount_paid       = ?,
            razorpay_order_id = ?
     WHERE  registration_id   = ? AND status = 'Pending'`,
    [amount_paid, razorpay_order_id, registration_id]
  );
  return result.affectedRows;
};

// ── Save Razorpay order id after order is created ─────────────────────────────
const saveRazorpayOrder = async (registration_id, razorpay_order_id) => {
  const pool = getPool();
  await pool.execute(
    `UPDATE event_registrations
     SET    razorpay_order_id = ?
     WHERE  registration_id   = ?`,
    [razorpay_order_id, registration_id]
  );
};

// ── Get single registration ───────────────────────────────────────────────────
const getRegistrationById = async (registration_id) => {
  const pool = getPool();
  const [[row]] = await pool.execute(
    `SELECT
       er.registration_id,
       er.event_id,
       er.session_id,
       er.status,
       er.participant_type,
       er.college_name,
       er.team_name,
       er.team_size,
       er.amount_paid,
       er.registered_at,
       er.receipt_pdf_url,
       pe.title             AS event_title,
       pe.registration_mode,
       pe.participation_type,
       pe.registration_fee,
       es.show_date,
       es.show_time,
       v.venue_name,
       c.city_name
     FROM   event_registrations er
     JOIN   parent_events       pe ON pe.event_id   = er.event_id
     LEFT JOIN event_sessions   es ON es.session_id = er.session_id
     LEFT JOIN venues            v  ON v.venue_id   = es.venue_id
     LEFT JOIN cities            c  ON c.city_id    = v.city_id
     WHERE  er.registration_id = ?`,
    [registration_id]
  );
  return row;
};

// ── Get all registrations for a user ─────────────────────────────────────────
const getRegistrationsByUser = async (user_id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT
       er.registration_id,
       er.event_id,
       er.session_id,
       er.status,
       er.participant_type,
       er.team_name,
       er.team_size,
       er.amount_paid,
       er.registered_at,
       er.receipt_pdf_url,
       pe.title             AS event_title,
       pe.poster_url,
       pe.registration_mode,
       pe.event_type,
       es.show_date,
       es.show_time,
       v.venue_name,
       c.city_name
     FROM   event_registrations er
     JOIN   parent_events       pe ON pe.event_id   = er.event_id
     LEFT JOIN event_sessions   es ON es.session_id = er.session_id
     LEFT JOIN venues            v  ON v.venue_id   = es.venue_id
     LEFT JOIN cities            c  ON c.city_id    = v.city_id
     WHERE  er.user_id = ?
     ORDER  BY er.registered_at DESC`,
    [user_id]
  );
  return rows;
};

// ── Get all registrations for an event (organizer view) ──────────────────────
const getRegistrationsByEvent = async (event_id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT
       er.registration_id,
       er.user_id,
       u.full_name,
       u.email,
       u.phone,
       er.session_id,
       er.status,
       er.participant_type,
       er.college_name,
       er.team_name,
       er.team_size,
       er.amount_paid,
       er.registered_at,
       es.show_date,
       es.show_time
     FROM   event_registrations er
     JOIN   users                u  ON u.user_id     = er.user_id
     LEFT JOIN event_sessions   es ON es.session_id = er.session_id
     WHERE  er.event_id = ?
     ORDER  BY er.registered_at DESC`,
    [event_id]
  );
  return rows;
};

// ── Get event config (mode, caps, team sizes) ─────────────────────────────────
const getEventRegistrationConfig = async (event_id) => {
  const pool = getPool();
  const [[row]] = await pool.execute(
    `SELECT
       event_id,
       title,
       registration_mode,
       participation_type,
       max_participants,
       min_team_size,
       max_team_size,
       registration_fee
     FROM   parent_events
     WHERE  event_id = ? AND is_active = TRUE`,
    [event_id]
  );
  return row;
};

// ── Cancel a registration ─────────────────────────────────────────────────────
const cancelRegistration = async (registration_id, user_id) => {
  const pool = getPool();
  const [result] = await pool.execute(
    `UPDATE event_registrations
     SET    status = 'Cancelled'
     WHERE  registration_id = ? AND user_id = ? AND status != 'Cancelled'`,
    [registration_id, user_id]
  );
  return result.affectedRows;
};

// ── Save receipt PDF url after Cloudinary upload ─────────────────────────────
const saveReceiptPDF = async (registration_id, receipt_pdf_url, receipt_public_id) => {
  const pool = getPool();
  await pool.execute(
    `UPDATE event_registrations
     SET    receipt_pdf_url   = ?,
            receipt_public_id = ?
     WHERE  registration_id   = ?`,
    [receipt_pdf_url, receipt_public_id, registration_id]
  );
};

module.exports = {
  callRegisterProc,
  confirmPaidRegistration,
  confirmPaidRegistrationById,
  saveRazorpayOrder,
  getRegistrationById,
  getRegistrationsByUser,
  getRegistrationsByEvent,
  getEventRegistrationConfig,
  cancelRegistration,
  saveReceiptPDF,
};
