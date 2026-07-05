import { Navigate } from "react-router";
import useAuth from "../context/useAuth";
import PageLoader from "../components/ui/PageLoader";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader message="Verifying session..." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;