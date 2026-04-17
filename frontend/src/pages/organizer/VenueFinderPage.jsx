import { useState } from 'react';
import {
  Search, MapPin, Users, Building2, X, CheckCircle2,
  CalendarClock, Loader2, AlertCircle, Clock
} from 'lucide-react';
import { getRentableVenues, submitRentalRequest } from '../../services/rental';

// ── Helpers ───────────────────────────────────────────────────────────────────
const toLocal = (dt) =>
  new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ type, message, onClose }) {
  const isSuccess = type === 'success';
  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4
        rounded-2xl shadow-2xl border animate-slide-up max-w-sm
        ${isSuccess
          ? 'bg-surface-container border-primary/30 text-on-surface'
          : 'bg-error-container border-error/30 text-on-error-container'}`}
    >
      {isSuccess
        ? <CheckCircle2 size={18} className="text-primary shrink-0" />
        : <AlertCircle  size={18} className="text-error shrink-0" />
      }
      <p className="text-sm flex-1">{message}</p>
      <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface ml-2">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Request Modal ─────────────────────────────────────────────────────────────
function RequestModal({ venue, startTime, endTime, onClose, onSuccess }) {
  const [eventName, setEventName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    setSubmitting(true);
    try {
      await submitRentalRequest({
        venue_id:   venue.venue_id,
        start_time: startTime,
        end_time:   endTime,
        event_name: eventName.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface-container rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="relative px-6 pt-7 pb-4 border-b border-outline-variant/40">
          <button onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container-highest
              flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={15} />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Building2 size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Requesting</p>
              <h2 className="text-base font-bold text-on-surface leading-tight">{venue.venue_name}</h2>
            </div>
          </div>
        </div>

        {/* Slot Summary */}
        <div className="mx-6 mt-5 p-4 rounded-2xl bg-surface-container-highest border border-outline-variant/30">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2.5">
            Requested Time Slot
          </p>
          <div className="flex items-start gap-2.5 text-sm text-on-surface">
            <Clock size={14} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p><span className="text-on-surface-variant">From:</span> {toLocal(startTime)}</p>
              <p className="mt-1"><span className="text-on-surface-variant">To:</span> {toLocal(endTime)}</p>
              <p className="mt-1 text-xs text-amber-400">
                + 5-hr cleanup buffer after end time
              </p>
            </div>
          </div>
        </div>

        {/* Event Name Input */}
        <div className="px-6 mt-5">
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
            Event Name <span className="text-on-surface-variant font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g. Annual Tech Summit 2025"
            maxLength={200}
            className="w-full px-4 py-3 bg-surface-container-highest text-on-surface rounded-xl
              border border-outline-variant text-sm outline-none
              focus:border-primary/60 placeholder-on-surface-variant transition-all"
          />
          <p className="text-xs text-on-surface-variant mt-1.5">
            This helps the venue owner understand your intended use.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 text-error text-sm
            bg-error-container/20 border border-error/20 px-4 py-3 rounded-xl">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 px-6 py-5 mt-2">
          <button onClick={onClose} disabled={submitting}
            className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant
              text-sm font-semibold hover:bg-surface-container-highest transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold
              hover:bg-primary-container transition-all shadow-lg shadow-primary/20
              disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting
              ? <><Loader2 size={15} className="animate-spin" /> Sending...</>
              : 'Confirm Request'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Venue Card ────────────────────────────────────────────────────────────────
function VenueCard({ venue, onRequest }) {
  return (
    <div className="group bg-surface-container rounded-2xl border border-outline-variant/30
      hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10
      transition-all duration-300 overflow-hidden flex flex-col">

      {/* Colour band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-primary/40" />

      <div className="p-5 flex flex-col flex-1">
        {/* Name + icon */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0
            group-hover:bg-primary/20 transition-colors">
            <Building2 size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-on-surface text-base leading-snug truncate">
              {venue.venue_name}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5 truncate">{venue.address || '—'}</p>
          </div>
        </div>

        {/* Metadata pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
            bg-surface-container-highest text-on-surface-variant border border-outline-variant/50">
            <MapPin size={11} className="text-primary" />
            {venue.city_name}, {venue.state_name}
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
            bg-surface-container-highest text-on-surface-variant border border-outline-variant/50">
            <Users size={11} className="text-secondary" />
            {venue.total_capacity.toLocaleString()} capacity
          </span>
        </div>

        {/* Owner */}
        {venue.owner_name && (
          <p className="text-xs text-on-surface-variant mb-4">
            Owner: <span className="text-on-surface font-medium">{venue.owner_name}</span>
          </p>
        )}

        <div className="mt-auto">
          <button
            onClick={() => onRequest(venue)}
            className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold
              border border-primary/20 hover:bg-primary hover:text-on-primary
              hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5
              transition-all duration-200 active:translate-y-0">
            Request Venue
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VenueFinderPage() {
  const now   = new Date();
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 h default

  const fmt = (d) => {
    // Format for datetime-local input: YYYY-MM-DDTHH:MM
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [startTime, setStartTime] = useState(fmt(now));
  const [endTime,   setEndTime]   = useState(fmt(later));
  const [venues,    setVenues]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);
  const [error,     setError]     = useState('');

  const [modalVenue, setModalVenue] = useState(null);
  const [toast,      setToast]      = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSearch = async () => {
    setError('');
    if (!startTime || !endTime) {
      setError('Please select both start and end date/time.');
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setError('End time must be after start time.');
      return;
    }
    setLoading(true);
    setSearched(false);
    try {
      const res = await getRentableVenues({ start_time: startTime, end_time: endTime });
      setVenues(res.data.data || []);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch venues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSuccess = () => {
    setModalVenue(null);
    showToast('success', `Rental request sent for "${modalVenue?.venue_name}". The owner will review shortly.`);
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-surface-container-low border-b border-outline-variant/30">
        {/* Decorative glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-0 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
              <CalendarClock size={20} className="text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Venue Finder</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface mb-2">
            Find &amp; Rent a Venue
          </h1>
          <p className="text-on-surface-variant text-sm max-w-xl">
            Browse venues available for your event. Select a time window to see which spaces are free,
            then send a request directly to the owner.
          </p>

          {/* ── Search Controls ── */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                Start Date &amp; Time
              </label>
              <input
                id="venue-start-time"
                type="datetime-local"
                value={startTime}
                min={fmt(new Date())}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant
                  rounded-xl text-on-surface text-sm outline-none focus:border-primary/60
                  transition-all [color-scheme:dark]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                End Date &amp; Time
              </label>
              <input
                id="venue-end-time"
                type="datetime-local"
                value={endTime}
                min={startTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant
                  rounded-xl text-on-surface text-sm outline-none focus:border-primary/60
                  transition-all [color-scheme:dark]"
              />
            </div>
            <button
              id="venue-search-btn"
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-on-primary
                text-sm font-bold hover:bg-primary-container shadow-lg shadow-primary/25
                transition-all hover:-translate-y-0.5 active:translate-y-0
                disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Searching…</>
                : <><Search size={15} /> Search Venues</>
              }
            </button>
          </div>

          {/* Validation error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-error text-sm
              bg-error-container/20 border border-error/20 px-4 py-3 rounded-xl max-w-xl">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface-container rounded-2xl border border-outline-variant/30 overflow-hidden">
                <div className="h-1.5 bg-surface-container-highest animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-surface-container-highest rounded-lg w-3/4 animate-pulse" />
                  <div className="h-3 bg-surface-container-highest rounded-lg w-1/2 animate-pulse" />
                  <div className="h-8 bg-surface-container-highest rounded-xl mt-4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results grid */}
        {!loading && searched && venues.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-on-surface">
                  Available Venues
                </h2>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  {venues.length} venue{venues.length !== 1 ? 's' : ''} available for your time slot
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                {venues.length} found
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {venues.map((v) => (
                <VenueCard key={v.venue_id} venue={v} onRequest={setModalVenue} />
              ))}
            </div>
          </>
        )}

        {/* Empty state after search */}
        {!loading && searched && venues.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center mb-5
              border border-outline-variant/30">
              <Building2 size={32} className="text-on-surface-variant opacity-40" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">No Venues Available</h3>
            <p className="text-on-surface-variant text-sm max-w-sm">
              All rentable venues are booked (including their 5-hour cleanup buffer) for the selected
              time window. Try a different date or time range.
            </p>
          </div>
        )}

        {/* Pre-search prompt */}
        {!loading && !searched && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center mb-5
              border border-outline-variant/30">
              <CalendarClock size={32} className="text-on-surface-variant opacity-40" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Pick a Time Window</h3>
            <p className="text-on-surface-variant text-sm max-w-sm">
              Select your event's start and end date/time above, then click "Search Venues" to see
              what's available in your window.
            </p>
          </div>
        )}
      </div>

      {/* ── Request Modal ── */}
      {modalVenue && (
        <RequestModal
          venue={modalVenue}
          startTime={startTime}
          endTime={endTime}
          onClose={() => setModalVenue(null)}
          onSuccess={handleRequestSuccess}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
