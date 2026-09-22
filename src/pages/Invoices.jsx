import { useEffect, useState, useMemo } from "react";
import {
  FiPlus,
  FiDownload,
  FiSearch,
  FiFilter,
  FiEye,
  FiTrash2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiPrinter,
} from "react-icons/fi";

import { ENDPOINTS } from "../config/api";
const INVOICES_API = ENDPOINTS.INVOICES;
const ORDERS_API = ENDPOINTS.ORDERS;
const CUSTOMERS_API = ENDPOINTS.CUSTOMERS;

const INVOICE_STATUSES = ["Draft", "Sent", "Paid", "Overdue", "Cancelled"];

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 8;

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  // Form State
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("Thank you for your business!");
  const [customItems, setCustomItems] = useState([
    { name: "", price: 0, quantity: 1 },
  ]);

  // Fetch Data from Backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [invRes, ordRes, custRes] = await Promise.all([
        fetch(INVOICES_API),
        fetch(ORDERS_API).catch(() => ({ ok: false })),
        fetch(CUSTOMERS_API).catch(() => ({ ok: false })),
      ]);

      const invData = await invRes.json();
      if (!invRes.ok) throw new Error(invData.message || "Failed to load invoices");
      const invArray = Array.isArray(invData) ? invData : invData.value || invData.data || [];
      setInvoices(invArray);

      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrdersList(Array.isArray(ordData) ? ordData : ordData.data || []);
      }

      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomersList(Array.isArray(custData) ? custData : custData.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Unable to connect to Invoices API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When an existing order is selected, populate fields automatically
  const handleOrderSelect = (orderId) => {
    setSelectedOrderId(orderId);
    const order = ordersList.find((o) => o._id === orderId);
    if (order) {
      setCustomerName(order.customerName || (order.customer && order.customer.name) || "");
      setCustomerEmail(order.customerEmail || (order.customer && order.customer.email) || "");
      if (order.items && order.items.length > 0) {
        setCustomItems(
          order.items.map((it) => ({
            name: it.name || it.description || "Product Item",
            price: Number(it.price || it.unitPrice || 0),
            quantity: Number(it.quantity || 1),
          }))
        );
      }
    }
  };

  // Custom Item Handlers
  const handleItemChange = (index, field, value) => {
    const updated = [...customItems];
    updated[index][field] = field === "name" ? value : Number(value) || 0;
    setCustomItems(updated);
  };

  const addItemRow = () => {
    setCustomItems([...customItems, { name: "", price: 0, quantity: 1 }]);
  };

  const removeItemRow = (index) => {
    if (customItems.length === 1) return;
    setCustomItems(customItems.filter((_, i) => i !== index));
  };

  // Calculations for Create Modal
  const itemsSubtotal = useMemo(() => {
    return customItems.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  }, [customItems]);

  const taxAmount = (itemsSubtotal * (Number(taxRate) || 0)) / 100;
  const calculatedGrandTotal = Math.max(0, itemsSubtotal + taxAmount - (Number(discount) || 0));

  const resetForm = () => {
    setSelectedOrderId("");
    setCustomerName("");
    setCustomerEmail("");
    setTaxRate(0);
    setDiscount(0);
    setDueDate("");
    setNotes("Thank you for your business!");
    setCustomItems([{ name: "", price: 0, quantity: 1 }]);
  };

  // Create Invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert("Customer name is required");
      return;
    }

    const validItems = customItems.filter((it) => it.name.trim() && Number(it.price) >= 0);
    if (validItems.length === 0) {
      alert("Please provide at least one valid item");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        orderId: selectedOrderId || null,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        items: validItems.map((it) => ({
          name: it.name.trim(),
          description: it.name.trim() || "Item",
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
          unitPrice: Number(it.price) || 0,
          total: (Number(it.quantity) || 1) * (Number(it.price) || 0),
        })),
        subtotal: itemsSubtotal,
        taxRate: Number(taxRate) || 0,
        taxAmount: taxAmount,
        discount: Number(discount) || 0,
        totalAmount: calculatedGrandTotal,
        dueDate: dueDate || undefined,
        notes,
      };

      const res = await fetch(INVOICES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create invoice");

      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (invoiceId, newStatus) => {
    try {
      const res = await fetch(`${INVOICES_API}/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setInvoices(invoices.map((inv) => (inv._id === invoiceId ? { ...inv, status: newStatus } : inv)));
    } catch (err) {
      alert(err.message || "Failed to update invoice status");
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`${INVOICES_API}/${invoiceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete invoice");
      setInvoices(invoices.filter((inv) => inv._id !== invoiceId));
    } catch (err) {
      alert(err.message || "Failed to delete invoice");
    }
  };

  const handleExportCSV = () => {
    const list = Array.isArray(invoices) ? invoices : [];
    if (!list.length) return alert("No invoices to export.");

    const headers = ["Invoice Number", "Customer", "Subtotal", "Tax", "Discount", "Total Due", "Status", "Issue Date", "Due Date"];
    const rows = list.map((inv) => [
      inv.invoiceNumber || "",
      inv.customerName || (inv.customer && inv.customer.name) || "",
      inv.subtotal || 0,
      inv.taxAmount || 0,
      inv.discount || 0,
      inv.totalAmount || 0,
      inv.status || "Draft",
      inv.issueDate || inv.createdAt ? new Date(inv.issueDate || inv.createdAt).toLocaleDateString() : "",
      inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "",
    ]);

    const lines = [headers.join(",")];
    rows.forEach((r) => {
      lines.push(
        r
          .map((f) => {
            const t = String(f).replace(/"/g, '""');
            return t.includes(",") || t.includes('"') || t.includes("\n") ? `"${t}"` : t;
          })
          .join(",")
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Top Metric Cards Calculations
  const totalInvoiced = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  }, [invoices]);

  const paidInvoices = useMemo(() => {
    return invoices.filter((inv) => (inv.status || "").toLowerCase() === "paid");
  }, [invoices]);

  const paidTotal = useMemo(() => {
    return paidInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  }, [paidInvoices]);

  const pendingCount = useMemo(() => {
    return invoices.filter((inv) => ["sent", "draft"].includes((inv.status || "").toLowerCase())).length;
  }, [invoices]);

  const overdueCount = useMemo(() => {
    return invoices.filter((inv) => (inv.status || "").toLowerCase() === "overdue").length;
  }, [invoices]);

  // Filtering & Pagination
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        (inv.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.customerName || (inv.customer && inv.customer.name) || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (inv.customerEmail || (inv.customer && inv.customer.email) || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || (inv.status || "").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * invoicesPerPage;
    return filteredInvoices.slice(start, start + invoicesPerPage);
  }, [filteredInvoices, currentPage]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate and manage billing invoices for customer orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FiDownload size={18} />
            Export CSV
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiPlus size={18} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={fetchData} className="ml-auto font-medium underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* METRIC TILES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Invoiced</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalInvoiced)}</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiFileText size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Paid Invoices</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(paidTotal)}</h2>
              <p className="mt-1 text-xs text-slate-400">{paidInvoices.length} paid</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FiDollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{pendingCount}</h2>
              <p className="mt-1 text-xs text-slate-400">Sent or Draft</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FiClock size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Overdue</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{overdueCount}</h2>
              <p className="mt-1 text-xs text-slate-400">Requires follow-up</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <FiAlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search invoice #, customer name, email..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
            >
              <option value="All">All Statuses</option>
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Issue Date</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <FiFileText size={16} />
                        </div>
                        <div>
                          <div>{inv.invoiceNumber}</div>
                          <div className="text-xs font-normal text-slate-400">
                            {inv.items ? inv.items.length : 0} items
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {inv.customerName || (inv.customer && inv.customer.name) || "Customer"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {inv.customerEmail || (inv.customer && inv.customer.email) || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {inv.issueDate || inv.createdAt
                        ? new Date(inv.issueDate || inv.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "Upon receipt"}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={inv.status || "Draft"}
                        onChange={(e) => handleUpdateStatus(inv._id, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold outline-none ${
                          (inv.status || "").toLowerCase() === "paid"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : (inv.status || "").toLowerCase() === "overdue"
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : (inv.status || "").toLowerCase() === "sent"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {INVOICE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title="View Invoice"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv._id)}
                          className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Delete Invoice"
                        >
                          <FiTrash2 size={16} />
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
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE INVOICE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Create New Invoice</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4">
              {/* Optional Order Preload */}
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Import From Existing Order (Optional)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                >
                  <option value="">-- Manual Entry or Select Order --</option>
                  {ordersList.map((ord) => (
                    <option key={ord._id} value={ord._id}>
                      {ord.orderNumber} - {ord.customerName} ({formatCurrency(ord.totalAmount)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Customer Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs font-semibold text-slate-600">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                />
              </div>

              {/* Items Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                {customItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Item name / description"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                    />
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      className="w-20 rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Unit Price"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                      className="w-28 rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                    />
                    <div className="w-24 text-right text-sm font-semibold text-slate-700">
                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={customItems.length === 1}
                      className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Financial Breakdowns */}
              <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(itemsSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Tax (%):</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-16 rounded border border-slate-200 px-2 py-0.5 text-xs outline-none"
                    />
                  </div>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Discount:</span>
                    <input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-20 rounded border border-slate-200 px-2 py-0.5 text-xs outline-none"
                    />
                  </div>
                  <span>-{formatCurrency(discount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">{formatCurrency(calculatedGrandTotal)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-600">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INVOICE MODAL */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {viewingInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Issued:{" "}
                  {viewingInvoice.issueDate || viewingInvoice.createdAt
                    ? new Date(viewingInvoice.issueDate || viewingInvoice.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Billed To</span>
                  <div className="font-semibold text-slate-900">
                    {viewingInvoice.customerName ||
                      (viewingInvoice.customer && viewingInvoice.customer.name) ||
                      "Client"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {viewingInvoice.customerEmail ||
                      (viewingInvoice.customer && viewingInvoice.customer.email) ||
                      ""}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Status</span>
                  <div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        (viewingInvoice.status || "").toLowerCase() === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {viewingInvoice.status || "Draft"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Due:{" "}
                    {viewingInvoice.dueDate
                      ? new Date(viewingInvoice.dueDate).toLocaleDateString()
                      : "Upon receipt"}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Line Items
                </span>
                <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100 p-3">
                  {(viewingInvoice.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between py-2 text-sm">
                      <div>
                        <div className="font-medium text-slate-900">
                          {it.description || it.name || "Item"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {it.quantity} x {formatCurrency(it.unitPrice || it.price || 0)}
                        </div>
                      </div>
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(
                          it.total || (it.quantity || 1) * (it.unitPrice || it.price || 0)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(viewingInvoice.subtotal)}</span>
                </div>
                {viewingInvoice.taxRate > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({viewingInvoice.taxRate}%):</span>
                    <span>{formatCurrency(viewingInvoice.taxAmount)}</span>
                  </div>
                )}
                {viewingInvoice.discount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(viewingInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
                  <span>Total Due:</span>
                  <span className="text-blue-600">
                    {formatCurrency(viewingInvoice.totalAmount)}
                  </span>
                </div>
              </div>

              {viewingInvoice.notes && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  <strong>Notes:</strong> {viewingInvoice.notes}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FiPrinter size={16} /> Print
              </button>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
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

export default Invoices;