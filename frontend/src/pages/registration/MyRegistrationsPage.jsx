import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, User, ChevronRight, Clock } from 'lucide-react';
import { getMyRegistrations, cancelRegistration } from '../../services/registration';

const STATUS_STYLE = {
  confirmed:  'bg-success/20 text-success border-success/30',
  pending:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  cancelled:  'bg-error/20 text-error border-error/30',
  refunded:   'bg-surface-container-highest text-on-surface-variant border-outline-variant',
};

export default function MyRegistrationsPage() {
  const [regs,     setRegs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const load = () => {
    setLoading(true);
    getMyRegistrations()
      .then(r => setRegs(r.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this registration?')) return;
    setCancelling(id);
    try {
      await cancelRegistration(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 rounded-2xl bg-surface-container animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold text-on-surface mb-6">My Registrations</h1>

      {regs.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <span className="text-5xl mb-4">📋</span>
          <p className="text-on-surface font-semibold">No registrations yet</p>
          <p className="text-sm text-on-surface-variant mt-1">Browse tech fests, workshops &amp; more</p>
          <Link to="/"
            className="mt-4 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold
              hover:bg-primary-container transition-all">
            Browse Events →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {regs.map(reg => (
            <div key={reg.registration_id}
              className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden
                hover:shadow-lg hover:shadow-black/10 transition-all">

              {/* Header */}
              <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-outline-variant/40">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-primary font-bold uppercase tracking-wide mb-0.5">
                    {reg.event_type}
                  </p>
                  <h3 className="font-bold text-on-surface truncate">{reg.event_title || reg.title}</h3>
                </div>
                <span className={`ml-3 shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[reg.status] || STATUS_STYLE.pending}`}>
                  {reg.status}
                </span>
              </div>

              {/* Details row */}
              <div className="px-5 py-3 flex flex-wrap gap-x-4 gap-y-2">
                {/* Participant / Team */}
                <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  {reg.team_name
                    ? <><Users size={12} className="text-primary" /> {reg.team_name} · {reg.team_size} members</>
                    : <><User size={12} className="text-primary" /> {reg.participant_type}</>
                  }
                </span>

                {/* Session date */}
                {reg.show_date && (
                  <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <Calendar size={12} className="text-primary" />
                    {new Date(reg.show_date).toDateString()} {reg.show_time}
                  </span>
                )}

                {/* Venue */}
                {reg.venue_name && (
                  <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <MapPin size={12} className="text-primary" />
                    {reg.venue_name}, {reg.city_name}
                  </span>
                )}

                {/* Amount */}
                {reg.amount_paid > 0 && (
                  <span className="text-xs font-bold text-success">
                    ₹{Number(reg.amount_paid).toLocaleString('en-IN')} paid
                  </span>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-5 pb-4 flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-mono">
                  #{reg.registration_id}
                </span>
                <div className="flex gap-2">
                  {/* Cancel — only for confirmed/pending */}
                  {['confirmed', 'pending'].includes(reg.status) && (
                    <button
                      onClick={() => handleCancel(reg.registration_id)}
                      disabled={cancelling === reg.registration_id}
                      className="text-xs px-3 py-1.5 rounded-lg border border-error/30 text-error
                        hover:bg-error/10 transition-all disabled:opacity-40">
                      {cancelling === reg.registration_id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                  <Link to={`/registration/${reg.registration_id}`}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg
                      bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                    Details <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}