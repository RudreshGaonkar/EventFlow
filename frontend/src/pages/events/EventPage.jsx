import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, Globe, ChevronLeft, Play,
  MapPin, Calendar, AlertCircle, Users, Ticket,FileText
} from 'lucide-react';
import { getEventDetail, getEventSessions } from '../../services/browse';

const RATING_BADGE = {
  G:  'bg-tertiary/20 text-tertiary border-tertiary/30',
  UA: 'bg-secondary/20 text-secondary border-secondary/30',
  A:  'bg-secondary-container/30 text-secondary border-secondary/20',
  S:  'bg-error-container/30 text-error border-error/20',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime12 = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hr   = parseInt(h);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr % 12 || 12;
  return `${hr12}:${m} ${ampm}`;
};

const formatDuration = (mins) => {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
};

// ── Session Card (booking events) ─────────────────────────────────────────────

function SessionCard({ session, onSelect }) {
  const available = session.available_seats;
  const pct    = session.total_seats > 0
    ? Math.round((session.booked_seats / session.total_seats) * 100) : 0;
  const isFull = available === 0;
  const isHot  = pct >= 60 && !isFull;

  return (
    <button
      onClick={() => !isFull && onSelect(session)}
      disabled={isFull}
      className={`w-full text-left p-4 rounded-2xl border transition-all
        ${isFull
          ? 'bg-surface-container/50 border-outline-variant/30 opacity-50 cursor-not-allowed'
          : 'bg-surface-container border-outline-variant hover:border-primary/60 hover:bg-surface-container-high cursor-pointer group'
        }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-on-surface">{formatTime12(session.show_time)}</span>
          <span className="text-xs text-on-surface-variant">
            {new Date(session.show_date).toLocaleDateString('en-IN', {
              weekday: 'short', day: 'numeric', month: 'short'
            })}
          </span>
        </div>
        {isFull
          ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/10 text-error border border-error/20">Sold Out</span>
          : isHot
          ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20">Filling Fast</span>
          : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary/10 text-tertiary border border-tertiary/20">Available</span>
        }
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <MapPin size={11} className="text-primary shrink-0" />
        <span className="text-xs text-on-surface truncate">{session.venue_name}</span>
      </div>

      <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all ${isFull ? 'bg-error' : isHot ? 'bg-secondary' : 'bg-tertiary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-on-surface-variant mb-3">{available} seats left</p>

      {isFull ? (
        <div className="pt-3 border-t border-outline-variant/30 text-center">
          <span className="text-xs text-error/70 font-semibold">Housefull</span>
        </div>
      ) : (
        <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">{session.city_name}</span>
          <span className="px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-lg
            group-hover:scale-105 transition-transform">
            Book Now →
          </span>
        </div>
      )}
    </button>
  );
}

// ── Registration Banner ───────────────────────────────────────────────────────

function RegistrationBanner({ event, onRegister }) {
  const isPaid = event.registration_mode === 'paid_registration';
  const isTeam = event.participation_type === 'team';
  const isBoth = event.participation_type === 'both';
  const fee    = Number(event.registration_fee || 0);

  return (
    <div className="bg-primary-container/20 border border-primary/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-on-surface">
            {isPaid
              ? `Registration Fee — ₹${fee.toLocaleString('en-IN')}`
              : 'Free Registration'}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {(isTeam || isBoth) && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5
                rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                <Users size={10} />
                Team · {event.min_team_size}–{event.max_team_size} members
              </span>
            )}
            {isBoth && (
              <span className="text-[10px] font-semibold px-2 py-0.5
                rounded-full bg-tertiary/10 text-tertiary border border-tertiary/20">
                Solo allowed
              </span>
            )}
            {event.max_participants && (
              <span className="text-[10px] font-semibold px-2 py-0.5
                rounded-full bg-surface-container-highest text-on-surface-variant border border-outline-variant">
                Max {event.max_participants} spots
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onRegister}
          className="shrink-0 bg-primary text-on-primary px-5 py-2.5 rounded-xl
            text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
        >
          {isPaid ? 'Pay & Register' : 'Register Free'}
        </button>
      </div>
      <div className="border-t border-primary/10 pt-3">
        <p className="text-xs text-on-surface-variant">
          Register once to get your event pass. Individual sessions may require separate sign-up.
        </p>
      </div>
    </div>
  );
}

// ── Sub-session Card (registration events) ────────────────────────────────────

function SubSessionCard({ session, onSubRegister }) {
  const needsReg  = session.requires_registration;
  const isFull    = session.session_max_participants !== null &&
                    session.session_registered >= session.session_max_participants;
  const spotsLeft = session.session_max_participants
    ? session.session_max_participants - (session.session_registered || 0)
    : null;

  return (
    <div className="w-full text-left p-4 rounded-2xl border bg-surface-container border-outline-variant transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-base font-bold text-on-surface">{formatTime12(session.show_time)}</span>
          <span className="text-xs text-on-surface-variant ml-2">
            {new Date(session.show_date).toLocaleDateString('en-IN', {
              weekday: 'short', day: 'numeric', month: 'short'
            })}
          </span>
        </div>
        {needsReg ? (
          isFull ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/10 text-error border border-error/20">
              Full
            </span>
          ) : (
            <button
              onClick={() => onSubRegister(session)}
              className="px-3 py-1 bg-secondary text-on-secondary text-xs font-bold
                rounded-lg hover:opacity-90 active:scale-95 transition-all shrink-0"
            >
              + Register
            </button>
          )
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold
            bg-tertiary/10 text-tertiary border border-tertiary/20">
            Open Access
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-1">
        <MapPin size={11} className="text-primary shrink-0" />
        <span className="text-xs text-on-surface truncate">
          {session.venue_name}, {session.city_name}
        </span>
      </div>

      {spotsLeft !== null && (
        <p className="text-[10px] text-on-surface-variant mt-1">
          {isFull ? 'No spots left' : `${spotsLeft} spots left`}
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EventPage() {
  const { event_id } = useParams();
  const navigate     = useNavigate();

  const [event,      setEvent]      = useState(null);
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [eRes, sRes] = await Promise.all([
          getEventDetail(event_id),
          getEventSessions(event_id),
        ]);
        setEvent(eRes.data.data);
        setSessions(sRes.data.data || []);
      } catch { navigate('/'); }
      finally  { setLoading(false); }
    };
    load();
  }, [event_id]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!event) return null;

  const isBookingEvent = !event.registration_mode || event.registration_mode === 'booking';

  const cities = [...new Map(sessions.map(s =>
    [s.city_id, { city_id: s.city_id, city_name: s.city_name }]
  )).values()];
  const dates = [...new Set(sessions.map(s => s.show_date))].sort();

  const filtered = sessions.filter(s => {
    if (cityFilter && String(s.city_id) !== String(cityFilter)) return false;
    if (dateFilter && s.show_date !== dateFilter)               return false;
    return true;
  });

  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.city_name]) acc[s.city_name] = [];
    acc[s.city_name].push(s);
    return acc;
  }, {});

  const allCast = event.cast || [];
  const crew = allCast
    .filter(p => p.role_type !== 'Cast')
    .filter((p, i, arr) => arr.findIndex(x => x.person_id === p.person_id) === i);
  const cast = allCast
    .filter(p => p.role_type === 'Cast')
    .filter((p, i, arr) => arr.findIndex(x => x.person_id === p.person_id) === i);

  // /events/ 
  const handleSelect = (session) =>
    navigate(`/session/${session.session_id}/seats`, { state: { event, session } });

  const handleRegister = () =>
    navigate(`/events/${event_id}/register`);

  const handleSubSessionRegister = (session) =>
    navigate(`/events/${event_id}/register`, { state: { session_id: session.session_id } });

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <div className="relative bg-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {event.poster_url
            ? <img src={event.poster_url} alt=""
                className="w-full h-full object-cover object-top blur-2xl scale-110 brightness-25 saturate-150" />
            : <div className="w-full h-full bg-surface-container-low" />
          }
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-white transition-colors mb-6">
            <ChevronLeft size={16} /> Back
          </button>

          {/* ✅ Fix: scope badge moved INSIDE this flex container */}
          <div className="flex gap-6 sm:gap-8 items-start">

            {/* Poster */}
            <div className="shrink-0 w-28 sm:w-40 rounded-2xl overflow-hidden
              shadow-2xl shadow-black/60 ring-1 ring-white/10">
              {event.poster_url
                ? <img src={event.poster_url} alt={event.title} className="w-full aspect-[2/3] object-cover" />
                : <div className="w-full aspect-[2/3] bg-surface-container-highest flex items-center justify-center">
                    <span className="text-4xl">🎬</span>
                  </div>
              }
            </div>

            {/* Details */}
            <div className="flex-1 pt-2 min-w-0">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/30">
                  {event.event_type}
                </span>
                {event.rating && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${RATING_BADGE[event.rating] || ''}`}>
                    {event.rating}
                  </span>
                )}
                {!isBookingEvent && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full
                    bg-secondary/20 text-secondary text-xs font-bold border border-secondary/30">
                    <Ticket size={10} />
                    {event.registration_mode === 'paid_registration' ? 'Paid Registration' : 'Free Registration'}
                  </span>
                )}
                {/* ✅ Fix: scope badge now inside flex, not floating outside */}
                {event.event_scope === 'national' ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full
                    bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                    🌐 National
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full
                    bg-tertiary/10 text-tertiary text-xs font-bold border border-tertiary/20">
                    📍 {sessions[0]?.state_name || 'State Level'}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-5">
                {event.duration_mins && (
                  <span className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <Clock size={13} className="text-primary" />
                    {formatDuration(event.duration_mins)}
                  </span>
                )}
                {event.language && (
                  <span className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <Globe size={13} className="text-primary" /> {event.language}
                  </span>
                )}
                {event.genre && (
                  <span className="text-sm text-on-surface-variant">{event.genre}</span>
                )}
                {event.age_limit && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-error
                    bg-error/10 px-2 py-0.5 rounded-full border border-error/20">
                    <AlertCircle size={11} /> {event.age_limit}+
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mt-5">
                {event.trailer_url && (
                  <a href={event.trailer_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-container
                      text-on-surface text-sm font-semibold rounded-2xl border border-outline-variant
                      hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all">
                    <Play size={14} fill="currentColor" /> Watch Trailer
                  </a>
                )}
                {event.brochure_url && (
                  <a href={event.brochure_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-container
                      text-on-surface text-sm font-semibold rounded-2xl border border-outline-variant
                      hover:border-secondary/40 hover:bg-secondary/10 hover:text-secondary transition-all">
                    <FileText size={14} /> Download Brochure
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* ── LEFT — About / Crew / Cast ── */}
          <div className="lg:col-span-2 space-y-8">
            {event.description && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-3">About</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">{event.description}</p>
              </div>
            )}

            {crew.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-3">Crew</h2>
                <div className="space-y-3">
                  {crew.map(p => (
                    <div key={p.person_id} className="flex items-center gap-3">
                      {p.photo_url
                        ? <img src={p.photo_url} className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-outline-variant" alt={p.real_name} />
                        : <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-on-surface-variant">{p.real_name?.[0]}</span>
                          </div>
                      }
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{p.real_name}</p>
                        <p className="text-[10px] text-primary font-medium">{p.designation || p.role_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cast.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-3">Cast</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-3">
                  {cast.slice(0, 9).map(p => (
                    <div key={p.person_id} className="flex flex-col items-center gap-1.5 text-center">
                      {p.photo_url
                        ? <img src={p.photo_url} className="w-14 h-14 rounded-2xl object-cover ring-1 ring-outline-variant" alt={p.real_name} />
                        : <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center ring-1 ring-outline-variant">
                            <span className="text-lg font-bold text-on-surface-variant">{p.real_name?.[0]}</span>
                          </div>
                      }
                      <p className="text-[10px] text-on-surface font-semibold leading-tight">{p.real_name}</p>
                      {p.character_name && (
                        <p className="text-[9px] text-on-surface-variant leading-tight">{p.character_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT — Book / Register ── */}
          <div className="lg:col-span-3">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-on-surface">
                  {isBookingEvent ? 'Book Tickets' : 'Event Schedule'}
                </h2>
                {sessions.length > 0 && (
                  <span className="text-xs text-on-surface-variant">
                    {isBookingEvent
                      ? `${sessions.length} show${sessions.length !== 1 ? 's' : ''} available`
                      : `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
                  </span>
                )}
              </div>

              {/* Registration banner */}
              {!isBookingEvent && (
                <div className="mb-6">
                  <RegistrationBanner event={event} onRegister={handleRegister} />
                </div>
              )}

              {/* No sessions */}
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center py-16 bg-surface-container rounded-3xl border border-outline-variant">
                  <Calendar size={32} className="text-on-surface-variant mb-3 opacity-40" />
                  <p className="text-sm font-medium text-on-surface">No sessions scheduled</p>
                  <p className="text-xs text-on-surface-variant mt-1">Check back soon</p>
                </div>
              ) : (
                <>
                  {/* City + Date filters — booking events only */}
                  {isBookingEvent && (
                    <>
                      {cities.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto mb-3 pb-1" style={{ scrollbarWidth: 'none' }}>
                          <button onClick={() => setCityFilter('')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all
                              ${!cityFilter ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant'}`}>
                            All Cities
                          </button>
                          {cities.map(c => (
                            <button key={c.city_id} onClick={() => setCityFilter(c.city_id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all
                                ${String(cityFilter) === String(c.city_id)
                                  ? 'bg-primary text-on-primary'
                                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant'}`}>
                              {c.city_name}
                            </button>
                          ))}
                        </div>
                      )}
                      {dates.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto mb-5 pb-1" style={{ scrollbarWidth: 'none' }}>
                          <button onClick={() => setDateFilter('')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all
                              ${!dateFilter ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant'}`}>
                            All Dates
                          </button>
                          {dates.map(d => (
                            <button key={d} onClick={() => setDateFilter(d)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all
                                ${dateFilter === d
                                  ? 'bg-secondary text-on-secondary'
                                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant'}`}>
                              {new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Session grids */}
                  {isBookingEvent ? (
                    Object.keys(grouped).length === 0 ? (
                      <div className="flex flex-col items-center py-12 bg-surface-container rounded-2xl border border-outline-variant">
                        <p className="text-sm text-on-surface-variant">No shows match filters</p>
                        <button onClick={() => { setCityFilter(''); setDateFilter(''); }}
                          className="mt-2 text-xs text-primary hover:underline">Clear filters</button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(grouped).map(([cityName, citySessions]) => (
                          <div key={cityName}>
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin size={13} className="text-primary" />
                              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{cityName}</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {citySessions.map(s => (
                                <SessionCard key={s.session_id} session={s} onSelect={handleSelect} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    // Registration: flat list of sub-sessions
                    <div className="space-y-3">
                      {sessions.map(s => (
                        <SubSessionCard
                          key={s.session_id}
                          session={s}
                          onSubRegister={handleSubSessionRegister}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}