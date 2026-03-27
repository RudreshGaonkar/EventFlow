import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { getUsers, getRoles, changeUserRole, createUser } from '../../../services/admin';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';
import { useAuth } from '../../../context/AuthContext';

const BLANK = { full_name: '', email: '', password: '', phone: '', role_id: '' };

export default function UsersTab() {
  const [users, setUsers]     = useState([]);
  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(BLANK);
  const [saving, setSaving]   = useState(false);
  const { showToast }         = useToast();
  const { user: me }          = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([getUsers(), getRoles()]);
      setUsers(uRes.data.data || []);
      setRoles(rRes.data.data || []);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (user_id, role_id) => {
    try {
      await changeUserRole(user_id, role_id);
      showToast('Role updated', 'success');
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const handleAddUser = async () => {
    if (!form.full_name || !form.email || !form.password || !form.role_id)
      return showToast('Fill all required fields', 'warning');
    setSaving(true);
    try {
      await createUser({ ...form, role_id: parseInt(form.role_id) });
      showToast('User created successfully', 'success');
      setModal(false);
      setForm(BLANK);
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {/* Add User button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setForm(BLANK); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all"
        >
          <UserPlus size={15} />
          Add User
        </button>
      </div>

      <AdminTable
        loading={loading}
        columns={['User', 'Email', 'Phone', 'Role', 'Status']}
        rows={(users || []).map(u => [
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-white text-sm">{u.full_name}</div>
              {u.requested_role === 'Event Organizer' && u.role_name === 'Attendee' && (
                <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                  Wants: Organizer
                </span>
              )}
            </div>
          </div>,
          u.email,
          u.phone || '—',
          me?.user_id === u.user_id
            ? <span className="text-xs text-on-surface-variant px-2 py-1 bg-surface-container rounded-lg">{u.role_name}</span>
            : <select
                value={u.role_id}
                onChange={e => handleRoleChange(u.user_id, e.target.value)}
                className="px-2 py-1 bg-surface-container-highest text-white rounded-lg text-xs outline-none"
              >
                {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
              </select>,
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
            {u.is_active ? 'Active' : 'Inactive'}
          </span>
        ])}
      />

      {/* Add User Modal */}
      <AdminModal
        open={modal}
        title="Add New User"
        onClose={() => setModal(false)}
        onSave={handleAddUser}
        saving={saving}
      >
        <AdminField
          label="Full Name *"
          type="text"
          value={form.full_name}
          onChange={set('full_name')}
          placeholder="e.g. Rahul Sharma"
        />
        <AdminField
          label="Email *"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="e.g. rahul@eventflow.com"
        />
        <AdminField
          label="Password *"
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="Min. 6 characters"
        />
        <AdminField
          label="Phone (optional)"
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          placeholder="e.g. 9876543210"
        />
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 px-1">
            Role *
          </label>
          <select
            value={form.role_id}
            onChange={set('role_id')}
            className="w-full px-4 py-2.5 bg-surface-container-highest text-white rounded-xl text-sm outline-none"
          >
            <option value="">Select a role</option>
            {roles.map(r => (
              <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
            ))}
          </select>
        </div>
      </AdminModal>
    </>
  );
}
