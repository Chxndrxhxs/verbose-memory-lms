import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const isLoading = useAuth((s) => s.isLoading);
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role && user.role !== "instructor") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
