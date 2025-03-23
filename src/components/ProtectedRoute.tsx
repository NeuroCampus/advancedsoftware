import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];  // Changed to array to support multiple roles
  redirectPath?: string;     // Optional custom redirect path
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles, 
  redirectPath = '/', 
}) => {
  const { token, role } = useUser();

  // Debug logging to help troubleshoot
  console.log('[ProtectedRoute] Checking auth:', { token, role, requiredRoles });

  // If no token, redirect to login
  if (!token) {
    console.log('[ProtectedRoute] No token found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // If requiredRoles are specified and user's role isn't included, redirect
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(role || '')) {
    console.log(`[ProtectedRoute] Role ${role} not in ${requiredRoles}, redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  // If all checks pass, render the children
  console.log('[ProtectedRoute] Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;