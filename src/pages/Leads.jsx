import { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiRefreshCw,
  FiUsers,
  FiDollarSign,
  FiPhone,
  FiMail,
  FiUserCheck,
} from "react-icons/fi";

import { ENDPOINTS } from "../config/api";
const API_URL = ENDPOINTS.LEADS;

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "Website",
  status: "New",
  priority: "Medium",
  value: "",
  notes: "",
};

function Leads() {
  const [leads, setLeads] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [viewingLead, setViewingLead] = useState(null);
  const [editingLead, setEditingLead] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [convertingId, setConvertingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const itemsPerPage = 5;

  // =====================================================
  // FETCH LEADS
  // =====================================================

  const fetchLeads = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch leads");
      }

      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // =====================================================
  // FORM HANDLING
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  const openAddModal = () => {
    setEditingLead(null);
    setFormData(emptyForm);
    setMessage("");
    setError("");
    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (lead) => {
    setEditingLead(lead);

    setFormData({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      source: lead.source || "Website",
      status: lead.status || "New",
      priority: lead.priority || "Medium",
      value: lead.value ?? "",
      notes: lead.notes || "",
    });

    setMessage("");
    setError("");
    setShowModal(true);
  };

  // =====================================================
  // SAVE LEAD
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!formData.name.trim()) {
        throw new Error("Lead name is required");
      }

      if (!formData.email.trim()) {
        throw new Error("Lead email is required");
      }

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const payload = {
        ...formData,
        value: Number(formData.value) || 0,
      };

      const url = editingLead
        ? `${API_URL}/${editingLead._id}`
        : API_URL;

      const method = editingLead ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save lead");
      }

      setMessage(
        editingLead
          ? "Lead updated successfully"
          : "Lead created successfully"
      );

      setShowModal(false);
      setFormData(emptyForm);
      setEditingLead(null);

      await fetchLeads(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CONVERT LEAD TO CUSTOMER
  // =====================================================

  const handleConvertLead = async (lead) => {
    const confirmed = window.confirm(
      `Convert "${lead.name}" into a Customer? This will create a permanent Customer profile and set lead status to Converted.`
    );

    if (!confirmed) return;

    try {
      setConvertingId(lead._id);
      setError("");
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_URL}/${lead._id}/convert`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to convert lead");
      }

      setMessage(`🎉 Successfully converted "${lead.name}" to Customer!`);
      if (viewingLead && viewingLead._id === lead._id) {
        setViewingLead({ ...viewingLead, status: "Converted" });
      }

      await fetchLeads(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to convert lead");
    } finally {
      setConvertingId(null);
    }
  };

  // =====================================================
  // DELETE LEAD
  // =====================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete lead");
      }

      setMessage("Lead deleted successfully");

      await fetchLeads(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete lead");
    }
  };

  // =====================================================
  // FILTER + SEARCH + SORT
  // =====================================================

  const filteredLeads = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    const filtered = leads.filter((lead) => {
      const matchesSearch =
        !searchText ||
        lead.name?.toLowerCase().includes(searchText) ||
        lead.email?.toLowerCase().includes(searchText) ||
        lead.phone?.toLowerCase().includes(searchText) ||
        lead.company?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        lead.status === statusFilter;

      const matchesSource =
        sourceFilter === "All" ||
        lead.source === sourceFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        lead.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSource &&
        matchesPriority
      );
    });

    const sorted = [...filtered];

    if (sortBy === "name-asc") {
      sorted.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    }

    if (sortBy === "name-desc") {
      sorted.sort((a, b) =>
        (b.name || "").localeCompare(a.name || "")
      );
    }

    if (sortBy === "value-high") {
      sorted.sort(
        (a, b) => Number(b.value || 0) - Number(a.value || 0)
      );
    }

    if (sortBy === "value-low") {
      sorted.sort(
        (a, b) => Number(a.value || 0) - Number(b.value || 0)
      );
    }

    if (sortBy === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }

    if (sortBy === "oldest") {
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
    }

    return sorted;
  }, [
    leads,
    search,
    statusFilter,
    sourceFilter,
    priorityFilter,
    sortBy,
  ]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages = Math.ceil(
    filteredLeads.length / itemsPerPage
  );

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSourceFilter("All");
    setPriorityFilter("All");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalLeads = leads.length;

  const newLeads = leads.filter(
    (lead) => lead.status === "New"
  ).length;

  const qualifiedLeads = leads.filter(
    (lead) => lead.status === "Qualified"
  ).length;

  const totalPipelineValue = leads.reduce(
    (sum, lead) => sum + Number(lead.value || 0),
    0
  );

  // =====================================================
  // HELPERS
  // =====================================================

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "LD";

    const words = name.trim().split(" ");

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (
      words[0][0] + words[words.length - 1][0]
    ).toUpperCase();
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "New":
        return "bg-blue-50 text-blue-700";

      case "Contacted":
        return "bg-purple-50 text-purple-700";

      case "Qualified":
        return "bg-emerald-50 text-emerald-700";

      case "Converted":
        return "bg-green-100 text-green-800 font-semibold";

      case "Lost":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-50 text-red-700";

      case "Medium":
        return "bg-amber-50 text-amber-700";

      case "Low":
        return "bg-slate-50 text-slate-600";

      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-40 rounded bg-slate-200"></div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 rounded-2xl bg-white"
              ></div>
            ))}
          </div>

          <div className="mt-6 h-[600px] rounded-2xl bg-white"></div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Leads
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage and track your potential customers.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => fetchLeads(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <FiRefreshCw
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <FiPlus />
              Add Lead
            </button>
          </div>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Total Leads
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {totalLeads}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiUsers className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  New Leads
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {newLeads}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <FiPlus className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Qualified
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {qualifiedLeads}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FiUsers className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Pipeline Value
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(totalPipelineValue)}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <FiDollarSign className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center gap-2">
            <FiFilter className="text-blue-600" />

            <h2 className="font-semibold text-slate-900">
              Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">

            {/* SEARCH */}
            <div className="relative lg:col-span-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* STATUS */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Lost">Lost</option>
              <option value="Converted">Converted</option>
            </select>

            {/* SOURCE */}
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Sources</option>
              <option value="Website">Website</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Referral">Referral</option>
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="Other">Other</option>
            </select>

            {/* PRIORITY */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 sm:w-56"
            >
              <option value="newest">
                Newest Leads
              </option>

              <option value="oldest">
                Oldest Leads
              </option>

              <option value="name-asc">
                Name A-Z
              </option>

              <option value="name-desc">
                Name Z-A
              </option>

              <option value="value-high">
                Highest Value
              </option>

              <option value="value-low">
                Lowest Value
              </option>
            </select>

            {(search ||
              statusFilter !== "All" ||
              sourceFilter !== "All" ||
              priorityFilter !== "All" ||
              sortBy !== "newest") && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            )}

          </div>
        </div>

        {/* TABLE */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">

              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Lead
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contact
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Source
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Priority
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Value
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <FiUsers className="h-6 w-6" />
                        </div>

                        <h3 className="mt-4 font-semibold text-slate-800">
                          No leads found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Try changing your filters or add a new lead.
                        </p>

                        <button
                          onClick={openAddModal}
                          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          <FiPlus />
                          Add Lead
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr
                      key={lead._id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >

                      {/* LEAD */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                            {getInitials(lead.name)}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {lead.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {lead.company || "No company"}
                            </p>

                          </div>

                        </div>
                      </td>

                      {/* CONTACT */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <FiMail />
                            {lead.email}
                          </div>

                          {lead.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <FiPhone />
                              {lead.phone}
                            </div>
                          )}

                        </div>
                      </td>

                      {/* SOURCE */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {lead.source}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                            lead.status
                          )}`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* PRIORITY */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPriorityStyle(
                            lead.priority
                          )}`}
                        >
                          {lead.priority}
                        </span>
                      </td>

                      {/* VALUE */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-700">
                          {formatCurrency(lead.value)}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">

                          {/* CONVERT BUTTON */}
                          {lead.status === "Converted" ? (
                            <span
                              className="rounded-lg p-2 text-emerald-600 opacity-60 cursor-default"
                              title="Already Converted to Customer"
                            >
                              <FiUserCheck className="h-4 w-4" />
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConvertLead(lead)}
                              disabled={convertingId === lead._id}
                              className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                              title="Convert to Customer"
                            >
                              <FiUserCheck
                                className={`h-4 w-4 ${
                                  convertingId === lead._id ? "animate-spin" : ""
                                }`}
                              />
                            </button>
                          )}

                          <button
                            onClick={() => setViewingLead(lead)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                            title="View"
                          >
                            <FiEye />
                          </button>

                          <button
                            onClick={() => openEditModal(lead)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            onClick={() => handleDelete(lead._id)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredLeads.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-700">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredLeads.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-700">
                  {filteredLeads.length}
                </span>{" "}
                leads
              </p>

              <div className="flex items-center gap-2">

                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => prev - 1)
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft />
                </button>

                <span className="px-3 text-sm font-medium text-slate-600">
                  {currentPage} / {totalPages || 1}
                </span>

                <button
                  disabled={
                    currentPage === totalPages ||
                    totalPages === 0
                  }
                  onClick={() =>
                    setCurrentPage((prev) => prev + 1)
                  }
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronRight />
                </button>

              </div>

            </div>
          )}

        </div>
      </div>

      {/* ================================================= */}
      {/* ADD / EDIT MODAL */}
      {/* ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

          <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingLead ? "Edit Lead" : "Add New Lead"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingLead
                    ? "Update lead information."
                    : "Enter the lead information below."}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FiX className="h-5 w-5" />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* NAME + EMAIL */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Lead Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter lead name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

              </div>

              {/* PHONE + COMPANY */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="03XX-XXXXXXX"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Company
                  </label>

                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Company name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>

              {/* SOURCE + STATUS */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Source
                  </label>

                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Website">Website</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Referral">Referral</option>
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Lost">Lost</option>
                    <option value="Converted">Converted</option>
                  </select>
                </div>

              </div>

              {/* PRIORITY + VALUE */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Priority
                  </label>

                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Estimated Value (PKR)
                  </label>

                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    placeholder="50000"
                    min="0"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>

              {/* NOTES */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Add notes about this lead..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                ></textarea>
              </div>

              {/* FORM ERROR */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <FiRefreshCw className="animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingLead
                    ? "Update Lead"
                    : "Create Lead"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* VIEW LEAD MODAL */}
      {/* ================================================= */}
{/* ================================================= */}
      {/* VIEW LEAD MODAL */}
      {/* ================================================= */}

      {viewingLead && (
        <div 
          onClick={() => setViewingLead(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm cursor-pointer"
        >
          {/* Modal Container: stopPropagation prevents backdrop clicks from inside */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl cursor-default"
          >

            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Lead Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Complete information about this lead.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingLead(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                aria-label="Close modal"
              >
                <FiX className="h-5 w-5 pointer-events-none" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 p-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                  {getInitials(viewingLead.name)}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {viewingLead.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {viewingLead.company || "No company"}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 break-all text-sm font-medium text-slate-800">
                    {viewingLead.email}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Phone
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {viewingLead.phone || "Not provided"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Source
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {viewingLead.source}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Status
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                      viewingLead.status
                    )}`}
                  >
                    {viewingLead.status}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Priority
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPriorityStyle(
                      viewingLead.priority
                    )}`}
                  >
                    {viewingLead.priority}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Estimated Value
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatCurrency(viewingLead.value)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  Notes
                </p>
                <div className="mt-2 rounded-xl bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {viewingLead.notes || "No notes available."}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="text-xs text-slate-400">
                Created: {formatDate(viewingLead.createdAt)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              {viewingLead.status !== "Converted" ? (
                <button
                  type="button"
                  onClick={() => handleConvertLead(viewingLead)}
                  disabled={convertingId === viewingLead._id}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                >
                  <FiUserCheck
                    className={
                      convertingId === viewingLead._id ? "animate-spin" : ""
                    }
                  />
                  Convert to Customer
                </button>
              ) : (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  ✓ Already Converted
                </span>
              )}

              <button
                type="button"
                onClick={() => setViewingLead(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Leads;
