import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Ticket, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { cancelBooking } from '../../services/booking';

const STATUS_BADGE = {
  Confirmed:  'bg-success/10 text-success border border-success/20',
  Pending:    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  Cancelled:  'bg-error/10 text-error border border-error/20',
  Refunded:   'bg-surface-container-highest text-on-surface-variant border border-outline-variant',
};

export default function MyBookingsPage() {
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    api.get('/booking/my')
      .then(r => setBookings(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(id);
    try {
      await cancelBooking(id);
      // Flip status locally — no page reload or loading skeleton
      setBookings(prev =>
        prev.map(b => b.booking_id === id ? { ...b, booking_status: 'Cancelled' } : b)
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-surface-container animate-pulse border border-outline-variant" />
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold text-on-surface mb-6 flex items-center gap-2">
        <Ticket className="text-primary" size={24} /> My Bookings
      </h1>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center bg-surface-container border border-outline-variant rounded-2xl">
          <span className="text-5xl mb-4">🎟️</span>
          <p className="text-on-surface font-semibold text-lg">No bookings yet.</p>
          <p className="text-sm text-on-surface-variant mt-1">
            Book seats to get your tickets here
          </p>
          <Link to="/" className="mt-6 px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Browse Events →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const dateObj = new Date(b.show_date);
            const month = dateObj.toLocaleString('en-US', { month: 'short' });
            const day = dateObj.getDate();
            const canCancel = ['Confirmed', 'Pending'].includes(b.booking_status);

            return (
              <div
                key={b.booking_id}
                className="group flex flex-col sm:flex-row bg-surface-container border border-outline-variant rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
              >
                {/* Date Block */}
                <div className="sm:w-24 bg-surface-container-highest flex flex-row sm:flex-col items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-outline-variant group-hover:bg-primary/10 transition-colors">
                  <span className="text-sm font-bold text-primary uppercase tracking-wider mr-2 sm:mr-0">{month}</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-on-surface">{day}</span>
                </div>

                {/* Details Block */}
                <div className="flex-1 p-5 flex flex-col justify-center">
                  <h2 className="text-xl font-bold text-on-surface mb-2">{b.event_title}</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mb-4">
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin size={14} className="text-primary" />
                      {b.venue_name}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Ticket size={14} className="text-primary" />
                      {b.seat_count} seat{b.seat_count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-auto">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${STATUS_BADGE[b.booking_status] || STATUS_BADGE.Pending}`}>
                      {b.booking_status}
                    </span>
                    <span className="text-sm font-bold text-on-surface flex items-center gap-1">
                      <CreditCard size={14} className="text-primary" />
                      ₹{Number(b.total_amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Cancel Action */}
                <div className="hidden sm:flex items-center justify-center p-5">
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(b.booking_id)}
                      disabled={cancelling === b.booking_id}
                      className="text-xs font-bold px-4 py-2 rounded-xl border border-error/30 text-error hover:bg-error/10 hover:border-error/50 transition-all disabled:opacity-40"
                    >
                      {cancelling === b.booking_id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>

                {/* Mobile Cancel */}
                {canCancel && (
                  <div className="sm:hidden px-5 pb-4">
                    <button
                      onClick={() => handleCancel(b.booking_id)}
                      disabled={cancelling === b.booking_id}
                      className="w-full text-xs font-bold px-4 py-2 rounded-xl border border-error/30 text-error hover:bg-error/10 hover:border-error/50 transition-all disabled:opacity-40"
                    >
                      {cancelling === b.booking_id ? 'Cancelling…' : 'Cancel Booking'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}