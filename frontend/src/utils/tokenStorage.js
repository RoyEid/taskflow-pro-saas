export const getToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

export const setToken = (token, rememberMe = true) => {
  if (rememberMe) {
    localStorage.setItem("token", token);
    sessionStorage.removeItem("token"); // Clean up just in case
  } else {
    sessionStorage.setItem("token", token);
    localStorage.removeItem("token");
  }
};

export const removeToken = () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
};
