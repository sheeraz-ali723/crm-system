import { useState } from "react";
import {
  FiLock,
  FiUnlock,
  FiKey,
  FiCamera,
  FiCheck,
  FiAlertCircle,
  FiShield,
  FiTrash2,
} from "react-icons/fi";

function AdminVault({ user, onProfileUpdated }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultKey, setVaultKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Unlocked state
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState({ message: "", error: false });
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Unlock verification
  const handleUnlock = async (e) => {
    e.preventDefault();
    setKeyError("");
    setVerifying(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api")}/auth/verify-vault-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ masterKey: vaultKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid Passcode");

      setIsUnlocked(true);
      setStatus({ message: "", error: false });
    } catch (err) {
      setKeyError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Avatar upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be under 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  // Save Avatar
  const handleSaveAvatar = async () => {
    setSavingAvatar(true);
    setStatus({ message: "", error: false });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api")}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update photo");

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = { ...currentUser, avatar };
      localStorage.setItem("user", JSON.stringify(updated));
      window.dispatchEvent(new Event("userProfileUpdated"));

      if (onProfileUpdated) onProfileUpdated(updated);
      setStatus({ message: "Admin profile photo updated successfully!", error: false });
    } catch (err) {
      setStatus({ message: err.message, error: true });
    } finally {
      setSavingAvatar(false);
    }
  };

  // Save Password
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setStatus({ message: "New passwords do not match", error: true });
      return;
    }

    setSavingPassword(true);
    setStatus({ message: "", error: false });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api")}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
          masterKey: vaultKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password");

      setStatus({ message: "Master password successfully changed!", error: false });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setStatus({ message: err.message, error: true });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              isUnlocked ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}
          >
            {isUnlocked ? <FiUnlock size={22} /> : <FiLock size={22} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Master Admin Vault</h3>
            <p className="text-xs text-slate-500">
              {isUnlocked
                ? "Vault Unlocked. You may modify protected credentials."
                : "Restricted Security Zone. Passcode verification required."}
            </p>
          </div>
        </div>

        {isUnlocked && (
          <button
            onClick={() => {
              setIsUnlocked(false);
              setVaultKey("");
              setStatus({ message: "", error: false });
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <FiLock size={14} /> Lock Vault
          </button>
        )}
      </div>

      {/* Screen 1: Locked Mode */}
      {!isUnlocked ? (
        <form onSubmit={handleUnlock} className="my-8 mx-auto max-w-sm text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 shadow-inner">
            <FiShield size={28} />
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm">Enter Master Passcode</h4>
            <p className="text-xs text-slate-500 mt-1">
              Protected administrator access for account credentials and avatar assets.
            </p>
          </div>

          {keyError && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-center gap-2">
              <FiAlertCircle size={15} /> {keyError}
            </div>
          )}

          <div className="relative">
            <FiKey className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="password"
              placeholder="Enter Master Passcode..."
              value={vaultKey}
              onChange={(e) => setVaultKey(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50"
          >
            {verifying ? "Verifying..." : "Unlock Admin Vault"}
          </button>
        </form>
      ) : (
        /* Screen 2: Unlocked Mode */
        <div className="mt-6 space-y-8">
          {status.message && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                status.error
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <FiCheck size={16} /> {status.message}
            </div>
          )}

          {/* Section A: Profile Photo */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FiCamera className="text-blue-600" /> Admin Profile Photo
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Admin Avatar"
                  className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                  {user?.name ? user.name[0].toUpperCase() : "A"}
                </div>
              )}

              <div className="space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label className="cursor-pointer rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition">
                    Choose Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>

                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar("")}
                      className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      <FiTrash2 size={13} className="inline mr-1" /> Remove
                    </button>
                  )}

                  <button
                    onClick={handleSaveAvatar}
                    disabled={savingAvatar}
                    className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    {savingAvatar ? "Saving..." : "Save Photo"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">Max size 2MB (JPG, PNG)</p>
              </div>
            </div>
          </div>

          {/* Section B: Master Password Change */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FiLock className="text-blue-600" /> Change Master Password
            </h4>

            <form onSubmit={handleSavePassword} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {savingPassword ? "Updating..." : "Update Master Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVault;
