import { Navigate, useLocation } from "react-router-dom";
import { hasRole, type Role } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";

export function Protected({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const user = useAuth((s) => s.user);
  const isLoading = useAuth((s) => s.isLoading);
  const location = useLocation();
  if (isLoading) return null;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (role && !hasRole(user, role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
