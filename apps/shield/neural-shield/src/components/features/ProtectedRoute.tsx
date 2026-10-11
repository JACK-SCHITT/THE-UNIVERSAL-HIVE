import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  proOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false, proOnly = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-base">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-DEFAULT to-green-neon flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-5 h-5 text-bg-base" />
          </div>
          <div className="text-xs font-mono text-[#4a6080]">AUTHENTICATING...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (proOnly && user.plan === 'free') {
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
