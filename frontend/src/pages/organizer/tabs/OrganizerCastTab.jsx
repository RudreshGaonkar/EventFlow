import { useState, useEffect } from 'react';
import { Trash2, UserPlus, Plus } from 'lucide-react';
import { getMyEvents, getPeople, createPerson, updatePerson, getCast, addCast, removeCast } from '../../../services/organizer';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';

const ROLE_TYPES = ['Cast', 'Director', 'Producer', 'Writer', 'Crew'];

const BLANK_PERSON = { real_name: '', bio: '', photo: null };
const BLANK_CAST = { person_id: '', role_type: 'Cast', character_name: '', designation: '', billing_order: '' };

export default function OrganizerCastTab() {
  const [events, setEvents] = useState([]);
  const [people, setPeople] = useState([]);
  const [cast, setCast] = useState([]);
  const [selEvent, setSelEvent] = useState('');
  const [loading, setLoading] = useState(false);
  const [personModal, setPersonModal] = useState(null);
  const [castModal, setCastModal] = useState(false);
  const [personForm, setPersonForm] = useState(BLANK_PERSON);
  const [castForm, setCastForm] = useState(BLANK_CAST);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([getMyEvents(), getPeople()])
      .then(([er, pr]) => {
        setEvents(er.data.data || []);
        setPeople(pr.data.data || []);
      })
      .catch(() => showToast('Failed to load', 'error'));
  }, []);

  useEffect(() => {
    if (!selEvent) return setCast([]);
    setLoading(true);
    getCast(selEvent)
      .then(r => setCast(r.data.data || []))
      .catch(() => showToast('Failed to load cast', 'error'))
      .finally(() => setLoading(false));
  }, [selEvent]);

  const reloadCast = () => {
    if (!selEvent) return;
    getCast(selEvent).then(r => setCast(r.data.data || []));
  };

  const reloadPeople = () => {
    getPeople().then(r => setPeople(r.data.data || []));
  };

  const handleSavePerson = async () => {
    if (!personForm.real_name) return showToast('Name is required', 'warning');
    setSaving(true);
    try {
      const fd = new FormData();
      if (personForm.real_name) fd.append('real_name', personForm.real_name);
      if (personForm.bio) fd.append('bio', personForm.bio);
      if (personForm.photo) fd.append('photo', personForm.photo);
      if (personModal.mode === 'add') { await createPerson(fd); showToast('Person created', 'success'); }
      else { await updatePerson(personModal.data.person_id, fd); showToast('Person updated', 'success'); }
      setPersonModal(null);
      setPersonForm(BLANK_PERSON);
      reloadPeople();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleAddCast = async () => {
    if (!castForm.person_id || !castForm.role_type) return showToast('Person and role are required', 'warning');
    setSaving(true);
    try {
      await addCast(selEvent, { ...castForm, billing_order: castForm.billing_order || undefined });
      showToast('Added to cast', 'success');
      setCastModal(false);
      setCastForm(BLANK_CAST);
      reloadCast();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleRemoveCast = async (event_person_id) => {
    if (!confirm('Remove from cast?')) return;
    try { await removeCast(event_person_id); showToast('Removed', 'success'); reloadCast(); }
    catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const sp = (k) => (e) => setPersonForm(f => ({ ...f, [k]: e.target.value }));
  const sc = (k) => (e) => setCastForm(f => ({ ...f, [k]: e.target.value }));

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
        <button
          onClick={() => { setPersonForm(BLANK_PERSON); setPersonModal({ mode: 'add' }); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface-variant text-sm font-semibold rounded-xl hover:text-on-surface hover:bg-surface-container-highest transition-all"
        >
          <UserPlus size={15} />
          New Person
        </button>
        {selEvent && (
          <button
            onClick={() => { setCastForm(BLANK_CAST); setCastModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-[#000000] text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all"
          >
            <Plus size={15} />
            Add to Cast
          </button>
        )}
      </div>

      {!selEvent ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
          <UserPlus size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Select an event to manage its cast & crew</p>
        </div>
      ) : (
        <AdminTable
          loading={loading}
          hideAdd
          columns={['Person', 'Role', 'Character / Designation', 'Order', 'Actions']}
          rows={(cast || []).map(c => [
            <div className="flex items-center gap-3">
              {c.photo_url
                ? <img src={c.photo_url} className="w-8 h-8 rounded-full object-cover" />
                : <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    {c.real_name?.slice(0, 2).toUpperCase()}
                  </div>
              }
              <span className="text-sm font-medium text-on-surface">{c.real_name}</span>
            </div>,
            <span className="text-xs px-2 py-0.5 bg-primary/15 text-primary rounded-full font-semibold">{c.role_type}</span>,
            c.character_name || c.designation || '—',
            c.billing_order || '—',
            <button
              onClick={() => handleRemoveCast(c.event_person_id)}
              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
            >
              <Trash2 size={14} />
            </button>
          ])}
        />
      )}

      <AdminModal
        open={!!personModal}
        title={personModal?.mode === 'add' ? 'New Person' : 'Edit Person'}
        onClose={() => setPersonModal(null)}
        onSave={handleSavePerson}
        saving={saving}
      >
        <AdminField label="Full Name *" value={personForm.real_name} onChange={sp('real_name')} placeholder="e.g. Shah Rukh Khan" />
        <AdminField label="Bio" value={personForm.bio} onChange={sp('bio')} placeholder="Short bio..." />
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setPersonForm(f => ({ ...f, photo: e.target.files[0] }))}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface-variant rounded-xl text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary-container file:text-on-primary-container file:text-xs file:font-semibold cursor-pointer"
          />
        </div>
      </AdminModal>

      <AdminModal
        open={castModal}
        title="Add to Cast & Crew"
        onClose={() => setCastModal(false)}
        onSave={handleAddCast}
        saving={saving}
      >
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">Person *</label>
          <select
            value={castForm.person_id}
            onChange={sc('person_id')}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface rounded-xl text-sm outline-none"
          >
            <option value="">Select person...</option>
            {people.map(p => <option key={p.person_id} value={p.person_id}>{p.real_name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">Role Type *</label>
          <select
            value={castForm.role_type}
            onChange={sc('role_type')}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface rounded-xl text-sm outline-none"
          >
            {ROLE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <AdminField label="Character Name" value={castForm.character_name} onChange={sc('character_name')} placeholder="e.g. Tony Stark" />
        <AdminField label="Designation" value={castForm.designation} onChange={sc('designation')} placeholder="e.g. Lead Director" />
        <AdminField label="Billing Order" type="number" value={castForm.billing_order} onChange={sc('billing_order')} placeholder="e.g. 1" />
      </AdminModal>
    </>
  );
}
