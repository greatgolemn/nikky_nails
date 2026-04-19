import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Gem } from 'lucide-react';

/**
 * AuthGuard protects routes that require authentication.
 * If the user is not logged in, redirects to /login.
 * Shows a loading spinner while checking auth state.
 */
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center animate-pulse">
            <Gem size={32} />
          </div>
          <p className="text-sm text-text-muted font-medium">กำลังโหลด...</p>
        </motion.div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
