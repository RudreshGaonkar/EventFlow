import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users, GraduationCap, Briefcase,
  ChevronRight, AlertCircle, Info,
  Calendar, MapPin, Sparkles, Lock
} from 'lucide-react';
import { getEventDetail, getEventSessions } from '../../services/browse';
import { registerForEvent } from '../../services/registration';

export default function RegistrationPage() {
  const { event_id } = useParams();
  const [qp] = useSearchParams();
  const navigate = useNavigate();

  const [event,      setEvent]      = useState(null);
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

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

  const isTeam  = event?.participation_type === 'team';
  const isFree  = event?.registration_mode  === 'free_registration';
  const isPaid  = event?.registration_mode  === 'paid_registration';
  const fee     = Number(event?.registration_fee || 0);
  const minTeam = Number(event?.min_team_size || 2);
  const maxTeam = Number(event?.max_team_size || 10);

  const hasPreselectedSession = Boolean(qp.get('session_id'));
  const showSessionPicker =
    !hasPreselectedSession &&
    sessions.length > 1 &&
    sessions.some(s => s.requires_registration);

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
    if (showSessionPicker && !form.session_id) return 'Please select a session';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        participant_type: form.participant_type,
        college_name: form.participant_type === 'student' ? form.college_name : undefined,
        team_name:    isTeam ? form.team_name              : undefined,
        team_size:    isTeam ? Number(form.team_size)      : undefined,
        session_id:   form.session_id ? Number(form.session_id) : undefined,
      };
      const { data } = await registerForEvent(event_id, payload);
      if (data.data?.checkout_url) {
        window.location.href = data.data.checkout_url;
      } else {
        navigate(`/registration/confirm?registration_id=${data.data.registration.registration_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-on-surface-variant animate-pulse">Loading event…</p>
      </div>
    </div>
  );

  if (!event) return (
    <p className="p-8 text-center text-error">Event not found</p>
  );

  const preselectedSession = hasPreselectedSession
    ? sessions.find(x => String(x.session_id) === String(qp.get('session_id')))
    : null;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        <div className="relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-container shadow-sm">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <div className="flex gap-4 p-5">
            {event.poster_url ? (
              <img
                src={event.poster_url}
                alt={event.title}
                className="w-16 h-22 rounded-xl object-cover shrink-0 shadow-md"
              />
            ) : (
              <div className="w-16 h-22 rounded-xl bg-surface-container-highest flex items-center justify-center text-2xl shrink-0">
                🎯
              </div>
            )}

            <div className="min-w-0 flex flex-col justify-center gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {event.event_type}
              </p>
              <h1 className="text-base font-extrabold text-on-surface leading-snug line-clamp-2">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {isFree && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold border border-success/25">
                    <Sparkles size={9} /> Free
                  </span>
                )}
                {isPaid && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                    ₹{fee.toLocaleString('en-IN')}
                  </span>
                )}
                {isTeam && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold border border-secondary/20">
                    <Users size={9} /> Team · {minTeam}–{maxTeam}
                  </span>
                )}
              </div>
            </div>
          </div>

          {preselectedSession && (
            <div className="mx-5 mb-4 flex items-center gap-2.5 rounded-xl bg-primary/8 border border-primary/15 px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-primary">
                <Calendar size={12} />
                <span className="text-xs font-semibold">
                  {new Date(preselectedSession.show_date).toDateString()}
                </span>
              </div>
              <span className="text-on-surface-variant text-xs opacity-40">·</span>
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <MapPin size={11} />
                <span className="text-xs">{preselectedSession.venue_name}</span>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-outline-variant bg-surface-container shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-outline-variant/50">
            <h2 className="text-sm font-bold text-on-surface">Registration Details</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Fill in your details to register</p>
          </div>

          <div className="p-6 space-y-5">

            {error && (
              <div className="flex items-start gap-2.5 bg-error/8 border border-error/20 rounded-xl px-4 py-3">
                <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                <p className="text-error text-xs font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {showSessionPicker && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Session
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  <select
                    value={form.session_id}
                    onChange={e => set('session_id', e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-3 bg-surface-container-highest text-on-surface text-sm rounded-xl border border-outline-variant focus:border-primary/50 outline-none appearance-none cursor-pointer transition-colors"
                  >
                    <option value="">Choose a session…</option>
                    {sessions
                      .filter(s => s.requires_registration)
                      .map(s => (
                        <option key={s.session_id} value={s.session_id}>
                          {new Date(s.show_date).toDateString()} {s.show_time} — {s.venue_name}, {s.city_name}
                        </option>
                      ))}
                  </select>
                  <ChevronRight size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-on-surface-variant pointer-events-none" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                I am a…
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { value: 'student',     label: 'Student',     icon: GraduationCap, desc: 'Currently enrolled' },
                  { value: 'independent', label: 'Independent', icon: Briefcase,     desc: 'Professional / other' },
                ].map(({ value, label, icon: Icon, desc }) => {
                  const active = form.participant_type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('participant_type', value)}
                      className={`relative flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border-2 text-center transition-all duration-200 overflow-hidden group ${
                        active
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-outline-variant bg-surface-container-highest text-on-surface-variant hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      {active && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                      )}
                      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                      <span className="text-xs font-bold leading-none">{label}</span>
                      <span className={`text-[10px] leading-none ${active ? 'text-primary/70' : 'text-on-surface-variant/60'}`}>
                        {desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.participant_type === 'student' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  College / University <span className="text-error">*</span>
                </label>
                <input
                  value={form.college_name}
                  onChange={e => set('college_name', e.target.value)}
                  placeholder="e.g. Goa University"
                  className="w-full bg-surface-container-highest text-on-surface text-sm rounded-xl px-4 py-3 border border-outline-variant focus:border-primary/50 outline-none placeholder:text-on-surface-variant/40 transition-colors"
                />
              </div>
            )}

            {isTeam && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Team Name <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    <input
                      value={form.team_name}
                      onChange={e => set('team_name', e.target.value)}
                      placeholder="e.g. Team Nexus"
                      className="w-full pl-9 pr-4 py-3 bg-surface-container-highest text-on-surface text-sm rounded-xl border border-outline-variant focus:border-primary/50 outline-none placeholder:text-on-surface-variant/40 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Team Size <span className="text-error">*</span>
                    <span className="ml-1 normal-case font-normal opacity-60">({minTeam}–{maxTeam} members)</span>
                  </label>
                  <input
                    type="number"
                    min={minTeam}
                    max={maxTeam}
                    value={form.team_size}
                    onChange={e => set('team_size', e.target.value)}
                    placeholder={`${minTeam} to ${maxTeam}`}
                    className="w-full bg-surface-container-highest text-on-surface text-sm rounded-xl px-4 py-3 border border-outline-variant focus:border-primary/50 outline-none placeholder:text-on-surface-variant/40 transition-colors"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2.5 bg-surface-container-highest rounded-xl px-4 py-3 border border-outline-variant/50">
              {isPaid ? <Lock size={13} className="text-on-surface-variant shrink-0 mt-0.5" />
                      : <Info size={13} className="text-primary shrink-0 mt-0.5" />}
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isFree
                  ? 'Your spot will be confirmed instantly after submission.'
                  : `You'll be redirected to Stripe to pay ₹${fee.toLocaleString('en-IN')}. Registration is confirmed only after successful payment.`
                }
              </p>
            </div>

          </div>

          <div className="px-6 pb-6">
            <button
              type="submit"
              disabled={submitting}
              className="relative w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-primary text-on-primary overflow-hidden hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
                  <span>{isPaid ? 'Redirecting to payment…' : 'Submitting…'}</span>
                </>
              ) : (
                <>
                  <span>
                    {isFree ? 'Confirm Registration' : `Pay ₹${fee.toLocaleString('en-IN')} & Register`}
                  </span>
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}