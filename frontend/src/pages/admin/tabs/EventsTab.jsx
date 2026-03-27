import { useState, useEffect } from 'react';
import { Pencil, Trash2, Image } from 'lucide-react';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../../services/admin';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';

const BLANK = {
  event_type: 'Movie', title: '', description: '', rating: 'U',
  duration_mins: '', age_limit: '', language: 'English',
  genre: '', trailer_url: '', poster: null
};

const EVENT_TYPES = ['Movie', 'Play', 'Concert', 'Comedy', 'Sports', 'Other'];
const RATINGS     = ['U', 'UA', 'A', 'S'];

export default function EventsTab() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(BLANK);
  const [saving,  setSaving]  = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try { const r = await getEvents(); setEvents(r.data.data || []); }
    catch { showToast('Failed to load events', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(BLANK); setModal({ mode: 'add' }); };
  const openEdit = (e) => {
    setForm({ ...e, poster: null });
    setModal({ mode: 'edit', data: e });
  };

  const handleSave = async () => {
    if (!form.title || !form.event_type) return showToast('Title and type required', 'warning');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'poster' && v) fd.append('poster', v);
        else if (k !== 'poster' && v !== null && v !== undefined) fd.append(k, v);
      });
      if (modal.mode === 'add') { await createEvent(fd); showToast('Event created!', 'success'); }
      else { await updateEvent(modal.data.event_id, fd); showToast('Event updated!', 'success'); }
      setModal(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this event?')) return;
    try { await deleteEvent(id); showToast('Event deactivated', 'success'); load(); }
    catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <AdminTable title="Events" onAdd={openAdd} loading={loading}
        columns={['Event', 'Type', 'Genre', 'Duration', 'Rating', 'Actions']}
        rows={events.map(e => [
          <div className="flex items-center gap-3">
            {e.poster_url
              ? <img src={e.poster_url} className="w-9 h-12 rounded-lg object-cover" />
              : <div className="w-9 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center"><Image size={14} className="text-outline" /></div>
            }
            <div>
              <p className="font-medium text-white text-sm">{e.title}</p>
              <p className="text-xs text-on-surface-variant">{e.language}</p>
            </div>
          </div>,
          <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">{e.event_type}</span>,
          e.genre || '—',
          e.duration_mins ? `${e.duration_mins}m` : '—',
          <span className="px-2 py-0.5 text-[10px] font-bold bg-surface-container rounded-lg font-mono">{e.rating}</span>,
          <div className="flex gap-2">
            <button onClick={() => openEdit(e)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Pencil size={14} /></button>
            <button onClick={() => handleDelete(e.event_id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"><Trash2 size={14} /></button>
          </div>
        ])}
      />

      <AdminModal open={!!modal} title={modal?.mode === 'add' ? 'Add Event' : 'Edit Event'}
        onClose={() => setModal(null)} onSave={handleSave} saving={saving} wide>
        <div className="grid grid-cols-2 gap-4">
          {/* Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Type</label>
            <select value={form.event_type} onChange={set('event_type')}
              className="w-full px-4 py-2.5 bg-surface-container-highest text-white rounded-xl text-sm outline-none">
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {/* Rating */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Rating</label>
            <select value={form.rating} onChange={set('rating')}
              className="w-full px-4 py-2.5 bg-surface-container-highest text-white rounded-xl text-sm outline-none">
              {RATINGS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <AdminField label="Title *" value={form.title} onChange={set('title')} placeholder="Event title" />
        <AdminField label="Description" value={form.description} onChange={set('description')} placeholder="Short description" />
        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Language" value={form.language} onChange={set('language')} placeholder="English" />
          <AdminField label="Genre" value={form.genre} onChange={set('genre')} placeholder="Drama, Action..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <AdminField label="Duration (mins)" type="number" value={form.duration_mins} onChange={set('duration_mins')} placeholder="120" />
          <AdminField label="Age Limit" type="number" value={form.age_limit} onChange={set('age_limit')} placeholder="18" />
        </div>
        <AdminField label="Trailer URL" value={form.trailer_url} onChange={set('trailer_url')} placeholder="https://youtube.com/..." />
        {/* Poster upload */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
            Poster Image
          </label>
          <input type="file" accept="image/*"
            onChange={e => setForm(f => ({ ...f, poster: e.target.files[0] }))}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface-variant rounded-xl text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary-container file:text-on-primary-container file:text-xs file:font-semibold cursor-pointer"
          />
          {modal?.data?.poster_url && !form.poster && (
            <img src={modal.data.poster_url} className="h-16 rounded-lg mt-1 object-cover" alt="current poster" />
          )}
        </div>
      </AdminModal>
    </>
  );
}
