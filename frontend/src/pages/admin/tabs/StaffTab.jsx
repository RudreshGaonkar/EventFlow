import { useState, useEffect, useRef } from 'react';
import { UserX, UserCheck, MapPin } from 'lucide-react';
import { getAllStaff, addStaff, toggleStaffActive, assignStaffVenue } from '../../../services/staff';
import { getStates, getCities, getVenues } from '../../../services/admin';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';

function SearchableSelect({ label, options, value, onChange, valueKey, labelKey, placeholder, disabled }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find(o => String(o[valueKey]) === String(value));
  const filtered = options.filter(o =>
    o[labelKey].toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
        {label}
      </label>
      <div className={`relative bg-surface-container-highest rounded-xl border border-transparent
        focus-within:border-primary/40 transition-all ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
        <div
          className="flex items-center gap-2 px-4 py-2.5 cursor-pointer min-h-[42px]"
          onClick={() => !disabled && setOpen(o => !o)}
        >
          {open ? (
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Type to search...`}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-on-surface-variant"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className={`flex-1 text-sm truncate ${selected ? 'text-white' : 'text-on-surface-variant'}`}>
              {selected ? selected[labelKey] : placeholder}
            </span>
          )}
        </div>
        {open && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container
            border border-outline-variant/20 rounded-xl shadow-2xl max-h-44 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-on-surface-variant">No results</p>
            ) : (
              filtered.map(o => (
                <div
                  key={o[valueKey]}
                  onClick={() => { onChange(o[valueKey]); setQuery(''); setOpen(false); }}
                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-primary/10 transition-colors
                    ${String(o[valueKey]) === String(value) ? 'text-primary font-medium' : 'text-on-surface'}`}
                >
                  {o[labelKey]}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VenueSelector({ form, setForm, states, cities, setCities, venues, setVenues, showToast }) {
  useEffect(() => {
    if (!form.state_id) {
      setCities([]); setVenues([]);
      setForm(f => ({ ...f, city_id: '', venue_id: '' }));
      return;
    }
    getCities(form.state_id)
      .then(r => setCities(r.data.data || []))
      .catch(() => showToast('Failed to load cities', 'error'));
    setForm(f => ({ ...f, city_id: '', venue_id: '' }));
    setVenues([]);
  }, [form.state_id]);

  useEffect(() => {
    if (!form.city_id) {
      setVenues([]);
      setForm(f => ({ ...f, venue_id: '' }));
      return;
    }
    getVenues(form.city_id)
      .then(r => setVenues(r.data.data || []))
      .catch(() => showToast('Failed to load venues', 'error'));
    setForm(f => ({ ...f, venue_id: '' }));
  }, [form.city_id]);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="flex flex-col gap-3">
      <SearchableSelect
        label="State"
        options={states}
        value={form.state_id}
        onChange={set('state_id')}
        valueKey="state_id"
        labelKey="state_name"
        placeholder="Select a state..."
      />
      <SearchableSelect
        label="City"
        options={cities}
        value={form.city_id}
        onChange={set('city_id')}
        valueKey="city_id"
        labelKey="city_name"
        placeholder={form.state_id ? 'Select a city...' : 'Pick state first'}
        disabled={!form.state_id}
      />
      <SearchableSelect
        label="Venue"
        options={venues}
        value={form.venue_id}
        onChange={set('venue_id')}
        valueKey="venue_id"
        labelKey="venue_name"
        placeholder={form.city_id ? 'Select a venue...' : 'Pick city first'}
        disabled={!form.city_id}
      />
    </div>
  );
}

const EMPTY_FORM = { full_name: '', email: '', password: '', phone: '', state_id: '', city_id: '', venue_id: '' };
const EMPTY_VENUE_FORM = { state_id: '', city_id: '', venue_id: '' };

export default function StaffTab() {
  const [staff, setStaff] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [venueForm, setVenueForm] = useState(EMPTY_VENUE_FORM);
  const [cities, setCities] = useState([]);
  const [venues, setVenues] = useState([]);
  const [venueCities, setVenueCities] = useState([]);
  const [venueVenues, setVenueVenues] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, stRes] = await Promise.all([getAllStaff(), getStates()]);
      setStaff(sRes.data.data || []);
      setStates(stRes.data.data || []);
    } catch { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setCities([]); setVenues([]);
    setModal('add');
  };

  const openAssignVenue = (member) => {
    setSelectedMember(member);
    setVenueForm(EMPTY_VENUE_FORM);
    setVenueCities([]); setVenueVenues([]);
    setModal('venue');
  };

  const handleSave = async () => {
    if (!form.full_name || !form.email || !form.password) {
      return showToast('Name, email and password are required', 'warning');
    }
    setSaving(true);
    try {
      await addStaff({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        ...(form.phone && { phone: form.phone }),
        ...(form.venue_id && { venue_id: form.venue_id }),
      });
      showToast('Staff member created', 'success');
      setModal(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleAssignVenue = async () => {
    if (!venueForm.venue_id) return showToast('Select a venue', 'warning');
    setSaving(true);
    try {
      await assignStaffVenue(selectedMember.user_id, venueForm.venue_id);
      showToast('Venue assigned', 'success');
      setModal(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (member) => {
    const next = !member.is_active;
    if (!confirm(`${next ? 'Activate' : 'Deactivate'} ${member.full_name}?`)) return;
    try {
      await toggleStaffActive(member.user_id, next);
      showToast(`Staff ${next ? 'activated' : 'deactivated'}`, 'success');
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  return (
    <>
      <AdminTable
        title="Venue Staff"
        columns={['Name / Email', 'Phone', 'Assigned Venue', 'Status', '']}
        rows={staff.map(m => [
          <div>
            <p className="font-medium text-white">{m.full_name}</p>
            <p className="text-xs text-on-surface-variant">{m.email}</p>
          </div>,

          m.phone || <span className="text-on-surface-variant">—</span>,

          <button
            onClick={() => openAssignVenue(m)}
            className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors group"
          >
            <MapPin size={13} className="shrink-0 text-on-surface-variant group-hover:text-primary" />
            <span className={m.venue_name ? 'text-on-surface' : 'text-on-surface-variant italic'}>
              {m.venue_name || 'Unassigned — click to assign'}
            </span>
          </button>,

          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
            ${m.is_active ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
            {m.is_active ? 'Active' : 'Inactive'}
          </span>,

          <button
            onClick={() => handleToggle(m)}
            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
            title={m.is_active ? 'Deactivate' : 'Activate'}
          >
            {m.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
          </button>
        ])}
        loading={loading}
        onAdd={openAdd}
        addLabel="Add Staff"
      />

      <AdminModal
        open={modal === 'add'}
        title="Add Venue Staff"
        onClose={() => setModal(null)}
        onSave={handleSave}
        saving={saving}
      >
        <AdminField label="Full Name" value={form.full_name}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Rahul Sharma" />
        <AdminField label="Email" type="email" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@example.com" />
        <AdminField label="Password" type="password" value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
        <AdminField label="Phone (optional)" value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" />
        <div className="border-t border-outline-variant/20 pt-4 mt-1">
          <p className="text-xs text-on-surface-variant uppercase tracking-wide font-medium mb-3">
            Venue Assignment (optional)
          </p>
          <VenueSelector
            form={form} setForm={setForm}
            states={states}
            cities={cities} setCities={setCities}
            venues={venues} setVenues={setVenues}
            showToast={showToast}
          />
        </div>
      </AdminModal>

      <AdminModal
        open={modal === 'venue'}
        title={`Assign Venue — ${selectedMember?.full_name}`}
        onClose={() => setModal(null)}
        onSave={handleAssignVenue}
        saving={saving}
      >
        {selectedMember?.venue_name && (
          <div className="flex items-center gap-2 bg-surface-container-highest rounded-xl px-4 py-3 text-sm">
            <MapPin size={14} className="text-primary shrink-0" />
            <span className="text-on-surface-variant">Current venue:</span>
            <span className="text-white font-medium">{selectedMember.venue_name}</span>
          </div>
        )}
        <VenueSelector
          form={venueForm} setForm={setVenueForm}
          states={states}
          cities={venueCities} setCities={setVenueCities}
          venues={venueVenues} setVenues={setVenueVenues}
          showToast={showToast}
        />
      </AdminModal>
    </>
  );
}