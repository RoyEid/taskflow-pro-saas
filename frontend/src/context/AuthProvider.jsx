import { useEffect, useState } from "react";
import AuthContext from "./AuthContext";
import api from "../services/api";
import { getToken, setToken, removeToken } from "../utils/tokenStorage";

function getResponseData(response) {
  return response.data?.data || response.data;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(() => {
    return Boolean(getToken());
  });

  useEffect(() => {
    const token = getToken();

    if (!token || token === "undefined") {
      removeToken();
      return;
    }

    const loadUser = async () => {
      try {
        const response = await api.get("/auth/me");
        const data = getResponseData(response);

        setUser(data.user);
      } catch {
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password, rememberMe = true) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const data = getResponseData(response);

    setToken(data.token, rememberMe);
    setUser(data.user);

    return data;
  };

  const register = async (name, email, password) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    const data = getResponseData(response);
    
    // Registration no longer logs the user in directly (email verification needed)
    return data;
  };

  const verifyEmail = async (email, code) => {
    const response = await api.post("/auth/verify-email", {
      email,
      code,
    });

    const data = getResponseData(response);

    setToken(data.token, true); // Auto-login new verified users
    setUser(data.user);

    return data;
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;