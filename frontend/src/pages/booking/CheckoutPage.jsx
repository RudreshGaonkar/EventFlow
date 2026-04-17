import { useSearchParams, Link } from 'react-router-dom';

export default function CheckoutPage() {
  const [params] = useSearchParams();
  const booking_id = params.get('booking_id');

  return (
    <div className="max-w-md mx-auto p-6 text-center mt-16">
      <div className="text-5xl mb-4">😔</div>
      <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
      <p className="text-gray-500 mb-6">
        Your booking #{booking_id} was not completed.<br />
        Your seats will be released shortly.
      </p>
      <Link to="/" className="bg-indigo-600 text-on-surface px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
        Back to Home
      </Link>
    </div>
  );
}