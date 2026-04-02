import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function ConfirmPage() {
  const [params] = useSearchParams();
  const booking_id = params.get('booking_id');

  const [booking, setBooking] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!booking_id) return;
    Promise.all([
      api.get(`/booking/${booking_id}`),
      api.get(`/payment/tickets/${booking_id}`),
    ])
      .then(([bRes, tRes]) => {
        setBooking(bRes.data.data);
        setTickets(tRes.data.data);
      })
      .catch(() => setError('Could not load booking details'))
      .finally(() => setLoading(false));
  }, [booking_id]);

  if (loading) return <p className="p-8 text-center">Loading confirmation…</p>;
  if (error)   return <p className="p-8 text-center text-red-600">{error}</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Success banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center">
        <div className="text-4xl mb-2">🎉</div>
        <h1 className="text-2xl font-bold text-green-800">Booking Confirmed!</h1>
        <p className="text-green-600 mt-1">Your tickets are ready below.</p>
      </div>

      {/* Event summary */}
      {booking && (
        <div className="bg-white border rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="text-lg font-bold">{booking.event_title}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {booking.venue_name} • {new Date(booking.show_date).toDateString()} {booking.show_time}
          </p>
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <span className="text-sm text-gray-500">Total Paid</span>
            <span className="font-bold text-lg">₹{Number(booking.total_amount).toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* Tickets */}
      <h2 className="font-semibold mb-3">Your Tickets</h2>
      <div className="space-y-3">
        {tickets.map(ticket => (
          <div key={ticket.ticket_id} className="border rounded-xl p-4 bg-white shadow-sm flex justify-between items-center">
            <div>
              <p className="font-mono font-bold text-indigo-700">{ticket.seat_label}</p>
              <p className="text-sm text-gray-500">{ticket.tier_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-mono">{ticket.ticket_uuid}</p>
              <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {ticket.entry_status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link to="/my-bookings" className="text-indigo-600 hover:underline text-sm">
          ← View all my bookings
        </Link>
      </div>
    </div>
  );
}