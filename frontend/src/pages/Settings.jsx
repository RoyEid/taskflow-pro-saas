import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import useAuth from "../context/useAuth";
import useTheme from "../context/useTheme";
import useWorkspace from "../context/useWorkspace";
import { showSuccess, showError, confirmAction } from "../utils/alerts";
import { changePassword, updateProfile } from "../services/authService";
import { Sun, Moon, Mail, Info } from "lucide-react";
import { checkPasswordRules } from "../utils/passwordValidation";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";
import PasswordInput from "../components/ui/PasswordInput";
import PageHeader from "../components/PageHeader";


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

  const { isDarkMode, toggleTheme } = useTheme();

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);



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

    const { allPassed } = checkPasswordRules(newPassword);
    if (!allPassed) {
      setPasswordError("Please meet all password requirements.");
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
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences and app settings."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">          <div className="overflow-hidden rounded-2xl tf-card-base">
            <div className="tf-bd border-b px-4 py-4 sm:px-7 sm:py-6">
              <h3 className="text-[16px] font-bold tf-text">
                Profile Information
              </h3>

              <p className="mt-1.5 text-[13px] tf-text-muted">
                Your personal account details.
              </p>
            </div>

            <div className="space-y-6 px-4 py-5 sm:px-7 sm:py-7">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl tf-bg-3 text-2xl font-bold tf-text-accent">
                  {getUserInitial(user)}
                </div>

                <div>
                  <h4 className="text-[15px] font-semibold tf-text">
                    {user?.name || "User"}
                  </h4>

                  <p className="mt-0.5 text-[13px] tf-text-muted">
                    {user?.email || "No email"}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleUpdateProfile}
                className="tf-bd border-t pt-5"
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="tf-label" htmlFor="settings-full-name">
                      Full Name
                    </label>

                    <input
                      id="settings-full-name"
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="tf-field w-full"
                    />
                  </div>

                  <div>
                    <label className="tf-label" htmlFor="settings-email">
                      Email Address
                    </label>

                    <input
                      id="settings-email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="tf-field w-full cursor-not-allowed"
                    />

                    <p className="tf-help mt-1.5">
                      Email address is used for login and cannot be changed yet.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="tf-btn-base tf-btn-primary"
                  >
                    {updatingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div
            id="change-password-section"
            className="overflow-hidden rounded-2xl tf-card-base"
          >
            <div className="tf-bd border-b px-4 py-4 sm:px-7 sm:py-6">
              <h3 className="text-[16px] font-bold tf-text">
                Change Password
              </h3>

              <p className="mt-1.5 text-[13px] tf-text-muted">
                Update your password to keep your account secure.
              </p>
            </div>
            <div className="px-4 py-5 sm:px-7 sm:py-7">
              {user?.provider && user.provider !== "local" ? (
                <div className="tf-alert tf-alert-info p-5">
                  <div className="flex items-start space-x-3.5">
                    <div className="mt-0.5 rounded-lg tf-bg-3 p-2 tf-text-info">
                      <Info className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold tf-text">
                        Account Managed by Provider
                      </h4>
                      <p className="mt-1 text-[13px] leading-relaxed tf-text-muted">
                        Your account is managed through {user.provider === "github" ? "GitHub" : "Google"} sign-in. Password changes must be handled from your provider account.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {passwordError && (
                    <div className="tf-alert tf-alert-error mb-5" role="alert">
                      {passwordError}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-6" autoComplete="off">
                    <PasswordInput
                      label="Current Password *"
                      value={passwords.currentPassword}
                      onChange={(e) =>
                        setPasswords((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      inputClassName="tf-field w-full pl-3.5 pr-11"
                    />

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <PasswordInput
                        label="New Password *"
                        value={passwords.newPassword}
                        onChange={(e) =>
                          setPasswords((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        inputClassName="tf-field w-full pl-3.5 pr-11"
                      />

                      <PasswordInput
                        label="Confirm Password *"
                        value={passwords.confirmPassword}
                        onChange={(e) =>
                          setPasswords((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        inputClassName="tf-field w-full pl-3.5 pr-11"
                      />
                    </div>

                    {passwords.newPassword && (
                      <div className="mb-4">
                        <PasswordStrengthIndicator
                          password={passwords.newPassword}
                          confirmPassword={passwords.confirmPassword}
                        />
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={
                          changingPassword ||
                          !passwords.currentPassword ||
                          !passwords.newPassword ||
                          !checkPasswordRules(passwords.newPassword).allPassed ||
                          passwords.newPassword !== passwords.confirmPassword
                        }
                        className="tf-btn-base tf-btn-primary"
                      >
                        {changingPassword ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl tf-card-base">
            <div className="tf-bd border-b px-4 py-4 sm:px-7 sm:py-6">
              <h3 className="text-[16px] font-bold tf-text">
                App Preferences
              </h3>

              <p className="mt-1.5 text-[13px] tf-text-muted">
                Customize your app experience.
              </p>
            </div>

            <div className="px-4 py-5 sm:px-7 sm:py-7">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-medium tf-text">
                    Theme
                  </h4>

                  <p className="mt-0.5 text-[13px] tf-text-muted">
                    Switch between light and dark mode.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="tf-btn-icon"
                  aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDarkMode ? (
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
          <div className="tf-card-base rounded-2xl p-7">
            <h3 className="mb-4 text-[15px] font-bold tf-text">
              Workspace Info
            </h3>

            {workspace ? (
              <div className="space-y-3 text-[13px]">
                <div className="flex items-start justify-between">
                  <span className="tf-text-muted">
                    Current
                  </span>

                  <span className="text-right font-medium tf-text">
                    {workspace?.name || "Unnamed Workspace"}
                  </span>
                </div>

                <div className="flex items-start justify-between tf-bd border-t pt-3">
                  <span className="tf-text-muted">
                    Created
                  </span>

                  <span className="font-medium tf-text">
                    {getSafeDateLabel(workspace?.createdAt)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[13px] tf-text-muted">
                No workspace selected.
              </p>
            )}
          </div>

          <div className="tf-card-base rounded-2xl p-7">
            <div className="mb-4 flex items-center gap-2">
              <Mail size={18} className="tf-text-accent" />
              <h3 className="text-[15px] font-bold tf-text">
                Notifications Info
              </h3>
            </div>

            <p className="text-[13px] leading-relaxed tf-text-muted">
              Important account, workspace, feedback, and support emails are sent automatically. Task activity notifications appear in the app.
            </p>
          </div>

          <div className="tf-card-base rounded-2xl border-rose-300/60 p-7 dark:border-rose-900/40">
            <h3 className="mb-2 text-[15px] font-bold tf-text-danger">
              Danger Zone
            </h3>

            <p className="mb-5 text-[13px] tf-text-muted">
              Sign out of your account on this device.
            </p>

            <button
              type="button"
              onClick={handleSignOut}
              className="tf-btn-base tf-btn-danger w-full"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;
