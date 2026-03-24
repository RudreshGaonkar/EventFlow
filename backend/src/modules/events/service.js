const { uploadFile, deleteFile } = require('../../config/cloudinary');
const { findUserById } = require('../auth/queries');
const {
  getAllEvents, getEventById, createEvent, updateEvent, softDeleteEvent,
  getAllPeople, createPerson, updatePerson,
  getEventPeople, addPersonToEvent, removePersonFromEvent,
  getSessionsByEvent, createSession, updateSessionMultiplier, updateSessionStatus,
  getReviewsByEvent, getReviewsBySession, createReview,
  getAvailableSessions, getReviewScores
} = require('./queries');

// Parent Events

const getEvents = async (req, res) => {
  try {
    const events = await getAllEvents();
    return res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error('[Events] getEvents error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch events' });
  }
};

const getEvent = async (req, res) => {
  try {
    const event = await getEventById(req.params.event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    const cast = await getEventPeople(req.params.event_id);
    const scores = await getReviewScores(req.params.event_id);
    return res.status(200).json({ success: true, data: { ...event, cast, scores } });
  } catch (err) {
    console.error('[Events] getEvent error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch event' });
  }
};

const addEvent = async (req, res) => {
  try {
    const { event_type, title, description, rating, duration_mins, age_limit, language, genre, trailer_url } = req.body;

    let poster_url = null;
    let poster_public_id = null;

    if (req.file) {
      const uploaded = await uploadFile(req.file.path, 'posters', null);
      poster_url = uploaded.secure_url;
      poster_public_id = uploaded.public_id;
    }

    const event_id = await createEvent(
      req.user.user_id, event_type, title, description,
      rating, duration_mins, age_limit, language, genre,
      poster_url, poster_public_id, trailer_url
    );

    return res.status(201).json({ success: true, message: 'Event created', data: { event_id } });
  } catch (err) {
    console.error('[Events] addEvent error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not create event' });
  }
};

const editEvent = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { title, description, rating, duration_mins, age_limit, language, genre, trailer_url } = req.body;

    const existing = await getEventById(event_id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (existing.organizer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Not your event' });
    }

    let poster_url = existing.poster_url;
    let poster_public_id = existing.poster_public_id;

    if (req.file) {
      if (existing.poster_public_id) {
        await deleteFile(existing.poster_public_id);
      }
      const uploaded = await uploadFile(req.file.path, 'posters', null);
      poster_url = uploaded.secure_url;
      poster_public_id = uploaded.public_id;
    }

    await updateEvent(event_id, title, description, rating, duration_mins, age_limit, language, genre, poster_url, poster_public_id, trailer_url);

    return res.status(200).json({ success: true, message: 'Event updated' });
  } catch (err) {
    console.error('[Events] editEvent error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update event' });
  }
};

const removeEvent = async (req, res) => {
  try {
    const { event_id } = req.params;
    const existing = await getEventById(event_id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (existing.organizer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Not your event' });
    }
    await softDeleteEvent(event_id);
    return res.status(200).json({ success: true, message: 'Event deactivated' });
  } catch (err) {
    console.error('[Events] removeEvent error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not deactivate event' });
  }
};

// People

const getPeople = async (req, res) => {
  try {
    const people = await getAllPeople();
    return res.status(200).json({ success: true, data: people });
  } catch (err) {
    console.error('[Events] getPeople error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch people' });
  }
};

const addPerson = async (req, res) => {
  try {
    const { real_name, bio } = req.body;

    let photo_url = null;
    let photo_public_id = null;

    if (req.file) {
      const uploaded = await uploadFile(req.file.path, 'cast', null);
      photo_url = uploaded.secure_url;
      photo_public_id = uploaded.public_id;
    }

    const person_id = await createPerson(real_name, photo_url, photo_public_id, bio);
    return res.status(201).json({ success: true, message: 'Person created', data: { person_id } });
  } catch (err) {
    console.error('[Events] addPerson error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not create person' });
  }
};

const editPerson = async (req, res) => {
  try {
    const { person_id } = req.params;
    const { real_name, bio } = req.body;

    let photo_url = req.body.photo_url || null;
    let photo_public_id = req.body.photo_public_id || null;

    if (req.file) {
      if (photo_public_id) {
        await deleteFile(photo_public_id);
      }
      const uploaded = await uploadFile(req.file.path, 'cast', null);
      photo_url = uploaded.secure_url;
      photo_public_id = uploaded.public_id;
    }

    await updatePerson(person_id, real_name, photo_url, photo_public_id, bio);
    return res.status(200).json({ success: true, message: 'Person updated' });
  } catch (err) {
    console.error('[Events] editPerson error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update person' });
  }
};

// Cast

const getCast = async (req, res) => {
  try {
    const cast = await getEventPeople(req.params.event_id);
    return res.status(200).json({ success: true, data: cast });
  } catch (err) {
    console.error('[Events] getCast error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch cast' });
  }
};

const addCast = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { person_id, role_type, character_name, designation, billing_order } = req.body;

    const existing = await getEventById(event_id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (existing.organizer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Not your event' });
    }

    const id = await addPersonToEvent(event_id, person_id, role_type, character_name, designation, billing_order);
    return res.status(201).json({ success: true, message: 'Person added to event', data: { event_person_id: id } });
  } catch (err) {
    console.error('[Events] addCast error:', err.message);
    if (err.message.includes('Duplicate')) {
      return res.status(409).json({ success: false, message: 'Person already added with this role' });
    }
    return res.status(500).json({ success: false, message: 'Could not add person to event' });
  }
};

const removeCast = async (req, res) => {
  try {
    await removePersonFromEvent(req.params.event_person_id);
    return res.status(200).json({ success: true, message: 'Person removed from event' });
  } catch (err) {
    console.error('[Events] removeCast error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not remove person from event' });
  }
};

// Sessions

const getSessions = async (req, res) => {
  try {
    const sessions = await getSessionsByEvent(req.params.event_id);
    return res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    console.error('[Events] getSessions error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch sessions' });
  }
};

const addSession = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { venue_id, show_date, show_time, demand_multiplier } = req.body;

    const existing = await getEventById(event_id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (existing.organizer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Not your event' });
    }

    const session_id = await createSession(event_id, venue_id, show_date, show_time, demand_multiplier);
    return res.status(201).json({ success: true, message: 'Session created', data: { session_id } });
  } catch (err) {
    console.error('[Events] addSession error:', err.message);
    if (err.message.includes('Duplicate')) {
      return res.status(409).json({ success: false, message: 'A session already exists at this venue, date and time' });
    }
    return res.status(500).json({ success: false, message: 'Could not create session' });
  }
};

const editSessionMultiplier = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { demand_multiplier } = req.body;
    await updateSessionMultiplier(session_id, demand_multiplier);
    return res.status(200).json({ success: true, message: 'Demand multiplier updated' });
  } catch (err) {
    console.error('[Events] editSessionMultiplier error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update multiplier' });
  }
};

const editSessionStatus = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { status } = req.body;
    await updateSessionStatus(session_id, status);
    return res.status(200).json({ success: true, message: 'Session status updated' });
  } catch (err) {
    console.error('[Events] editSessionStatus error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not update session status' });
  }
};

// Reviews

const getEventReviews = async (req, res) => {
  try {
    const reviews = await getReviewsByEvent(req.params.event_id);
    return res.status(200).json({ success: true, data: reviews });
  } catch (err) {
    console.error('[Events] getEventReviews error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch reviews' });
  }
};

const getSessionReviews = async (req, res) => {
  try {
    const reviews = await getReviewsBySession(req.params.session_id);
    return res.status(200).json({ success: true, data: reviews });
  } catch (err) {
    console.error('[Events] getSessionReviews error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch reviews' });
  }
};

const addReview = async (req, res) => {
  try {
    const { event_id, session_id, rating, review_text } = req.body;

    if ((event_id && session_id) || (!event_id && !session_id)) {
      return res.status(400).json({ success: false, message: 'Review must target either an event or a session — not both or neither' });
    }

    const id = await createReview(req.user.user_id, event_id, session_id, rating, review_text);
    return res.status(201).json({ success: true, message: 'Review submitted', data: { review_id: id } });
  } catch (err) {
    console.error('[Events] addReview error:', err.message);
    if (err.message.includes('Duplicate')) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this' });
    }
    return res.status(500).json({ success: false, message: 'Could not submit review' });
  }
};

// Browse — ✅ FIXED: fetches home_state_id from DB instead of JWT

const browseSessions = async (req, res) => {
  try {
    let state_id = req.query.state_id;

    if (!state_id) {
      const user = await findUserById(req.user.user_id);
      state_id = user?.home_state_id;
    }

    if (!state_id) {
      return res.status(400).json({ success: false, message: 'State is required for browsing' });
    }

    const sessions = await getAvailableSessions(state_id);
    return res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    console.error('[Events] browseSessions error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch sessions' });
  }
};

module.exports = {
  getEvents, getEvent, addEvent, editEvent, removeEvent,
  getPeople, addPerson, editPerson,
  getCast, addCast, removeCast,
  getSessions, addSession, editSessionMultiplier, editSessionStatus,
  getEventReviews, getSessionReviews, addReview,
  browseSessions
};
