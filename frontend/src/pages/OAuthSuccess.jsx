import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { setToken } from "../utils/tokenStorage";

import BrandLoader from "../components/ui/BrandLoader";

function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      navigate("/login?error=missing_token", { replace: true });
      return;
    }

    setToken(token, true);

    window.history.replaceState({}, document.title, "/oauth-success");

    window.location.replace("/workspaces");
  }, [token, navigate]);

  return (
    <BrandLoader
      text="Completing sign in..."
      fullScreen={true}
      size="lg"
    />
  );
}

export default OAuthSuccess;