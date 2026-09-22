import { useMemo, useState, useEffect } from "react";
import {
  FiActivity,
  FiPhone,
  FiCalendar,
  FiMail,
  FiFileText,
  FiPlus,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiShoppingBag,
  FiDollarSign,
} from "react-icons/fi";

import { ENDPOINTS } from "../config/api";
const ACTIVITIES_API = ENDPOINTS.ACTIVITIES;
const CUSTOMERS_API = ENDPOINTS.CUSTOMERS;

const ACTIVITY_TYPES = ["Call", "Meeting", "Email", "Note", "Task", "Order", "Deal"];

const initialForm = {
  type: "Note",
  title: "",
  description: "",
  customer: "",
  customerName: "",
  performedBy: "Sheeraz Ali",
  date: new Date().toISOString().split("T")[0],
};

function Activities() {
  const [activities, setActivities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // ===============================
  // Fetch Data
  // ===============================
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [actRes, custRes] = await Promise.all([
        fetch(ACTIVITIES_API),
        fetch(CUSTOMERS_API).catch(() => ({ ok: false })),
      ]);

      const actData = await actRes.json();
      if (!actRes.ok) throw new Error(actData.message || "Failed to load activities");
      setActivities(Array.isArray(actData) ? actData : []);

      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(Array.isArray(custData) ? custData : custData.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Unable to connect to Activities API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===============================
  // Customer Selection
  // ===============================
  const handleCustomerChange = (customerId) => {
    const cust = customers.find((c) => c._id === customerId);
    setForm({
      ...form,
      customer: customerId,
      customerName: cust ? cust.name : "",
    });
  };

  // ===============================
  // Create / Delete
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Title is required");

    setSaving(true);
    try {
      const res = await fetch(ACTIVITIES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to log activity");

      setIsModalOpen(false);
      setForm(initialForm);
      await fetchData();
    } catch (err) {
      alert(err.message || "Error logging activity");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this activity log?")) return;
    try {
      const res = await fetch(`${ACTIVITIES_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete activity");
      await fetchData();
    } catch (err) {
      alert(err.message || "Error deleting activity");
    }
  };

  // ===============================
  // UI Helpers
  // ===============================
  const getTypeIcon = (type) => {
    switch (type) {
      case "Call":
        return <FiPhone className="text-blue-600" size={16} />;
      case "Meeting":
        return <FiCalendar className="text-purple-600" size={16} />;
      case "Email":
        return <FiMail className="text-amber-600" size={16} />;
      case "Task":
        return <FiCheckCircle className="text-emerald-600" size={16} />;
      case "Order":
        return <FiShoppingBag className="text-indigo-600" size={16} />;
      case "Deal":
        return <FiDollarSign className="text-emerald-700" size={16} />;
      default:
        return <FiFileText className="text-slate-600" size={16} />;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "Call":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Meeting":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Email":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Task":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Order":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Deal":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const q = search.toLowerCase();
      const matchSearch =
        act.title.toLowerCase().includes(q) ||
        (act.description || "").toLowerCase().includes(q) ||
        (act.customerName || "").toLowerCase().includes(q) ||
        (act.performedBy || "").toLowerCase().includes(q);

      const matchType = typeFilter === "All" || act.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [activities, search, typeFilter]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Activities</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time audit log of customer touchpoints, calls, notes, and actions.
          </p>
        </div>

        <button
          onClick={() => {
            setForm(initialForm);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <FiPlus size={18} />
          Log Activity
        </button>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={fetchData} className="ml-auto underline font-medium hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* SEARCH & FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs, customers, or details..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="All">All Types</option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TIMELINE LIST */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-center py-10 text-slate-500 text-sm">Loading activity logs...</p>
        ) : filteredActivities.length > 0 ? (
          <div className="relative border-l-2 border-slate-100 ml-4 space-y-6">
            {filteredActivities.map((act) => (
              <div key={act._id} className="relative pl-6 group">
                {/* Timeline Dot */}
                <div className="absolute -left-[17px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                  {getTypeIcon(act.type)}
                </div>

                {/* Content Box */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition group-hover:border-slate-200 group-hover:bg-slate-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${getTypeBadge(act.type)}`}>
                        {act.type}
                      </span>
                      <h4 className="font-semibold text-slate-800 text-sm sm:text-base">{act.title}</h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {new Date(act.date || act.createdAt).toLocaleDateString()} at{" "}
                        {new Date(act.date || act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        onClick={() => handleDelete(act._id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition p-1"
                        title="Delete log"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {act.description && (
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{act.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>
                      Logged by: <strong className="text-slate-700">{act.performedBy}</strong>
                    </span>
                    {(act.customerName || act.customer?.name) && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                        Customer: {act.customerName || act.customer?.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiActivity size={36} className="mx-auto text-slate-300" />
            <h3 className="mt-3 font-semibold text-slate-700">No activities found</h3>
            <p className="mt-1 text-sm text-slate-400">Log a new call, meeting, or customer update.</p>
          </div>
        )}
      </div>

      {/* CREATE ACTIVITY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Log Activity</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Activity Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title / Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discovery call with client"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes / Description</label>
                <textarea
                  rows="3"
                  placeholder="Meeting minutes or call details..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Related Customer</label>
                  <select
                    value={form.customer}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Optional --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Performed By</label>
                  <input
                    type="text"
                    value={form.performedBy}
                    onChange={(e) => setForm({ ...form, performedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition"
                >
                  {saving ? "Logging..." : "Save Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Activities;
