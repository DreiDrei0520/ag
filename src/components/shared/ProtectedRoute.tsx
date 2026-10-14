import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui';
import type { Role } from '../../types';

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: Role[];
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  if (!user.isActive) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-agdark-800">Account deactivated</h1>
        <p className="max-w-md text-sm text-agdark-500">
          This admin account has been deactivated.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
}
