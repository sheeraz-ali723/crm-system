import { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiDownload,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiUsers,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
} from "react-icons/fi";

import { ENDPOINTS } from "../config/api";
const API_URL = ENDPOINTS.CUSTOMERS;

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  status: "Active",
  notes: "",
};

function Customer() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");

  // Sorting
  const [sortBy, setSortBy] = useState("default");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 5;

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);

  // Form
  const [formData, setFormData] = useState(emptyForm);

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  // ==========================================
  // FETCH CUSTOMERS
  // ==========================================

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch customers");
      }

      setCustomers(Array.isArray(data) ? data : (data.customers || []));
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ==========================================
  // AUTO HIDE SUCCESS MESSAGE
  // ==========================================

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  // ==========================================
  // OPEN ADD MODAL
  // ==========================================

      const handleExportCSV = () => {
    const listToExport = Array.isArray(customers) ? customers : [];
    if (listToExport.length === 0) {
      alert("No customers to export.");
      return;
    }

    const headers = ["Name", "Email", "Phone", "Company", "Status", "Created At"];
    const rows = listToExport.map((c) => [
      c.name || "",
      c.email || "",
      c.phone || "",
      c.company || "",
      c.status || "active",
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
    ]);

    const csvLines = [headers.join(",")];
    rows.forEach((row) => {
      const escaped = row.map((field) => {
        const text = String(field).replace(/"/g, '""');
        return text.includes(",") || text.includes('"') || text.includes("\n")
          ? '"' + text + '"'
          : text;
      });
      csvLines.push(escaped.join(","));
    });

    const csvContent = csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "customers_" + new Date().toISOString().slice(0, 10) + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

const openAddModal = () => {
    setEditingCustomer(null);
    setFormData(emptyForm);
    setShowModal(true);
    setError("");
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (customer) => {
    setEditingCustomer(customer);

    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      address: customer.address || "",
      city: customer.city || "",
      status: customer.status || "Active",
      notes: customer.notes || "",
    });

    setShowModal(true);
    setError("");
  };

  // ==========================================
  // CLOSE FORM MODAL
  // ==========================================

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData(emptyForm);
    setError("");
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // ADD / UPDATE CUSTOMER
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Customer email is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const isEditing = Boolean(editingCustomer);

      const url = isEditing
        ? `${API_URL}/${editingCustomer._id}`
        : API_URL;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${isEditing ? "update" : "add"} customer`
        );
      }

      setMessage(
        isEditing
          ? "Customer updated successfully!"
          : "Customer added successfully!"
      );

      closeModal();

      await fetchCustomers();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE CUSTOMER
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete customer");
      }

      setMessage("Customer deleted successfully!");

      await fetchCustomers();
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  // ==========================================
  // GET UNIQUE CITIES
  // ==========================================

  const cities = useMemo(() => {
    const cityList = customers
      .map((customer) => customer.city?.trim())
      .filter(Boolean);

    return [...new Set(cityList)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [customers]);

  // ==========================================
  // FILTER + SORT CUSTOMERS
  // ==========================================

  const filteredCustomers = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const filtered = customers.filter((customer) => {
      const matchesSearch =
        !searchText ||
        customer.name?.toLowerCase().includes(searchText) ||
        customer.email?.toLowerCase().includes(searchText) ||
        customer.company?.toLowerCase().includes(searchText) ||
        customer.phone?.toLowerCase().includes(searchText) ||
        customer.city?.toLowerCase().includes(searchText) ||
        customer.address?.toLowerCase().includes(searchText) ||
        customer.status?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        customer.status === statusFilter;

      const matchesCity =
        cityFilter === "All" ||
        customer.city === cityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCity
      );
    });

    // Make a copy before sorting
    const sorted = [...filtered];

    // ========================================
    // SORTING
    // ========================================

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

    if (sortBy === "newest") {
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      });
    }

    if (sortBy === "oldest") {
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateA - dateB;
      });
    }

    return sorted;
  }, [
    customers,
    search,
    statusFilter,
    cityFilter,
    sortBy,
  ]);

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.ceil(
    filteredCustomers.length / customersPerPage
  );

  const startIndex =
    (currentPage - 1) * customersPerPage;

  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + customersPerPage
  );

  // ==========================================
  // KEEP PAGE VALID
  // ==========================================

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

  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // ==========================================
  // STATUS FILTER
  // ==========================================

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // ==========================================
  // CITY FILTER
  // ==========================================

  const handleCityFilter = (e) => {
    setCityFilter(e.target.value);
    setCurrentPage(1);
  };

  // ==========================================
  // SORT
  // ==========================================

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  // ==========================================
  // CLEAR SEARCH / FILTERS / SORT
  // ==========================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCityFilter("All");
    setSortBy("default");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "All" ||
    cityFilter !== "All" ||
    sortBy !== "default";

  // ==========================================
  // CUSTOMER INITIALS
  // ==========================================

  const getInitials = (name) => {
    if (!name) return "CU";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusStyle = (status) => {
    if (status === "Active") {
      return "bg-emerald-100 text-emerald-700";
    }

    return "bg-red-100 text-red-700";
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>

          <p className="text-sm text-gray-500">
            Loading customers...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Customers
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your customers and their information
          </p>
        </div>

        <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FiDownload size={18} />
            Export CSV
          </button>
          <button onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <FiPlus size={18} />
          Add Customer
        </button>
      </div>

      {/* SUCCESS MESSAGE */}

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && !showModal && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* SEARCH + FILTERS + SORT */}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-4">
          {/* Search */}

          <div className="relative lg:col-span-1">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={19}
            />

            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search customers..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status */}

          <div className="relative">
            <FiFilter
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={17}
            />

            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* City */}

          <select
            value={cityFilter}
            onChange={handleCityFilter}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="All">All Cities</option>

            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Sort */}

          <select
            value={sortBy}
            onChange={handleSortChange}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="default">Sort By</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="newest">Newest Customers</option>
            <option value="oldest">Oldest Customers</option>
          </select>
        </div>

        {/* FILTER INFO */}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FiUsers size={16} />

            <span>
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {filteredCustomers.length}
              </span>{" "}
              customer
              {filteredCustomers.length !== 1 ? "s" : ""}
            </span>

            {hasActiveFilters && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                Filters / sorting applied
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700"
            >
              <FiX size={16} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* CUSTOMER TABLE */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phone
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Company
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  City
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="border-b border-gray-100 transition hover:bg-gray-50"
                  >
                    {/* Customer */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                          {getInitials(customer.name)}
                        </div>

                        <div>
                          <p className="font-medium text-gray-800">
                            {customer.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {customer.phone || "—"}
                    </td>

                    {/* Company */}

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {customer.company || "—"}
                    </td>

                    {/* City */}

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {customer.city || "—"}
                    </td>

                    {/* Status */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          customer.status
                        )}`}
                      >
                        {customer.status || "Active"}
                      </span>
                    </td>

                    {/* Actions */}

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {/* View */}

                        <button
                          onClick={() =>
                            setViewingCustomer(customer)
                          }
                          className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                          title="View customer"
                        >
                          <FiEye size={17} />
                        </button>

                        {/* Edit */}

                        <button
                          onClick={() =>
                            openEditModal(customer)
                          }
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                          title="Edit customer"
                        >
                          <FiEdit2 size={17} />
                        </button>

                        {/* Delete */}

                        <button
                          onClick={() =>
                            handleDelete(customer._id)
                          }
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Delete customer"
                        >
                          <FiTrash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-14 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                        <FiUsers
                          size={25}
                          className="text-gray-400"
                        />
                      </div>

                      <h3 className="font-medium text-gray-700">
                        No customers found
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search or filters.
                      </p>

                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        {filteredCustomers.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {startIndex + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-gray-700">
                {Math.min(
                  startIndex + customersPerPage,
                  filteredCustomers.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {filteredCustomers.length}
              </span>{" "}
              customers
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* Previous */}

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.max(prev - 1, 1)
                    )
                  }
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Previous page"
                >
                  <FiChevronLeft size={17} />
                </button>

                {/* Page Numbers */}

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {/* Next */}

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Next page"
                >
                  <FiChevronRight size={17} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingCustomer
                    ? "Update customer information"
                    : "Enter customer information"}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Name + Email */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              {/* Phone + Company */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Company
                  </label>

                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* City + Status */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Address */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Address
                </label>

                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Notes */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add notes about this customer..."
                  rows="4"
                  className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingCustomer
                    ? "Update Customer"
                    : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW CUSTOMER MODAL */}

      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800">
                Customer Details
              </h2>

              <button
                onClick={() => setViewingCustomer(null)}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                  {getInitials(viewingCustomer.name)}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {viewingCustomer.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {viewingCustomer.email}
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      viewingCustomer.status
                    )}`}
                  >
                    {viewingCustomer.status || "Active"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Phone
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {viewingCustomer.phone || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Company
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {viewingCustomer.company || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    City
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {viewingCustomer.city || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Status
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {viewingCustomer.status || "—"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Address
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {viewingCustomer.address || "—"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Notes
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {viewingCustomer.notes || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewingCustomer(null)}
                  className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customer;
