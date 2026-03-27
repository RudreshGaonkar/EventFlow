import { useState, useEffect } from 'react';
import { Plus, CalendarClock } from 'lucide-react';
import { getEvents, getSessions, createSession, updateSessionStatus } from '../../../services/admin';
import { getVenues } from '../../../services/admin';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';

const STATUS_COLORS = {
  Scheduled: 'bg-blue-500/15 text-blue-400',
  Ongoing:   'bg-emerald-500/15 text-emerald-400',
  Completed: 'bg-surface-container text-on-surface-variant',
  Cancelled: 'bg-red-500/15 text-red-400',
};

export default function SessionsTab() {
  const [events,    setEvents]    = useState([]);
  const [venues,    setVenues]    = useState([]);
  const [sessions,  setSessions]  = useState([]);
  const [selEvent,  setSelEvent]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [modal,     setModal]     = useState(null);
  const [form,      setForm]      = useState({ venue_id: '', show_date: '', show_time: '', demand_multiplier: 1.0 });
  const [saving,    setSaving]    = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([getEvents(), getVenues()])
      .then(([er, vr]) => { setEvents(er.data.data || []); setVenues(vr.data.data || []); })
      .catch(() => showToast('Failed to load', 'error'));
  }, []);

  useEffect(() => {
    if (!selEvent) return setSessions([]);
    setLoading(true);
    getSessions(selEvent)
      .then(r => setSessions(r.data.data || []))
      .catch(() => showToast('Failed to load sessions', 'error'))
      .finally(() => setLoading(false));
  }, [selEvent]);

  const handleSave = async () => {
    if (!selEvent || !form.venue_id || !form.show_date || !form.show_time)
      return showToast('Fill all required fields', 'warning');
    setSaving(true);
    try {
      await createSession(selEvent, form);
      showToast('Session created!', 'success');
      setModal(null);
      getSessions(selEvent).then(r => setSessions(r.data.data || []));
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleStatus = async (session_id, status) => {
    try {
      await updateSessionStatus(session_id, status);
      showToast('Status updated', 'success');
      getSessions(selEvent).then(r => setSessions(r.data.data || []));
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {/* Event selector */}
      <div className="mb-6 flex items-center gap-4">
        <div className="space-y-1 flex-1 max-w-xs">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
            Select Event
          </label>
          <select value={selEvent} onChange={e => setSelEvent(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-container text-white rounded-xl text-sm outline-none border border-outline-variant/20">
            <option value="">— choose an event —</option>
            {events.map(e => <option key={e.event_id} value={e.event_id}>{e.title}</option>)}
          </select>
        </div>
        {selEvent && (
          <button onClick={() => { setForm({ venue_id: '', show_date: '', show_time: '', demand_multiplier: 1.0 }); setModal({ mode: 'add' }); }}
            className="mt-5 flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container
              text-sm font-semibold rounded-xl hover:opacity-90 transition-all">
            <Plus size={15} /> Add Session
          </button>
        )}
      </div>

      <AdminTable
        title={selEvent ? `Sessions` : 'Sessions — select an event above'}
        loading={loading}
        hideAdd
        columns={['Date', 'Time', 'Venue', 'Multiplier', 'Status', 'Actions']}
        rows={sessions.map(s => [
          new Date(s.show_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          s.show_time,
          s.venue_name,
          <span className="font-mono text-xs text-secondary">×{s.demand_multiplier}</span>,
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[s.status] || ''}`}>
            {s.status}
          </span>,
          s.status === 'Scheduled' ? (
            <select onChange={e => handleStatus(s.session_id, e.target.value)} defaultValue=""
              className="px-2 py-1 bg-surface-container-highest text-white rounded-lg text-xs outline-none">
              <option value="" disabled>Change</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          ) : '—'
        ])}
      />

      <AdminModal open={!!modal} title="Add Session"
        onClose={() => setModal(null)} onSave={handleSave} saving={saving}>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Venue *</label>
          <select value={form.venue_id} onChange={set('venue_id')}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-white rounded-xl text-sm outline-none">
            <option value="">Select Venue</option>
            {venues.map(v => <option key={v.venue_id} value={v.venue_id}>{v.venue_name} — {v.city_name}</option>)}
          </select>
        </div>
        <AdminField label="Show Date *" type="date" value={form.show_date} onChange={set('show_date')} />
        <AdminField label="Show Time *" type="time" value={form.show_time} onChange={set('show_time')} />
        <AdminField label="Demand Multiplier" type="number" step="0.1" min="0.5" max="10"
          value={form.demand_multiplier} onChange={set('demand_multiplier')} />
      </AdminModal>
    </>
  );
}
