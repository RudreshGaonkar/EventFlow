import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, CheckCircle2, XCircle, AlertTriangle,
  Loader2, ArrowLeft, Ticket, MapPin, CalendarDays,
  Clock, Tag, Armchair, Circle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateTicket } from '../../services/scanner';

const IDLE = 'idle';
const LOADING = 'loading';
const DONE = 'done';

const RESULT_META = {
  0: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/60 border-emerald-500/30',
    label: 'ENTRY APPROVED',
    badge: 'APPROVED',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
  },
  1: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-950/60 border-amber-500/30',
    label: 'ALREADY USED',
    badge: 'DUPLICATE',
    badgeColor: 'bg-amber-500/20 text-amber-400',
  },
  2: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-950/60 border-red-500/30',
    label: 'NOT FOUND',
    badge: 'INVALID',
    badgeColor: 'bg-red-500/20 text-red-400',
  },
  3: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-950/60 border-red-500/30',
    label: 'TICKET CANCELLED',
    badge: 'CANCELLED',
    badgeColor: 'bg-red-500/20 text-red-400',
  },
};

export default function ScannerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uuid, setUuid] = useState('');
  const [status, setStatus] = useState(IDLE);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = uuid.trim();
    if (!trimmed) return;
    setStatus(LOADING);
    try {
      const res = await validateTicket(trimmed);
      const data = { ok: true, ...res.data };
      setResult(data);
      setHistory(prev => [{
        uuid_short: trimmed.slice(0, 12) + '...',
        result_code: data.result_code,
        time: new Date(),
      }, ...prev].slice(0, 10));
    } catch (err) {
      const data = { ok: false, ...err.response?.data };
      setResult(data);
      setHistory(prev => [{
        uuid_short: trimmed.slice(0, 12) + '...',
        result_code: data.result_code ?? 2,
        time: new Date(),
      }, ...prev].slice(0, 10));
    } finally {
      setStatus(DONE);
      setUuid('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const code = result?.result_code;
  const meta = code != null ? (RESULT_META[code] ?? RESULT_META[2]) : null;
  const ticket = result?.ticket;

  const timeAgo = (date) => {
    const s = Math.floor((new Date() - date) / 1000);
    if (s < 60) return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white flex flex-col">
      <div className="border-b border-white/8 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/staff')}
          className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-white/50 hover:text-white"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-sm font-bold tracking-[0.15em] uppercase text-white">
            Staff Check-in Portal
          </h1>
          <p className="text-xs text-white/35 tracking-widest uppercase">
            {user?.full_name} &bull; {user?.role_name}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:flex-row gap-0 overflow-hidden">
        <div className="flex flex-col gap-5 p-6 md:w-[380px] md:border-r border-white/8">
          <div>
            <p className="text-xs tracking-[0.15em] uppercase text-white/40 mb-3">
              Manual Ticket Entry
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={uuid}
                  onChange={(e) => setUuid(e.target.value)}
                  placeholder="Paste or type ticket UUID..."
                  autoFocus
                  disabled={status === LOADING}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm
                    placeholder-white/25 outline-none focus:border-violet-500/60 transition-all
                    disabled:opacity-50 pr-10"
                />
                <Ticket size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20" />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={status === LOADING || !uuid.trim()}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40
                  transition-all rounded-xl py-3.5 text-sm font-semibold tracking-wide
                  flex items-center justify-center gap-2"
              >
                {status === LOADING
                  ? <><Loader2 size={16} className="animate-spin" /> Validating...</>
                  : <><ScanLine size={16} /> Validate Ticket</>
                }
              </motion.button>
            </form>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-[0.15em] uppercase text-white/40">
                Recent Validations
              </p>
              {history.length > 0 && (
                <span className="text-xs text-white/30">
                  Total: {history.length}
                </span>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-white/20 italic">No scans yet this session</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((h, i) => {
                  const hMeta = RESULT_META[h.result_code] ?? RESULT_META[2];
                  const HIcon = hMeta.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-white/4 rounded-xl px-3 py-2.5"
                    >
                      <HIcon size={14} className={hMeta.color} />
                      <span className="text-xs text-white/60 font-mono flex-1">{h.uuid_short}</span>
                      <span className="text-xs text-white/25">{timeAgo(h.time)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 bg-white/4 rounded-xl px-4 py-3 border border-white/8">
            <Circle size={8} className="text-emerald-400 fill-emerald-400 shrink-0" />
            <span className="text-xs tracking-[0.12em] uppercase text-white/50">Scanner Ready</span>
            <div className="flex-1 h-0.5 bg-white/8 rounded-full ml-1">
              <div className="h-full w-2/3 bg-emerald-500/40 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-4 justify-start">
          <p className="text-xs tracking-[0.15em] uppercase text-white/40">Scan Result</p>
          <AnimatePresence mode="wait">
            {status === DONE && result && meta ? (
              <motion.div
                key={code}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className={`rounded-2xl border p-6 flex flex-col gap-4 ${meta.bg}`}
              >
                <div className={`flex items-center gap-3 ${meta.color}`}>
                  <meta.icon size={32} />
                  <div>
                    <p className="text-xl font-bold tracking-wide">{meta.label}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${meta.badgeColor}`}>
                      {meta.badge}
                    </span>
                  </div>
                </div>

                {ticket && (
                  <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
                    {ticket.attendee_name && (
                      <Row icon={Ticket} label="Attendee" value={ticket.attendee_name} />
                    )}
                    {ticket.event_title && (
                      <Row icon={Tag} label="Event" value={ticket.event_title} />
                    )}
                    {ticket.venue_name && (
                      <Row icon={MapPin} label="Venue" value={ticket.venue_name} />
                    )}
                    {ticket.show_date && (
                      <Row icon={CalendarDays} label="Date" value={ticket.show_date} />
                    )}
                    {ticket.show_time && (
                      <Row icon={Clock} label="Time" value={ticket.show_time} />
                    )}
                    {ticket.tier_name && (
                      <Row icon={Tag} label="Tier" value={ticket.tier_name} />
                    )}
                    {ticket.seat_label && (
                      <Row icon={Armchair} label="Seat" value={ticket.seat_label} />
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-white/8 border-dashed p-10 flex flex-col
                  items-center justify-center gap-3 text-center"
              >
                <ScanLine size={32} className="text-white/15" />
                <p className="text-sm text-white/25">Scan result will appear here</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon size={14} className="text-white/30 shrink-0" />
      <span className="text-white/40 w-20 shrink-0 text-xs uppercase tracking-wide">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}