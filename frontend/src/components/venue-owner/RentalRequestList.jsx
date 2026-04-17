import { useState, useEffect } from 'react';
import { CalendarClock, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { getOwnerRentalRequests, updateRentalRequestStatus } from '../../services/rental';

// ── Helpers ───────────────────────────────────────────────────────────────────
const toLocal = (dt) =>
  new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

function RequestToast({ action, venueName }) {
  const isAccept = action === 'Accepted';
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4
      rounded-2xl shadow-2xl border animate-slide-up max-w-sm
      ${isAccept ? 'bg-surface-container border-primary/30 text-on-surface' : 'bg-surface-container border-error/30 text-on-surface'}`}
    >
      {isAccept ? <CheckCircle2 size={18} className="text-primary shrink-0" /> : <XCircle size={18} className="text-error shrink-0" />}
      <p className="text-sm flex-1">Request for {venueName} was <b>{action.toLowerCase()}</b>.</p>
    </div>
  );
}

export default function RentalRequestList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await getOwnerRentalRequests();
      setRequests(res.data.data || []);
    } catch (err) {
      setError('Failed to load rental requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id, status, venueName) => {
    setProcessingId(id);
    setError('');
    try {
      await updateRentalRequestStatus(id, status);
      // Immediately reflect status update in UI
      setRequests(prev => prev.map(req => req.request_id === id ? { ...req, status } : req));
      setToast({ action: status, venueName });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status.toLowerCase()} request.`);
      await fetchRequests(); // Restore state in case of failure
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
        <Loader2 size={32} className="animate-spin mb-4 text-primary" />
        <p>Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error-container/20 border border-error/30 text-error px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-outline-variant/30 rounded-3xl bg-surface-container-low">
          <CalendarClock size={40} className="text-on-surface-variant opacity-40 mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-2">No Rental Requests</h3>
          <p className="text-on-surface-variant text-sm max-w-sm">
            Event organizers haven't sent any requests for your venues yet. Check back later.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map(req => (
            <div key={req.request_id} className="bg-surface-container-highest border border-outline-variant/30 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start md:items-center">
              
              {/* Left Side: Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${req.status === 'Accepted' ? 'bg-primary/20 text-primary border border-primary/30' : 
                      req.status === 'Rejected' ? 'bg-error/20 text-error border border-error/30' : 
                      req.status === 'Cancelled' ? 'bg-surface-variant text-on-surface-variant border border-outline-variant' :
                      'bg-amber-400/20 text-amber-400 border border-amber-400/30'}`}>
                    {req.status}
                  </span>
                  <p className="text-xs text-on-surface-variant font-medium">#{req.request_id} • {req.venue_name}</p>
                </div>
                
                <h3 className="text-lg font-bold text-on-surface truncate">
                  {req.event_name || 'Unnamed Event'}
                </h3>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  Requested by <span className="text-on-surface font-medium">{req.organizer_name}</span> ({req.organizer_email})
                </p>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
                  <div className="flex items-start gap-2 bg-surface-container-lowest px-3 py-2 rounded-xl border border-outline-variant/20">
                    <Clock size={15} className="text-secondary shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="text-on-surface-variant mb-0.5">Start: <span className="text-on-surface">{toLocal(req.start_time)}</span></p>
                      <p className="text-on-surface-variant">End: <span className="text-on-surface">{toLocal(req.end_time)}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Actions */}
              {req.status === 'Pending' && (
                <div className="flex md:flex-col gap-2 w-full md:w-32 shrink-0 border-t md:border-t-0 md:border-l border-outline-variant/30 pt-4 md:pt-0 md:pl-5">
                  <button
                    onClick={() => handleStatusUpdate(req.request_id, 'Accepted', req.venue_name)}
                    disabled={processingId === req.request_id}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-lg shadow-primary/20
                      hover:bg-primary-container hover:-translate-y-0.5 transition-all active:translate-y-0
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    {processingId === req.request_id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Accept
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(req.request_id, 'Rejected', req.venue_name)}
                    disabled={processingId === req.request_id}
                    className="flex-1 py-2.5 rounded-xl bg-surface-container border border-error/50 text-error text-xs font-bold
                      hover:bg-error/10 hover:-translate-y-0.5 transition-all active:translate-y-0
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    {processingId === req.request_id ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <RequestToast action={toast.action} venueName={toast.venueName} />}
    </div>
  );
}
