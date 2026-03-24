import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ROLES } from './utils/constants';

import LoginPage      from './pages/auth/LoginPage';
import BrowsePage     from './pages/browse/BrowsePage';
import EventPage      from './pages/events/EventPage';
import SeatsPage      from './pages/seats/SeatsPage';
import CheckoutPage   from './pages/booking/CheckoutPage';
import ConfirmPage    from './pages/booking/ConfirmPage';
import MyBookingsPage from './pages/booking/MyBookingsPage';
import TicketsPage    from './pages/tickets/TicketsPage';
import AdminPage      from './pages/admin/AdminPage';
import StaffPage      from './pages/staff/StaffPage';
import ScannerPage    from './pages/staff/ScannerPage';

const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A]">
    <div className="w-10 h-10 rounded-full border-2 border-[#6C63FF] border-t-transparent animate-spin" />
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return user ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role_name !== role) return <Navigate to="/" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={
        <GuestRoute><LoginPage /></GuestRoute>
      } />

      <Route path="/"element={<BrowsePage />} />
      <Route path="/events/:eventId"element={<EventPage />} />

      <Route path="/events/:eventId/seats/:sessionId" element={
        <PrivateRoute><SeatsPage /></PrivateRoute>
      } />
      <Route path="/checkout" element={
        <PrivateRoute><CheckoutPage /></PrivateRoute>
      } />
      <Route path="/booking/confirm/:bookingId" element={
        <PrivateRoute><ConfirmPage /></PrivateRoute>
      } />
      <Route path="/bookings" element={
        <PrivateRoute><MyBookingsPage /></PrivateRoute>
      } />
      <Route path="/tickets/:bookingId" element={
        <PrivateRoute><TicketsPage /></PrivateRoute>
      } />

      <Route path="/admin/*" element={
        <RoleRoute role={ROLES.ADMIN}><AdminPage /></RoleRoute>
      } />
      <Route path="/staff" element={
        <RoleRoute role={ROLES.ADMIN}><StaffPage /></RoleRoute>
      } />
      <Route path="/scanner" element={
        <RoleRoute role={ROLES.STAFF}><ScannerPage /></RoleRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
