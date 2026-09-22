import React, { useState, useEffect, useMemo } from "react";
import {
  FiPlus,
  FiDownload,
  FiSearch,
  FiEye,
  FiTrash2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiPackage,
  FiUser,
  FiCreditCard,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRotateCw,
} from "react-icons/fi";

import { ENDPOINTS } from "../config/api";
const ORDERS_API = ENDPOINTS.ORDERS;
const PRODUCTS_API = ENDPOINTS.PRODUCTS;
const CUSTOMERS_API = ENDPOINTS.CUSTOMERS;

const PAYMENT_STATUSES = ["Unpaid", "Paid", "Refunded"];
const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "Online"];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 6;

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // New Order Form
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState([
    { productId: "", quantity: 1, price: 0, stock: 0 },
  ]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [ordersRes, productsRes, customersRes] = await Promise.all([
        fetch(ORDERS_API),
        fetch(PRODUCTS_API),
        fetch(CUSTOMERS_API).catch(() => ({ ok: false })),
      ]);

      const ordersData = await ordersRes.json();
      if (!ordersRes.ok) throw new Error(ordersData.message || "Failed to load orders");
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      if (productsRes.ok) {
        const prodData = await productsRes.json();
        setProductsList(Array.isArray(prodData) ? prodData : prodData.data || []);
      }

      if (customersRes.ok) {
        const custData = await customersRes.json();
        setCustomersList(Array.isArray(custData) ? custData : custData.data || []);
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      setErrorMessage(error.message || "Unable to connect to Orders API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleExportOrdersCSV = () => {
    const list = Array.isArray(orders) ? orders : [];
    if (!list.length) {
      alert("No orders to export.");
      return;
    }

    const headers = ["Order Number", "Customer", "Items Count", "Total Amount", "Status", "Order Date"];
    const rows = list.map((o) => [
      o.orderNumber || "",
      o.customerName || (o.customer && o.customer.name) || "",
      (o.items && o.items.length) || 0,
      o.totalAmount || 0,
      o.status || "Pending",
      o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "",
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
    link.setAttribute("download", `orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleItemProductChange = (index, prodId) => {
    const product = productsList.find((p) => p._id === prodId);
    const updated = [...orderItems];
    updated[index] = {
      productId: prodId,
      quantity: 1,
      price: product ? product.price : 0,
      stock: product ? product.stock : 0,
    };
    setOrderItems(updated);
  };

  const handleItemQtyChange = (index, qty) => {
    const updated = [...orderItems];
    updated[index].quantity = Math.max(1, Number(qty) || 1);
    setOrderItems(updated);
  };

  const addItemRow = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1, price: 0, stock: 0 }]);
  };

  const removeItemRow = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculatedOrderTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  }, [orderItems]);

  const handleCustomerSelect = (id) => {
    setSelectedCustomerId(id);
    const cust = customersList.find((c) => c._id === id);
    if (cust) {
      setCustomerName(cust.name || "");
      setCustomerEmail(cust.email || "");
    }
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setCustomerName("");
    setCustomerEmail("");
    setPaymentMethod("Cash");
    setNotes("");
    setOrderItems([{ productId: "", quantity: 1, price: 0, stock: 0 }]);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Please provide customer name.");
      return;
    }

    const validItems = orderItems.filter((it) => it.productId);
    if (validItems.length === 0) {
      alert("Please select at least one item.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerId: selectedCustomerId || undefined,
        customerName,
        customerEmail,
        paymentMethod,
        notes,
        items: validItems.map((it) => {
          const prod = productsList.find((p) => p._id === it.productId);
          return {
            productId: it.productId,
            name: prod ? prod.name : "Product",
            price: it.price,
            quantity: it.quantity,
          };
        }),
        totalAmount: calculatedOrderTotal,
      };

      const res = await fetch(ORDERS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create order");

      setIsCreateOpen(false);
      resetForm();
      fetchInitialData();
    } catch (err) {
      alert(err.message || "Failed to save order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`${ORDERS_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete order");
      setOrders(orders.filter((o) => o._id !== id));
    } catch (err) {
      alert(err.message || "Could not delete order");
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${ORDERS_API}/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setOrders(orders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
      setOpenMenu(null);
    } catch (err) {
      alert(err.message || "Update failed");
    }
  };

  // Filter & Pagination
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (paymentFilter === "All") return true;
      return (o.status || "").toLowerCase() === paymentFilter.toLowerCase();
    });
  }, [orders, paymentFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentPage]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Track and manage live customer orders from database.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportOrdersCSV}
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
            Create Order
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        {["All", "Pending", "Delivered", "Cancelled"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setPaymentFilter(tab);
              setCurrentPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              paymentFilter === tab
                ? "bg-slate-900 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order._id || order.orderNumber} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {order.orderNumber || "ORD-PENDING"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {order.customerName || (order.customer && order.customer.name) || "Guest"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {order.customerEmail || (order.customer && order.customer.email) || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.items && order.items.length
                        ? `${order.items.length} item${order.items.length > 1 ? "s" : ""}`
                        : "0 items"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      Rs {(order.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          (order.status || "").toLowerCase() === "delivered"
                            ? "bg-emerald-50 text-emerald-700"
                            : (order.status || "").toLowerCase() === "cancelled"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Delete Order"
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

      {/* CREATE ORDER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Create New Order</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                >
                  <option value="">-- Choose Existing Customer (Optional) --</option>
                  {customersList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                    placeholder="Enter name"
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

              {/* Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Order Items
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      required
                      value={item.productId}
                      onChange={(e) => handleItemProductChange(idx, e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                    >
                      <option value="">Select Product</option>
                      {productsList.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (Rs {p.price})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                      className="w-20 rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                      placeholder="Qty"
                    />

                    <div className="w-24 text-right text-sm font-semibold text-slate-700">
                      Rs {(item.price * item.quantity).toLocaleString()}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={orderItems.length === 1}
                      className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-base font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-blue-600">Rs {calculatedOrderTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-end gap-3 pt-4">
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
                  {submitting ? "Saving..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ORDER MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {viewingOrder.orderNumber || "Order Details"}
                </h3>
                <p className="text-xs text-slate-400">
                  Placed on{" "}
                  {viewingOrder.createdAt
                    ? new Date(viewingOrder.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Customer</span>
                  <div className="font-semibold text-slate-900">
                    {viewingOrder.customerName ||
                      (viewingOrder.customer && viewingOrder.customer.name) ||
                      "Guest"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {viewingOrder.customerEmail ||
                      (viewingOrder.customer && viewingOrder.customer.email) ||
                      ""}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Payment</span>
                  <div className="font-semibold text-slate-900">
                    {viewingOrder.paymentMethod || "Cash"} · {viewingOrder.paymentStatus || "Paid"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Status: {viewingOrder.status || "Delivered"}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Order Items
                </span>
                <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100 p-3">
                  {(viewingOrder.items || []).map((it, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm">
                      <div>
                        <div className="font-medium text-slate-900">{it.name || "Item"}</div>
                        <div className="text-xs text-slate-400">
                          {it.quantity} x Rs {(it.price || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="font-semibold text-slate-900">
                        Rs {((it.quantity || 1) * (it.price || 0)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-base font-bold">
                <span className="text-slate-700">Total Amount</span>
                <span className="text-blue-600">
                  Rs {(viewingOrder.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingOrder(null)}
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

export default Orders;