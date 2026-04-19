import { useEffect, useState, useRef, useCallback } from 'react';
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

  const [layoutData,     setLayoutData]     = useState(null);
  const [selected,       setSelected]       = useState([]);
  const [zoneSelections, setZoneSelections] = useState({});
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

  const pollRef    = useRef(null); // holds the setInterval id
  const timeoutRef = useRef(null); // holds the 5-min hard timeout
  const isMounted  = useRef(true); // tracks if component is still mounted
  const hasOpenedRazorpay = useRef(false); // mathematically guarantees opening only once

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (pollRef.current)    clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ── Load seats ──────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/seats/session/${session_id}`)
      .then(r => {
        const data = r.data.data;
        setLayoutData(data);
        if (data.layout_type === 'ZONED') {
          const initZones = {};
          data.zones.forEach(z => { initZones[z.tier_id] = 0; });
          setZoneSelections(initZones);
        }
      })
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
          setJobState('redirecting');

          if (!hasOpenedRazorpay.current) {
            hasOpenedRazorpay.current = true;

            const options = {
            key: job.data.razorpay_key,
            amount: job.data.total_amount * 100, // paise
            currency: 'INR',
            name: 'EventFlow',
            description: job.data.description,
            order_id: job.data.razorpay_order_id,
            handler: async function (response) {
              // Clear the hard timeout — user completed payment
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              try {
                await api.post('/payment/verify', {
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  booking_id:          job.data.booking_id,
                  amount:              job.data.total_amount
                });
                // Navigate only if still mounted — React Router handles unmount
                if (isMounted.current) {
                  navigate(`/booking/confirm?booking_id=${job.data.booking_id}`);
                }
              } catch (err) {
                if (isMounted.current) {
                  setError('Payment verification failed. Please contact support.');
                  setJobState('idle'); // ← unlock the UI
                }
              }
            },
            theme: { color: "#6750A4" },
            modal: {
              ondismiss: function() {
                // Always fires when modal closes — must unconditionally reset state
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                if (isMounted.current) {
                  setError('Payment cancelled. Your seats will be released shortly.');
                  setJobState('idle'); // ← unlock the UI regardless of reason
                }
              }
            }
          };

            const rzp = new window.Razorpay(options);
            rzp.open();

            // Hard timeout failsafe: if neither handler nor ondismiss fires in 5 min,
            // force-reset the state so the UI is never permanently frozen.
            timeoutRef.current = setTimeout(() => {
              if (isMounted.current && jobState === 'redirecting') {
                setError('Payment timed out. Please check My Bookings or try again.');
                setJobState('idle');
              }
            }, 300000); // 5 minutes
          }
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
    let seatIdsToBook = [];

    if (layoutData?.layout_type === 'ZONED') {
      // Loop over selected quantities and slice from the pre-aggregated available_seat_ids
      for (const [tierId, qty] of Object.entries(zoneSelections)) {
        if (qty > 0) {
          const zone = layoutData.zones.find(z => z.tier_id === Number(tierId));
          if (zone) {
            seatIdsToBook = seatIdsToBook.concat(zone.available_seat_ids.slice(0, qty));
          }
        }
      }
      if (!seatIdsToBook.length) return;
    } else {
      seatIdsToBook = selected;
      if (!selected.length) return;
    }

    setError('');
    setJobState('queued');

    try {
      const { data } = await api.post('/booking', {
        session_id: Number(session_id),
        seat_ids:   seatIdsToBook,
      });

      // Backend returns 202 + job_id — start polling
      startPolling(data.data.job_id);

    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
      setJobState('idle');
    }
  };

  let byTier = {};
  if (layoutData?.layout_type === 'GRID') {
    byTier = layoutData.seats.reduce((acc, s) => {
      (acc[s.tier_name] = acc[s.tier_name] || []).push(s);
      return acc;
    }, {});
  }

  const isbusy = jobState !== 'idle' || !isOpen;

  // Helpers for ZONED layout
  const totalZoneTickets = Object.values(zoneSelections).reduce((a, b) => a + b, 0);
  const totalZonePrice = layoutData?.layout_type === 'ZONED'
    ? layoutData.zones.reduce((sum, z) => sum + (z.price * (zoneSelections[z.tier_id] || 0)), 0)
    : 0;

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

      {layoutData?.layout_type === 'ZONED' ? (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-outline-variant">
              <h2 className="text-xl font-bold text-on-surface">General Admission</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Select your ticket quantities (Max 10 total)
              </p>
            </div>
            
            <div className="flex flex-col divide-y divide-outline-variant">
              {layoutData.zones.map(zone => {
                const qty = zoneSelections[zone.tier_id] || 0;
                return (
                  <div key={zone.tier_id} className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">{zone.tier}</h3>
                      <p className="text-sm text-on-surface-variant mt-1">₹{zone.price.toLocaleString('en-IN')}</p>
                      <p className={`text-xs mt-1 ${zone.available_count === 0 ? 'text-error font-medium' : 'text-on-surface-variant'}`}>
                        {zone.available_count > 0 ? `${zone.available_count} left` : 'Sold out'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setZoneSelections(prev => ({ ...prev, [zone.tier_id]: Math.max(0, qty - 1) }))}
                        className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-lg text-on-surface hover:bg-surface-container-highest transition disabled:opacity-50"
                        disabled={isbusy || qty <= 0}
                      >
                        -
                      </button>
                      <span className="text-xl font-bold text-on-surface w-6 text-center">{qty}</span>
                      <button 
                        onClick={() => setZoneSelections(prev => ({ ...prev, [zone.tier_id]: qty + 1 }))}
                        className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-lg text-on-surface hover:bg-surface-container-highest transition disabled:opacity-50"
                        disabled={isbusy || totalZoneTickets >= 10 || qty >= zone.available_count}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {totalZoneTickets > 0 && (
            <div className="sticky bottom-4 w-full max-w-lg mt-6 bg-surface-container border border-outline-variant rounded-xl shadow-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-on-surface">
                  {totalZoneTickets} ticket{totalZoneTickets > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-on-surface-variant">
                  Total: ₹{totalZonePrice.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={handleBook}
                disabled={isbusy}
                className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
              >
                {isbusy && (
                  <span className="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
                )}
                {BOOK_LABEL[jobState]}
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
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
                  ₹{(layoutData?.seats || [])
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
        </>
      )}
    </div>
  );
}
