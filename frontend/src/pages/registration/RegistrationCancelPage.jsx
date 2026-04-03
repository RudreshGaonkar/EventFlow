import { useSearchParams, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function RegistrationCancelPage() {
  const [qp] = useSearchParams();
  const id   = qp.get('registration_id');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-5">

        <div className="bg-error/10 border border-error/20 rounded-2xl p-8">
          <XCircle size={48} className="text-error mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-on-surface mb-2">Payment Cancelled</h1>
          <p className="text-sm text-on-surface-variant">
            Registration #{id} was not completed.<br />
            Your slot has been released.
          </p>
        </div>

        <div className="flex gap-3">
          <Link to={`/events`}
            className="flex-1 py-3 rounded-xl border border-outline-variant text-sm font-semibold
              text-on-surface text-center hover:bg-surface-container transition-all">
            Browse Events
          </Link>
          <Link to="/"
            className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold
              text-center hover:bg-primary-container transition-all">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}