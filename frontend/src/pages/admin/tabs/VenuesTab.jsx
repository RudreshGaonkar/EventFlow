import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { getVenues, createVenue, updateVenue, deactivateVenue, getCities } from '../../../services/admin';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { getPendingVenues, approveVenue, rejectVenue } from '../../../services/venue-owner';

export default function VenuesTab() {
  const [venues,  setVenues]  = useState([]);
  const [cities,  setCities]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({ city_id: '', venue_name: '', address: '', total_capacity: '' });
  const [saving,  setSaving]  = useState(false);
  const { showToast } = useToast();
  const [pending, setPending] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, cRes] = await Promise.all([getVenues(), getCities()]);
      setVenues(vRes.data.data || []);
      setCities(cRes.data.data || []);
      const pRes = await getPendingVenues();
      setPending(pRes.data.data || []);
    } catch { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({ city_id: '', venue_name: '', address: '', total_capacity: '' }); setModal({ mode: 'add' }); };
  const openEdit = (v) => { setForm({ city_id: v.city_id, venue_name: v.venue_name, address: v.address, total_capacity: v.total_capacity }); setModal({ mode: 'edit', data: v }); };

  const handleSave = async () => {
    if (!form.city_id || !form.venue_name || !form.total_capacity) return showToast('Fill required fields', 'warning');
    setSaving(true);
    try {
      if (modal.mode === 'add') { await createVenue(form); showToast('Venue created', 'success'); }
      else { await updateVenue(modal.data.venue_id, form); showToast('Venue updated', 'success'); }
      setModal(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this venue?')) return;
    try { await deactivateVenue(id); showToast('Venue deactivated', 'success'); load(); }
    catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const handleApprove = async (id) => {
    try { await approveVenue(id); showToast('Venue approved', 'success'); load(); }
    catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this venue?')) return;
    try { await rejectVenue(id); showToast('Venue rejected', 'success'); load(); }
    catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  return (
    <>
    {pending.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-yellow-400" />
            <h3 className="text-sm font-semibold text-yellow-400">
              Pending Approvals ({pending.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pending.map(v => (
              <div key={v.venue_id}
                className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    {v.venue_name}
                    <span className="ml-2 text-xs text-on-surface-variant">— {v.city_name}</span>
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Submitted by <span className="text-on-surface">{v.owner_name}</span> · {v.owner_email}
                  </p>
                  {v.address && <p className="text-xs text-on-surface-variant">{v.address}</p>}
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button onClick={() => handleApprove(v.venue_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary/20 transition-all">
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button onClick={() => handleReject(v.venue_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 text-error text-xs font-semibold rounded-lg hover:bg-error/20 transition-all">
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <AdminTable title="Venues" onAdd={openAdd} loading={loading}
        columns={['Venue', 'City', 'Capacity', 'Status', 'Actions']}
        rows={venues.map(v => [
          <div><p className="font-medium text-on-surface text-sm">{v.venue_name}</p><p className="text-xs text-on-surface-variant truncate max-w-[200px]">{v.address}</p></div>,
          v.city_name,
          v.total_capacity?.toLocaleString(),
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${v.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
            {v.is_active ? 'Active' : 'Inactive'}
          </span>,
          <div className="flex gap-2">
            <button onClick={() => openEdit(v)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Pencil size={14} /></button>
            {v.is_active && <button onClick={() => handleDeactivate(v.venue_id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"><Trash2 size={14} /></button>}
          </div>
        ])}
      />
      <AdminModal open={!!modal} title={modal?.mode === 'add' ? 'Add Venue' : 'Edit Venue'}
        onClose={() => setModal(null)} onSave={handleSave} saving={saving}>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">City</label>
          <select value={form.city_id} onChange={e => setForm(f => ({ ...f, city_id: e.target.value }))}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-on-surface rounded-xl text-sm outline-none">
            <option value="">Select City</option>
            {cities.map(c => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}
          </select>
        </div>
        <AdminField label="Venue Name" value={form.venue_name} onChange={e => setForm(f => ({ ...f, venue_name: e.target.value }))} placeholder="e.g. Kala Academy" />
        <AdminField label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
        <AdminField label="Total Capacity" type="number" value={form.total_capacity} onChange={e => setForm(f => ({ ...f, total_capacity: e.target.value }))} placeholder="e.g. 500" />
      </AdminModal>
    </>
  );
}
