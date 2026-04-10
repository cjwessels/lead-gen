import { useAuth } from "@/store/auth";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: any) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (user) return <Navigate to="/app/dashboard" />;

  return children;
}