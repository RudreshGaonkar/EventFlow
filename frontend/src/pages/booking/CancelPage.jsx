import { useSearchParams, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function CancelPage() {
  const [params] = useSearchParams();
  const booking_id = params.get('booking_id');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-error" />
        </div>
        <h1 className="text-2xl font-extrabold text-on-surface mb-2">Payment Cancelled</h1>
        <p className="text-on-surface-variant text-sm mb-2">
          Your booking was not completed. No charge was made.
        </p>
        {booking_id && (
          <p className="text-xs text-on-surface-variant font-mono bg-surface-container-highest border border-outline-variant rounded-xl px-4 py-2 inline-block mb-6">
            Booking #{booking_id} — held seats will be released shortly.
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link to="/" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold text-center hover:opacity-90 transition-all">
            Browse Events
          </Link>
          <Link to="/my-bookings" className="px-5 py-2.5 border border-outline-variant text-on-surface rounded-xl text-sm font-bold text-center hover:bg-surface-container transition-all">
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}