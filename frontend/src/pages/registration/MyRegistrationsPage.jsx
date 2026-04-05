import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, User, Clock } from 'lucide-react';
import { getMyRegistrations, cancelRegistration } from '../../services/registration';

const STATUS_STYLE = {
  confirmed:  'bg-success/10 text-success border border-success/20',
  pending:    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  cancelled:  'bg-error/10 text-error border border-error/20',
  refunded:   'bg-surface-container-highest text-on-surface-variant border border-outline-variant',
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
    if (!window.confirm('Cancel this registration?')) return;
    setCancelling(id);
    try {
      await cancelRegistration(id);
      // Flip status locally — no loading skeleton, no page reload
      setRegs(prev =>
        prev.map(r => r.registration_id === id ? { ...r, status: 'Cancelled' } : r)
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-surface-container animate-pulse border border-outline-variant" />
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold text-on-surface mb-6 flex items-center gap-2">
        <Users className="text-primary" size={24} /> My Registrations
      </h1>

      {regs.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center bg-surface-container border border-outline-variant rounded-2xl">
          <span className="text-5xl mb-4">📋</span>
          <p className="text-on-surface font-semibold text-lg">No registrations yet</p>
          <p className="text-sm text-on-surface-variant mt-1">Browse tech fests, workshops &amp; more</p>
          <Link to="/"
            className="mt-6 px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Browse Events →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {regs.map(reg => {
            const hasDate = reg.show_date;
            const dateObj = hasDate ? new Date(reg.show_date) : null;
            const month = hasDate ? dateObj.toLocaleString('en-US', { month: 'short' }) : 'TBD';
            const day = hasDate ? dateObj.getDate() : '--';

            return (
              <div key={reg.registration_id}
                className="group flex flex-col sm:flex-row bg-surface-container border border-outline-variant rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                
                {/* Date Block */}
                <div className="sm:w-24 bg-surface-container-highest flex flex-row sm:flex-col items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-outline-variant group-hover:bg-primary/10 transition-colors">
                  <span className="text-sm font-bold text-primary uppercase tracking-wider mr-2 sm:mr-0">{month}</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-on-surface">{day}</span>
                </div>

                {/* Details Block */}
                <div className="flex-1 p-5 flex flex-col justify-center">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-[10px] text-primary font-extrabold uppercase tracking-widest mb-1.5">
                        {reg.event_type}
                      </p>
                      <h3 className="text-xl font-bold text-on-surface leading-tight">{reg.event_title || reg.title}</h3>
                    </div>
                    <span className={`shrink-0 self-start text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[reg.status.toLowerCase()] || STATUS_STYLE.pending}`}>
                      {reg.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mb-4 mt-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      {reg.team_name
                        ? <><Users size={14} className="text-primary" /> {reg.team_name} ({reg.team_size} pax)</>
                        : <><User size={14} className="text-primary" /> {reg.participant_type}</>
                      }
                    </span>
                    {reg.venue_name && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin size={14} className="text-primary" />
                        {reg.venue_name}, {reg.city_name}
                      </span>
                    )}
                    {reg.show_time && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock size={14} className="text-primary" />
                        {reg.show_time}
                      </span>
                    )}
                  </div>

                  {/* Actions / Footer row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto pt-4 border-t border-outline-variant/40 gap-4 sm:gap-0">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <span className="text-xs text-on-surface-variant font-mono bg-surface-container-highest px-2.5 py-1 rounded-md border border-outline-variant/50">
                        #{reg.registration_id}
                      </span>
                      {Number(reg.amount_paid) > 0 && (
                        <span className="text-sm font-bold text-success flex items-center gap-1 px-2.5 py-1 bg-success/5 rounded-md border border-success/10">
                          ₹{Number(reg.amount_paid).toLocaleString('en-IN')} paid
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      {['confirmed', 'pending'].includes(reg.status.toLowerCase()) && (
                        <button
                          onClick={() => handleCancel(reg.registration_id)}
                          disabled={cancelling === reg.registration_id}
                          className="text-xs font-bold w-full sm:w-auto px-4 py-2 rounded-xl border border-error/30 text-error hover:bg-error/10 hover:border-error/50 transition-all disabled:opacity-40 flex justify-center">
                          {cancelling === reg.registration_id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}