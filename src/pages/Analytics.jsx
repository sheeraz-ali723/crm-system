import { useEffect, useState } from "react";
import {
  FiTrendingUp,
  FiDollarSign,
  FiShoppingBag,
  FiPercent,
  FiUsers,
  FiPackage,
  FiRefreshCw,
  FiAlertCircle,
  FiBarChart2,
  FiPieChart,
} from "react-icons/fi";

import { ENDPOINTS } from "../config/api";
const ANALYTICS_API = ENDPOINTS.ANALYTICS;

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const res = await fetch(ANALYTICS_API);
      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Failed to load analytics");
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to connect to Analytics API");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-slate-500 text-sm">Aggregating business analytics from database...</p>
      </div>
    );
  }

  const {
    summary = {},
    orderStatusCounts = {},
    paymentStatusCounts = {},
    stageCounts = {},
    topSellingProducts = [],
    monthlyRevenueData = [],
  } = data || {};

  const maxRevenue = Math.max(...monthlyRevenueData.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Analytics & Insights</h1>
          <p className="mt-1 text-sm text-slate-500">
            Performance metrics, sales distribution, and conversion rates.
          </p>
        </div>

        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
          {refreshing ? "Refreshing..." : "Refresh Analytics"}
        </button>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => fetchAnalytics(false)} className="ml-auto underline font-medium hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* 4 KEY PERFORMANCE TILES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Gross Paid Revenue</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(summary.totalRevenue)}
              </h2>
              <p className="mt-1 text-xs text-slate-400">Total settled revenue</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiDollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Avg. Order Value</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(summary.averageOrderValue)}
              </h2>
              <p className="mt-1 text-xs text-slate-400">Across {summary.totalOrders} total orders</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiShoppingBag size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Deal Win Rate</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{summary.winRate}%</h2>
              <p className="mt-1 text-xs text-slate-400">Closed Won vs Closed Lost</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FiPercent size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Catalog Volume</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{summary.totalProducts}</h2>
              <p className="mt-1 text-xs text-slate-400">Products in stock system</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FiPackage size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* MONTHLY REVENUE BAR CHART & TOP PRODUCTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800">Monthly Revenue Distribution</h3>
              <p className="text-xs text-slate-400">Paid volume across the last 6 months</p>
            </div>
            <FiBarChart2 className="text-slate-400" size={20} />
          </div>

          <div className="flex h-64 items-end gap-4 pt-6 px-2">
            {monthlyRevenueData.map((item, idx) => {
              const heightPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition">
                    {formatCurrency(item.revenue)}
                  </span>
                  <div
                    style={{ height: `${Math.max(heightPercent, 6)}%` }}
                    className="w-full max-w-[48px] bg-blue-600 group-hover:bg-blue-700 rounded-t-lg transition-all"
                  ></div>
                  <span className="text-xs font-medium text-slate-500">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Top Selling Products</h3>
              <p className="text-xs text-slate-400">Ranked by realized sales</p>
            </div>
            <FiTrendingUp className="text-emerald-500" size={20} />
          </div>

          <div className="divide-y divide-slate-100">
            {topSellingProducts.length > 0 ? (
              topSellingProducts.map((p, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.unitsSold} units ordered</p>
                  </div>
                  <span className="font-bold text-sm text-slate-900">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-xs text-slate-400">No product orders logged yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* LOWER SPLIT: ORDER STATUSES & PIPELINE CONVERSION */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Order Fulfillment Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-1">Order Fulfillment Status</h3>
          <p className="text-xs text-slate-400 mb-4">Current order processing queue</p>

          <div className="space-y-3">
            {Object.entries(orderStatusCounts).map(([status, count]) => {
              const total = summary.totalOrders || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{status}</span>
                    <span>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${
                        status === "Delivered"
                          ? "bg-emerald-500"
                          : status === "Shipped"
                          ? "bg-blue-500"
                          : status === "Cancelled"
                          ? "bg-rose-500"
                          : "bg-amber-400"
                      }`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deal Funnel Conversion */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-1">Deals Pipeline Stages</h3>
          <p className="text-xs text-slate-400 mb-4">Distribution of ongoing sales opportunities</p>

          <div className="space-y-3">
            {Object.keys(stageCounts).length > 0 ? (
              Object.entries(stageCounts).map(([stage, count]) => {
                const total = summary.totalDeals || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={stage} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{stage}</span>
                      <span>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${
                          stage === "Closed Won"
                            ? "bg-emerald-500"
                            : stage === "Closed Lost"
                            ? "bg-slate-400"
                            : "bg-indigo-500"
                        }`}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-8 text-xs text-slate-400">No active deals found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
