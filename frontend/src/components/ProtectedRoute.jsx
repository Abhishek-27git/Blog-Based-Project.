import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Route protector checking authentication and role authorization.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <span className="material-symbols-outlined text-4xl text-secondary animate-spin">
          progress_activity
        </span>
        <p className="font-ui-label text-ui-label text-on-surface-variant mt-4 uppercase tracking-widest">
          Loading Manuscript...
        </p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Banned user check (fallback safety)
  if (user.isBanned) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 text-center">
        <span className="material-symbols-outlined text-5xl text-error mb-4">
          block
        </span>
        <h2 className="font-display-lg text-headline-md mb-2">Access Denied</h2>
        <p className="font-body-md text-on-surface-variant max-w-md">
          Your account has been suspended by the moderator team. If you believe this is an error, please contact support.
        </p>
      </div>
    );
  }

  // Not authorized (e.g. user trying to access admin dashboard)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
