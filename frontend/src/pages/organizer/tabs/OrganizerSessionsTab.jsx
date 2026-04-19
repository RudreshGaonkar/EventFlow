import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { getMyEvents, getMySessions, createMySession, updateSessionStatus, updateSessionMultiplier } from '../../../services/organizer';
import { getVenues } from '../../../services/organizer';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';


const STATUS_COLORS = {
  Scheduled: 'bg-blue-500/15 text-blue-400',
  Ongoing: 'bg-emerald-500/15 text-emerald-400',
  Completed: 'bg-surface-container text-on-surface-variant',
  Cancelled: 'bg-red-500/15 text-red-400',
};

const STATUSES = ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'];

const BLANK = {
  venue_id: '',
  show_date: '',
  show_time: '',
  demand_multiplier: 1.0,
  requires_registration: false,      // ← new
  session_max_participants: '',      // ← new
};


export default function OrganizerSessionsTab() {
  const [events, setEvents]     = useState([]);
  const [venues, setVenues]     = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selEvent, setSelEvent] = useState('');
  const [loading, setLoading]   = useState(false);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(BLANK);
  const [saving, setSaving]     = useState(false);
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // ── derive selected event object for conditional fields ──────────────────
  const selectedEvent = events.find(e => String(e.event_id) === String(selEvent));
  const isNonBooking  = selectedEvent && selectedEvent.registration_mode !== 'booking';

  useEffect(() => {
    Promise.all([getMyEvents(), getVenues()])
      .then(([er, vr]) => {
        setEvents(er.data.data || []);
        setVenues(vr.data.data || []);
      })
      .catch(() => showToast('Failed to load', 'error'));
  }, []);

  useEffect(() => {
    if (!selEvent) return setSessions([]);
    setLoading(true);
    getMySessions(selEvent)
      .then(r => setSessions(r.data.data || []))
      .catch(() => showToast('Failed to load sessions', 'error'))
      .finally(() => setLoading(false));
  }, [selEvent]);

  useEffect(() => {
    if (location.state?.prefill && events.length > 0 && venues.length > 0) {
      const { title, venue_id } = location.state.prefill;
      let matchedEventId = '';

      if (title) {
        const foundEvent = events.find(e => e.title.toLowerCase() === title.toLowerCase());
        if (foundEvent) {
          setSelEvent(foundEvent.event_id);
          matchedEventId = foundEvent.event_id;
        }
      }

      if (venue_id) {
        setForm(f => ({ ...f, venue_id: String(venue_id) }));
        if (matchedEventId) setModal(true); // only auto-open if event is selected
      }

      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, events, venues, navigate]);

  const reload = () => {
    if (!selEvent) return;
    getMySessions(selEvent).then(r => setSessions(r.data.data || []));
  };

  const handleSave = async () => {
    if (!selEvent || !form.venue_id || !form.show_date || !form.show_time)
      return showToast('Fill all required fields', 'warning');
    setSaving(true);
    try {
      await createMySession(selEvent, form);
      showToast('Session created!', 'success');
      setModal(false);
      setForm(BLANK);
      reload();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleStatus = async (session_id, status) => {
    try {
      await updateSessionStatus(session_id, status);
      showToast('Status updated', 'success');
      reload();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const handleMultiplier = async (session_id, val) => {
    try {
      await updateSessionMultiplier(session_id, val);
      showToast('Multiplier updated', 'success');
      reload();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <select
          value={selEvent}
          onChange={e => setSelEvent(e.target.value)}
          className="flex-1 max-w-xs px-4 py-2.5 bg-surface-container-highest text-on-surface rounded-xl text-sm outline-none"
        >
          <option value="">Select an event...</option>
          {events.map(e => <option key={e.event_id} value={e.event_id}>{e.title}</option>)}
        </select>
        {selEvent && (
          <button
            onClick={() => { setForm(BLANK); setModal(true); }}
            className="flex items-center gap-2 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-colors px-4 py-2 text-sm"
          >
            <CalendarClock size={15} />
            Add Session
          </button>
        )}
      </div>

      {!selEvent ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <CalendarClock size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Select an event to view its sessions</p>
        </div>
      ) : (
        <AdminTable
          loading={loading}
          hideAdd
          columns={['Venue', 'City', 'Date', 'Time', 'Multiplier', 'Status']}
          rows={(sessions || []).map(s => [
            s.venue_name,
            s.city_name,
            new Date(s.show_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            s.show_time?.slice(0, 5),
            <input
              type="number"
              defaultValue={s.demand_multiplier}
              step="0.1" min="0.1" max="10"
              onBlur={e => handleMultiplier(s.session_id, e.target.value)}
              className="w-20 px-2 py-1 bg-surface-container-highest text-on-surface rounded-lg text-xs outline-none"
            />,
            <select
              value={s.status}
              onChange={e => handleStatus(s.session_id, e.target.value)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold outline-none ${STATUS_COLORS[s.status]}`}
            >
              {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          ])}
        />
      )}

      <AdminModal
        open={modal}
        title="Add Session"
        onClose={() => setModal(false)}
        onSave={handleSave}
        saving={saving}
      >
        {/* ── Venue ── */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">
            Venue *
          </label>
          <select
            value={form.venue_id}
            onChange={set('venue_id')}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface rounded-xl text-sm outline-none"
          >
            <option value="">Select Venue</option>
            {venues.map(v => (
              <option key={v.venue_id} value={v.venue_id}>
                {v.venue_name} — {v.city_name}
              </option>
            ))}
          </select>
        </div>

        <AdminField label="Date *"             type="date"   value={form.show_date}         onChange={set('show_date')} />
        <AdminField label="Time *"             type="time"   value={form.show_time}         onChange={set('show_time')} />
        <AdminField label="Demand Multiplier"  type="number" value={form.demand_multiplier} onChange={set('demand_multiplier')} placeholder="e.g. 1.5" />

        {/* ── Registration (non-booking events only) ───────────────────────── */}
        {isNonBooking && (
          <>
            <div className="flex items-center justify-between px-1 py-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
                Requires Registration
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm(f => ({
                    ...f,
                    requires_registration: !f.requires_registration,
                    session_max_participants: '',   // reset when toggled off
                  }))
                }
                className={`relative w-11 h-6 rounded-full transition-colors duration-200
                  ${form.requires_registration ? 'bg-primary' : 'bg-surface-container-highest'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
                    transition-transform duration-200
                    ${form.requires_registration ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {form.requires_registration && (
              <AdminField
                label="Max Participants (this session)"
                type="number"
                value={form.session_max_participants}
                onChange={set('session_max_participants')}
                placeholder="e.g. 50  — leave blank for unlimited"
              />
            )}
          </>
        )}
      </AdminModal>
    </>
  );
}