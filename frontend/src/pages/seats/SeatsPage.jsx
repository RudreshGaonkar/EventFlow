import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const STATUS_COLOR = {
  Available: 'bg-tertiary-container border-tertiary text-on-tertiary-container hover:opacity-90 cursor-pointer',
  Locked:    'bg-surface-container-high border-outline text-on-surface-variant cursor-not-allowed opacity-50',
  Booked:    'bg-error-container border-error text-on-error-container cursor-not-allowed opacity-50',
};

export default function SeatsPage() {
  const { session_id } = useParams();
  const navigate = useNavigate();

  const [seats,   setSeats]   = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get(`/seats/session/${session_id}`)
      .then(r => setSeats(r.data.data.seats))
      .catch(() => setError('Could not load seats'))
      .finally(() => setLoading(false));
  }, [session_id]);

  const toggle = (seat) => {
    if (seat.status !== 'Available') return;
    setSelected(prev =>
      prev.includes(seat.session_seat_id)
        ? prev.filter(id => id !== seat.session_seat_id)
        : [...prev, seat.session_seat_id]
    );
  };

  const handleBook = async () => {
    if (!selected.length) return;
    setBooking(true); setError('');
    try {
      const { data } = await api.post('/booking', {
        session_id: Number(session_id),
        seat_ids: selected,
      });
      window.location.href = data.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
      setBooking(false);
    }
  };

  const byTier = seats.reduce((acc, s) => {
    (acc[s.tier_name] = acc[s.tier_name] || []).push(s);
    return acc;
  }, {});

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-on-surface">Select Seats</h1>

      {error && <p className="mb-4 text-error text-sm">{error}</p>}

      {Object.entries(byTier).map(([tier, tierSeats]) => (
        <div key={tier} className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
            {tier} — ₹{tierSeats[0].final_price}
          </h2>
          <div className="flex flex-wrap gap-2">
            {tierSeats.map(seat => (
              <button
                key={seat.session_seat_id}
                onClick={() => toggle(seat)}
                className={`
                  w-12 h-12 rounded border-2 text-xs font-medium transition-all
                  ${STATUS_COLOR[seat.status]}
                  ${selected.includes(seat.session_seat_id)
                    ? '!bg-primary-container !border-primary !text-on-primary-container ring-2 ring-primary'
                    : ''}
                `}
              >
                {seat.seat_label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant mb-6">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-tertiary-container border border-tertiary inline-block" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-surface-container-high border border-outline inline-block" />
          Locked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-error-container border border-error inline-block" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-primary-container border-2 border-primary inline-block" />
          Selected
        </span>
      </div>

      {/* Summary bar */}
      {selected.length > 0 && (
        <div className="sticky bottom-4 bg-surface-container border border-outline-variant rounded-xl shadow-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-on-surface">
              {selected.length} seat{selected.length > 1 ? 's' : ''} selected
            </p>
            <p className="text-sm text-on-surface-variant">
              ₹{seats
                  .filter(s => selected.includes(s.session_seat_id))
                  .reduce((sum, s) => sum + Number(s.final_price), 0)
                  .toLocaleString('en-IN')}
            </p>
          </div>
          <button
            onClick={handleBook}
            disabled={booking}
            className="bg-primary text-on-primary px-5 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {booking ? 'Redirecting…' : 'Proceed to Pay →'}
          </button>
        </div>
      )}
    </div>
  );
}