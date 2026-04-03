const { getPool } = require('../../config/db');

const findMyEvents = async (organizer_id) => {
  const [rows] = await getPool().query(
    `SELECT * FROM parent_events
     WHERE organizer_id = ? AND is_active = 1
     ORDER BY created_at DESC`,
    [organizer_id]
  );
  return rows;
};

const insertEvent = async (organizer_id, fields) => {
  const [r] = await getPool().query(
    `INSERT INTO parent_events
     (organizer_id, event_type, title, description, rating, duration_mins,
      age_limit, language, genre, poster_url, trailer_url, brochure_url,
      registration_mode, event_scope, listing_days_ahead,
      registration_fee, participation_type, max_participants,
      min_team_size, max_team_size)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      organizer_id,
      fields.event_type          || 'Movie',
      fields.title,
      fields.description         || null,
      fields.rating              || 'G',
      fields.duration_mins       || null,
      fields.age_limit           || null,
      fields.language            || 'English',
      fields.genre               || null,
      fields.poster_url          || null,
      fields.trailer_url         || null,
      fields.brochure_url        || null,
      fields.registration_mode   || 'booking',
      fields.event_scope         || 'national',
      fields.listing_days_ahead  || 5,
      fields.registration_fee    || 0.00,
      fields.participation_type  || 'solo',
      fields.max_participants    || null,
      fields.min_team_size       || null,
      fields.max_team_size       || null,
    ]
  );
  return r.insertId;
};

const modifyEvent = async (event_id, organizer_id, fields) => {
  const [check] = await getPool().query(
    `SELECT event_id FROM parent_events WHERE event_id = ? AND organizer_id = ?`,
    [event_id, organizer_id]
  );
  if (!check.length) throw new Error('FORBIDDEN');

  const allowed = [
    'event_type', 'title', 'description', 'rating', 'duration_mins',
    'age_limit', 'language', 'genre', 'poster_url', 'trailer_url',
    'brochure_url', 'registration_mode', 'event_scope', 'listing_days_ahead',
    'registration_fee', 'participation_type', 'max_participants',
    'min_team_size', 'max_team_size',
  ];
  const cols = [], vals = [];
  for (const k of allowed) {
    if (fields[k] !== undefined) { cols.push(`${k} = ?`); vals.push(fields[k]); }
  }
  if (!cols.length) return;
  vals.push(event_id);
  await getPool().query(`UPDATE parent_events SET ${cols.join(', ')} WHERE event_id = ?`, vals);
};

const softDeleteEvent = async (event_id, organizer_id) => {
  const [check] = await getPool().query(
    `SELECT event_id FROM parent_events WHERE event_id = ? AND organizer_id = ?`,
    [event_id, organizer_id]
  );
  if (!check.length) throw new Error('FORBIDDEN');
  await getPool().query(`UPDATE parent_events SET is_active = 0 WHERE event_id = ?`, [event_id]);
};

const findMySessionsByEvent = async (event_id, organizer_id) => {
  const [rows] = await getPool().query(
    `SELECT es.*, v.venue_name, c.city_name
     FROM event_sessions es
     JOIN venues v ON v.venue_id = es.venue_id
     JOIN cities c ON c.city_id = v.city_id
     JOIN parent_events pe ON pe.event_id = es.event_id
     WHERE es.event_id = ? AND pe.organizer_id = ?
     ORDER BY es.show_date, es.show_time`,
    [event_id, organizer_id]
  );
  return rows;
};

const insertSession = async (event_id, organizer_id, fields) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [check] = await conn.query(
      `SELECT event_id FROM parent_events WHERE event_id = ? AND organizer_id = ?`,
      [event_id, organizer_id]
    );
    if (!check.length) throw new Error('FORBIDDEN');

    const [[{ seatCount }]] = await conn.query(
      `SELECT COUNT(*) AS seatCount FROM seats WHERE venue_id = ? AND is_active = 1`,
      [fields.venue_id]
    );

    const [r] = await conn.query(
      `INSERT INTO event_sessions
         (event_id, venue_id, show_date, show_time, demand_multiplier,
          total_seats, requires_registration, session_max_participants)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_id,
        fields.venue_id,
        fields.show_date,
        fields.show_time,
        fields.demand_multiplier        || 1.0,
        seatCount,
        fields.requires_registration    ? 1 : 0,
        fields.session_max_participants || null,
      ]
    );
    const session_id = r.insertId;

    if (seatCount > 0) {
      await conn.query(
        `INSERT INTO session_seats (session_id, seat_id, status)
         SELECT ?, seat_id, 'Available'
         FROM seats WHERE venue_id = ? AND is_active = 1`,
        [session_id, fields.venue_id]
      );
    }

    await conn.commit();
    return session_id;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const setSessionStatus = async (session_id, organizer_id, status) => {
  const [check] = await getPool().query(
    `SELECT es.session_id FROM event_sessions es
     JOIN parent_events pe ON pe.event_id = es.event_id
     WHERE es.session_id = ? AND pe.organizer_id = ?`,
    [session_id, organizer_id]
  );
  if (!check.length) throw new Error('FORBIDDEN');
  await getPool().query(`UPDATE event_sessions SET status = ? WHERE session_id = ?`, [status, session_id]);
};

const setSessionMultiplier = async (session_id, organizer_id, multiplier) => {
  const [check] = await getPool().query(
    `SELECT es.session_id FROM event_sessions es
     JOIN parent_events pe ON pe.event_id = es.event_id
     WHERE es.session_id = ? AND pe.organizer_id = ?`,
    [session_id, organizer_id]
  );
  if (!check.length) throw new Error('FORBIDDEN');
  await getPool().query(
    `UPDATE event_sessions SET demand_multiplier = ? WHERE session_id = ?`,
    [multiplier, session_id]
  );
};

const findAllVenues = async () => {
  const [rows] = await getPool().query(
    `SELECT v.venue_id, v.venue_name, v.address, v.total_capacity,
            c.city_name, s.state_name
     FROM venues v
     JOIN cities c ON c.city_id = v.city_id
     JOIN states s ON s.state_id = c.state_id
     WHERE v.is_active = 1
     ORDER BY s.state_name, c.city_name, v.venue_name`
  );
  return rows;
};

const findAllPeople = async () => {
  const [rows] = await getPool().query(
    `SELECT person_id, real_name, bio, photo_url FROM people ORDER BY real_name`
  );
  return rows;
};

const insertPerson = async (real_name, bio, photo_url) => {
  const [r] = await getPool().query(
    `INSERT INTO people (real_name, bio, photo_url) VALUES (?, ?, ?)`,
    [real_name, bio || null, photo_url || null]
  );
  return r.insertId;
};

const modifyPerson = async (person_id, real_name, bio, photo_url) => {
  const cols = ['real_name = ?'];
  const vals = [real_name];
  if (bio       !== undefined) { cols.push('bio = ?');       vals.push(bio); }
  if (photo_url !== undefined) { cols.push('photo_url = ?'); vals.push(photo_url); }
  vals.push(person_id);
  await getPool().query(`UPDATE people SET ${cols.join(', ')} WHERE person_id = ?`, vals);
};

const findCastByEvent = async (event_id) => {
  const [rows] = await getPool().query(
    `SELECT ep.event_person_id, ep.role_type, ep.character_name,
            ep.designation, ep.billing_order,
            p.person_id, p.real_name, p.photo_url
     FROM event_people ep
     JOIN people p ON p.person_id = ep.person_id
     WHERE ep.event_id = ?
     ORDER BY ep.billing_order, p.real_name`,
    [event_id]
  );
  return rows;
};

const insertCastMember = async (event_id, organizer_id, fields) => {
  const [check] = await getPool().query(
    `SELECT event_id FROM parent_events WHERE event_id = ? AND organizer_id = ?`,
    [event_id, organizer_id]
  );
  if (!check.length) throw new Error('FORBIDDEN');
  const [r] = await getPool().query(
    `INSERT INTO event_people (event_id, person_id, role_type, character_name, designation, billing_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      event_id, fields.person_id, fields.role_type,
      fields.character_name || null,
      fields.designation    || null,
      fields.billing_order  || null,
    ]
  );
  return r.insertId;
};

const deleteCastMember = async (event_person_id, organizer_id) => {
  const [check] = await getPool().query(
    `SELECT ep.event_person_id FROM event_people ep
     JOIN parent_events pe ON pe.event_id = ep.event_id
     WHERE ep.event_person_id = ? AND pe.organizer_id = ?`,
    [event_person_id, organizer_id]
  );
  if (!check.length) throw new Error('FORBIDDEN');
  await getPool().query(`DELETE FROM event_people WHERE event_person_id = ?`, [event_person_id]);
};

module.exports = {
  findMyEvents, insertEvent, modifyEvent, softDeleteEvent,
  findMySessionsByEvent, insertSession, setSessionStatus, setSessionMultiplier,
  findAllVenues, findAllPeople, insertPerson, modifyPerson,
  findCastByEvent, insertCastMember, deleteCastMember,
};