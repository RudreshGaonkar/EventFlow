const { getPool } = require('../../config/db');

const searchEvents = async ({ search, city_id, state_id, event_type, genre }) => {
  let sql = `
    SELECT
      ANY_VALUE(pe.event_id)       AS event_id,
      pe.title,
      ANY_VALUE(pe.event_type)     AS event_type,
      ANY_VALUE(pe.language)       AS language,
      ANY_VALUE(pe.genre)          AS genre,
      ANY_VALUE(pe.rating)         AS rating,
      ANY_VALUE(pe.duration_mins)  AS duration_mins,
      ANY_VALUE(pe.poster_url)     AS poster_url,
      ANY_VALUE(pe.description)    AS description,
      MIN(es.show_date)            AS next_show
    FROM parent_events pe
    JOIN event_sessions es ON es.event_id = pe.event_id
    JOIN venues v ON v.venue_id = es.venue_id
    JOIN cities c ON c.city_id = v.city_id
    WHERE pe.is_active = 1
      AND es.status = 'Scheduled'
      AND es.show_date >= CURDATE()
  `;
  const params = [];

  if (state_id)   { sql += ` AND c.state_id = ?`;    params.push(state_id); }
  if (search)     { sql += ` AND pe.title LIKE ?`;   params.push(`%${search}%`); }
  if (city_id)    { sql += ` AND v.city_id = ?`;     params.push(city_id); }
  if (event_type) { sql += ` AND pe.event_type = ?`; params.push(event_type); }
  if (genre)      { sql += ` AND pe.genre LIKE ?`;   params.push(`%${genre}%`); }

  sql += ` GROUP BY pe.title ORDER BY next_show ASC`;

  const [rows] = await getPool().query(sql, params);
  return rows;
};

const getEventDetail = async (event_id) => {
  const [[event]] = await getPool().query(
    `SELECT pe.*, u.full_name AS organizer_name
     FROM parent_events pe
     JOIN users u ON u.user_id = pe.organizer_id
     WHERE pe.event_id = ? AND pe.is_active = 1`,
    [event_id]
  );
  if (!event) return null;

  // Get cast from ALL events with the same title (merged)
  const [cast] = await getPool().query(
    `SELECT DISTINCT ep.role_type, ep.character_name, ep.designation, ep.billing_order,
            p.person_id, p.real_name, p.photo_url
     FROM event_people ep
     JOIN people p ON p.person_id = ep.person_id
     JOIN parent_events pe ON pe.event_id = ep.event_id
     WHERE pe.title = ?
       AND pe.is_active = 1
     ORDER BY ep.billing_order, p.real_name`,
    [event.title]
  );

  return { ...event, cast };
};

const getSessionsByEvent = async (event_id) => {
  const [[ev]] = await getPool().query(
    `SELECT title FROM parent_events WHERE event_id = ?`, [event_id]
  );
  if (!ev) return [];

  const [rows] = await getPool().query(
    `SELECT es.session_id, es.show_date, es.show_time, es.status,
            es.demand_multiplier, es.total_seats, es.booked_seats,
            pe.event_id, pe.title, pe.duration_mins,
            v.venue_id, v.venue_name, v.address,
            c.city_id, c.city_name, c.city_multiplier,
            s.state_name,
            (es.total_seats - es.booked_seats) AS available_seats
     FROM event_sessions es
     JOIN parent_events pe ON pe.event_id = es.event_id
     JOIN venues v ON v.venue_id = es.venue_id
     JOIN cities c ON c.city_id = v.city_id
     JOIN states s ON s.state_id = c.state_id
     WHERE pe.title = ?
       AND pe.is_active = 1
       AND es.status = 'Scheduled'
       AND TIMESTAMP(es.show_date, es.show_time) > NOW()
     ORDER BY es.show_date, es.show_time`,
    [ev.title]
  );
  return rows;
};

const getCitiesWithEvents = async () => {
  const [rows] = await getPool().query(
    `SELECT DISTINCT c.city_id, c.city_name, s.state_name
     FROM cities c
     JOIN states s ON s.state_id = c.state_id
     JOIN venues v ON v.city_id = c.city_id
     JOIN event_sessions es ON es.venue_id = v.venue_id
     JOIN parent_events pe ON pe.event_id = es.event_id
     WHERE pe.is_active = 1
       AND es.status = 'Scheduled'
       AND es.show_date >= CURDATE()
     ORDER BY c.city_name`
  );
  return rows;
};

const getStates = async () => {
  const [rows] = await getPool().query(
    `SELECT DISTINCT s.state_id, s.state_name
     FROM states s
     JOIN cities c ON c.state_id = s.state_id
     JOIN venues v ON v.city_id = c.city_id
     JOIN event_sessions es ON es.venue_id = v.venue_id
     JOIN parent_events pe ON pe.event_id = es.event_id
     WHERE pe.is_active = 1
       AND es.status = 'Scheduled'
       AND es.show_date >= CURDATE()
     ORDER BY s.state_name`
  );
  return rows;
};

module.exports = { searchEvents, getEventDetail, getSessionsByEvent, getCitiesWithEvents, getStates };