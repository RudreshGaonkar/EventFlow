import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import RoleGuard from './components/common/RoleGuard';
import Skeleton from './components/common/LoadingSkeleton';
import { ToastProvider } from './components/common/Toast'; 

// Auth
import LoginPage from './pages/auth/LoginPage';

// Main (placeholders for now)
import BrowsePage    from './pages/browse/BrowsePage';
import EventPage     from './pages/events/EventPage';
import SeatsPage     from './pages/seats/SeatsPage';
import CheckoutPage  from './pages/booking/CheckoutPage';
import ConfirmPage   from './pages/booking/ConfirmPage';
import MyBookingsPage from './pages/booking/MyBookingsPage';
import TicketsPage   from './pages/tickets/TicketsPage';

// Role-specific
import AdminPage   from './pages/admin/AdminPage';
import StaffPage   from './pages/staff/StaffPage';
import ScannerPage from './pages/staff/ScannerPage';

// Pages that hide the Navbar
const NO_NAVBAR = ['/login'];

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
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — any logged in user */}
        <Route path="/"          element={<PrivateRoute><BrowsePage /></PrivateRoute>} />
        <Route path="/events/:id" element={<PrivateRoute><EventPage /></PrivateRoute>} />
        <Route path="/seats/:sessionId" element={<PrivateRoute><SeatsPage /></PrivateRoute>} />
        <Route path="/checkout"  element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/confirm"   element={<PrivateRoute><ConfirmPage /></PrivateRoute>} />
        <Route path="/bookings"  element={<PrivateRoute><MyBookingsPage /></PrivateRoute>} />
        <Route path="/tickets/:bookingId" element={<PrivateRoute><TicketsPage /></PrivateRoute>} />

        {/* Staff only */}
        <Route path="/staff"   element={
          <RoleGuard roles={['Staff', 'System Admin']}><StaffPage /></RoleGuard>
        } />
        <Route path="/scanner" element={
          <RoleGuard roles={['Staff', 'System Admin']}><ScannerPage /></RoleGuard>
        } />

        {/* Admin only */}
        <Route path="/admin/*" element={
          <RoleGuard roles={['System Admin']}><AdminPage /></RoleGuard>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ToastProvider>
    </div>
  );
}
