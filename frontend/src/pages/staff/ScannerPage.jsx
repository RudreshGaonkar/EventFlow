import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, CheckCircle2, XCircle, AlertTriangle,
  Loader2, ArrowLeft, Ticket, MapPin, CalendarDays,
  Clock, Tag, Armchair, Circle, ShieldCheck, Calendar
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { validateTicket } from '../../services/scanner';
import api from '../../services/api';

// ── State machine ──────────────────────────────────────────────────────────────
const IDLE    = 'idle';
const LOADING = 'loading';
const DONE    = 'done';

// result_code → visual config (using Pure Dark theme vars where possible)
const RESULT_META = {
  0: {
    icon: CheckCircle2,
    colorClass:  'text-success',
    bgClass:     'bg-success/10 border-success/25',
    label:       'ENTRY APPROVED',
    badge:       'APPROVED',
    badgeClass:  'bg-success/10 text-success',
  },
  1: {
    icon: AlertTriangle,
    colorClass:  'text-warning',
    bgClass:     'bg-warning/10 border-warning/25',
    label:       'ALREADY CHECKED-IN',
    badge:       'DUPLICATE',
    badgeClass:  'bg-warning/10 text-warning',
  },
  2: {
    icon: XCircle,
    colorClass:  'text-error',
    bgClass:     'bg-error/10 border-error/25',
    label:       'TICKET NOT FOUND',
    badge:       'INVALID',
    badgeClass:  'bg-error/10 text-error',
  },
  3: {
    icon: XCircle,
    colorClass:  'text-error',
    bgClass:     'bg-error/10 border-error/25',
    label:       'TICKET CANCELLED',
    badge:       'CANCELLED',
    badgeClass:  'bg-error/10 text-error',
  },
  5: {
    icon: XCircle,
    colorClass:  'text-error',
    bgClass:     'bg-error/10 border-error/25',
    label:       'WRONG VENUE',
    badge:       'FORBIDDEN',
    badgeClass:  'bg-error/10 text-error',
  },
  6: {
    icon: AlertTriangle,
    colorClass:  'text-warning',
    bgClass:     'bg-warning/10 border-warning/25',
    label:       'WRONG SESSION',
    badge:       'MISMATCH',
    badgeClass:  'bg-warning/10 text-warning',
  },
};

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon size={14} className="text-on-surface-variant shrink-0" />
      <span className="text-on-surface-variant w-20 shrink-0 text-xs uppercase tracking-wide">
        {label}
      </span>
      <span className="text-on-surface font-semibold">{value}</span>
    </div>
  );
}

// ── Format helpers ─────────────────────────────────────────────────────────────
const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const d = new Date(); d.setHours(+h, +m);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
};

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ScannerPage() {
  const navigate           = useNavigate();
  const { sessionId }      = useParams();            // from /scanner/:sessionId
  const { user }           = useAuth();

  const [uuid,       setUuid]    = useState('');
  const [status,     setStatus]  = useState(IDLE);
  const [result,     setResult]  = useState(null);
  const [history,    setHistory] = useState([]);
  const [session,    setSession] = useState(null);   // active session metadata
  const inputRef               = useRef(null);

  // ── Load session context if sessionId is provided ──────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    api.get('/staff/my-sessions')
      .then(r => {
        const found = (r.data.data || []).find(
          s => String(s.session_id) === String(sessionId)
        );
        setSession(found || null);
      })
      .catch(() => {});
  }, [sessionId]);

  // ── Scan handler ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = uuid.trim();
    if (!trimmed) return;
    setStatus(LOADING);
    try {
      const res  = await validateTicket(trimmed, sessionId ? Number(sessionId) : undefined);
      const data = { ok: true, ...res.data };
      setResult(data);
      setHistory(prev => [{
        uuid_short:  trimmed.slice(0, 8) + '…',
        result_code: data.result_code,
        time:        Date.now(),
      }, ...prev].slice(0, 15));
    } catch (err) {
      const data = { ok: false, ...err.response?.data };
      setResult(data);
      setHistory(prev => [{
        uuid_short:  trimmed.slice(0, 8) + '…',
        result_code: data.result_code ?? 2,
        time:        Date.now(),
      }, ...prev].slice(0, 15));
    } finally {
      setStatus(DONE);
      setUuid('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const code   = result?.result_code;
  const meta   = code != null ? (RESULT_META[code] ?? RESULT_META[2]) : null;
  const ticket = result?.ticket;

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-outline-variant/20 bg-surface-container-low
        px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/staff')}
          className="p-1.5 rounded-lg hover:bg-surface-container transition-colors
            text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold tracking-wide text-on-surface font-headline">
            Ticket Scanner
          </h1>
          <p className="text-xs text-on-surface-variant truncate">
            {user?.full_name} · {user?.role_name}
          </p>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold text-success
          bg-success/10 border border-success/20 px-2.5 py-1 rounded-full shrink-0">
          <Circle size={6} className="fill-success" /> Live
        </span>
      </div>

      {/* ── Session context banner (only when launched from StaffPage) ───────── */}
      {session && (
        <div className="bg-surface-container border-b border-outline-variant/20 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high
              flex items-center justify-center shrink-0">
              <ShieldCheck size={15} className="text-on-surface-variant" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mb-0.5">
                Active Session
              </p>
              <p className="font-semibold text-on-surface text-sm truncate">
                {session.event_title}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <Calendar size={10} /> {formatDate(session.show_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  <span className="font-semibold text-on-surface">
                    {formatTime(session.show_time)}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={10} /> {session.venue_name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main layout (sidebar + result panel) ─────────────────────────────── */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">

        {/* ── Left: Input + history ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 p-5
          md:w-[360px] md:border-r border-outline-variant/20">

          {/* Input form */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-3 font-semibold">
              Manual Ticket Entry
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={uuid}
                  onChange={e => setUuid(e.target.value)}
                  placeholder="Paste or type ticket UUID…"
                  autoFocus
                  autoComplete="off"
                  disabled={status === LOADING || !sessionId}
                  className="w-full bg-surface-container border border-outline-variant/40
                    rounded-xl px-4 py-3.5 text-sm text-on-surface
                    placeholder:text-on-surface-variant/40
                    outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10
                    transition-all disabled:opacity-50 pr-10 font-mono"
                />
                <Ticket size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2
                  text-on-surface-variant/30" />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                disabled={status === LOADING || !uuid.trim() || !sessionId}
                className="w-full bg-primary text-on-primary disabled:opacity-40
                  transition-all rounded-xl py-3.5 text-sm font-bold tracking-wide
                  flex items-center justify-center gap-2"
              >
                {status === LOADING
                  ? <><Loader2 size={16} className="animate-spin" /> Validating…</>
                  : <><ScanLine size={16} /> Verify Ticket</>
                }
              </motion.button>
            </form>
          </div>

          {/* Scan history */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                Scan Log
              </p>
              {history.length > 0 && (
                <span className="text-xs text-on-surface-variant">{history.length} scans</span>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-on-surface-variant/50 italic">No scans yet this session</p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-72">
                {history.map((h, i) => {
                  const hMeta = RESULT_META[h.result_code] ?? RESULT_META[2];
                  const HIcon = hMeta.icon;
                  return (
                    <div key={i}
                      className="flex items-center gap-3 bg-surface-container
                        rounded-xl px-3 py-2.5 border border-outline-variant/20">
                      <HIcon size={13} className={hMeta.colorClass} />
                      <span className="text-xs text-on-surface-variant font-mono flex-1 truncate">
                        {h.uuid_short}
                      </span>
                      <span className="text-xs text-on-surface-variant/50 shrink-0">
                        {timeAgo(h.time)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status indicator */}
          <div className={`flex items-center gap-2.5 bg-surface-container
            rounded-xl px-4 py-2.5 border border-outline-variant/20 ${!sessionId ? 'opacity-50' : ''}`}>
            <Circle size={8} className={`shrink-0 ${!sessionId ? 'text-warning fill-warning' : 'text-success fill-success'}`} />
            <span className="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
              {!sessionId ? 'No Session Selected' : 'Scanner Ready'}
            </span>
          </div>
        </div>

        {/* ── Right: Scan result ──────────────────────────────────────────────── */}
        <div className="flex-1 p-5 flex flex-col gap-4">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
            Scan Result
          </p>

          <AnimatePresence mode="wait">
            {!sessionId ? (
              <motion.div
                key="no-session"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 rounded-2xl border border-warning/30 bg-warning/5
                  flex flex-col items-center justify-center gap-4 p-12 text-center min-h-64"
              >
                <div className="w-16 h-16 rounded-2xl bg-warning/10
                  flex items-center justify-center">
                  <AlertTriangle size={28} className="text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-warning">
                    Missing Session Context
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-[250px] mx-auto">
                    Please return to the Staff Portal and select a specific event session before scanning tickets.
                  </p>
                </div>
              </motion.div>
            ) : status === DONE && result && meta ? (
              <motion.div
                key={code + String(Date.now())}
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1,    y: 0 }}
                exit={{   opacity: 0, scale: 0.95,   y: 8 }}
                transition={{ duration: 0.22 }}
                className={`rounded-2xl border p-6 flex flex-col gap-5 ${meta.bgClass}`}
              >
                {/* Status header */}
                <div className={`flex items-center gap-4 ${meta.colorClass}`}>
                  <meta.icon size={40} strokeWidth={1.5} />
                  <div>
                    <p className="text-2xl font-extrabold tracking-wide leading-tight font-headline">
                      {meta.label}
                    </p>
                    <span className={`inline-block mt-1 text-xs px-2.5 py-0.5
                      rounded-full font-bold tracking-widest ${meta.badgeClass}`}>
                      {meta.badge}
                    </span>
                  </div>
                </div>

                {/* Error message from backend */}
                {result.message && code !== 0 && (
                  <p className="text-sm text-on-surface-variant border-t
                    border-outline-variant/20 pt-3 leading-relaxed">
                    {result.message}
                  </p>
                )}

                {/* Ticket detail rows */}
                {ticket && (
                  <div className="flex flex-col gap-3 pt-1 border-t border-outline-variant/20">
                    {ticket.attendee_name && (
                      <Row icon={Ticket}      label="Attendee" value={ticket.attendee_name} />
                    )}
                    {ticket.event_title && (
                      <Row icon={Tag}         label="Event"    value={ticket.event_title} />
                    )}
                    {ticket.venue_name && (
                      <Row icon={MapPin}      label="Venue"    value={ticket.venue_name} />
                    )}
                    {ticket.show_date && (
                      <Row icon={CalendarDays} label="Date"   value={formatDate(ticket.show_date)} />
                    )}
                    {ticket.show_time && (
                      <Row icon={Clock}       label="Time"    value={formatTime(ticket.show_time)} />
                    )}
                    {ticket.tier_name && (
                      <Row icon={Tag}         label="Tier"    value={ticket.tier_name} />
                    )}
                    {ticket.seat_label && (
                      <Row icon={Armchair}    label="Seat"    value={ticket.seat_label} />
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Empty state */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 rounded-2xl border border-dashed border-outline-variant/30
                  flex flex-col items-center justify-center gap-4 p-12 text-center min-h-64"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-container
                  flex items-center justify-center">
                  <ScanLine size={28} className="text-on-surface-variant/40" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface-variant">
                    Awaiting scan
                  </p>
                  <p className="text-xs text-on-surface-variant/50 mt-1">
                    Enter a ticket UUID and press Verify
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}