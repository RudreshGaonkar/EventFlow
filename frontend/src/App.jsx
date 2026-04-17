import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuth from './hooks/useAuth'; // './context/AuthContext';
import Navbar from './components/common/Navbar';
import RoleGuard from './components/common/RoleGuard';
import Skeleton from './components/common/LoadingSkeleton';
import { ToastProvider } from './components/common/Toast';
import Footer from './components/common/Footer';
import ProfilePage from './pages/profile/ProfilePage';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Browse & Events
import BrowsePage from './pages/browse/BrowsePage';
import EventPage from './pages/events/EventPage';
import RegistrationPage from './pages/events/RegisterPage';

// Seats
import SeatsPage from './pages/seats/SeatsPage';

// Booking
import CheckoutPage from './pages/booking/CheckoutPage';
import ConfirmPage from './pages/booking/ConfirmPage';
import CancelPage from './pages/booking/CancelPage';
import MyBookingsPage from './pages/booking/MyBookingsPage';

// Tickets
import TicketsPage from './pages/tickets/TicketsPage';

// Registration
import RegistrationConfirmPage from './pages/registration/RegistrationConfirmPage';
import RegistrationCancelPage from './pages/registration/RegistrationCancelPage';
import MyRegistrationsPage from './pages/registration/MyRegistrationsPage';

// Role-specific
import AdminPage from './pages/admin/AdminPage';
import StaffPage from './pages/staff/StaffPage';
import ScannerPage from './pages/staff/ScannerPage';
import OrganizerPage from './pages/organizer/OrganizerPage';
import VenueOwnerPage from './pages/venue-owner/VenueOwnerPage';

// Pages that hide the Navbar
const NO_NAVBAR = ['/login'];

function RoleRedirect() {
  const { user } = useAuth();
  const userRoles = user?.roles || (user?.role_name ? [user.role_name] : []);
  const hasRole = (role) => userRoles.includes(role);

  // Still force Admin and Staff to their portals, but let Organizers and Owners browse!
  if (hasRole('System Admin')) return <Navigate to="/admin" replace />;
  if (hasRole('Venue Staff')) return <Navigate to="/staff" replace />;

  return <BrowsePage />;
}

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
      <div className="space-y-3 w-64">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const location = useLocation();
  const showNavbar = !NO_NAVBAR.includes(location.pathname);

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      {showNavbar && <Navbar />}
      <ToastProvider>
        <Routes>
          {/* ── Public ── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Home — role-based redirect ── */}
          <Route path="/" element={<PrivateRoute><RoleRedirect /></PrivateRoute>} />

          {/* ── Events ── */}
          <Route path="/events/:event_id"
            element={<PrivateRoute><EventPage /></PrivateRoute>} />

          {/* ── Registration ── */}
          {/* FIX 1: was missing — EventPage navigates here for register */}
          <Route path="/events/:event_id/register"
            element={<PrivateRoute><RegistrationPage /></PrivateRoute>} />

          {/* ── Seats ── */}
          <Route path="/session/:session_id/seats"
            element={<PrivateRoute><SeatsPage /></PrivateRoute>} />

          {/* ── Booking ── */}
          <Route path="/checkout"
            element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />

          {/* FIX 2: was "/confirm" — Stripe redirects to /booking/confirm */}
          <Route path="/booking/confirm"
            element={<PrivateRoute><ConfirmPage /></PrivateRoute>} />

          {/* FIX 3: was missing — Stripe redirects to /booking/cancel */}
          <Route path="/booking/cancel"
            element={<PrivateRoute><CancelPage /></PrivateRoute>} />

          {/* FIX 4: was "/bookings" — ConfirmPage & Navbar link to /my-bookings */}
          <Route path="/my-bookings"
            element={<PrivateRoute><MyBookingsPage /></PrivateRoute>} />

          {/* ── Tickets ── */}
          {/* FIX 5: was "/tickets/:bookingId" — TicketsPage shows all tickets */}
          <Route path="/my-tickets"
            element={<PrivateRoute><TicketsPage /></PrivateRoute>} />

          {/* ── Registration flows ── */}
          <Route path="/registration/confirm"
            element={<PrivateRoute><RegistrationConfirmPage /></PrivateRoute>} />
          <Route path="/registration/cancel"
            element={<PrivateRoute><RegistrationCancelPage /></PrivateRoute>} />
          <Route path="/my-registrations"
            element={<PrivateRoute><MyRegistrationsPage /></PrivateRoute>} />

          {/* ── Staff ── */}
          <Route path="/staff" element={
            <RoleGuard roles={['Venue Staff', 'System Admin']}><StaffPage /></RoleGuard>
          } />
          <Route path="/scanner" element={
            <RoleGuard roles={['Venue Staff', 'System Admin']}><ScannerPage /></RoleGuard>
          } />

          {/* ── Admin ── */}
          <Route path="/admin/*" element={
            <RoleGuard roles={['System Admin']}><AdminPage /></RoleGuard>
          } />

          {/* ── Organizer ── */}
          <Route path="/organizer" element={
            <RoleGuard roles={['Event Organizer']}><OrganizerPage /></RoleGuard>
          } />

          {/* ── Venue Owner ── */}
          <Route path="/venue-owner" element={
            <RoleGuard roles={['Venue Owner']}><VenueOwnerPage /></RoleGuard>
          } />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
      {showNavbar && <Footer />}
    </div>
  );
}
