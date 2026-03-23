const db = require('../../config/db');

const validateTicket = async (ticket_uuid, staff_id) => {
  const [rows] = await db.query(
    'CALL validateticket(?, ?, @result_code, @result_msg)',
    [ticket_uuid, staff_id]
  );

  const [[out]] = await db.query(
    'SELECT @result_code AS result_code, @result_msg AS result_msg'
  );

  return out;
};

const getTicketPreview = async (ticket_uuid) => {
  const [rows] = await db.query(
    `SELECT
      t.ticketuuid,
      t.entrystatus,
      u.fullname     AS attendee_name,
      pe.title       AS event_title,
      v.venuename    AS venue_name,
      es.showdate    AS show_date,
      es.showtime    AS show_time,
      st.tiername    AS tier_name,
      s.seatlabel    AS seat_label
    FROM tickets t
    JOIN sessionseats ss  ON ss.sessionseatid = t.sessionseatid
    JOIN seats s          ON s.seatid = ss.seatid
    JOIN seattiers st     ON st.tierid = s.tierid
    JOIN eventsessions es ON es.sessionid = ss.sessionid
    JOIN parentevents pe  ON pe.eventid = es.eventid
    JOIN venues v         ON v.venueid = es.venueid
    JOIN bookings b       ON b.bookingid = t.bookingid
    JOIN users u          ON u.userid = b.userid
    WHERE t.ticketuuid = ?`,
    [ticket_uuid]
  );
  return rows[0] || null;
};

module.exports = { validateTicket, getTicketPreview };
