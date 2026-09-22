import { useState, useEffect } from "react";
import {
  FiUser,
  FiBell,
  FiGlobe,
  FiSave,
  FiCheck,
  FiAlertCircle,
  FiShield,
} from "react-icons/fi";
import AdminVault from "../components/AdminVault";

import { ENDPOINTS } from "../config/api";
const SETTINGS_API = ENDPOINTS.SETTINGS;

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Stored auth user state
  const [storedUser, setStoredUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  // Settings form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: storedUser.email || "",
    phone: "",
    company: "Nexora Business",
    currency: "PKR",
    timezone: "Asia/Karachi",
    defaultTaxRate: 0,
    invoiceNotes: "Thank you for your business!",
    lowStockThreshold: 5,
    emailNotifications: true,
    orderAlerts: true,
    stockAlerts: true,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await fetch(SETTINGS_API);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load settings");

      const fullName = storedUser.name || `${data.firstName || ""} ${data.lastName || ""}`.trim();
      const parts = fullName.split(" ");

      setForm({
        firstName: parts[0] || data.firstName || "Admin",
        lastName: parts.slice(1).join(" ") || data.lastName || "",
        email: storedUser.email || data.email || "",
        phone: data.phone || "03457154529",
        company: data.company || "Nexora Business",
        currency: data.currency || "PKR",
        timezone: data.timezone || "Asia/Karachi",
        defaultTaxRate: data.defaultTaxRate || 0,
        invoiceNotes: data.invoiceNotes || "Thank you for your business!",
        lowStockThreshold: data.lowStockThreshold || 5,
        emailNotifications: data.emailNotifications ?? true,
        orderAlerts: data.orderAlerts ?? true,
        stockAlerts: data.stockAlerts ?? true,
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Unable to fetch application settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Save Business & General Preferences
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const settingsRes = await fetch(SETTINGS_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!settingsRes.ok) throw new Error("Failed to save organization settings");

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(err.message || "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-slate-500 text-sm">Loading system preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">System Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure general preferences, company defaults, and access the Master Admin Vault.
          </p>
        </div>

        {activeTab !== "security" && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <FiCheck size={18} /> Saved!
              </>
            ) : (
              <>
                <FiSave size={18} /> {saving ? "Saving..." : "Save Changes"}
              </>
            )}
          </button>
        )}
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={fetchSettings}
            className="ml-auto underline font-medium hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* TABS CONTAINER */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* TAB BUTTONS */}
        <div className="w-full lg:w-64 space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${
              activeTab === "profile"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <FiUser size={18} /> General Profile
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${
              activeTab === "security"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <FiShield size={18} /> Master Admin Vault
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${
              activeTab === "preferences"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <FiGlobe size={18} /> Business & Billing
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition ${
              activeTab === "notifications"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <FiBell size={18} /> Alert Thresholds
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1">
          {/* 1. GENERAL PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                General Profile Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                💡 <strong>Looking to update your avatar or account password?</strong> Open the{" "}
                <strong>Master Admin Vault</strong> tab using your secret passcode.
              </div>
            </div>
          )}

          {/* 2. MASTER ADMIN VAULT TAB */}
          {activeTab === "security" && (
            <AdminVault
              user={storedUser}
              onProfileUpdated={(updated) => setStoredUser(updated)}
            />
          )}

          {/* 3. BUSINESS & BILLING TAB */}
          {activeTab === "preferences" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                Business & Billing Defaults
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Base Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PKR">Pakistani Rupee (PKR)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                    <option value="AED">UAE Dirham (AED)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Timezone
                  </label>
                  <select
                    value={form.timezone}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                    <option value="UTC">UTC (Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Default Invoice Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.defaultTaxRate}
                    onChange={(e) => handleChange("defaultTaxRate", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Low Inventory Alert Level (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.lowStockThreshold}
                    onChange={(e) => handleChange("lowStockThreshold", e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Default Invoice Memo
                </label>
                <textarea
                  rows="2"
                  value={form.invoiceNotes}
                  onChange={(e) => handleChange("invoiceNotes", e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* 4. NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                Notification Thresholds & Triggers
              </h3>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Email Notifications</p>
                    <p className="text-xs text-slate-500">
                      Receive summaries and security reports by email.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.emailNotifications}
                    onChange={(e) => handleChange("emailNotifications", e.target.checked)}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Order Alerts</p>
                    <p className="text-xs text-slate-500">
                      Trigger alerts whenever orders are created or updated.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.orderAlerts}
                    onChange={(e) => handleChange("orderAlerts", e.target.checked)}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Low Stock Scanner</p>
                    <p className="text-xs text-slate-500">
                      Auto-scan product catalog on inventory dips.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.stockAlerts}
                    onChange={(e) => handleChange("stockAlerts", e.target.checked)}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
