import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiBell,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiInfo,
  FiTrash2,
  FiCheck,
  FiFilter,
  FiExternalLink,
} from "react-icons/fi";

import { ENDPOINTS } from "../config/api";
const NOTIFICATIONS_API = ENDPOINTS.NOTIFICATIONS;

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'unread' | 'read'

  // Fetch from backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await fetch(NOTIFICATIONS_API);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Unable to connect to Notifications API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${NOTIFICATIONS_API}/${id}/read`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to mark as read");
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      alert(err.message || "Error updating notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${NOTIFICATIONS_API}/read-all`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to mark all as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      alert(err.message || "Error updating notifications");
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`${NOTIFICATIONS_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete notification");
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      alert(err.message || "Error deleting notification");
    }
  };

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    if (filter === "read") return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case "danger":
        return <FiAlertCircle className="text-rose-600" size={18} />;
      case "warning":
        return <FiAlertTriangle className="text-amber-600" size={18} />;
      case "success":
        return <FiCheckCircle className="text-emerald-600" size={18} />;
      default:
        return <FiInfo className="text-blue-600" size={18} />;
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case "danger":
        return "bg-rose-50 border-rose-200 text-rose-700";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "success":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      default:
        return "bg-blue-50 border-blue-200 text-blue-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="text-xs bg-rose-500 text-white font-semibold px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            System warnings, stock alerts, and CRM event reminders.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <FiCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={fetchNotifications} className="ml-auto underline font-medium hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* FILTERS */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <FiFilter className="text-slate-400" />
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {["all", "unread", "read"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                  filter === tab
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-400">
          Showing {filteredNotifications.length} items
        </span>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 text-sm">
            Checking for updates...
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all ${
                notif.read
                  ? "bg-white border-slate-200 opacity-75"
                  : "bg-blue-50/40 border-blue-200 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${getBadgeStyle(
                    notif.type
                  )}`}
                >
                  {getIcon(notif.type)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800 text-sm">{notif.title}</h4>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {notif.category}
                    </span>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-600 leading-snug">{notif.message}</p>

                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                    <span>
                      {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {notif.link && (
                      <Link
                        to={notif.link}
                        className="flex items-center gap-1 text-blue-600 font-medium hover:underline"
                      >
                        View Details <FiExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif._id)}
                    className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                    title="Mark as read"
                  >
                    <FiCheck size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif._id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Delete"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <FiBell size={38} className="mx-auto text-slate-300" />
            <h3 className="mt-3 font-semibold text-slate-700">All caught up!</h3>
            <p className="mt-1 text-sm text-slate-400">No new notifications in this view.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
