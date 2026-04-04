import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Ticket, MapPin, Calendar } from 'lucide-react';
import api from '../../services/api';

const MAX_RETRIES = 6;
const RETRY_DELAY = 2000; // 2s between retries — webhook usually fires in 2-4s

export default function ConfirmPage() {
  const [params] = useSearchParams();
  const booking_id = params.get('booking_id');

  const [booking, setBooking] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!booking_id) return;

    let attempt = 0;

    const tryLoad = async () => {
      try {
        const [bRes, tRes] = await Promise.all([
          api.get(`/booking/${booking_id}`),
          api.get(`/tickets/booking/${booking_id}`),
        ]);

        const bData = bRes.data.data;
        const tData = tRes.data.data || [];

        // If booking is still Pending and webhook hasn't fired yet, retry
        if (bData.booking_status === 'Pending' && attempt < MAX_RETRIES) {
          attempt++;
          setRetrying(true);
          setTimeout(tryLoad, RETRY_DELAY);
          return;
        }

        setBooking(bData);
        setTickets(tData);
        setRetrying(false);
      } catch {
        if (attempt < MAX_RETRIES) {
          attempt++;
          setTimeout(tryLoad, RETRY_DELAY);
          return;
        }
        setError('Could not load booking details. Please check My Bookings.');
      } finally {
        if (attempt === 0 || attempt >= MAX_RETRIES) setLoading(false);
      }
    };

    tryLoad();
  }, [booking_id]);

  if (loading || retrying) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-on-surface-variant text-sm">
        {retrying ? 'Confirming payment…' : 'Loading…'}
      </p>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto p-8 text-center">
      <p className="text-error mb-4">{error}</p>
      <Link to="/my-bookings" className="text-primary underline text-sm">View My Bookings</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Success banner */}
      <div className="bg-success/10 border border-success/30 rounded-2xl p-6 mb-6 text-center">
        <CheckCircle className="mx-auto mb-2 text-success" size={40} />
        <h1 className="text-2xl font-bold text-on-surface">Booking Confirmed!</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Your tickets are ready below.</p>
      </div>

      {/* Event summary */}
      {booking && (
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 mb-6">
          <h2 className="text-lg font-bold text-on-surface">{booking.event_title}</h2>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-primary" />
              {booking.venue_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              {new Date(booking.show_date).toDateString()} {booking.show_time}
            </span>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-outline-variant">
            <span className="text-sm text-on-surface-variant">Total Paid</span>
            <span className="font-bold text-lg text-on-surface">
              ₹{Number(booking.total_amount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Tickets */}
      {tickets.length > 0 && (
        <>
          <h2 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
            <Ticket size={18} className="text-primary" /> Your Tickets
          </h2>
          <div className="space-y-3">
            {tickets.map(ticket => (
              <div key={ticket.ticket_id}
                className="border border-outline-variant rounded-xl p-4 bg-surface-container
                  flex justify-between items-center">
                <div>
                  <p className="font-mono font-bold text-primary">{ticket.seat_label}</p>
                  <p className="text-sm text-on-surface-variant">{ticket.tier_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant font-mono truncate max-w-[140px]">
                    {ticket.ticket_uuid}
                  </p>
                  <span className="inline-block mt-1 text-xs bg-success/20 text-success
                    px-2 py-0.5 rounded-full border border-success/30">
                    {ticket.entry_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/my-tickets"
          className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm
            font-bold text-center hover:opacity-90 transition-all">
          View All My Tickets →
        </Link>
        <Link to="/my-bookings"
          className="px-5 py-2.5 border border-outline-variant text-on-surface rounded-xl
            text-sm font-bold text-center hover:bg-surface-container-high transition-all">
          My Bookings
        </Link>
      </div>
    </div>
  );
}