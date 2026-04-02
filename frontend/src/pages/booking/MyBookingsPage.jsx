import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const STATUS_BADGE = {
  Confirmed:  'bg-green-100 text-green-700',
  Pending:    'bg-yellow-100 text-yellow-700',
  Cancelled:  'bg-red-100 text-red-700',
  Refunded:   'bg-gray-100 text-gray-600',
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/booking/my')
      .then(r => setBookings(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8 text-center">Loading bookings…</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <p className="text-4xl mb-3">🎟️</p>
          <p>No bookings yet.</p>
          <Link to="/" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">
            Browse Events →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <Link
              key={b.booking_id}
              to={`/booking/${b.booking_id}`}
              className="block bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{b.event_title}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {b.venue_name} • {new Date(b.show_date).toDateString()}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {b.seat_count} seat{b.seat_count > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[b.booking_status]}`}>
                    {b.booking_status}
                  </span>
                  <p className="text-sm font-semibold mt-2">
                    ₹{Number(b.total_amount).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}