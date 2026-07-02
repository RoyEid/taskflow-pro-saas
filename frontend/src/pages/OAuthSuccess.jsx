import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { setToken } from "../utils/tokenStorage";

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-500" />

        <h2 className="mt-4 text-[15px] font-medium text-slate-700 dark:text-slate-300">
          Completing sign in...
        </h2>
      </div>
    </div>
  );
}

export default OAuthSuccess;