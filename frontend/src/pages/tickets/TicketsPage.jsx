import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, QrCode, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../services/api';

const STATUS_STYLE = {
  Valid:        'bg-success/20 text-success border-success/30',
  'Checked-In': 'bg-primary/20 text-primary border-primary/30',
  Cancelled:    'bg-error/20 text-error border-error/30',
};

const STATUS_ICON = {
  Valid:        <CheckCircle size={12} />,
  'Checked-In': <QrCode size={12} />,
  Cancelled:    <XCircle size={12} />,
};

export default function TicketsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get('/booking/my')
      .then(async (res) => {
        const confirmed = (res.data.data || []).filter(
          b => b.booking_status === 'Confirmed'
        );

        // Fetch tickets for each confirmed booking in parallel
        const withTickets = await Promise.all(
          confirmed.map(async (b) => {
            try {
              const tRes = await api.get(`/payment/tickets/${b.booking_id}`);
              return { ...b, tickets: tRes.data.data || [] };
            } catch {
              return { ...b, tickets: [] };
            }
          })
        );

        setBookings(withTickets.filter(b => b.tickets.length > 0));
      })
      .catch(() => setError('Could not load tickets'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold text-on-surface mb-6 flex items-center gap-2">
        <Ticket className="text-primary" size={24} /> My Tickets
      </h1>

      {error && <p className="text-error text-sm mb-4">{error}</p>}

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <span className="text-5xl mb-4">🎟️</span>
          <p className="text-on-surface font-semibold">No tickets yet</p>
          <p className="text-sm text-on-surface-variant mt-1">
            Book seats to get your tickets here
          </p>
          <Link to="/"
            className="mt-4 px-5 py-2.5 bg-primary text-on-primary rounded-xl
              text-sm font-bold hover:opacity-90 transition-all">
            Browse Events →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map(booking => (
            <div key={booking.booking_id}
              className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden">

              {/* Booking header */}
              <div className="px-5 pt-4 pb-3 border-b border-outline-variant/40">
                <h3 className="font-bold text-on-surface">{booking.event_title}</h3>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-primary" />
                    {booking.venue_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} className="text-primary" />
                    {new Date(booking.show_date).toDateString()} · {booking.show_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} className="text-primary" />
                    Booking #{booking.booking_id}
                  </span>
                </div>
              </div>

              {/* Tickets grid */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {booking.tickets.map(ticket => (
                  <div key={ticket.ticket_id}
                    className="bg-surface border border-outline-variant/60 rounded-xl p-3.5
                      flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-primary text-base leading-none mb-1">
                        {ticket.seat_label}
                      </p>
                      <p className="text-xs text-on-surface-variant">{ticket.tier_name}</p>
                      <p className="text-xs font-mono text-on-surface-variant/60 mt-1 truncate">
                        {ticket.ticket_uuid?.slice(0, 8)}…
                      </p>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1 text-xs font-bold
                      px-2.5 py-1 rounded-full border
                      ${STATUS_STYLE[ticket.entry_status] || STATUS_STYLE['Valid']}`}>
                      {STATUS_ICON[ticket.entry_status]}
                      {ticket.entry_status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 pb-4 flex items-center justify-between">
                <p className="text-xs text-on-surface-variant">
                  {booking.tickets.length} ticket{booking.tickets.length > 1 ? 's' : ''} ·{' '}
                  <span className="font-semibold text-on-surface">
                    ₹{Number(booking.total_amount).toLocaleString('en-IN')} paid
                  </span>
                </p>
                <Link to={`/booking/confirm?booking_id=${booking.booking_id}`}
                  className="text-xs text-primary hover:underline">
                  View details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}