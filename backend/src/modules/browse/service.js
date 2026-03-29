const { searchEvents, getEventDetail, getSessionsByEvent, getCitiesWithEvents, getStates } = require('./queries');

const browseEvents = async (req, res) => {
  try {
    const { search, city_id, state_id, event_type, genre } = req.query;
    const events = await searchEvents({ search, city_id, state_id, event_type, genre });
    return res.status(200).json({ success: true, data: events });
  } catch (err) {
    console.error('[Browse] browseEvents:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch events' });
  }
};

const eventDetail = async (req, res) => {
  try {
    const event = await getEventDetail(req.params.event_id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    return res.status(200).json({ success: true, data: event });
  } catch (err) {
    console.error('[Browse] eventDetail:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch event' });
  }
};

const eventSessions = async (req, res) => {
  try {
    const sessions = await getSessionsByEvent(req.params.event_id);
    return res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    console.error('[Browse] eventSessions:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch sessions' });
  }
};

const citiesWithEvents = async (req, res) => {
  try {
    const cities = await getCitiesWithEvents();
    return res.status(200).json({ success: true, data: cities });
  } catch (err) {
    console.error('[Browse] citiesWithEvents:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch cities' });
  }
};

const statesList = async (req, res) => {
  try {
    const states = await getStates();
    return res.status(200).json({ success: true, data: states });
  } catch (err) {
    console.error('[Browse] statesList:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch states' });
  }
};

module.exports = { browseEvents, eventDetail, eventSessions, citiesWithEvents, statesList };