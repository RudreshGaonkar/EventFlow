import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users, User, GraduationCap, Briefcase,
  ChevronRight, AlertCircle, Info
} from 'lucide-react';
import { getEventDetail, getEventSessions } from '../../services/events';
import { registerForEvent } from '../../services/registration';

export default function RegistrationPage() {
  const { event_id }   = useParams();
  const [qp]           = useSearchParams();
  const navigate       = useNavigate();

  const [event,     setEvent]     = useState(null);
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [error,     setError]     = useState('');

  // Form state
  const [form, setForm] = useState({
    session_id:       qp.get('session_id') || '',
    participant_type: 'student',
    college_name:     '',
    team_name:        '',
    team_size:        '',
  });

  useEffect(() => {
    Promise.all([
      getEventDetail(event_id),
      getEventSessions(event_id),
    ]).then(([eRes, sRes]) => {
      setEvent(eRes.data.data);
      setSessions(sRes.data.data || []);
    }).catch(() => setError('Could not load event'))
      .finally(() => setLoading(false));
  }, [event_id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isTeam   = event?.participation_type === 'team';
  const isFree   = event?.registration_mode  === 'free_registration';
  const isPaid   = event?.registration_mode  === 'paid_registration';
  const fee      = Number(event?.registration_fee || 0);
  const minTeam  = Number(event?.min_team_size || 2);
  const maxTeam  = Number(event?.max_team_size || 10);

  const validate = () => {
    if (!form.participant_type) return 'Select participant type';
    if (form.participant_type === 'student' && !form.college_name.trim())
      return 'College name is required for students';
    if (isTeam && !form.team_name.trim()) return 'Team name is required';
    if (isTeam) {
      const ts = Number(form.team_size);
      if (!ts || ts < minTeam || ts > maxTeam)
        return `Team size must be between ${minTeam} and ${maxTeam}`;
    }
    if (sessions.length > 0 && !form.session_id)
      return 'Please select a session';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setError(''); setSubmitting(true);

    try {
      const payload = {
        participant_type: form.participant_type,
        college_name:     form.participant_type === 'student' ? form.college_name : undefined,
        team_name:        isTeam ? form.team_name  : undefined,
        team_size:        isTeam ? Number(form.team_size) : undefined,
        session_id:       form.session_id ? Number(form.session_id) : undefined,
      };

      const { data } = await registerForEvent(event_id, payload);

      if (data.data?.checkout_url) {
        // Paid — redirect to Stripe
        window.location.href = data.data.checkout_url;
      } else {
        // Free — go to confirm
        navigate(`/registration/confirm?registration_id=${data.data.registration.registration_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-8 text-center text-on-surface-variant">Loading event…</p>;
  if (!event)  return <p className="p-8 text-center text-error">Event not found</p>;

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Event banner */}
        <div className="flex gap-4 items-center bg-surface-container rounded-2xl p-4 mb-6 border border-outline-variant">
          {event.poster_url
            ? <img src={event.poster_url} alt={event.title}
                className="w-16 h-20 rounded-xl object-cover shrink-0" />
            : <div className="w-16 h-20 rounded-xl bg-surface-container-highest flex items-center justify-center text-2xl shrink-0">🎯</div>
          }
          <div className="min-w-0">
            <p className="text-xs text-primary font-bold uppercase tracking-wide mb-1">{event.event_type}</p>
            <h1 className="text-lg font-extrabold text-on-surface leading-tight truncate">{event.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {isFree && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-semibold border border-success/30">
                  Free Registration
                </span>
              )}
              {isPaid && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-semibold border border-secondary/30">
                  ₹{fee.toLocaleString('en-IN')} Registration Fee
                </span>
              )}
              {isTeam && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold border border-primary/30">
                  👥 Team ({minTeam}–{maxTeam} members)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}
          className="bg-surface-container rounded-2xl border border-outline-variant p-6 space-y-5">

          <h2 className="text-base font-bold text-on-surface">Registration Details</h2>

          {error && (
            <div className="flex items-start gap-2 bg-error/10 border border-error/30 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* Session picker — only if multiple sessions exist */}
          {sessions.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                Select Session
              </label>
              <select
                value={form.session_id}
                onChange={e => set('session_id', e.target.value)}
                required
                className="w-full bg-surface-container-highest text-on-surface text-sm rounded-xl
                  px-4 py-3 border border-outline-variant focus:border-primary/50 outline-none"
              >
                <option value="">Choose a session…</option>
                {sessions.map(s => (
                  <option key={s.session_id} value={s.session_id}>
                    {new Date(s.show_date).toDateString()} {s.show_time} — {s.venue_name}, {s.city_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Participant type */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
              I am a…
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'student',     label: 'Student',     icon: GraduationCap, desc: 'Currently enrolled' },
                { value: 'independent', label: 'Independent', icon: Briefcase,     desc: 'Professional / other' },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button key={value} type="button"
                  onClick={() => set('participant_type', value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all
                    ${form.participant_type === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant bg-surface-container-highest text-on-surface-variant hover:border-primary/40'
                    }`}>
                  <Icon size={20} />
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-[11px] opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* College name — only for students */}
          {form.participant_type === 'student' && (
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                College / University *
              </label>
              <input
                value={form.college_name}
                onChange={e => set('college_name', e.target.value)}
                placeholder="e.g. Goa University"
                className="w-full bg-surface-container-highest text-on-surface text-sm rounded-xl
                  px-4 py-3 border border-outline-variant focus:border-primary/50 outline-none
                  placeholder-on-surface-variant transition-all"
              />
            </div>
          )}

          {/* Team fields */}
          {isTeam && (
            <>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                  Team Name *
                </label>
                <div className="relative">
                  <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    value={form.team_name}
                    onChange={e => set('team_name', e.target.value)}
                    placeholder="e.g. Team Nexus"
                    className="w-full pl-9 pr-4 py-3 bg-surface-container-highest text-on-surface text-sm
                      rounded-xl border border-outline-variant focus:border-primary/50 outline-none
                      placeholder-on-surface-variant transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                  Team Size * ({minTeam}–{maxTeam} members)
                </label>
                <input
                  type="number"
                  min={minTeam}
                  max={maxTeam}
                  value={form.team_size}
                  onChange={e => set('team_size', e.target.value)}
                  placeholder={`${minTeam} to ${maxTeam}`}
                  className="w-full bg-surface-container-highest text-on-surface text-sm rounded-xl
                    px-4 py-3 border border-outline-variant focus:border-primary/50 outline-none
                    placeholder-on-surface-variant transition-all"
                />
              </div>
            </>
          )}

          {/* Info note */}
          <div className="flex gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <Info size={14} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-on-surface-variant">
              {isFree
                ? 'Your spot will be confirmed instantly after submission.'
                : `You will be redirected to pay ₹${fee.toLocaleString('en-IN')} via Stripe. Your registration is confirmed only after successful payment.`
              }
            </p>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm
              bg-primary text-on-primary hover:bg-primary-container transition-all
              disabled:opacity-50 shadow-lg shadow-primary/20">
            {submitting
              ? (isPaid ? 'Redirecting to payment…' : 'Submitting…')
              : (isFree ? 'Confirm Registration' : `Pay ₹${fee.toLocaleString('en-IN')} & Register`)
            }
            {!submitting && <ChevronRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}