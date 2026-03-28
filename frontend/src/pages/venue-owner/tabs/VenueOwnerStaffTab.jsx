import { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { getMyStaff } from '../../../services/venue-owner';
import { getAllStaff, addStaff, assignStaffVenue } from '../../../services/staff';
import { getMyVenues } from '../../../services/venue-owner';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';

function SearchableSelect({ label, options, value, onChange, valueKey, labelKey, placeholder }) {
  const [query, setQuery]   = useState('');
  const [open,  setOpen]    = useState(false);
  const ref = useRef(null);

  const selected = options.find(o => String(o[valueKey]) === String(value));
  const filtered = options.filter(o => o[labelKey].toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{label}</label>
      <div className="relative bg-surface-container-highest rounded-xl border border-transparent focus-within:border-primary/40 transition-all">
        <div className="flex items-center gap-2 px-4 py-2.5 cursor-pointer min-h-[42px]"
          onClick={() => setOpen(o => !o)}>
          {open ? (
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-on-surface-variant"
              onClick={e => e.stopPropagation()} />
          ) : (
            <span className={`flex-1 text-sm truncate ${selected ? 'text-white' : 'text-on-surface-variant'}`}>
              {selected ? selected[labelKey] : placeholder}
            </span>
          )}
          <ChevronDown size={14} className={`text-on-surface-variant shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
        {open && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant/20 rounded-xl shadow-2xl max-h-44 overflow-y-auto">
            {filtered.length === 0
              ? <p className="px-4 py-3 text-sm text-on-surface-variant">No results</p>
              : filtered.map(o => (
                <div key={o[valueKey]}
                  onClick={() => { onChange(o[valueKey]); setQuery(''); setOpen(false); }}
                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-primary/10 transition-colors
                    ${String(o[valueKey]) === String(value) ? 'text-primary font-medium' : 'text-on-surface'}`}>
                  {o[labelKey]}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

const EMPTY_FORM  = { full_name: '', email: '', password: '', phone: '', venue_id: '' };
const EMPTY_VENUE = { venue_id: '' };

export default function VenueOwnerStaffTab() {
  const [staff,          setStaff]          = useState([]);
  const [venues,         setVenues]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [modal,          setModal]          = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [venueForm,      setVenueForm]      = useState(EMPTY_VENUE);
  const [selectedMember, setSelectedMember] = useState(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, vRes] = await Promise.all([getMyStaff(), getMyVenues()]);
      setStaff(sRes.data.data  || []);
      setVenues(vRes.data.data || []);
    } catch { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const venueOptions = venues
    .filter(v => v.status === 'Active')
    .map(v => ({ ...v, display_name: `${v.venue_name} — ${v.city_name}` }));

  const openAdd    = () => { setForm(EMPTY_FORM); setModal('add'); };
  const openAssign = (m) => { setSelectedMember(m); setVenueForm(EMPTY_VENUE); setModal('venue'); };

  const handleSave = async () => {
    if (!form.full_name || !form.email || !form.password)
      return showToast('Name, email and password are required', 'warning');
    if (!form.venue_id) return showToast('Assign a venue', 'warning');
    setSaving(true);
    try {
      await addStaff({ full_name: form.full_name, email: form.email, password: form.password,
        ...(form.phone    && { phone:    form.phone    }),
        ...(form.venue_id && { venue_id: form.venue_id }),
      });
      showToast('Staff member created', 'success');
      setModal(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleAssign = async () => {
    if (!venueForm.venue_id) return showToast('Select a venue', 'warning');
    setSaving(true);
    try {
      await assignStaffVenue(selectedMember.user_id, venueForm.venue_id);
      showToast('Venue assigned', 'success');
      setModal(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <AdminTable
        loading={loading}
        onAdd={openAdd}
        addLabel="Add Staff"
        columns={['Name / Email', 'Phone', 'Assigned Venue', 'Status']}
        rows={staff.map(m => [
          <div>
            <p className="font-medium text-white">{m.full_name}</p>
            <p className="text-xs text-on-surface-variant">{m.email}</p>
          </div>,
          m.phone || <span className="text-on-surface-variant">—</span>,
          <button onClick={() => openAssign(m)}
            className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors group">
            <MapPin size={13} className="shrink-0 text-on-surface-variant group-hover:text-primary" />
            <span className={m.venue_name ? 'text-on-surface' : 'text-on-surface-variant italic'}>
              {m.venue_name || 'Unassigned — click to assign'}
            </span>
          </button>,
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
            ${m.is_active ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
            {m.is_active ? 'Active' : 'Inactive'}
          </span>,
        ])}
      />

      <AdminModal open={modal === 'add'} title="Add Venue Staff"
        onClose={() => setModal(null)} onSave={handleSave} saving={saving}>
        <AdminField label="Full Name" value={form.full_name}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Rahul Sharma" />
        <AdminField label="Email" type="email" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@example.com" />
        <AdminField label="Password" type="password" value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
        <AdminField label="Phone (optional)" value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
        <SearchableSelect label="Assign Venue *" options={venueOptions} value={form.venue_id}
          onChange={val => setForm(f => ({ ...f, venue_id: val }))}
          valueKey="venue_id" labelKey="display_name" placeholder="Select a venue..." />
      </AdminModal>

      <AdminModal open={modal === 'venue'} title={`Assign Venue — ${selectedMember?.full_name}`}
        onClose={() => setModal(null)} onSave={handleAssign} saving={saving}>
        {selectedMember?.venue_name && (
          <div className="flex items-center gap-2 bg-surface-container-highest rounded-xl px-4 py-3 text-sm">
            <MapPin size={14} className="text-primary shrink-0" />
            <span className="text-on-surface-variant">Current:</span>
            <span className="text-white font-medium">{selectedMember.venue_name}</span>
          </div>
        )}
        <SearchableSelect label="New Venue" options={venueOptions} value={venueForm.venue_id}
          onChange={val => setVenueForm({ venue_id: val })}
          valueKey="venue_id" labelKey="display_name" placeholder="Select a venue..." />
      </AdminModal>
    </>
  );
}