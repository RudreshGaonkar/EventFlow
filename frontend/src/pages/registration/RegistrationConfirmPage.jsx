import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Users, User, Calendar, MapPin, Download } from 'lucide-react';
import { getRegistration } from '../../services/registration';

export default function RegistrationConfirmPage() {
  const [qp]  = useSearchParams();
  const id    = qp.get('registration_id');

  const [reg,     setReg]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) return;
    getRegistration(id)
      .then(r => setReg(r.data.data))
      .catch(() => setError('Could not load registration'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-8 text-center text-on-surface-variant">Loading…</p>;
  if (error)   return <p className="p-8 text-center text-error">{error}</p>;
  if (!reg)    return <p className="p-8 text-center text-on-surface-variant">Registration not found</p>;

  const isTeam = reg.team_name;
  const isPaid = reg.amount_paid > 0;

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Success banner */}
        <div className="bg-success/10 border border-success/30 rounded-2xl p-6 text-center">
          <CheckCircle size={40} className="text-success mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold text-on-surface mb-1">You're Registered! 🎉</h1>
          <p className="text-sm text-on-surface-variant">
            {isPaid
              ? 'Payment confirmed. Your registration is active.'
              : 'Your free registration is confirmed.'
            }
          </p>
        </div>

        {/* Registration card */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden">

          {/* Event header */}
          <div className="bg-surface-container-highest px-5 py-4 border-b border-outline-variant">
            <p className="text-xs text-primary font-bold uppercase tracking-wide">{reg.event_type}</p>
            <h2 className="text-lg font-bold text-on-surface mt-0.5">{reg.event_title || reg.title}</h2>
          </div>

          {/* Details */}
          <div className="divide-y divide-outline-variant/30">

            {/* Reg ID */}
            <div className="px-5 py-3 flex justify-between items-center">
              <span className="text-xs text-on-surface-variant">Registration ID</span>
              <span className="font-mono text-sm font-bold text-primary">#{reg.registration_id}</span>
            </div>

            {/* Participant */}
            <div className="px-5 py-3 flex justify-between items-center">
              <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                <User size={12} /> Participant Type
              </span>
              <span className="text-sm font-semibold text-on-surface capitalize">{reg.participant_type}</span>
            </div>

            {/* College */}
            {reg.college_name && (
              <div className="px-5 py-3 flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">College</span>
                <span className="text-sm text-on-surface">{reg.college_name}</span>
              </div>
            )}

            {/* Team */}
            {isTeam && (
              <>
                <div className="px-5 py-3 flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                    <Users size={12} /> Team Name
                  </span>
                  <span className="text-sm font-semibold text-on-surface">{reg.team_name}</span>
                </div>
                <div className="px-5 py-3 flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant">Team Size</span>
                  <span className="text-sm text-on-surface">{reg.team_size} members</span>
                </div>
              </>
            )}

            {/* Session */}
            {reg.show_date && (
              <div className="px-5 py-3 flex justify-between items-center">
                <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                  <Calendar size={12} /> Session
                </span>
                <span className="text-sm text-on-surface">
                  {new Date(reg.show_date).toDateString()} {reg.show_time}
                </span>
              </div>
            )}

            {/* Venue */}
            {reg.venue_name && (
              <div className="px-5 py-3 flex justify-between items-center">
                <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                  <MapPin size={12} /> Venue
                </span>
                <span className="text-sm text-on-surface text-right max-w-[200px]">
                  {reg.venue_name}, {reg.city_name}
                </span>
              </div>
            )}

            {/* Payment */}
            {isPaid && (
              <div className="px-5 py-3 flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">Amount Paid</span>
                <span className="font-bold text-success">
                  ₹{Number(reg.amount_paid).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Status */}
            <div className="px-5 py-3 flex justify-between items-center">
              <span className="text-xs text-on-surface-variant">Status</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                ${reg.status === 'confirmed'
                  ? 'bg-success/20 text-success'
                  : 'bg-secondary/20 text-secondary'
                }`}>
                {reg.status}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/my-registrations"
            className="flex-1 py-3 rounded-xl border border-outline-variant text-sm font-semibold
              text-on-surface text-center hover:bg-surface-container transition-all">
            My Registrations
          </Link>
          <Link to="/"
            className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold
              text-center hover:bg-primary-container transition-all shadow-lg shadow-primary/20">
            Browse Events
          </Link>
        </div>
      </div>
    </div>
  );
}