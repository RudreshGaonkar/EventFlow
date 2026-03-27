import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { getCities, createCity, updateCity, deleteCity, getStates } from '../../../services/admin';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';

export default function CitiesTab() {
  const [cities,  setCities]  = useState([]);
  const [states,  setStates]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({ state_id: '', city_name: '', city_multiplier: 1.0 });
  const [saving,  setSaving]  = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([getCities(), getStates()]);
      setCities(cRes.data.data || []);
      setStates(sRes.data.data || []);
    } catch { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({ state_id: '', city_name: '', city_multiplier: 1.0 }); setModal({ mode: 'add' }); };
  const openEdit = (c) => { setForm({ state_id: c.state_id, city_name: c.city_name, city_multiplier: c.city_multiplier }); setModal({ mode: 'edit', data: c }); };

  const handleSave = async () => {
    if (!form.state_id || !form.city_name) return showToast('Fill all fields', 'warning');
    setSaving(true);
    try {
      if (modal.mode === 'add') { await createCity(form); showToast('City created', 'success'); }
      else { await updateCity(modal.data.city_id, form); showToast('City updated', 'success'); }
      setModal(null); load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this city?')) return;
    try { await deleteCity(id); showToast('Deleted', 'success'); load(); }
    catch (e) { showToast(e.response?.data?.message || 'Cannot delete', 'error'); }
  };

  return (
    <>
      <AdminTable
        title="Cities"
        onAdd={openAdd}
        loading={loading}
        columns={['City', 'State', 'Multiplier', 'Actions']}
        rows={cities.map(c => [
          c.city_name,
          c.state_name,
          <span className="font-mono text-xs text-secondary">×{c.city_multiplier}</span>,
          <div className="flex gap-2">
            <button onClick={() => openEdit(c)} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"><Pencil size={14} /></button>
            <button onClick={() => handleDelete(c.city_id)} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"><Trash2 size={14} /></button>
          </div>
        ])}
      />
      <AdminModal open={!!modal} title={modal?.mode === 'add' ? 'Add City' : 'Edit City'}
        onClose={() => setModal(null)} onSave={handleSave} saving={saving}>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">State</label>
          <select value={form.state_id} onChange={e => setForm(f => ({ ...f, state_id: e.target.value }))}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-white rounded-xl text-sm outline-none">
            <option value="">Select State</option>
            {states.map(s => <option key={s.state_id} value={s.state_id}>{s.state_name}</option>)}
          </select>
        </div>
        <AdminField label="City Name" value={form.city_name}
          onChange={e => setForm(f => ({ ...f, city_name: e.target.value }))} placeholder="e.g. Panaji" />
        <AdminField label="Price Multiplier" type="number" step="0.1" min="0.5" max="5"
          value={form.city_multiplier}
          onChange={e => setForm(f => ({ ...f, city_multiplier: e.target.value }))} />
      </AdminModal>
    </>
  );
}
