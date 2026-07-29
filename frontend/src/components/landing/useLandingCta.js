import useAuth from "../../context/useAuth";

/* Resolves the landing page call-to-action against the current session.

   `ready` is false only while a stored token is being verified, so the
   buttons never flash "Sign in" and then swap to "Go to Dashboard".
   Visitors without a token skip that state entirely, because AuthProvider
   initialises `loading` to false when no token is present. */
function useLandingCta() {
  const { user, loading } = useAuth();

  if (loading) {
    return { ready: false, primary: null, secondary: null };
  }

  if (user) {
    return {
      ready: true,
      primary: { label: "Go to Dashboard", to: "/dashboard" },
      secondary: null,
    };
  }

  return {
    ready: true,
    primary: { label: "Get started", to: "/register" },
    secondary: { label: "Sign in", to: "/login" },
  };
}

export default useLandingCta;
