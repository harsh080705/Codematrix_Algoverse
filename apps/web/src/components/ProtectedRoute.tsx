import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { getAccessToken, getStoredUser } from "../lib/session";
import type { UserRole } from "@aihub/shared";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const token = getAccessToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleNormalized = String(user.role).toLowerCase();
    const isAllowed = allowedRoles.some(r => String(r).toLowerCase() === userRoleNormalized);

    if (!isAllowed) {
      // Redirect user to their appropriate role dashboard if they lack permission
      if (userRoleNormalized === "admin") {
        return <Navigate to="/admin" replace />;
      }
      if (userRoleNormalized === "developer") {
        return <Navigate to="/developer" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
