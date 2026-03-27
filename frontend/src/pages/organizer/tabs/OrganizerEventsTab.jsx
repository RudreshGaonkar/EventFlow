import { useState, useEffect } from 'react';
import { Pencil, Trash2, Image } from 'lucide-react';
import { getMyEvents, createMyEvent, updateMyEvent, deactivateMyEvent } from '../../../services/organizer';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';

const BLANK = {
  event_type: 'Movie', title: '', description: '', rating: 'G',
  duration_mins: '', age_limit: '', language: 'English',
  genre: '', trailer_url: '', poster: null
};

const EVENT_TYPES = ['Movie', 'Concert', 'Play', 'Sport', 'Other'];
const RATINGS = ['G', 'UA', 'A', 'S'];

export default function OrganizerEventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const r = await getMyEvents();
      setEvents(r.data.data || []);
    } catch { showToast('Failed to load events', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(BLANK); setModal({ mode: 'add' }); };
  const openEdit = (e) => { setForm({ ...e, poster: null }); setModal({ mode: 'edit', data: e }); };

  const handleSave = async () => {
    if (!form.title || !form.event_type) return showToast('Title and type are required', 'warning');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'poster' && v) fd.append('poster', v);
        else if (k !== 'poster' && v !== null && v !== undefined && v !== '') fd.append(k, v);
      });
      if (modal.mode === 'add') { await createMyEvent(fd); showToast('Event created!', 'success'); }
      else { await updateMyEvent(modal.data.event_id, fd); showToast('Event updated!', 'success'); }
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

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <AdminTable
        loading={loading}
        onAdd={openAdd}
        columns={['Event', 'Type', 'Genre', 'Duration', 'Rating', 'Actions']}
        rows={(events || []).map(e => [
          <div className="flex items-center gap-3">
            {e.poster_url
              ? <img src={e.poster_url} className="w-10 h-14 object-cover rounded-lg" />
              : <div className="w-10 h-14 bg-surface-container-highest rounded-lg flex items-center justify-center"><Image size={16} className="text-on-surface-variant" /></div>
            }
            <div>
              <div className="font-medium text-white text-sm">{e.title}</div>
              <div className="text-xs text-on-surface-variant">{e.language}</div>
            </div>
          </div>,
          <span className="text-xs px-2 py-0.5 bg-primary/15 text-primary rounded-full font-semibold">{e.event_type}</span>,
          e.genre || '—',
          e.duration_mins ? `${e.duration_mins}m` : '—',
          <span className="text-xs px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full font-semibold">{e.rating}</span>,
          <div className="flex items-center gap-1">
            <button onClick={() => openEdit(e)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Pencil size={14} /></button>
            <button onClick={() => handleDeactivate(e.event_id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"><Trash2 size={14} /></button>
          </div>
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
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">Type</label>
          <select value={form.event_type} onChange={set('event_type')} className="w-full px-4 py-2.5 bg-surface-container-highest text-white rounded-xl text-sm outline-none">
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <AdminField label="Title *" value={form.title} onChange={set('title')} placeholder="e.g. Inception" />
        <AdminField label="Description" value={form.description} onChange={set('description')} placeholder="Short description..." />
        <AdminField label="Genre" value={form.genre} onChange={set('genre')} placeholder="e.g. Thriller, Drama" />
        <AdminField label="Language" value={form.language} onChange={set('language')} placeholder="e.g. English" />
        <AdminField label="Duration (mins)" type="number" value={form.duration_mins} onChange={set('duration_mins')} placeholder="e.g. 148" />
        <AdminField label="Age Limit" type="number" value={form.age_limit} onChange={set('age_limit')} placeholder="e.g. 13" />
        <AdminField label="Trailer URL" type="url" value={form.trailer_url} onChange={set('trailer_url')} placeholder="https://youtube.com/..." />

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">Rating</label>
          <select value={form.rating} onChange={set('rating')} className="w-full px-4 py-2.5 bg-surface-container-highest text-white rounded-xl text-sm outline-none">
            {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">Poster Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setForm(f => ({ ...f, poster: e.target.files[0] }))}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface-variant rounded-xl text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary-container file:text-on-primary-container file:text-xs file:font-semibold cursor-pointer"
          />
          {modal?.data?.poster_url && !form.poster && (
            <img src={modal.data.poster_url} className="mt-2 h-20 rounded-lg object-cover" />
          )}
        </div>
      </AdminModal>
    </>
  );
}
