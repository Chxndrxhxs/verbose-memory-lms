import { Navigate } from "react-router-dom";
import { canTeach, hasRole, type Role } from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";

export function Protected({
  children,
  role = "instructor",
}: {
  children: React.ReactNode;
  role?: Role;
}) {
  const user = useAuth((s) => s.user);
  const isLoading = useAuth((s) => s.isLoading);
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  // Auth cookies are shared across the learner/instructor apps on one host,
  // so a learner session can land here. Send them to login to switch accounts
  // instead of "/" — the landing page would just bounce them back.
  if (!hasRole(user, role) && !canTeach(user))
    return <Navigate to="/login" replace state={{ reason: "role" }} />;
  return <>{children}</>;
}
