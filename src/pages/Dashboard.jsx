import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiDollarSign,
  FiShoppingBag,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiRefreshCw,
  FiArrowRight,
  FiAlertCircle,
  FiPhone,
  FiCalendar,
  FiMail,
  FiFileText,
  FiTag,
} from "react-icons/fi";

import { ENDPOINTS } from "../config/api";
const DASHBOARD_API = ENDPOINTS.DASHBOARD_STATS;

function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    stats: {
      totalRevenue: 0,
      totalCustomers: 0,
      pipelineValue: 0,
      activeDealsCount: 0,
      wonDealsCount: 0,
      activeOrdersCount: 0,
      pendingTasksCount: 0,
    },
    recentOrders: [],
    recentDeals: [],
    recentActivities: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const res = await fetch(DASHBOARD_API);
      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Failed to load dashboard metrics");

      const payload = json.data || json;

      setData({
        stats: {
          totalRevenue: Number(payload.stats?.totalRevenue ?? 0),
          totalCustomers: Number(payload.stats?.totalCustomers ?? 0),
          pipelineValue: Number(payload.stats?.pipelineValue ?? 0),
          activeDealsCount: Number(payload.stats?.activeDealsCount ?? 0),
          wonDealsCount: Number(payload.stats?.wonDealsCount ?? 0),
          activeOrdersCount: Number(payload.stats?.activeOrdersCount ?? 0),
          pendingTasksCount: Number(payload.stats?.pendingTasksCount ?? 0),
        },
        recentOrders: Array.isArray(payload.recentOrders) ? payload.recentOrders : [],
        recentDeals: Array.isArray(payload.recentDeals) ? payload.recentDeals : [],
        recentActivities: Array.isArray(payload.recentActivities) ? payload.recentActivities : [],
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Unable to connect to dashboard API");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getActivityIcon = (type) => {
    switch ((type || "").toLowerCase()) {
      case "order":
        return <FiShoppingBag className="text-purple-600" size={16} />;
      case "deal":
        return <FiTrendingUp className="text-amber-600" size={16} />;
      case "call":
        return <FiPhone className="text-blue-600" size={16} />;
      case "meeting":
        return <FiCalendar className="text-emerald-600" size={16} />;
      case "email":
        return <FiMail className="text-indigo-600" size={16} />;
      default:
        return <FiFileText className="text-slate-600" size={16} />;
    }
  };

  const getActivityBadgeColor = (type) => {
    switch ((type || "").toLowerCase()) {
      case "order":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "deal":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "call":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "meeting":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time database performance metrics and revenue overview.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={loading || refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
            {refreshing ? "Updating..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => fetchDashboardData(false)}
            className="ml-auto font-medium underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 PRIMARY METRIC TILES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Realized Revenue */}
        <div
          onClick={() => navigate("/orders")}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
              <FiDollarSign size={24} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Orders</span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Realized Revenue</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {loading ? "..." : formatCurrency(data.stats.totalRevenue)}
            </h2>
            <p className="mt-1 text-xs font-medium text-emerald-600">Verified Paid Volume</p>
          </div>
        </div>

        {/* Total Customers */}
        <div
          onClick={() => navigate("/customers")}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
              <FiUsers size={24} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Database</span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Total Customers</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {loading ? "..." : data.stats.totalCustomers}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-400">Active Directory</p>
          </div>
        </div>

        {/* Pipeline Value */}
        <div
          onClick={() => navigate("/deals")}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 transition group-hover:bg-amber-600 group-hover:text-white">
              <FiTrendingUp size={24} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Deals</span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Pipeline Value</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {loading ? "..." : formatCurrency(data.stats.pipelineValue)}
            </h2>
            <p className="mt-1 text-xs font-medium text-amber-600">
              {data.stats.activeDealsCount} Active Deals
            </p>
          </div>
        </div>

        {/* Active Orders Count */}
        <div
          onClick={() => navigate("/orders")}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600 transition group-hover:bg-purple-600 group-hover:text-white">
              <FiShoppingBag size={24} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fulfillment</span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Active Orders</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {loading ? "..." : data.stats.activeOrdersCount}
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-400">Pending & Processing</p>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: TABLES & ACTIVITY FEED */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* RECENT ORDERS (2 Cols) */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Customer Orders</h2>
              <p className="text-xs text-slate-400">Live order fulfillment stream</p>
            </div>
            <button
              onClick={() => navigate("/orders")}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              View all <FiArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Loading orders...
                    </td>
                  </tr>
                ) : data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No recent orders recorded.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.slice(0, 5).map((ord) => (
                    <tr key={ord._id || ord.orderNumber} className="hover:bg-slate-50/60">
                      <td className="px-6 py-3.5 font-semibold text-slate-900">
                        {ord.orderNumber || "ORD-N/A"}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-slate-800">
                          {ord.customerName || (ord.customer && ord.customer.name) || "Customer"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {ord.customerEmail || (ord.customer && ord.customer.email) || ""}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        {formatCurrency(ord.totalAmount)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            (ord.status || "").toLowerCase() === "delivered"
                              ? "bg-emerald-50 text-emerald-700"
                              : (ord.status || "").toLowerCase() === "cancelled"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {ord.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PIPELINE DEALS SUMMARY (1 Col) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top Pipeline Deals</h2>
              <p className="text-xs text-slate-400">High-value pending contracts</p>
            </div>
            <button
              onClick={() => navigate("/deals")}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              All deals <FiArrowRight size={14} />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-400">Loading pipeline...</p>
            ) : data.recentDeals.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No active deals found.</p>
            ) : (
              data.recentDeals.slice(0, 4).map((deal) => (
                <div key={deal._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{deal.title || "Untitled Deal"}</p>
                    <p className="text-xs text-slate-400">
                      {deal.customer || deal.email || "Lead"} • {deal.stage || "New"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(deal.value)}</p>
                    <span
                      className={`inline-block text-[10px] font-semibold uppercase ${
                        (deal.priority || "").toLowerCase() === "high"
                          ? "text-rose-600"
                          : "text-amber-600"
                      }`}
                    >
                      {deal.priority || "Normal"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RECENT OPERATIONAL ACTIVITY STREAM */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiActivity size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Operational Activity</h2>
              <p className="text-xs text-slate-400">Real-time audit log of system events</p>
            </div>
          </div>
        </div>

        <div className="mt-5 divide-y divide-slate-100">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading activity feed...</p>
          ) : data.recentActivities.length === 0 ? (
            <div className="py-8 text-center">
              <FiClock className="mx-auto mb-2 text-slate-300" size={32} />
              <p className="text-sm font-medium text-slate-500">No operational activities recorded yet.</p>
              <p className="text-xs text-slate-400">Events will show up here as orders, invoices, and deals update.</p>
            </div>
          ) : (
            data.recentActivities.slice(0, 5).map((act, index) => (
              <div key={act._id || index} className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-200">
                  {getActivityIcon(act.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{act.title}</p>
                    <span className="text-xs text-slate-400">
                      {act.createdAt || act.date
                        ? new Date(act.createdAt || act.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now"}
                    </span>
                  </div>
                  {act.description && (
                    <p className="mt-0.5 text-xs text-slate-600">{act.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getActivityBadgeColor(
                        act.type
                      )}`}
                    >
                      {act.type || "Event"}
                    </span>
                    {act.customerName && (
                      <span className="text-[11px] text-slate-400">
                        Customer: <strong className="text-slate-600">{act.customerName}</strong>
                      </span>
                    )}
                    {act.performedBy && (
                      <span className="text-[11px] text-slate-400">
                        • by {act.performedBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;