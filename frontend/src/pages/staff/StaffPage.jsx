import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, Calendar, Clock, MapPin, Users,
  ChevronRight, ShieldCheck, AlertCircle, Loader2, Building2
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const isToday = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
};

const STATUS_STYLES = {
  Scheduled: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  Ongoing:   'bg-green-500/15 text-green-400 border-green-500/25',
  default:   'bg-surface-container text-on-surface-variant border-outline',
};

// ── Session Card ───────────────────────────────────────────────────────────────
function SessionCard({ session, index }) {
  const navigate = useNavigate();
  const statusStyle = STATUS_STYLES[session.status] || STATUS_STYLES.default;
  const today = isToday(session.show_date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      className="bg-surface-container border border-outline-variant/30 rounded-2xl overflow-hidden
                 hover:border-outline/60 transition-all duration-300 hover:shadow-lg hover:shadow-black/40"
    >
      {/* Poster strip */}
      {session.poster_url && (
        <div className="w-full aspect-[21/9] sm:aspect-[3/1] relative overflow-hidden">
          <img
            src={session.poster_url}
            alt={session.event_title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-surface-container" />
          {today && (
            <span className="absolute top-2.5 left-3 px-2 py-0.5 text-[10px] font-bold tracking-widest
              uppercase bg-green-500 text-black rounded-full">
              Today
            </span>
          )}
        </div>
      )}

      <div className={`px-4 py-4 ${!session.poster_url ? 'pt-5' : ''}`}>
        {/* Title + status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="font-semibold text-on-surface text-base leading-tight truncate">
              {session.event_title}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">{session.event_type}</p>
          </div>
          <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1
            rounded-full border ${statusStyle}`}>
            {session.status}
          </span>
        </div>

        {/* Meta row */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Calendar size={12} className="shrink-0" />
            <span>{formatDate(session.show_date)}</span>
            <span className="text-outline">·</span>
            <Clock size={12} className="shrink-0" />
            <span className="font-semibold text-on-surface">{formatTime(session.show_time)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{session.venue_name}, {session.city_name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Users size={12} className="shrink-0" />
            <span>
              <span className="text-on-surface font-semibold">{session.booked_seats}</span>
              {' / '}{session.total_seats} booked
            </span>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/scanner/${session.session_id}`)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl
            bg-primary text-on-primary font-semibold text-sm
            hover:bg-primary/90 transition-all"
        >
          <span className="flex items-center gap-2">
            <ScanLine size={16} />
            Start Scanning
          </span>
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
        <Building2 size={28} className="text-on-surface-variant" />
      </div>
      <p className="font-semibold text-on-surface mb-1">No sessions today</p>
      <p className="text-sm text-on-surface-variant max-w-xs">
        There are no active or upcoming sessions scheduled for your assigned venues.
      </p>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/staff/my-sessions')
      .then(r => { if (!cancelled) setSessions(r.data.data || []); })
      .catch(err => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load sessions');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Split sessions into today vs tomorrow
  const todaySessions    = sessions.filter(s => isToday(s.show_date));
  const upcomingSessions = sessions.filter(s => !isToday(s.show_date));

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-on-surface-variant mb-1 font-medium">
            EventFlow · Staff Portal
          </p>
          <h1 className="text-2xl font-bold text-on-surface font-headline">Today's Sessions</h1>

          {/* Staff identity card */}
          <div className="mt-4 bg-surface-container-low border border-outline-variant/20
            rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-high
              flex items-center justify-center font-bold text-sm text-on-surface shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-on-surface text-sm truncate">{user?.full_name}</p>
              <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
            </div>
            <span className="ml-auto flex items-center gap-1 text-[11px] font-bold
              text-green-400 bg-green-500/10 border border-green-500/20
              px-2.5 py-1 rounded-full shrink-0">
              <ShieldCheck size={11} /> Staff
            </span>
          </div>
        </motion.div>

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20 gap-3 text-on-surface-variant"
            >
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading sessions…</span>
            </motion.div>
          )}

          {/* ── Error ──────────────────────────────────────────────────────── */}
          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-4 py-3.5 bg-error/10 border border-error/20
                rounded-xl text-error text-sm"
            >
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}

          {/* ── Content ────────────────────────────────────────────────────── */}
          {!loading && !error && (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {sessions.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {todaySessions.length > 0 && (
                    <section className="mb-8">
                      <h2 className="text-xs font-bold uppercase tracking-wider
                        text-on-surface-variant mb-3">
                        Today
                      </h2>
                      <div className="space-y-4">
                        {todaySessions.map((s, i) => (
                          <SessionCard key={s.session_id} session={s} index={i} />
                        ))}
                      </div>
                    </section>
                  )}

                  {upcomingSessions.length > 0 && (
                    <section>
                      <h2 className="text-xs font-bold uppercase tracking-wider
                        text-on-surface-variant mb-3">
                        Tomorrow
                      </h2>
                      <div className="space-y-4">
                        {upcomingSessions.map((s, i) => (
                          <SessionCard key={s.session_id} session={s} index={todaySessions.length + i} />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
