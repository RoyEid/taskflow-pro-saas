import { Navigate, useLocation } from "react-router";
import useAuth from "../context/useAuth";
import PageLoader from "../components/ui/PageLoader";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader message="Verifying session..." />;
  }

  if (!user) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTo)}`}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
