import { useState, useEffect } from 'react';
import { UserPlus, Plus, X } from 'lucide-react';
import { getUsers, getRoles, changeUserRole, createUser } from '../../../services/admin';
import { useToast } from '../../../components/common/Toast';
import AdminTable from '../../../components/common/AdminTable';
import AdminModal from '../../../components/common/AdminModal';
import AdminField from '../../../components/common/AdminField';
import useAuth from '../../../hooks/useAuth'; // '../../../context/AuthContext';
import api from '../../../services/api';

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

  const handleGrantRole = async (user_id, role_id) => {
    try {
      await api.patch(`/admin/users/${user_id}/grant-role`, { role_id: parseInt(role_id) });
      showToast('Role granted', 'success');
      load();
    } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const handleRevokeRole = async (user_id, role_id) => {
    try {
      await api.patch(`/admin/users/${user_id}/revoke-role`, { role_id: parseInt(role_id) });
      showToast('Role revoked', 'success');
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

  const hasPendingRequest = (u) => {
    const active = (u.all_roles || [])
      .filter(r => r.status === 'Active')
      .map(r => r.role_name);
    return u.requested_role &&
      u.requested_role !== 'Attendee' &&
      !active.includes(u.requested_role);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setForm(BLANK); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all"
        >
          <UserPlus size={15} /> Add User
        </button>
      </div>

      <AdminTable
        loading={loading}
        columns={['User', 'Contact', 'Active Roles', 'Status']}
        rows={(users || []).map(u => {
          const activeRoles = (u.all_roles || []).filter(r => r.status === 'Active');
          const availableToGrant = roles.filter(r =>
            !activeRoles.find(ar => ar.role_id === r.role_id)
          );
          const isPending = hasPendingRequest(u);
          const isSelf = me?.user_id === u.user_id;

          return [
            // Name + request badge
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-white text-sm">{u.full_name}</div>
                {isPending && !isSelf && (
                  <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                    Wants: {u.requested_role}
                  </span>
                )}
              </div>
            </div>,

            // Email + Phone
            <div>
              <p className="text-sm text-on-surface">{u.email}</p>
              <p className="text-xs text-on-surface-variant">{u.phone || '—'}</p>
            </div>,

            // Active role badges + grant dropdown
            <div className="flex flex-wrap items-center gap-1">
              {activeRoles.map(r => (
                <span
                  key={r.role_id}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-primary/15 text-primary rounded-full"
                >
                  {r.role_name}
                  {!isSelf && (
                    <button
                      onClick={() => handleRevokeRole(u.user_id, r.role_id)}
                      className="hover:text-red-400 transition-colors ml-0.5"
                      title={`Revoke ${r.role_name}`}
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
              {!isSelf && availableToGrant.length > 0 && (
                <select
                  value=""
                  onChange={e => e.target.value && handleGrantRole(u.user_id, e.target.value)}
                  className="text-[10px] px-2 py-0.5 bg-surface-container-highest text-on-surface-variant rounded-full outline-none cursor-pointer hover:text-white transition-colors"
                >
                  <option value="">+ Add role</option>
                  {availableToGrant.map(r => (
                    <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                  ))}
                </select>
              )}
            </div>,

            // Status
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {u.is_active ? 'Active' : 'Inactive'}
            </span>
          ];
        })}
      />

      <AdminModal
        open={modal}
        title="Add New User"
        onClose={() => setModal(false)}
        onSave={handleAddUser}
        saving={saving}
      >
        <AdminField label="Full Name *" type="text" value={form.full_name} onChange={set('full_name')} placeholder="e.g. Rahul Sharma" />
        <AdminField label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="e.g. rahul@eventflow.com" />
        <AdminField label="Password *" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" />
        <AdminField label="Phone (optional)" type="tel" value={form.phone} onChange={set('phone')} placeholder="e.g. 9876543210" />
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