const { uploadFile } = require('../../config/cloudinary');
const {
  findMyEvents, insertEvent, modifyEvent, softDeleteEvent,
  findMySessionsByEvent, insertSession, setSessionStatus, setSessionMultiplier,
  findAllPeople, insertPerson, modifyPerson,
  findCastByEvent, insertCastMember, deleteCastMember,
  findPermittedVenues,
} = require('./queries');

// ── Cloudinary helper ─────────────────────────────────────────────────────────
const uploadImage = async (buffer, folder) => {
  const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  const result = await uploadFile(base64, folder);
  return result.secure_url;
};

// ── Events ────────────────────────────────────────────────────────────────────

const getMyEvents = async (req, res) => {
  try {
    const events = await findMyEvents(req.user.user_id);
    return res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error('[Organizer] getMyEvents:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch events' });
  }
};

const createEvent = async (req, res) => {
  try {
    let poster_url   = null;
    let brochure_url = null;

    if (req.files?.poster?.[0])
      poster_url = await uploadFile(
        `data:image/jpeg;base64,${req.files.poster[0].buffer.toString('base64')}`,
        'eventflow/posters'
      ).then(r => r.secure_url);

    if (req.files?.brochure?.[0])
      brochure_url = await uploadFile(
        `data:application/pdf;base64,${req.files.brochure[0].buffer.toString('base64')}`,
        'eventflow/brochures'
      ).then(r => r.secure_url);

    const {
      title,
      description        = null,
      event_type         = 'Movie',
      rating             = null,
      duration_mins      = null,
      age_limit          = null,
      language           = null,
      genre              = null,
      trailer_url        = null,
      registration_mode  = 'booking',
      event_scope        = 'national',
      listing_days_ahead = 5,
      registration_fee   = 0.00,
      participation_type = 'solo',
      max_participants   = null,
      min_team_size      = null,
      max_team_size      = null,
    } = req.body;

    const id = await insertEvent(req.user.user_id, {
      title, description, event_type,
      rating, duration_mins, age_limit, language, genre,
      trailer_url,
      registration_mode, event_scope, listing_days_ahead,
      registration_fee, participation_type,
      max_participants, min_team_size, max_team_size,
      poster_url, brochure_url,
    });

    return res.status(201).json({ success: true, message: 'Event created', data: { event_id: id } });
  } catch (err) {
    console.error('[Organizer] createEvent:', err.message);
    return res.status(500).json({ success: false, message: 'Could not create event' });
  }
};


const updateEvent = async (req, res) => {
  try {
    const {
      registration_mode  = 'booking',
      event_scope        = 'national',
      listing_days_ahead = 5,
      registration_fee   = 0.00,
      participation_type = 'solo',
      ...rest
    } = req.body;

    let fields = {
      ...rest,
      registration_mode,
      event_scope,
      listing_days_ahead,
      registration_fee,
      participation_type,
    };

    if (req.files?.poster?.[0])
      fields.poster_url = await uploadFile(
        `data:image/jpeg;base64,${req.files.poster[0].buffer.toString('base64')}`,
        'eventflow/posters'
      ).then(r => r.secure_url);

    if (req.files?.brochure?.[0])
      fields.brochure_url = await uploadFile(
        `data:application/pdf;base64,${req.files.brochure[0].buffer.toString('base64')}`,
        'eventflow/brochures'
      ).then(r => r.secure_url);

    await modifyEvent(req.params.event_id, req.user.user_id, fields);
    return res.status(200).json({ success: true, message: 'Event updated' });
  } catch (err) {
    if (err.message === 'FORBIDDEN')
      return res.status(403).json({ success: false, message: 'Not your event' });
    console.error('[Organizer] updateEvent:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update event' });
  }
};

const deactivateEvent = async (req, res) => {
  try {
    await softDeleteEvent(req.params.event_id, req.user.user_id);
    return res.status(200).json({ success: true, message: 'Event deactivated' });
  } catch (err) {
    if (err.message === 'FORBIDDEN')
      return res.status(403).json({ success: false, message: 'Not your event' });
    console.error('[Organizer] deactivateEvent:', err.message);
    return res.status(500).json({ success: false, message: 'Could not deactivate event' });
  }
};

// ── Sessions ──────────────────────────────────────────────────────────────────

const getSessions = async (req, res) => {
  try {
    const sessions = await findMySessionsByEvent(req.params.event_id, req.user.user_id);
    return res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    console.error('[Organizer] getSessions:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch sessions' });
  }
};

const createSession = async (req, res) => {
  try {
    const id = await insertSession(req.params.event_id, req.user.user_id, req.body);
    return res.status(201).json({ success: true, message: 'Session created', data: { session_id: id } });
  } catch (err) {
    if (err.message === 'FORBIDDEN')
      return res.status(403).json({ success: false, message: 'Not your event' });
    if (err.message === 'VENUE_FORBIDDEN')
      return res.status(403).json({ success: false, message: 'You do not have permission to use this venue at this time.' });
    console.error('[Organizer] createSession:', err.message);
    return res.status(500).json({ success: false, message: 'Could not create session' });
  }
};

const updateStatus = async (req, res) => {
  try {
    await setSessionStatus(req.params.session_id, req.user.user_id, req.body.status);
    return res.status(200).json({ success: true, message: 'Status updated' });
  } catch (err) {
    if (err.message === 'FORBIDDEN')
      return res.status(403).json({ success: false, message: 'Not your session' });
    console.error('[Organizer] updateStatus:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update status' });
  }
};

const updateMultiplier = async (req, res) => {
  try {
    await setSessionMultiplier(req.params.session_id, req.user.user_id, req.body.demand_multiplier);
    return res.status(200).json({ success: true, message: 'Multiplier updated' });
  } catch (err) {
    if (err.message === 'FORBIDDEN')
      return res.status(403).json({ success: false, message: 'Not your session' });
    console.error('[Organizer] updateMultiplier:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update multiplier' });
  }
};

// ── Venues ────────────────────────────────────────────────────────────────────

const getVenues = async (req, res) => {
  try {
    const venues = await findPermittedVenues(req.user.user_id);
    return res.status(200).json({ success: true, data: venues });
  } catch (err) {
    console.error('[Organizer] getVenues:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch venues' });
  }
};

// ── People ────────────────────────────────────────────────────────────────────

const getPeople = async (req, res) => {
  try {
    const people = await findAllPeople();
    return res.status(200).json({ success: true, data: people });
  } catch (err) {
    console.error('[Organizer] getPeople:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch people' });
  }
};

const createPerson = async (req, res) => {
  try {
    let photo_url = null;
    if (req.file) photo_url = await uploadImage(req.file.buffer, 'eventflow/people');
    const id = await insertPerson(req.body.real_name, req.body.bio, photo_url);
    return res.status(201).json({ success: true, message: 'Person created', data: { person_id: id } });
  } catch (err) {
    console.error('[Organizer] createPerson:', err.message);
    return res.status(500).json({ success: false, message: 'Could not create person' });
  }
};

const updatePerson = async (req, res) => {
  try {
    let photo_url = undefined;
    if (req.file) photo_url = await uploadImage(req.file.buffer, 'eventflow/people');
    await modifyPerson(req.params.person_id, req.body.real_name, req.body.bio, photo_url);
    return res.status(200).json({ success: true, message: 'Person updated' });
  } catch (err) {
    console.error('[Organizer] updatePerson:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update person' });
  }
};

// ── Cast ──────────────────────────────────────────────────────────────────────

const getCast = async (req, res) => {
  try {
    const cast = await findCastByEvent(req.params.event_id);
    return res.status(200).json({ success: true, data: cast });
  } catch (err) {
    console.error('[Organizer] getCast:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch cast' });
  }
};

const addCast = async (req, res) => {
  try {
    const id = await insertCastMember(req.params.event_id, req.user.user_id, req.body);
    return res.status(201).json({ success: true, message: 'Added to cast', data: { event_person_id: id } });
  } catch (err) {
    if (err.message === 'FORBIDDEN')
      return res.status(403).json({ success: false, message: 'Not your event' });
    console.error('[Organizer] addCast:', err.message);
    return res.status(500).json({ success: false, message: 'Could not add to cast' });
  }
};

const removeCast = async (req, res) => {
  try {
    await deleteCastMember(req.params.event_person_id, req.user.user_id);
    return res.status(200).json({ success: true, message: 'Removed from cast' });
  } catch (err) {
    if (err.message === 'FORBIDDEN')
      return res.status(403).json({ success: false, message: 'Not your event' });
    console.error('[Organizer] removeCast:', err.message);
    return res.status(500).json({ success: false, message: 'Could not remove from cast' });
  }
};

module.exports = {  getMyEvents, createEvent, updateEvent, deactivateEvent,  getSessions, createSession, updateStatus, updateMultiplier,
  getVenues,  getPeople, createPerson, updatePerson,  getCast, addCast, removeCast,
};