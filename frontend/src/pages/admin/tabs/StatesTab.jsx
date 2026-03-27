import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { getStates, createState, updateState, deleteState } from '../../../services/admin';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';

export default function StatesTab() {
  const [states,  setStates]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | { mode:'add'|'edit', data? }
  const [form,    setForm]    = useState({ state_name: '', state_code: '' });
  const [saving,  setSaving]  = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getStates();
      setStates(res.data.data || []);
    } catch { showToast('Failed to load states', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm({ state_name: '', state_code: '' }); setModal({ mode: 'add' }); };
  const openEdit = (s) => { setForm({ state_name: s.state_name, state_code: s.state_code }); setModal({ mode: 'edit', data: s }); };

  const handleSave = async () => {
    if (!form.state_name || !form.state_code) return showToast('Fill all fields', 'warning');
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await createState(form);
        showToast('State created', 'success');
      } else {
        await updateState(modal.data.state_id, form);
        showToast('State updated', 'success');
      }
      setModal(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Error', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this state?')) return;
    try {
      await deleteState(id);
      showToast('State deleted', 'success');
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Cannot delete', 'error'); }
  };

  return (
    <>
      <AdminTable
        title="States"
        onAdd={openAdd}
        loading={loading}
        columns={['State Name', 'Code', 'Actions']}
        rows={states.map(s => [
          s.state_name,
          <span className="font-mono text-xs bg-surface-container px-2 py-0.5 rounded-lg">
            {s.state_code}
          </span>,
          <div className="flex gap-2">
            <button onClick={() => openEdit(s)}
              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDelete(s.state_id)}
              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        ])}
      />

      <AdminModal
        open={!!modal}
        title={modal?.mode === 'add' ? 'Add State' : 'Edit State'}
        onClose={() => setModal(null)}
        onSave={handleSave}
        saving={saving}
      >
        <AdminField label="State Name" value={form.state_name}
          onChange={e => setForm(f => ({ ...f, state_name: e.target.value }))}
          placeholder="e.g. Goa" />
        <AdminField label="State Code" value={form.state_code}
          onChange={e => setForm(f => ({ ...f, state_code: e.target.value.toUpperCase() }))}
          placeholder="e.g. GA" maxLength={3} />
      </AdminModal>
    </>
  );
}
