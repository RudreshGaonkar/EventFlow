import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, QrCode, CheckCircle, XCircle, Download } from 'lucide-react';
import api from '../../services/api';

const STATUS_STYLE = {
  Valid:        'bg-success/20 text-success border-success/30',
  'Checked-In': 'bg-primary/20 text-primary border-primary/30',
  Cancelled:    'bg-error/20 text-error border-error/30',
};

const STATUS_ICON = {
  Valid:        <CheckCircle size={14} />,
  'Checked-In': <QrCode size={14} />,
  Cancelled:    <XCircle size={14} />,
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-on-surface-variant font-medium animate-pulse">Loading tickets...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-on-surface mb-6 flex items-center gap-2">
        <Ticket className="text-primary" size={24} /> My Tickets
      </h1>

      {error && <p className="text-error text-sm font-medium mb-4 bg-error/10 p-3 rounded-lg border border-error/20">{error}</p>}

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center bg-surface-container border border-outline-variant rounded-2xl">
          <span className="text-5xl mb-4">🎟️</span>
          <p className="text-on-surface font-semibold text-lg">No tickets yet</p>
          <p className="text-sm text-on-surface-variant mt-1">
            Book seats to get your tickets here
          </p>
          <Link to="/"
            className="mt-6 px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Browse Events →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {bookings.map(booking => (
            <div key={booking.booking_id} className="space-y-4">
              
              {/* Booking Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-3">
                <div>
                  <h3 className="font-extrabold text-on-surface text-xl">{booking.event_title}</h3>
                  <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-1">
                    <Calendar size={14} className="text-primary" />
                    {new Date(booking.show_date).toDateString()} at {booking.show_time}
                  </p>
                </div>
                <Link to={`/booking/confirm?booking_id=${booking.booking_id}`}
                  className="text-sm font-bold text-primary hover:underline flex items-center gap-1 w-fit bg-primary/10 px-3 py-1.5 rounded-lg transition-colors hover:bg-primary/20">
                  View Booking
                </Link>
              </div>

              {/* Tickets Grid */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {booking.tickets.map(ticket => (
                  <div key={ticket.ticket_id}
                    className="w-full relative flex flex-col bg-surface-container rounded-2xl overflow-hidden shadow-lg border border-outline-variant hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                    
                    {/* Top Section (Gradient + Event info) */}
                    <div className="bg-gradient-to-br from-primary to-secondary p-5 text-on-primary relative">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-extrabold text-lg leading-tight truncate pr-4">{booking.event_title}</h4>
                          <div className="flex items-center gap-2 shrink-0">
                            {ticket.ticket_pdf_url && (
                              <a
                                href={ticket.ticket_pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download Ticket PDF"
                                onClick={e => e.stopPropagation()}
                                className="opacity-70 hover:opacity-100 transition-opacity"
                              >
                                <Download size={16} className="text-on-primary" />
                              </a>
                            )}
                            <Ticket size={24} className="opacity-80" />
                          </div>
                        </div>
                        <div className="space-y-2 text-xs font-medium text-on-primary/95">
                          <p className="flex items-center gap-2 drop-shadow-md">
                            <MapPin size={12} /> <span className="truncate">{booking.venue_name}</span>
                          </p>
                          <p className="flex items-center gap-2 drop-shadow-md">
                            <Calendar size={12} /> {new Date(booking.show_date).toDateString()} • {booking.show_time}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dashed line separator with notches */}
                    <div className="relative flex items-center justify-center bg-surface-container h-4">
                      <div className="absolute left-[-12px] w-6 h-6 bg-background rounded-full border border-outline-variant"></div>
                      <div className="w-full border-t-[2px] border-dashed border-outline-variant/60 my-0 mx-6 z-10"></div>
                      <div className="absolute right-[-12px] w-6 h-6 bg-background rounded-full border border-outline-variant"></div>
                    </div>

                    {/* Middle Section (Seat Details) */}
                    <div className="px-6 py-5">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Seat</p>
                          <p className="font-mono text-4xl font-extrabold text-primary leading-none">
                            {ticket.seat_label}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Tier</p>
                          <p className="font-extrabold text-on-surface text-lg leading-none">
                            {ticket.tier_name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section (Status & IDs) */}
                    <div className="px-6 pb-5 pt-0 mt-auto bg-surface-container relative overflow-hidden">
                      {ticket.entry_status !== 'Valid' && (
                        <div className={`absolute -right-4 -bottom-4 z-0 opacity-10 pointer-events-none transform -rotate-12 ${
                          ticket.entry_status === 'Checked-In' ? 'text-primary' : 'text-error'
                        }`}>
                          <div className="border-[6px] border-current px-4 py-2 rounded-xl text-5xl font-black uppercase tracking-tighter">
                            {ticket.entry_status}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between border-t border-outline-variant/40 pt-4 relative z-10">
                        <div className="min-w-0 pr-4">
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Ticket ID</p>
                          <p className="text-xs font-mono text-on-surface truncate">
                            {ticket.ticket_uuid}
                          </p>
                        </div>
                        <span className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border bg-surface-container backdrop-blur-md shadow-sm ${STATUS_STYLE[ticket.entry_status] || STATUS_STYLE['Valid']}`}>
                          {STATUS_ICON[ticket.entry_status]}
                          {ticket.entry_status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}