import { useState, useEffect } from 'react';
import { Pencil, Trash2, Image, Globe, MapPin, FileText } from 'lucide-react';
import { getMyEvents, createMyEvent, updateMyEvent, deactivateMyEvent } from '../../../services/organizer';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';

const BLANK = {
  event_type:         'Movie',
  title:              '',
  description:        '',
  rating:             'G',
  duration_hrs:       '',
  duration_mins_part: '',
  duration_mins:      '',
  age_limit:          '',
  language:           'English',
  genre:              '',
  trailer_url:        '',
  registration_mode:  'booking',
  event_scope:        'national',
  listing_days_ahead: '',
  registration_fee:   '',
  participation_type: 'solo',
  max_participants:   '',
  min_team_size:      '2',
  max_team_size:      '5',
  brochure_url:       '',
  brochure:           null,
  poster:             null,
};

const EVENT_TYPES = ['Movie', 'Concert', 'Play', 'Sport', 'Other', 'Tech Fest', 'Workshop'];
const RATINGS     = ['G', 'UA', 'A', 'S'];

function AdminSelect({ label, value, onChange, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">
        {label}
      </label>
      <select value={value} onChange={onChange}
        className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface rounded-xl text-sm outline-none">
        {children}
      </select>
    </div>
  );
}

function Section({ title }) {
  return (
    <div className="col-span-full pt-2 pb-1 border-t border-outline-variant/30">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{title}</p>
    </div>
  );
}

const fmtDuration = (mins) => {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h)      return `${h}h`;
  return `${m}m`;
};

export default function OrganizerEventsTab() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(BLANK);
  const [saving,  setSaving]  = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const r = await getMyEvents();
      setEvents(r.data.data || []);
    } catch { showToast('Failed to load events', 'error'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(BLANK); setModal({ mode: 'add' }); };

  const openEdit = (e) => {
    const totalMins = parseInt(e.duration_mins) || 0;
    setForm({
      ...BLANK,
      ...e,
      poster:             null,
      duration_hrs:       totalMins ? Math.floor(totalMins / 60) : '',
      duration_mins_part: totalMins ? totalMins % 60             : '',
    });
    setModal({ mode: 'edit', data: e });
  };

  const handleSave = async () => {
    if (!form.title || !form.event_type)
      return showToast('Title and type are required', 'warning');
    if (form.registration_mode === 'paid_registration' && !form.registration_fee)
      return showToast('Registration fee is required for paid events', 'warning');

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if      (k === 'poster'             && v) fd.append('poster',   v);
        else if (k === 'brochure'           && v) fd.append('brochure', v);
        else if (
          k !== 'poster' &&
          k !== 'brochure' &&
          k !== 'brochure_url' &&
          k !== 'duration_hrs' &&
          k !== 'duration_mins_part' &&
          v !== null && v !== undefined && v !== ''
        ) fd.append(k, v);
      });

      if (modal.mode === 'add') {
        await createMyEvent(fd);
        showToast('Event created!', 'success');
      } else {
        await updateMyEvent(modal.data.event_id, fd);
        showToast('Event updated!', 'success');
      }
      setModal(null);
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this event?')) return;
    try { await deactivateMyEvent(id); showToast('Event deactivated', 'success'); load(); }
    catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const set  = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setV = (k, v) =>     setForm(f => ({ ...f, [k]: v }));

  const isBooking  = form.registration_mode === 'booking';
  const isPaid     = form.registration_mode === 'paid_registration';
  const isReg      = !isBooking;
  const isTeamMode = form.participation_type === 'team' || form.participation_type === 'both';

  return (
    <>
      <AdminTable
        loading={loading}
        onAdd={openAdd}
        columns={['Event', 'Type', 'Mode', 'Scope', 'Duration', 'Rating', 'Actions']}
        rows={(events || []).map(e => [

          /* Event */
          <div className="flex items-center gap-3">
            <div className={`overflow-hidden shrink-0 rounded-lg bg-surface-container-highest flex items-center justify-center
              ${['Movie', 'Play'].includes(e.event_type) ? 'w-10 aspect-[2/3]' : 'w-14 aspect-video'}`}>
              {e.poster_url 
                ? <img src={e.poster_url} className="w-full h-full object-cover" alt={e.title} />
                : <Image size={16} className="text-on-surface-variant" />}
            </div>
            <div>
              <div className="font-medium text-on-surface text-sm">{e.title}</div>
              <div className="text-xs text-on-surface-variant">{e.language}</div>
            </div>
          </div>,

          /* Type */
          <span className="text-xs px-2 py-0.5 bg-primary/15 text-primary rounded-full font-semibold">
            {e.event_type}
          </span>,

          /* Mode */
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
            ${e.registration_mode === 'booking'
              ? 'bg-tertiary/15 text-tertiary'
              : e.registration_mode === 'paid_registration'
              ? 'bg-secondary/15 text-secondary'
              : 'bg-primary/10 text-primary'
            }`}>
            {e.registration_mode === 'booking'? '🎟 Booking'
              : e.registration_mode === 'paid_registration' ? '💳 Paid Reg'
              : '✅ Free Reg'}
          </span>,

          /* Scope */
          e.event_scope === 'national'
            ? <span className="flex items-center gap-1 text-xs text-primary"><Globe size={11} /> National</span>
            : <span className="flex items-center gap-1 text-xs text-tertiary"><MapPin size={11} /> State</span>,

          /* Duration */
          <span className="text-xs text-on-surface-variant">{fmtDuration(e.duration_mins)}</span>,

          /* Rating */
          <span className="text-xs px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full font-semibold">
            {e.rating}
          </span>,

          /* Actions */
          <div className="flex items-center gap-1">
            <button onClick={() => openEdit(e)}
              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDeactivate(e.event_id)}
              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all">
              <Trash2 size={14} />
            </button>
          </div>,
        ])}
      />

      <AdminModal
        open={!!modal}
        title={modal?.mode === 'add' ? 'Add New Event' : 'Edit Event'}
        onClose={() => setModal(null)}
        onSave={handleSave}
        saving={saving}
        wide
      >
        {/* ── Basic Info ──────────────────────────────────────────────────── */}
        <Section title="Basic Info" />

        <AdminSelect label="Event Type" value={form.event_type} onChange={set('event_type')}>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </AdminSelect>

        <AdminField label="Title *"     value={form.title}       onChange={set('title')}       placeholder="e.g. Inception" />
        <AdminField label="Description" value={form.description} onChange={set('description')} placeholder="Short description..." />
        <AdminField label="Genre"       value={form.genre}       onChange={set('genre')}       placeholder="e.g. Thriller, Drama" />
        <AdminField label="Language"    value={form.language}    onChange={set('language')}    placeholder="e.g. English" />

        {/* ── Duration ────────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">
            Duration
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="number" min="0" max="23"
                value={form.duration_hrs}
                onChange={e => {
                  const hrs  = parseInt(e.target.value) || 0;
                  const mins = parseInt(form.duration_mins_part) || 0;
                  setForm(f => ({ ...f, duration_hrs: e.target.value, duration_mins: hrs * 60 + mins || '' }));
                }}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface
                  placeholder:text-on-surface-variant rounded-xl text-sm outline-none pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">hrs</span>
            </div>
            <div className="relative">
              <input
                type="number" min="0" max="59"
                value={form.duration_mins_part}
                onChange={e => {
                  const hrs  = parseInt(form.duration_hrs) || 0;
                  const mins = parseInt(e.target.value)    || 0;
                  setForm(f => ({ ...f, duration_mins_part: e.target.value, duration_mins: hrs * 60 + mins || '' }));
                }}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface
                  placeholder:text-on-surface-variant rounded-xl text-sm outline-none pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">mins</span>
            </div>
          </div>
        </div>

        <AdminField label="Age Limit"   type="number" value={form.age_limit}   onChange={set('age_limit')}   placeholder="e.g. 13" />
        <AdminField label="Trailer URL" type="url"    value={form.trailer_url} onChange={set('trailer_url')} placeholder="https://youtube.com/..." />

        <AdminSelect label="Rating" value={form.rating} onChange={set('rating')}>
          {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
        </AdminSelect>

        {/* ── Registration & Scope ───────────────────────────────────────── */}
        <Section title="Registration & Scope" />

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">
            Registration Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'booking',           label: '🎟 Seat Booking',  desc: 'Users pick seats' },
              { value: 'free_registration', label: '✅ Free Register', desc: 'No payment needed' },
              { value: 'paid_registration', label: '💳 Paid Register', desc: 'Fee required' },
            ].map(({ value, label, desc }) => (
              <button key={value} type="button" onClick={() => setV('registration_mode', value)}
                className={`p-3 rounded-xl border-2 text-center text-xs transition-all
                  ${form.registration_mode === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant bg-surface-container-highest text-on-surface-variant hover:border-primary/40'
                  }`}>
                <div className="font-bold mb-0.5">{label}</div>
                <div className="opacity-60 text-[10px]">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {isPaid && (
          <AdminField label="Registration Fee (₹) *" type="number"
            value={form.registration_fee} onChange={set('registration_fee')} placeholder="e.g. 500" />
        )}

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">
            Event Scope
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'national', label: '🌐 National', desc: 'Visible in all states' },
              { value: 'state',    label: '📍 State',    desc: 'Visible in venue state only' },
            ].map(({ value, label, desc }) => (
              <button key={value} type="button" onClick={() => setV('event_scope', value)}
                className={`p-3 rounded-xl border-2 text-center text-xs transition-all
                  ${form.event_scope === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant bg-surface-container-highest text-on-surface-variant hover:border-primary/40'
                  }`}>
                <div className="font-bold mb-0.5">{label}</div>
                <div className="opacity-60 text-[10px]">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        <AdminField label="Listing Days Ahead (optional)" type="number"
          value={form.listing_days_ahead} onChange={set('listing_days_ahead')}
          placeholder={isBooking ? 'Default: 5 days' : 'Default: 30 days'} />

        {/* ── Participation ───────────────────────────────────────────────── */}
        {isReg && (
          <>
            <Section title="Participation" />
            <AdminSelect label="Participation Type" value={form.participation_type} onChange={set('participation_type')}>
              <option value="solo">Solo only</option>
              <option value="team">Team only</option>
              <option value="both">Solo & Team</option>
            </AdminSelect>
            <AdminField label="Max Total Registrations (optional)" type="number"
              value={form.max_participants} onChange={set('max_participants')} placeholder="Leave blank for unlimited" />
            {isTeamMode && (
              <div className="grid grid-cols-2 gap-3">
                <AdminField label="Min Team Size" type="number" value={form.min_team_size} onChange={set('min_team_size')} placeholder="e.g. 2" />
                <AdminField label="Max Team Size" type="number" value={form.max_team_size} onChange={set('max_team_size')} placeholder="e.g. 5" />
              </div>
            )}
          </>
        )}

        {/* ── Documents ──────────────────────────────────────────────────── */}
        <Section title="Documents" />

        {form.brochure_url && (
          <a href={form.brochure_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mb-1">
            <FileText size={12} /> View current brochure ↗
          </a>
        )}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">
            {form.brochure_url ? 'Replace Brochure (PDF)' : 'Upload Brochure (PDF, optional)'}
          </label>
          <input type="file" accept="application/pdf"
            onChange={e => setForm(f => ({ ...f, brochure: e.target.files[0] || null }))}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface rounded-xl text-sm
              outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0
              file:text-xs file:font-semibold file:bg-primary/20 file:text-primary
              hover:file:bg-primary/30 cursor-pointer" />
          {form.brochure && (
            <p className="text-[10px] text-on-surface-variant px-1 mt-1">
              📄 {form.brochure.name} — {(form.brochure.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>

        {/* ── Poster ─────────────────────────────────────────────────────── */}
        <Section title="Poster" />

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">
            Poster Image
          </label>
          <input type="file" accept="image/*"
            onChange={e => setForm(f => ({ ...f, poster: e.target.files[0] }))}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface-variant rounded-xl
              text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0
              file:bg-primary-container file:text-on-primary-container file:text-xs file:font-semibold cursor-pointer" />
          {modal?.data?.poster_url && !form.poster && (
            <img src={modal.data.poster_url} className="mt-2 h-20 rounded-lg object-cover" alt="Current poster" />
          )}
        </div>
      </AdminModal>
    </>
  );
}