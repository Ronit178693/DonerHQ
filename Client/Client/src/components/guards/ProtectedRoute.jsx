import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

/**
 * Route guard component that redirects unauthenticated users to /login.
 * Optionally restricts by role.
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}> ... </Route>
 *   <Route element={<ProtectedRoute roles={['ngo']} />}> ... </Route>
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) {
    return null; // Or a loading spinner component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
