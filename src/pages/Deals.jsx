import React, { useState, useEffect, useMemo } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiCalendar,
  FiUser,
  FiMail,
  FiFileText,
  FiX,
  FiAlertCircle,
  FiCheck,
} from "react-icons/fi";

import { ENDPOINTS } from "../config/api";
const API_URL = ENDPOINTS.DEALS;
const CUSTOMERS_URL = ENDPOINTS.CUSTOMERS;

const STAGES = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const PRIORITIES = ["Low", "Medium", "High"];

const initialFormState = {
  title: "",
  customer: "",
  customerRef: "",
  email: "",
  value: "",
  stage: "New",
  priority: "Medium",
  expectedCloseDate: "",
  notes: "",
};

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [form, setForm] = useState(initialFormState);

  // ===============================
  // Fetch Deals & Customers
  // ===============================
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [dealsRes, customersRes] = await Promise.all([
        fetch(API_URL, { headers }),
        fetch(CUSTOMERS_URL, { headers }).catch(() => null),
      ]);

      const dealsData = await dealsRes.json();
      if (!dealsRes.ok) {
        throw new Error(dealsData.message || "Failed to load deals from server");
      }
      setDeals(Array.isArray(dealsData) ? dealsData : dealsData.data || []);

      if (customersRes && customersRes.ok) {
        const custData = await customersRes.json();
        setCustomers(Array.isArray(custData) ? custData : custData.customers || []);
      }
    } catch (error) {
      console.error("Fetch data error:", error);
      setErrorMessage(error.message || "Network error: Unable to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===============================
  // Modal Handlers
  // ===============================
  const openCreateModal = () => {
    setEditingDeal(null);
    setForm(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (deal) => {
    setEditingDeal(deal);
    setForm({
      title: deal.title || "",
      customer: deal.customer || (deal.customerRef?.name) || "",
      customerRef: deal.customerRef?._id || deal.customerRef || "",
      email: deal.email || (deal.customerRef?.email) || "",
      value: deal.value !== undefined ? deal.value : "",
      stage: deal.stage || "New",
      priority: deal.priority || "Medium",
      expectedCloseDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toISOString().split("T")[0]
        : "",
      notes: deal.notes || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDeal(null);
    setForm(initialFormState);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setForm((prev) => ({
        ...prev,
        customerRef: "",
      }));
      return;
    }

    const selectedCust = customers.find((c) => c._id === selectedId);
    if (selectedCust) {
      setForm((prev) => ({
        ...prev,
        customerRef: selectedCust._id,
        customer: selectedCust.name,
        email: selectedCust.email || prev.email,
      }));
    }
  };

  // ===============================
  // Save / Update Deal
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Deal title is required");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const isEditing = Boolean(editingDeal && editingDeal._id);
      const url = isEditing ? `${API_URL}/${editingDeal._id}` : API_URL;
      const method = isEditing ? "PUT" : "POST";
      const token = localStorage.getItem("token");

      const payload = {
        title: form.title.trim(),
        customer: form.customer.trim(),
        customerRef: form.customerRef || null,
        email: form.email.trim(),
        value: Number(form.value) || 0,
        stage: form.stage,
        priority: form.priority,
        expectedCloseDate: form.expectedCloseDate ? new Date(form.expectedCloseDate) : null,
        notes: form.notes.trim(),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to save deal");
      }

      closeModal();
      await fetchData();
    } catch (error) {
      console.error("Save deal error:", error);
      alert(error.message || "Failed to save deal.");
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // Delete Deal
  // ===============================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this deal?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete deal");
      }

      await fetchData();
    } catch (error) {
      console.error("Delete deal error:", error);
      alert(error.message || "Error deleting deal");
    }
  };

  // ===============================
  // Formatting & Helpers
  // ===============================
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const custName = deal.customer || deal.customerRef?.name || "";
      const matchesSearch =
        deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStage = stageFilter === "All" || deal.stage === stageFilter;
      const matchesPriority = priorityFilter === "All" || deal.priority === priorityFilter;

      return matchesSearch && matchesStage && matchesPriority;
    });
  }, [deals, searchTerm, stageFilter, priorityFilter]);

  const metrics = useMemo(() => {
    const totalPipeline = deals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    const wonDeals = deals.filter((d) => d.stage === "Won");
    const wonValue = wonDeals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
    const openDeals = deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost");

    return {
      totalCount: deals.length,
      pipelineValue: totalPipeline,
      wonCount: wonDeals.length,
      wonRevenue: wonValue,
      openCount: openDeals.length,
    };
  }, [deals]);

  const getStageBadgeColor = (stage) => {
    switch (stage) {
      case "Won":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Lost":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "Negotiation":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Proposal":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Qualified":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-50 text-red-700 border-red-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Deals Pipeline</h1>
          <p className="text-sm text-slate-500">Track and manage your sales pipeline and deal closures</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors gap-2"
        >
          <FiPlus className="w-5 h-5" />
          Add Deal
        </button>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={fetchData}
            className="ml-auto underline font-medium hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pipeline Value</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(metrics.pipelineValue)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FiDollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Won Revenue</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(metrics.wonRevenue)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <FiTrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Deals</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{metrics.openCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <FiCheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Deals</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{metrics.totalCount}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
            <FiFileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search deals, customers, emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading deals pipeline...</div>
        ) : filteredDeals.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No deals found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Deal Title</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Value</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Expected Close</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDeals.map((deal) => {
                  const customerDisplay = deal.customer || deal.customerRef?.name || "—";
                  const isLinkedCustomer = Boolean(deal.customerRef);

                  return (
                    <tr key={deal._id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div>{deal.title}</div>
                        {deal.notes && (
                          <div className="text-xs text-slate-400 line-clamp-1 max-w-xs">{deal.notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-800">{customerDisplay}</span>
                          {isLinkedCustomer && (
                            <span title="Linked to Customer Profile" className="inline-flex items-center text-blue-600">
                              <FiCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        {deal.email && <div className="text-xs text-slate-400">{deal.email}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {formatCurrency(deal.value)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStageBadgeColor(
                            deal.stage
                          )}`}
                        >
                          {deal.stage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${getPriorityBadgeColor(
                            deal.priority
                          )}`}
                        >
                          {deal.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {deal.expectedCloseDate
                          ? new Date(deal.expectedCloseDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(deal)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Deal"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(deal._id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Deal"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          onClick={closeModal}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 cursor-default"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingDeal ? "Edit Deal" : "Create New Deal"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <FiX className="w-5 h-5 pointer-events-none" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Enterprise License"
                  value={form.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              {/* Customer selection from DB */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Existing Customer (Optional)
                </label>
                <select
                  value={form.customerRef || ""}
                  onChange={handleCustomerSelect}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                >
                  <option value="">-- Choose from Customers (or enter below) --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.company ? `(${c.company})` : ""} - {c.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Customer / Company Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      name="customer"
                      placeholder="Acme Corp"
                      value={form.customer}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      placeholder="contact@acme.com"
                      value={form.email}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Value (PKR)
                  </label>
                  <input
                    type="number"
                    name="value"
                    min="0"
                    placeholder="0"
                    value={form.value}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Stage
                  </label>
                  <select
                    name="stage"
                    value={form.stage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Expected Close Date
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    name="expectedCloseDate"
                    value={form.expectedCloseDate}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Notes / Details
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  placeholder="Add deal specifics or requirements..."
                  value={form.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
                >
                  {saving ? "Saving..." : editingDeal ? "Update Deal" : "Create Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
