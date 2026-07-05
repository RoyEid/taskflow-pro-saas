import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { setToken } from "../utils/tokenStorage";

import BrandLoader from "../components/ui/BrandLoader";

function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const provider = searchParams.get("provider");

  useEffect(() => {
    if (!token) {
      navigate("/login?error=missing_token", { replace: true });
      return;
    }

    setToken(token, true);

    if (email && provider) {
      const prettyProvider = provider === "github" ? "GitHub" : provider === "google" ? "Google" : provider;
      localStorage.setItem("oauth_success_message", `Signed in with ${prettyProvider} as ${email}`);
    }

    window.history.replaceState({}, document.title, "/oauth-success");

    window.location.replace("/workspaces");
  }, [token, email, provider, navigate]);

  return (
    <BrandLoader
      text="Completing sign in..."
      fullScreen={true}
      size="lg"
    />
  );
}

export default OAuthSuccess;