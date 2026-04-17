import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Loader2, Building2, Clock, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { getMyRentalRequests } from '../../services/rental';

// ── Helpers ───────────────────────────────────────────────────────────────────
const toLocal = (dt) =>
  new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function MyRentalRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const res = await getMyRentalRequests();
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

  const handleCreateEvent = (req) => {
    // Navigate to events tab and potentially pass state, if a CreateEvent page is added
    // For now we navigate back to organizer dashboard with a query para that the tab can consume
    navigate('/organizer', { state: { 
      openAddModal: true, 
      prefill: { 
        title: req.event_name || '', 
        venue_id: req.venue_id 
      }
    }});
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
        <Loader2 size={32} className="animate-spin mb-4 text-primary" />
        <p>Loading your requests...</p>
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
          <h3 className="text-lg font-bold text-on-surface mb-2">No Requests Found</h3>
          <p className="text-on-surface-variant text-sm max-w-sm">
            You haven't requested any venues yet. Head over to the Venue Finder to rent a space.
          </p>
          <button 
            onClick={() => navigate('/venue-finder')}
            className="mt-6 px-6 py-2.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-on-primary rounded-xl text-sm font-semibold transition-all">
            Find Venues
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map(req => (
            <div key={req.request_id} className="bg-surface-container rounded-3xl border border-outline-variant/30 overflow-hidden flex flex-col group">
              
              {/* Colored top border based on status */}
              <div className={`h-1.5 w-full ${
                req.status === 'Accepted' ? 'bg-primary' :
                req.status === 'Rejected' ? 'bg-error' :
                req.status === 'Cancelled' ? 'bg-surface-variant' :
                'bg-amber-400'
              }`} />

              <div className="p-5 flex flex-col flex-1">
                {/* Header & Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center shrink-0">
                    <Building2 size={20} className="text-primary" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${req.status === 'Accepted' ? 'bg-primary/20 text-primary border border-primary/30' : 
                      req.status === 'Rejected' ? 'bg-error/20 text-error border border-error/30' : 
                      req.status === 'Cancelled' ? 'bg-surface-variant text-on-surface-variant border border-outline-variant' :
                      'bg-amber-400/20 text-amber-400 border border-amber-400/30'}`}>
                    {req.status}
                  </span>
                </div>

                {/* Main Details */}
                <h3 className="font-bold text-on-surface text-lg leading-snug truncate">
                  {req.venue_name}
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-1.5 truncate">
                  <MapPin size={12} /> {req.city_name}, {req.state_name}
                </p>

                {req.event_name && (
                   <p className="text-xs text-on-surface-variant mt-2">
                     For event: <span className="font-medium text-on-surface">{req.event_name}</span>
                   </p>
                )}

                {/* Time Slot Details */}
                <div className="mt-5 p-3 rounded-xl bg-surface-container-highest border border-outline-variant/30 text-sm">
                  <div className="flex items-start gap-2.5 text-on-surface">
                    <Clock size={14} className="text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="mb-1"><span className="text-on-surface-variant text-xs">Start:</span><br/> {toLocal(req.start_time)}</p>
                      <p><span className="text-on-surface-variant text-xs">End:</span><br/> {toLocal(req.end_time)}</p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Actions */}
                <div className="mt-auto pt-5">
                  {req.status === 'Accepted' && (
                    <button
                      onClick={() => handleCreateEvent(req)}
                      className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold
                        shadow-lg shadow-primary/20 hover:bg-primary-container
                        hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Create Event
                    </button>
                  )}

                  {req.status === 'Rejected' && (
                    <div className="w-full py-2.5 rounded-xl bg-error-container text-on-error-container text-sm font-medium text-center flex items-center justify-center gap-2 border border-error/20">
                      <XCircle size={16} /> Request Declined
                    </div>
                  )}

                  {req.status === 'Pending' && (
                    <div className="w-full py-2.5 rounded-xl bg-surface-container-highest text-on-surface-variant text-sm font-medium text-center border border-outline-variant/30">
                      Awaiting Owner Approval
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
