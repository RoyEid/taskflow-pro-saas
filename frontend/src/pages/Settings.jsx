import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import useAuth from "../context/useAuth";
import useWorkspace from "../context/useWorkspace";
import { showSuccess, showError, confirmAction } from "../utils/alerts";
import { changePassword, updateProfile } from "../services/authService";
import { Sun, Moon, Shield, LogOut } from "lucide-react";

function getInitialTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSafeDateLabel(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function getUserInitial(user) {
  return user?.name?.charAt(0)?.toUpperCase() || "U";
}

function Settings() {
  const { user, logout } = useAuth();
  const { workspace } = useWorkspace();

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
  });

  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [theme, setTheme] = useState(getInitialTheme);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    const cleanName = profileData.name.trim();

    if (!cleanName) {
      showError("Full name is required.");
      return;
    }

    setUpdatingProfile(true);

    try {
      await updateProfile({ name: cleanName });

      showSuccess("Profile updated successfully");

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      showError(
        err?.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    const currentPassword = passwords.currentPassword.trim();
    const newPassword = passwords.newPassword.trim();
    const confirmPassword = passwords.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);

      showSuccess("Password changed successfully");

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to change password.";

      showError(message);
      setPasswordError(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    const confirmed = await confirmAction({
      title: "Sign Out",
      text: "Are you sure you want to sign out?",
      confirmButtonText: "Sign Out",
    });

    if (confirmed) {
      logout();
    }
  };

  return (
    <DashboardLayout>
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings
          </h2>

          <p className="mt-1 text-[14px] text-slate-500 dark:text-slate-400">
            Manage your account preferences and app settings.
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-7 py-6 dark:border-slate-800/60">
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                Profile Information
              </h3>

              <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
                Your personal account details.
              </p>
            </div>

            <div className="space-y-6 px-7 py-7">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                  {getUserInitial(user)}
                </div>

                <div>
                  <h4 className="text-[15px] font-semibold text-slate-900 dark:text-white">
                    {user?.name || "User"}
                  </h4>

                  <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                    {user?.email || "No email"}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleUpdateProfile}
                className="border-t border-slate-100 pt-5 dark:border-slate-800/60"
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="h-10 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[13px] text-slate-500 shadow-sm outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
                    />

                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Email address is used for login and cannot be changed yet.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="h-10 rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    {updatingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div
            id="change-password-section"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900"
          >
            <div className="border-b border-slate-200 px-7 py-6 dark:border-slate-800/60">
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                Change Password
              </h3>

              <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
                Update your password to keep your account secure.
              </p>
            </div>

            <div className="px-7 py-7">
              {passwordError && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                    Current Password *
                  </label>

                  <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) =>
                      setPasswords((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                      New Password *
                    </label>

                    <input
                      type="password"
                      value={passwords.newPassword}
                      onChange={(e) =>
                        setPasswords((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
                      Confirm Password *
                    </label>

                    <input
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={(e) =>
                        setPasswords((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="h-10 rounded-lg bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-300 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-7 py-6 dark:border-slate-800/60">
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                App Preferences
              </h3>

              <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
                Customize your app experience.
              </p>
            </div>

            <div className="px-7 py-7">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-medium text-slate-900 dark:text-white">
                    Theme
                  </h4>

                  <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                    Switch between light and dark mode.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 hover:scale-110 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  {theme === "dark" ? (
                    <Sun
                      size={18}
                      className="rotate-0 transition-transform duration-500 hover:rotate-180"
                    />
                  ) : (
                    <Moon
                      size={18}
                      className="rotate-0 transition-transform duration-500 hover:-rotate-12"
                    />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={18} className="text-emerald-500" />

              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                Security Info
              </h3>
            </div>

            <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              For your security, use a strong password and do not share your
              account. We recommend changing your password every 90 days.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <h3 className="mb-4 text-[15px] font-bold text-slate-900 dark:text-white">
              Workspace Info
            </h3>

            {workspace ? (
              <div className="space-y-3 text-[13px]">
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Current
                  </span>

                  <span className="text-right font-medium text-slate-900 dark:text-white">
                    {workspace?.name || "Unnamed Workspace"}
                  </span>
                </div>

                <div className="flex items-start justify-between border-t border-slate-100 pt-3 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400">
                    Created
                  </span>

                  <span className="font-medium text-slate-900 dark:text-white">
                    {getSafeDateLabel(workspace?.createdAt)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-slate-500">
                No workspace selected.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-7 shadow-sm dark:border-red-900/30 dark:bg-slate-900">
            <h3 className="mb-2 text-[15px] font-bold text-red-600 dark:text-red-400">
              Danger Zone
            </h3>

            <p className="mb-5 text-[13px] text-slate-500 dark:text-slate-400">
              Sign out of your account on this device.
            </p>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-50 py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;