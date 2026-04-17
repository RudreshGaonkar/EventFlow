import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';


const STATUS_COLOR = {
  Available: 'bg-tertiary-container border-tertiary text-on-tertiary-container hover:opacity-90 cursor-pointer',
  Locked:    'bg-surface-container-high border-outline text-on-surface-variant cursor-not-allowed opacity-50',
  Booked:    'bg-error-container border-error text-on-error-container cursor-not-allowed opacity-50',
};

// ── Booking button label based on current state ───────────────────────────────
const BOOK_LABEL = {
  idle:       'Proceed to Pay →',
  queued:     'Queuing booking…',
  processing: 'Confirming seats…',
  redirecting:'Redirecting to payment…',
};


export default function SeatsPage() {
  const { session_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [seats,    setSeats]    = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [jobState, setJobState] = useState('idle'); // idle | queued | processing | redirecting
  const [error,    setError]    = useState('');

  const event = location.state?.event;
  const session = location.state?.session;
  
  let isOpen = true;
  let daysDiff = 0;
  let listingDaysAhead = session?.listing_days_ahead || event?.listing_days_ahead || 5;

  if (session?.show_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const showDate = new Date(session.show_date);
    showDate.setHours(0, 0, 0, 0);
    daysDiff = Math.round((showDate - today) / (1000 * 60 * 60 * 24));
    isOpen = daysDiff <= listingDaysAhead;
  }

  const pollRef = useRef(null); // holds the setInterval id

  // ── Cleanup polling on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Load seats ──────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/seats/session/${session_id}`)
      .then(r => setSeats(r.data.data.seats))
      .catch(() => setError('Could not load seats'))
      .finally(() => setLoading(false));
  }, [session_id]);

  const toggle = (seat) => {
    if (seat.status !== 'Available' || !isOpen) return;
    setSelected(prev =>
      prev.includes(seat.session_seat_id)
        ? prev.filter(id => id !== seat.session_seat_id)
        : [...prev, seat.session_seat_id]
    );
  };

  // ── Poll job status every 2s until done or failed ───────────────────────────
  const startPolling = (job_id) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/booking/status/${job_id}`);
        const job = data.data;

        if (job.status === 'processing') {
          setJobState('processing');
        }

        if (job.status === 'done') {
          clearInterval(pollRef.current);
          setJobState('idle'); // clear UI block

          const options = {
            key: job.data.razorpay_key,
            amount: job.data.total_amount * 100, // paise
            currency: 'INR',
            name: 'EventFlow',
            description: job.data.description,
            order_id: job.data.razorpay_order_id,
            handler: async function (response) {
              try {
                // Verify signature on backend
                await api.post('/payment/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  booking_id: job.data.booking_id,
                  amount: job.data.total_amount
                });
                navigate(`/booking/confirm?booking_id=${job.data.booking_id}`);
              } catch (err) {
                setError('Payment verification failed');
              }
            },
            theme: { color: "#6750A4" },
            modal: {
              ondismiss: function() {
                setError('Payment cancelled. Your seats will be released shortly.');
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }

        if (job.status === 'failed') {
          clearInterval(pollRef.current);
          setError(job.message || 'Booking failed — please try again');
          setJobState('idle');
        }

      } catch {
        // network blip — keep polling silently
      }
    }, 2000);
  };

  // ── Submit booking → queue → poll ───────────────────────────────────────────
  const handleBook = async () => {
    if (!selected.length) return;
    setError('');
    setJobState('queued');

    try {
      const { data } = await api.post('/booking', {
        session_id: Number(session_id),
        seat_ids:   selected,
      });

      // Backend returns 202 + job_id — start polling
      startPolling(data.data.job_id);

    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
      setJobState('idle');
    }
  };

  const byTier = seats.reduce((acc, s) => {
    (acc[s.tier_name] = acc[s.tier_name] || []).push(s);
    return acc;
  }, {});

  const isbusy = jobState !== 'idle' || !isOpen;

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-on-surface">Select Seats</h1>

      {!isOpen && (
        <div className="mb-6 p-4 bg-surface-container-highest border border-outline-variant rounded-xl text-center">
          <p className="text-on-surface font-semibold text-lg">Booking Not Open Yet</p>
          <p className="text-on-surface-variant text-sm mt-1">
            Outside {listingDaysAhead}-day booking window.
          </p>
        </div>
      )}

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
                disabled={isbusy}
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
            disabled={isbusy}
            className="bg-primary text-on-primary px-5 py-2 rounded-lg font-medium
              hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
          >
            {isbusy && (
              <span className="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
            )}
            {BOOK_LABEL[jobState]}
          </button>
        </div>
      )}
    </div>
  );
}
