import { Navigate } from "react-router-dom";
import { hasRole, type Role } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";

export function Protected({
  children,
  role = "admin",
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const user = useAuth((s) => s.user);
  const isLoading = useAuth((s) => s.isLoading);
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(user, role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}