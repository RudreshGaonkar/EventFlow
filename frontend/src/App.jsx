import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import RoleGuard from './components/common/RoleGuard';
import Skeleton from './components/common/LoadingSkeleton';
import { ToastProvider } from './components/common/Toast'; 
import Footer from './components/common/Footer';
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
import AdminPage    from './pages/admin/AdminPage';
import StaffPage    from './pages/staff/StaffPage';
import ScannerPage  from './pages/staff/ScannerPage';
import OrganizerPage from './pages/organizer/OrganizerPage'; 
import VenueOwnerPage from './pages/venue-owner/VenueOwnerPage';

// Pages that hide the Navbar
const NO_NAVBAR = ['/login'];

function RoleRedirect() {
  const { user } = useAuth();

  const userRoles = user?.roles || (user?.role_name ? [user.role_name] : []);
  const hasRole = (role) => userRoles.includes(role);

  if (hasRole('System Admin'))    return <Navigate to="/admin"       replace />;
  if (hasRole('Venue Staff'))     return <Navigate to="/staff"       replace />;
  if (hasRole('Event Organizer')) return <Navigate to="/organizer"   replace />;
  if (hasRole('Venue Owner'))     return <Navigate to="/venue-owner" replace />;

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
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — any logged in user */}
          {/* <Route path="/"element={<PrivateRoute><BrowsePage /></PrivateRoute>} /> */}
          <Route path="/" element={ <PrivateRoute> <RoleRedirect /> </PrivateRoute>}/>
          <Route path="/events/:event_id"          element={<PrivateRoute><EventPage /></PrivateRoute>} />
          <Route path="/session/:session_id/seats" element={<PrivateRoute><SeatsPage /></PrivateRoute>} />
          <Route path="/checkout"            element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="/confirm"             element={<PrivateRoute><ConfirmPage /></PrivateRoute>} />
          <Route path="/bookings"            element={<PrivateRoute><MyBookingsPage /></PrivateRoute>} />
          <Route path="/tickets/:bookingId"  element={<PrivateRoute><TicketsPage /></PrivateRoute>} />

          {/* Staff only */}
          <Route path="/staff" element={
            <RoleGuard roles={['Venue Staff', 'System Admin']}><StaffPage /></RoleGuard>
          } />
          <Route path="/scanner" element={
            <RoleGuard roles={['Venue Staff', 'System Admin']}><ScannerPage /></RoleGuard>
          } />

          {/* Admin only */}
          <Route path="/admin/*" element={
            <RoleGuard roles={['System Admin']}><AdminPage /></RoleGuard>
          } />

          {/* ✅ Organizer only */}
          <Route path="/organizer" element={
            <RoleGuard roles={['Event Organizer']}><OrganizerPage /></RoleGuard>
          } />

          <Route path="/venue-owner" element={
            <RoleGuard roles={['Venue Owner']}><VenueOwnerPage /></RoleGuard>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
      {showNavbar && <Footer />}
    </div>
  );
}