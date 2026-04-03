import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, ChevronLeft, ChevronRight,
  Music, Tv, Trophy, Laugh, Ticket, Star, Clock,
  X, Navigation, Cpu, BookOpen, Globe, Users
} from 'lucide-react';
import { browseEvents, getBrowseCities, getBrowseStates } from '../../services/browse';

const CATEGORIES = [
  { label: 'Movies',    icon: Tv,       type: 'Movie'     },
  { label: 'Concerts',  icon: Music,    type: 'Concert'   },
  { label: 'Sports',    icon: Trophy,   type: 'Sport'     },
  { label: 'Plays',     icon: Ticket,   type: 'Play'      },
  { label: 'Tech Fests',icon: Cpu,      type: 'Tech Fest' },
  { label: 'Workshops', icon: BookOpen, type: 'Workshop'  },
  { label: 'Other',     icon: Laugh,    type: 'Other'     },
];

const RATING_BADGE = {
  G:  'bg-tertiary/20 text-tertiary',
  UA: 'bg-secondary/20 text-secondary',
  A:  'bg-secondary-container/30 text-secondary',
  S:  'bg-error-container/30 text-error',
};

const STATE_KEY = 'ef_selected_state';

// ── Helpers ───────────────────────────────────────────────────────────────────

const isRegistration = (event) =>
  event.registration_mode && event.registration_mode !== 'booking';

const getCtaLabel = (event) => {
  if (!isRegistration(event)) return 'Book Tickets';
  if (event.registration_mode === 'free_registration') return 'Register Free';
  return `Register · ₹${Number(event.registration_fee).toLocaleString('en-IN')}`;
};

// ── State Picker Modal ────────────────────────────────────────────────────────

function StatePickerModal({ states, onSelect, onSkip }) {
  const [search, setSearch] = useState('');
  const filtered = states.filter(s =>
    s.state_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface-container rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Navigation size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-1">Select Your State</h2>
          <p className="text-sm text-on-surface-variant">
            National events are visible to everyone. Select your state to also
            see local events &amp; shows.
          </p>
        </div>

        {/* Search */}
        <div className="px-6 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search state..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-highest text-white rounded-xl
                text-sm outline-none border border-outline-variant focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* States list */}
        <div className="px-3 max-h-72 overflow-y-auto">
          {filtered.length === 0
            ? <p className="text-center text-on-surface-variant text-sm py-6">No states found</p>
            : filtered.map(s => (
              <button key={s.state_id} onClick={() => onSelect(s)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  hover:bg-primary/10 hover:text-primary text-on-surface text-sm
                  font-medium transition-all text-left">
                <MapPin size={14} className="text-primary shrink-0" />
                {s.state_name}
              </button>
            ))
          }
        </div>

        {/* Skip */}
        <div className="px-6 py-4 border-t border-outline-variant/30 text-center">
          <button onClick={onSkip}
            className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
            Skip — show national events only
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────

function EventCard({ event }) {
  const navigate = useNavigate();
  const isReg    = isRegistration(event);
  const cta      = getCtaLabel(event);

  return (
    <div
      onClick={() => navigate(`/events/${event.event_id}`)}
      className="group relative flex-shrink-0 w-40 sm:w-44 cursor-pointer"
    >
      <div className="relative rounded-2xl overflow-hidden aspect-[2/3]
        bg-surface-container shadow-lg
        group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-primary/20
        transition-all duration-300">

        {event.poster_url
          ? <img src={event.poster_url} alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
              <span className="text-5xl">{isReg ? '🎯' : '🎬'}</span>
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {event.rating && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${RATING_BADGE[event.rating] || ''}`}>
              {event.rating}
            </span>
          )}
          {event.event_scope === 'national' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              🌐
            </span>
          )}
        </div>

        {/* Registration badge top-right */}
        {isReg && (
          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-secondary/20 text-secondary border border-secondary/30">
              {event.participation_type === 'team' ? '👥 Team' : '📋 Register'}
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-semibold text-xs leading-tight truncate">{event.title}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-on-surface-variant">
              {event.language || event.event_type}
            </span>
            {event.next_show && (
              <span className="flex items-center gap-0.5 text-[9px] text-on-surface-variant">
                <Clock size={8} />
                {new Date(event.next_show).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CTA button */}
      <button
        onClick={e => { e.stopPropagation(); navigate(`/events/${event.event_id}`); }}
        className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-semibold
          transition-all duration-200 border
          ${isReg
            ? 'bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary hover:text-on-secondary'
            : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-on-primary'
          }`}
      >
        {cta}
      </button>
    </div>
  );
}

// ── Horizontal Scroll Row ─────────────────────────────────────────────────────

function EventRow({ title, events, icon: Icon, emptyHidden = true }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  if (emptyHidden && !events.length) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-primary" />}
          <h2 className="text-lg font-bold text-on-surface">{title}</h2>
          <span className="text-xs text-on-surface-variant">({events.length})</span>
        </div>
        {events.length > 3 && (
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)}
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-primary text-on-surface-variant
                hover:text-white flex items-center justify-center transition-all">
              <ChevronLeft size={15} />
            </button>
            <button onClick={() => scroll(1)}
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-primary text-on-surface-variant
                hover:text-white flex items-center justify-center transition-all">
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex items-center gap-3 py-6 px-5 rounded-2xl border border-outline-variant/30
          bg-surface-container/50 text-on-surface-variant text-sm">
          <Icon size={20} className="opacity-40" />
          No {title.toLowerCase()} available in your area right now
        </div>
      ) : (
        <div ref={ref} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {events.map(e => <EventCard key={e.event_id} event={e} />)}
        </div>
      )}
    </div>
  );
}

// ── Hero Slider ───────────────────────────────────────────────────────────────

function HeroSlider({ events }) {
  const navigate   = useNavigate();
  const [current, setCurrent] = useState(0);
  const timerRef  = useRef(null);
  const featured  = events.slice(0, 5);

  const go = useCallback((idx) => {
    setCurrent((idx + featured.length) % featured.length);
  }, [featured.length]);

  useEffect(() => {
    timerRef.current = setInterval(() => go(current + 1), 5000);
    return () => clearInterval(timerRef.current);
  }, [current, go]);

  if (!featured.length) return null;
  const ev    = featured[current];
  const isReg = isRegistration(ev);
  const cta   = getCtaLabel(ev);

  return (
    <div className="relative w-screen left-1/2 -translate-x-1/2 h-[420px] sm:h-[540px] overflow-hidden mb-10 group">
      <div className="absolute inset-0">
        {ev.poster_url
          ? <img src={ev.poster_url} alt={ev.title}
              className="w-full h-full object-cover scale-105 blur-sm brightness-40" />
          : <div className="w-full h-full bg-surface-container-low" />
        }
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <div className="absolute inset-0 flex items-end pb-14">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 items-end">
            {ev.poster_url && (
              <img src={ev.poster_url} alt={ev.title}
                className="hidden sm:block w-36 rounded-2xl shadow-2xl shadow-black/60 shrink-0" />
            )}
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/30">
                  {ev.event_type}
                </span>
                {ev.rating && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${RATING_BADGE[ev.rating] || ''}`}>
                    {ev.rating}
                  </span>
                )}
                {ev.event_scope === 'national' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
                    bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Globe size={11} /> National
                  </span>
                )}
                {isReg && ev.participation_type === 'team' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
                    bg-secondary/20 text-secondary border border-secondary/30">
                    <Users size={11} /> Team Event
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-2">{ev.title}</h1>
              <p className="text-sm text-on-surface-variant mb-5">
                {ev.language}{ev.duration_mins ? ` · ${ev.duration_mins} min` : ''}
                {ev.genre ? ` · ${ev.genre}` : ''}
              </p>
              <button onClick={() => navigate(`/events/${ev.event_id}`)}
                className={`px-6 py-3 font-bold text-sm rounded-2xl
                  hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg
                  ${isReg
                    ? 'bg-secondary text-on-secondary shadow-secondary/30 hover:bg-secondary-container'
                    : 'bg-primary text-on-primary shadow-primary/30 hover:bg-primary-container'
                  }`}>
                {cta}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button onClick={() => { clearInterval(timerRef.current); go(current - 1); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
          bg-black/40 backdrop-blur-sm text-white flex items-center justify-center
          opacity-0 group-hover:opacity-100 hover:bg-primary transition-all">
        <ChevronLeft size={18} />
      </button>
      <button onClick={() => { clearInterval(timerRef.current); go(current + 1); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
          bg-black/40 backdrop-blur-sm text-white flex items-center justify-center
          opacity-0 group-hover:opacity-100 hover:bg-primary transition-all">
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {featured.map((_, i) => (
          <button key={i} onClick={() => go(i)}
            className={`rounded-full transition-all ${i === current ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`} />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [allEvents,     setAllEvents]     = useState([]);
  const [cities,        setCities]        = useState([]);
  const [states,        setStates]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [cityId,        setCityId]        = useState('');
  const [activeType,    setActiveType]    = useState('');
  const [suggestions,   setSuggestions]   = useState([]);
  const [selectedState, setSelectedState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STATE_KEY)); } catch { return null; }
  });
  const [showStatePicker, setShowStatePicker] = useState(false);
  const navigate = useNavigate();

  // Load states on mount
  useEffect(() => {
    getBrowseStates().then(r => setStates(r.data.data || []));
  }, []);

  // Show picker if no state selected yet
  useEffect(() => {
    if (!selectedState && states.length > 0) setShowStatePicker(true);
  }, [states, selectedState]);

  const handleSelectState = (state) => {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
    setSelectedState(state);
    setShowStatePicker(false);
    setCityId('');
  };

  // Skip — show national events only (state_id = 0)
  const handleSkipState = () => {
    setShowStatePicker(false);
    // leave selectedState null — backend returns national-only when state_id=0
  };

  // Load cities filtered to selected state
  useEffect(() => {
    getBrowseCities().then(r => setCities(r.data.data || []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedState) params.state_id  = selectedState.state_id;
      if (cityId)        params.city_id   = cityId;
      if (activeType)    params.event_type = activeType;
      const r = await browseEvents(params);
      setAllEvents(r.data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [selectedState, cityId, activeType]);

  useEffect(() => { load(); }, [load]);

  // Search suggestions
  useEffect(() => {
    if (search.trim().length < 2) { setSuggestions([]); return; }
    setSuggestions(
      allEvents.filter(e => e.title.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    );
  }, [search, allEvents]);

  const filtered = search.trim()
    ? allEvents.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
    : allEvents;

  // Categorised rows
  const movies    = filtered.filter(e => e.event_type === 'Movie');
  const concerts  = filtered.filter(e => e.event_type === 'Concert');
  const plays     = filtered.filter(e => e.event_type === 'Play');
  const techFests = filtered.filter(e => e.event_type === 'Tech Fest');
  const workshops = filtered.filter(e => e.event_type === 'Workshop');
  const sports    = filtered.filter(e => e.event_type === 'Sport');

  // Cities for selected state
  const stateCities = selectedState
    ? cities.filter(c => c.state_name === selectedState.state_name)
    : cities;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* State Picker Modal */}
      {showStatePicker && (
        <StatePickerModal
          states={states}
          onSelect={handleSelectState}
          onSkip={handleSkipState}
        />
      )}

      {/* Hero */}
      {!loading && !search && !activeType && (
        <HeroSlider events={allEvents} />
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* ── Search + Location bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 mt-6">

          {/* State selector */}
          <button
            onClick={() => setShowStatePicker(true)}
            className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-3
              rounded-2xl text-sm font-semibold text-primary hover:bg-primary/20 transition-all shrink-0"
          >
            <Navigation size={15} />
            {selectedState ? selectedState.state_name : '🌐 National'}
          </button>

          {/* City selector */}
          {stateCities.length > 1 && (
            <div className="flex items-center gap-2 bg-surface-container px-4 py-3 rounded-2xl
              min-w-[140px] border border-outline-variant hover:border-primary/30 transition-all">
              <MapPin size={15} className="text-primary shrink-0" />
              <select value={cityId} onChange={e => setCityId(e.target.value)}
                className="bg-transparent text-sm text-on-surface outline-none w-full appearance-none cursor-pointer">
                <option value="">All Cities</option>
                {stateCities.map(c => (
                  <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search movies, tech fests, concerts..."
              className="w-full pl-11 pr-10 py-3 bg-surface-container text-on-surface rounded-2xl text-sm
                outline-none border border-outline-variant focus:border-primary/50 transition-all
                placeholder-on-surface-variant"
            />
            {search && (
              <button onClick={() => { setSearch(''); setSuggestions([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                <X size={15} />
              </button>
            )}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container
                border border-outline-variant rounded-2xl shadow-2xl overflow-hidden z-50">
                {suggestions.map(e => (
                  <div key={e.event_id}
                    onClick={() => { navigate(`/events/${e.event_id}`); setSearch(''); setSuggestions([]); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 cursor-pointer transition-colors">
                    {e.poster_url
                      ? <img src={e.poster_url} className="w-8 h-10 rounded-lg object-cover shrink-0" />
                      : <div className="w-8 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-lg">
                          {isRegistration(e) ? '🎯' : '🎬'}
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface font-medium truncate">{e.title}</p>
                      <p className="text-xs text-on-surface-variant">
                        {e.event_type} · {e.language || (e.event_scope === 'national' ? '🌐 National' : e.state_name)}
                      </p>
                    </div>
                    {isRegistration(e) && (
                      <span className="text-[10px] text-secondary font-semibold shrink-0">Register</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Category Pills ── */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-8" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setActiveType('')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold
              whitespace-nowrap transition-all shrink-0 ${!activeType
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/30'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant'}`}>
            All Events
          </button>
          {CATEGORIES.map(({ label, icon: Icon, type }) => (
            <button key={label} onClick={() => setActiveType(activeType === type ? '' : type)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold
                whitespace-nowrap transition-all shrink-0 ${activeType === type
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/30'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant'}`}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-surface-container animate-pulse aspect-[2/3]" />
            ))}
          </div>
        ) : search ? (
          /* ── Search results ── */
          <div className="mb-12">
            <p className="text-sm text-on-surface-variant mb-5">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for{' '}
              "<span className="text-on-surface">{search}</span>"
              {selectedState ? ` in ${selectedState.state_name}` : ' (National)'}
            </p>
            {filtered.length === 0
              ? <div className="flex flex-col items-center py-20">
                  <span className="text-5xl mb-4">🎭</span>
                  <p className="text-on-surface-variant">No events found</p>
                </div>
              : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filtered.map(e => <EventCard key={e.event_id} event={e} />)}
                </div>
            }
          </div>
        ) : (
          /* ── Categorised rows ── */
          <>
            <EventRow title="Trending Movies"       events={movies}    icon={Tv}       />
            <EventRow title="Live Concerts"          events={concerts}  icon={Music}    />
            <EventRow title="Theatre & Plays"        events={plays}     icon={Ticket}   />
            <EventRow title="Tech Fests"             events={techFests} icon={Cpu}      emptyHidden />
            <EventRow title="Workshops & Seminars"   events={workshops} icon={BookOpen} emptyHidden />
            <EventRow title="Sports"                 events={sports}    icon={Trophy}   emptyHidden />
            <EventRow title="All Events"             events={filtered}  icon={Star}     />

            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-20">
                <span className="text-5xl mb-4">🎭</span>
                <p className="text-on-surface font-semibold">
                  No events {selectedState ? `in ${selectedState.state_name}` : 'available'}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {selectedState
                    ? 'Try changing your state or check back later'
                    : 'Select a state to see local events too'}
                </p>
                <button onClick={() => setShowStatePicker(true)}
                  className="mt-4 px-5 py-2 bg-primary/10 text-primary border border-primary/20
                    rounded-xl text-sm font-semibold">
                  {selectedState ? 'Change State' : 'Select State'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}