import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Skeleton from './LoadingSkeleton';

const RoleGuard = ({ children, roles = [] }) => {
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

  if (!user) return <Navigate to="/login" replace />;

  const userRoles = user.roles || [user.role_name];

  if (roles.length > 0 && !roles.some(r => userRoles.includes(r))) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleGuard;