const { getPool } = require('../config/db');

const updateSessionStatuses = async () => {
  const pool = getPool();
  try {
    // Mark as Ongoing — show has started but not yet finished
    await pool.query(`
      UPDATE event_sessions es
      JOIN parent_events pe ON pe.event_id = es.event_id
      SET es.status = 'Ongoing'
      WHERE es.status = 'Scheduled'
        AND TIMESTAMP(es.show_date, es.show_time) <= NOW()
        AND TIMESTAMP(es.show_date, es.show_time) + INTERVAL pe.duration_mins MINUTE > NOW()
    `);

    // Mark as Completed — show has fully ended
    await pool.query(`
      UPDATE event_sessions es
      JOIN parent_events pe ON pe.event_id = es.event_id
      SET es.status = 'Completed'
      WHERE es.status IN ('Scheduled', 'Ongoing')
        AND TIMESTAMP(es.show_date, es.show_time) + INTERVAL pe.duration_mins MINUTE <= NOW()
    `);

  } catch (err) {
    console.error('[SessionJob] Failed to update statuses:', err.message);
  }
};

module.exports = { updateSessionStatuses };