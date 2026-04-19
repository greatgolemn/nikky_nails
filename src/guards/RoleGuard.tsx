import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

/**
 * RoleGuard restricts access to specific user roles.
 * Redirects to the appropriate page if the user lacks permission.
 */
export const RoleGuard: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}> = ({ allowedRoles, children, fallbackPath = '/' }) => {
  const { userRole } = useAuth();

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
