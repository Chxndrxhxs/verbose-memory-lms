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
  // Same shared-cookie situation as the instructor app: a non-admin session
  // landing here must go to login, not "/" (that would bounce forever).
  if (!hasRole(user, role)) return <Navigate to="/login" replace state={{ reason: "role" }} />;
  return <>{children}</>;
}