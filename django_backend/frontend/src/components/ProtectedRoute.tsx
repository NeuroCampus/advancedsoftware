// src/components/ProtectedRoute.tsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[]; // Array to support multiple roles
  redirectPath?: string; // Optional custom redirect path
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  redirectPath = '/login',
}) => {
  const { state } = useAuth();

  // Debug logging to help troubleshoot
  console.log('[ProtectedRoute] Checking auth:', { token: state.user?.token, role: state.user?.role, requiredRoles });

  // If no token, redirect to login
  if (!state.user?.token) {
    console.log('[ProtectedRoute] No token found, redirecting to /login');
    return <Navigate to={redirectPath} replace />;
  }

  // If requiredRoles are specified and user's role isn't included, redirect
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(state.user.role || '')) {
    console.log(`[ProtectedRoute] Role ${state.user.role} not in ${requiredRoles}, redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  // If all checks pass, render the children
  console.log('[ProtectedRoute] Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;