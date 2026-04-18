import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Search, Loader2, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';
import api from '../../../services/api';

export default function RoleRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await api.get('/admin/role-requests');
      setRequests(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, reason = '') => {
    setProcessing(id);
    try {
      await api.patch(`/admin/role-requests/${id}/${action}`, { reason });
      setRequests(prev => prev.filter(r => r.user_role_id !== id));
      if (action === 'reject') setRejectId(null);
    } catch (e) {
      alert(e.response?.data?.message || `Failed to ${action}`);
    } finally {
      setProcessing(null);
    }
  };

  const filtered = requests.filter(r => 
    r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.role_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Role Requests</h2>
          <p className="text-sm text-on-surface-variant">Review and approve role upgrades</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container border border-outline-variant rounded-xl
              text-sm text-on-surface focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant bg-surface-container border border-outline-variant rounded-2xl">
            No pending requests found.
          </div>
        ) : filtered.map(req => (
          <div key={req.user_role_id} className="p-4 sm:p-5 bg-surface-container hover:bg-surface-container-high transition-colors border border-outline-variant rounded-2xl flex flex-col md:flex-row gap-6 items-start">
            
            {/* User Info */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full">
                  {req.role_name}
                </span>
                <span className="text-xs text-on-surface-variant">{new Date(req.requested_at).toLocaleString()}</span>
              </div>
              <p className="text-base font-bold text-on-surface">{req.full_name}</p>
              <p className="text-sm text-on-surface-variant">{req.email} • {req.phone}</p>
            </div>

            {/* Documents */}
            <div className="flex gap-4">
              <div className="space-y-1 text-center flex flex-col items-center">
                <p className="text-xs font-medium text-on-surface-variant">ID Proof</p>
                <button onClick={() => setPreviewImage(req.id_proof_url)}
                  className="w-24 aspect-video bg-surface-container-highest rounded-xl overflow-hidden border border-outline-variant hover:border-primary transition-all">
                  <img src={req.id_proof_url} alt="ID" className="w-full h-full object-cover" />
                </button>
              </div>
              <div className="space-y-1 text-center flex flex-col items-center">
                <p className="text-xs font-medium text-on-surface-variant">Photo</p>
                <button onClick={() => setPreviewImage(req.photo_url)}
                  className="w-20 aspect-square bg-surface-container-highest rounded-xl overflow-hidden border border-outline-variant hover:border-primary transition-all">
                  <img src={req.photo_url} alt="Photo" className="w-full h-full object-cover" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex md:flex-col gap-2 shrink-0 md:min-w-[120px]">
              {rejectId === req.user_role_id ? (
                <div className="space-y-2 w-full">
                  <input type="text" placeholder="Reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-background border border-outline-variant rounded text-on-surface" />
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(req.user_role_id, 'reject', rejectReason)} disabled={processing === req.user_role_id || !rejectReason}
                      className="flex-1 py-1.5 text-xs bg-error text-on-surface rounded font-medium">Confirm</button>
                    <button onClick={() => setRejectId(null)} className="flex-1 py-1.5 text-xs bg-surface-container-highest text-on-surface rounded font-medium">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={() => handleAction(req.user_role_id, 'approve')} disabled={processing === req.user_role_id}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-sm font-semibold transition-all">
                    {processing === req.user_role_id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Approve
                  </button>
                  <button onClick={() => { setRejectId(req.user_role_id); setRejectReason(''); }} disabled={processing === req.user_role_id}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-error/10 text-error border border-error/20 hover:bg-error/20 rounded-xl text-sm font-semibold transition-all">
                    <X size={16} /> Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-on-surface rounded-full hover:bg-white/20 transition-all"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
