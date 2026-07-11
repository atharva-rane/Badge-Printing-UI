export const logout = (navigate) => {
  localStorage.removeItem("token");

  navigate("/", { replace: true });
};
