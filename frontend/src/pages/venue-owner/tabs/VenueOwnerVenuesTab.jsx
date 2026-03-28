import { useState, useEffect } from 'react';
import { Pencil, Building2 } from 'lucide-react';
import { getMyVenues, createMyVenue, updateMyVenue, getCities } from '../../../services/venue-owner';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';

const BLANK = { city_id: '', venue_name: '', address: '', total_capacity: '' };

const STATUS_COLORS = {
  Active:   'bg-primary/10 text-primary',
  Pending:  'bg-yellow-500/15 text-yellow-400',
  Inactive: 'bg-error/10 text-error',
};

export default function VenueOwnerVenuesTab() {
  const [venues,  setVenues]  = useState([]);
  const [cities,  setCities]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(BLANK);
  const [saving,  setSaving]  = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, cRes] = await Promise.all([getMyVenues(), getCities()]);
      setVenues(vRes.data.data || []);
      setCities(cRes.data.data || []);
    } catch { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(BLANK); setModal({ mode: 'add' }); };
  const openEdit = (v) => {
    setForm({ city_id: v.city_id, venue_name: v.venue_name, address: v.address || '', total_capacity: v.total_capacity });
    setModal({ mode: 'edit', data: v });
  };

  const handleSave = async () => {
    if (!form.city_id || !form.venue_name || !form.total_capacity)
      return showToast('Fill all required fields', 'warning');
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await createMyVenue(form);
        showToast('Venue submitted for approval!', 'success');
      } else {
        await updateMyVenue(modal.data.venue_id, form);
        showToast('Venue updated', 'success');
      }
      setModal(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <AdminTable
        title="My Venues"
        loading={loading}
        onAdd={openAdd}
        columns={['Venue', 'City', 'Capacity', 'Status', 'Actions']}
        rows={venues.map(v => [
          <div>
            <p className="font-medium text-white text-sm">{v.venue_name}</p>
            <p className="text-xs text-on-surface-variant">{v.address || '—'}</p>
          </div>,
          <span className="text-sm text-on-surface">{v.city_name}</span>,
          v.total_capacity?.toLocaleString(),
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[v.status] || ''}`}>
            {v.status}
          </span>,
          <button
            onClick={() => openEdit(v)}
            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
          >
            <Pencil size={14} />
          </button>
        ])}
      />

      {/* Pending notice */}
      <div className="mt-4 flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
        <Building2 size={15} className="text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-yellow-300">
          New venues start as <strong>Pending</strong> and must be approved by an admin before they go live.
        </p>
      </div>

      <AdminModal
        open={!!modal}
        title={modal?.mode === 'add' ? 'Add New Venue' : 'Edit Venue'}
        onClose={() => setModal(null)}
        onSave={handleSave}
        saving={saving}
      >
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">City *</label>
          <select
            value={form.city_id}
            onChange={e => setForm(f => ({ ...f, city_id: e.target.value }))}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-white rounded-xl text-sm outline-none"
          >
            <option value="">Select City</option>
            {cities.map(c => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}
          </select>
        </div>
        <AdminField label="Venue Name *" value={form.venue_name}
          onChange={e => setForm(f => ({ ...f, venue_name: e.target.value }))} placeholder="e.g. Kala Academy" />
        <AdminField label="Address" value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
        <AdminField label="Total Capacity *" type="number" value={form.total_capacity}
          onChange={e => setForm(f => ({ ...f, total_capacity: e.target.value }))} placeholder="e.g. 500" />
      </AdminModal>
    </>
  );
}