import React, {
  useState,
  useEffect,
  useMemo,
} from "react";

import {
  FiPlus,
  FiDownload,
  FiEye,
  FiTrash2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";

import { ENDPOINTS } from "../config/api";

const ORDERS_API = ENDPOINTS.ORDERS;
const PRODUCTS_API = ENDPOINTS.PRODUCTS;
const CUSTOMERS_API = ENDPOINTS.CUSTOMERS;

function Orders() {
  /* =====================================================
     STATE
  ===================================================== */

  const [orders, setOrders] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);

  const ordersPerPage = 6;

  /* =====================================================
     MODALS
  ===================================================== */

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [viewingOrder, setViewingOrder] = useState(null);

  /* =====================================================
     FORM
  ===================================================== */

  const [selectedCustomerId, setSelectedCustomerId] =
    useState("");

  const [customerName, setCustomerName] = useState("");

  const [customerEmail, setCustomerEmail] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [notes, setNotes] = useState("");

  const [orderItems, setOrderItems] = useState([
    {
      productId: "",
      quantity: 1,
      price: 0,
      stock: 0,
    },
  ]);

  /* =====================================================
     FETCH INITIAL DATA
  ===================================================== */

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [
        ordersRes,
        productsRes,
        customersRes,
      ] = await Promise.all([
        fetch(ORDERS_API),

        fetch(PRODUCTS_API),

        fetch(CUSTOMERS_API).catch(() => ({
          ok: false,
        })),
      ]);

      /* =================================================
         ORDERS
      ================================================= */

      const ordersData = await ordersRes.json();

      console.log(
        "GET ORDERS RESPONSE:",
        ordersData
      );

      if (!ordersRes.ok) {
        throw new Error(
          ordersData.message ||
            "Failed to load orders"
        );
      }

      const ordersArray = Array.isArray(
        ordersData
      )
        ? ordersData
        : Array.isArray(ordersData.orders)
        ? ordersData.orders
        : [];

      console.log(
        "ORDERS ARRAY:",
        ordersArray
      );

      setOrders(ordersArray);

      /* =================================================
         PRODUCTS
      ================================================= */

      if (productsRes.ok) {
        const productsData =
          await productsRes.json();

        const productsArray =
          Array.isArray(productsData)
            ? productsData
            : Array.isArray(productsData.data)
            ? productsData.data
            : Array.isArray(productsData.products)
            ? productsData.products
            : [];

        setProductsList(productsArray);
      }

      /* =================================================
         CUSTOMERS
      ================================================= */

      if (customersRes.ok) {
        const customersData =
          await customersRes.json();

        const customersArray =
          Array.isArray(customersData)
            ? customersData
            : Array.isArray(customersData.data)
            ? customersData.data
            : Array.isArray(
                customersData.customers
              )
            ? customersData.customers
            : [];

        setCustomersList(customersArray);
      }
    } catch (error) {
      console.error(
        "Fetch orders error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to connect to Orders API"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchInitialData();
  }, []);

  /* =====================================================
     RESET FORM
  ===================================================== */

  const resetForm = () => {
    setSelectedCustomerId("");
    setCustomerName("");
    setCustomerEmail("");
    setPaymentMethod("Cash");
    setNotes("");

    setOrderItems([
      {
        productId: "",
        quantity: 1,
        price: 0,
        stock: 0,
      },
    ]);
  };

  /* =====================================================
     CUSTOMER SELECT
  ===================================================== */

  const handleCustomerSelect = (id) => {
    setSelectedCustomerId(id);

    const customer =
      customersList.find(
        (item) => item._id === id
      );

    if (customer) {
      setCustomerName(
        customer.name || ""
      );

      setCustomerEmail(
        customer.email || ""
      );
    } else {
      setCustomerName("");
      setCustomerEmail("");
    }
  };

  /* =====================================================
     PRODUCT SELECT
  ===================================================== */

  const handleItemProductChange = (
    index,
    productId
  ) => {
    const product =
      productsList.find(
        (item) => item._id === productId
      );

    const updatedItems = [
      ...orderItems,
    ];

    updatedItems[index] = {
      productId,
      quantity: 1,
      price: product
        ? Number(product.price) || 0
        : 0,
      stock: product
        ? Number(product.stock) || 0
        : 0,
    };

    setOrderItems(updatedItems);
  };

  /* =====================================================
     QUANTITY CHANGE
  ===================================================== */

  const handleItemQtyChange = (
    index,
    value
  ) => {
    const updatedItems = [
      ...orderItems,
    ];

    const item =
      updatedItems[index];

    const quantity =
      Math.max(
        1,
        Number(value) || 1
      );

    if (
      item.stock > 0 &&
      quantity > item.stock
    ) {
      alert(
        `Only ${item.stock} items available in stock.`
      );

      updatedItems[index].quantity =
        item.stock;
    } else {
      updatedItems[index].quantity =
        quantity;
    }

    setOrderItems(updatedItems);
  };

  /* =====================================================
     ADD ITEM
  ===================================================== */

  const addItemRow = () => {
    setOrderItems([
      ...orderItems,
      {
        productId: "",
        quantity: 1,
        price: 0,
        stock: 0,
      },
    ]);
  };

  /* =====================================================
     REMOVE ITEM
  ===================================================== */

  const removeItemRow = (index) => {
    if (orderItems.length === 1) {
      return;
    }

    setOrderItems(
      orderItems.filter(
        (_, i) => i !== index
      )
    );
  };

  /* =====================================================
     TOTAL
  ===================================================== */

  const calculatedOrderTotal =
    useMemo(() => {
      return orderItems.reduce(
        (total, item) => {
          return (
            total +
            (Number(item.price) || 0) *
              (Number(item.quantity) || 1)
          );
        },
        0
      );
    }, [orderItems]);

  /* =====================================================
     CREATE ORDER
  ===================================================== */

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert(
        "Please provide customer name."
      );
      return;
    }

    const validItems =
      orderItems.filter(
        (item) => item.productId
      );

    if (validItems.length === 0) {
      alert(
        "Please select at least one product."
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customerId:
          selectedCustomerId || undefined,

        customerName:
          customerName.trim(),

        customerEmail:
          customerEmail.trim(),

        paymentMethod,

        notes,

        items: validItems.map(
          (item) => {
            const product =
              productsList.find(
                (p) =>
                  p._id ===
                  item.productId
              );

            return {
              productId:
                item.productId,

              name: product
                ? product.name
                : "Product",

              price:
                Number(item.price) || 0,

              quantity:
                Number(item.quantity) || 1,
            };
          }
        ),

        totalAmount:
          calculatedOrderTotal,
      };

      console.log(
        "CREATE ORDER PAYLOAD:",
        payload
      );

      const response =
        await fetch(ORDERS_API, {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        });

      const data =
        await response.json();

      console.log(
        "CREATE ORDER RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create order"
        );
      }

      alert(
        "Order created successfully!"
      );

      setIsCreateOpen(false);

      resetForm();

      await fetchInitialData();
    } catch (error) {
      console.error(
        "Create order error:",
        error
      );

      alert(
        error.message ||
          "Failed to create order"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     DELETE ORDER
  ===================================================== */

  const handleDeleteOrder = async (
    orderId
  ) => {
    if (!orderId) {
      alert(
        "Order ID is missing."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this order?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${ORDERS_API}/${orderId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete order"
        );
      }

      setOrders((previous) =>
        previous.filter(
          (order) =>
            order._id !== orderId
        )
      );

      alert(
        "Order deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete order error:",
        error
      );

      alert(
        error.message ||
          "Could not delete order"
      );
    }
  };

  /* =====================================================
     UPDATE ORDER STATUS
  ===================================================== */

  const handleUpdateStatus = async (
    orderId,
    newStatus
  ) => {
    if (!orderId || !newStatus) {
      return;
    }

    try {
      const response =
        await fetch(
          `${ORDERS_API}/${orderId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "UPDATE STATUS RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update status"
        );
      }

      setOrders((previous) =>
        previous.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status:
                  data.order?.status ||
                  newStatus,
              }
            : order
        )
      );

      /* Update opened order modal too */
      setViewingOrder((previous) => {
        if (
          previous &&
          previous._id === orderId
        ) {
          return {
            ...previous,
            status:
              data.order?.status ||
              newStatus,
          };
        }

        return previous;
      });
    } catch (error) {
      console.error(
        "Update status error:",
        error
      );

      alert(
        error.message ||
          "Failed to update status"
      );
    }
  };

  /* =====================================================
     STATUS STYLE
  ===================================================== */

  const getStatusClass = (status) => {
    switch (status) {
      case "Delivered":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "Cancelled":
        return "border-rose-200 bg-rose-50 text-rose-700";

      case "Processing":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "Shipped":
        return "border-purple-200 bg-purple-50 text-purple-700";

      case "Pending":
      default:
        return "border-amber-200 bg-amber-50 text-amber-700";
    }
  };

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredOrders =
    useMemo(() => {
      if (
        statusFilter ===
        "All"
      ) {
        return orders;
      }

      return orders.filter(
        (order) =>
          (
            order.status ||
            "Pending"
          ).toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }, [
      orders,
      statusFilter,
    ]);

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredOrders.length /
          ordersPerPage
      )
    );

  const paginatedOrders =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ordersPerPage;

      return filteredOrders.slice(
        start,
        start + ordersPerPage
      );
    }, [
      filteredOrders,
      currentPage,
    ]);

  /* =====================================================
     EXPORT CSV
  ===================================================== */

  const handleExportOrdersCSV =
    () => {
      if (!orders.length) {
        alert(
          "No orders to export."
        );
        return;
      }

      const headers = [
        "Order Number",
        "Customer",
        "Items Count",
        "Total Amount",
        "Status",
        "Payment Status",
        "Payment Method",
        "Order Date",
      ];

      const rows = orders.map(
        (order) => [
          order.orderNumber || "",

          order.customerName ||
            order.customer?.name ||
            "",

          order.items?.length || 0,

          order.totalAmount || 0,

          order.status ||
            "Pending",

          order.paymentStatus ||
            "Unpaid",

          order.paymentMethod ||
            "Cash",

          order.createdAt
            ? new Date(
                order.createdAt
              ).toLocaleDateString()
            : "",
        ]
      );

      const lines = [
        headers.join(","),
      ];

      rows.forEach((row) => {
        lines.push(
          row
            .map((field) => {
              const value =
                String(field)
                  .replace(
                    /"/g,
                    '""'
                  );

              return value.includes(
                ","
              ) ||
                value.includes(
                  '"'
                ) ||
                value.includes(
                  "\n"
                )
                ? `"${value}"`
                : value;
            })
            .join(",")
        );
      });

      const blob =
        new Blob(
          [lines.join("\n")],
          {
            type: "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download = `orders_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
      );
    };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Orders
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track and manage customer orders.
          </p>
        </div>

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={
              handleExportOrdersCSV
            }
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FiDownload size={18} />

            Export CSV
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateOpen(
                true
              );
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiPlus size={18} />

            Create Order
          </button>

        </div>
      </div>

      {/* ERROR */}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

          <FiAlertCircle size={20} />

          <span>
            {errorMessage}
          </span>

        </div>
      )}

      {/* FILTERS */}

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">

        {[
          "All",
          "Pending",
          "Processing",
          "Shipped",
          "Delivered",
          "Cancelled",
        ].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setStatusFilter(
                status
              );

              setCurrentPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              statusFilter ===
              status
                ? "bg-slate-900 text-white shadow"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {status}
          </button>
        ))}

      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm text-slate-600">

            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">

              <tr>

                <th className="px-6 py-4">
                  Order ID
                </th>

                <th className="px-6 py-4">
                  Customer
                </th>

                <th className="px-6 py-4">
                  Items
                </th>

                <th className="px-6 py-4">
                  Total Amount
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

                <th className="px-6 py-4">
                  Date
                </th>

                <th className="px-6 py-4 text-right">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (

                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400"
                  >
                    Loading orders...
                  </td>
                </tr>

              ) : paginatedOrders.length ===
                0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400"
                  >
                    No orders found.
                  </td>
                </tr>

              ) : (

                paginatedOrders.map(
                  (order) => {

                    const status =
                      order.status ||
                      "Pending";

                    return (
                      <tr
                        key={
                          order._id ||
                          order.orderNumber
                        }
                        className="hover:bg-slate-50/50"
                      >

                        {/* ORDER NUMBER */}

                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {order.orderNumber ||
                            "ORD-PENDING"}
                        </td>

                        {/* CUSTOMER */}

                        <td className="px-6 py-4">

                          <div className="font-medium text-slate-900">
                            {order.customerName ||
                              order.customer
                                ?.name ||
                              "Guest"}
                          </div>

                          <div className="text-xs text-slate-400">
                            {order.customerEmail ||
                              order.customer
                                ?.email ||
                              ""}
                          </div>

                        </td>

                        {/* ITEMS */}

                        <td className="px-6 py-4">

                          {order.items?.length ||
                            0}{" "}
                          item
                          {order.items?.length ===
                          1
                            ? ""
                            : "s"}

                        </td>

                        {/* TOTAL */}

                        <td className="px-6 py-4 font-semibold text-slate-900">

                          Rs{" "}
                          {Number(
                            order.totalAmount ||
                              0
                          ).toLocaleString()}

                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4">

                          <select
                            value={status}
                            onChange={(e) =>
                              handleUpdateStatus(
                                order._id,
                                e.target
                                  .value
                              )
                            }
                            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-blue-200 ${getStatusClass(
                              status
                            )}`}
                          >

                            <option value="Pending">
                              Pending
                            </option>

                            <option value="Processing">
                              Processing
                            </option>

                            <option value="Shipped">
                              Shipped
                            </option>

                            <option value="Delivered">
                              Delivered
                            </option>

                            <option value="Cancelled">
                              Cancelled
                            </option>

                          </select>

                        </td>

                        {/* DATE */}

                        <td className="px-6 py-4 text-xs text-slate-500">

                          {order.createdAt
                            ? new Date(
                                order.createdAt
                              ).toLocaleDateString()
                            : "N/A"}

                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-4">

                          <div className="flex items-center justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setViewingOrder(
                                  order
                                )
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="View Order"
                            >
                              <FiEye
                                size={17}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteOrder(
                                  order._id
                                )
                              }
                              className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                              title="Delete Order"
                            >
                              <FiTrash2
                                size={17}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        {!loading &&
          totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm text-slate-500">

              <span>
                Page{" "}
                {currentPage}{" "}
                of{" "}
                {totalPages}
              </span>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50"
                >
                  <FiChevronLeft
                    size={16}
                  />
                </button>

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50"
                >
                  <FiChevronRight
                    size={16}
                  />
                </button>

              </div>

            </div>
          )}

      </div>

      {/* =================================================
          CREATE ORDER MODAL
      ================================================= */}

      {isCreateOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">

              <h2 className="text-xl font-bold text-slate-900">
                Create New Order
              </h2>

              <button
                type="button"
                onClick={() =>
                  setIsCreateOpen(
                    false
                  )
                }
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <FiX size={20} />
              </button>

            </div>

            <form
              onSubmit={
                handleCreateOrder
              }
              className="mt-4 space-y-5"
            >

              {/* CUSTOMER */}

              <div>

                <label className="text-xs font-semibold text-slate-600">
                  Select Customer
                </label>

                <select
                  value={
                    selectedCustomerId
                  }
                  onChange={(e) =>
                    handleCustomerSelect(
                      e.target.value
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                >

                  <option value="">
                    -- Choose Existing Customer --
                  </option>

                  {customersList.map(
                    (customer) => (
                      <option
                        key={
                          customer._id
                        }
                        value={
                          customer._id
                        }
                      >
                        {customer.name}{" "}
                        (
                        {
                          customer.email
                        }
                        )
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* CUSTOMER DETAILS */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="text-xs font-semibold text-slate-600">
                    Customer Name *
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      customerName
                    }
                    onChange={(e) =>
                      setCustomerName(
                        e.target.value
                      )
                    }
                    placeholder="Enter customer name"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                  />

                </div>

                <div>

                  <label className="text-xs font-semibold text-slate-600">
                    Customer Email
                  </label>

                  <input
                    type="email"
                    value={
                      customerEmail
                    }
                    onChange={(e) =>
                      setCustomerEmail(
                        e.target.value
                      )
                    }
                    placeholder="customer@example.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                  />

                </div>

              </div>

              {/* ITEMS */}

              <div className="space-y-3">

                <div className="flex items-center justify-between">

                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Order Items
                  </label>

                  <button
                    type="button"
                    onClick={
                      addItemRow
                    }
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    + Add Item
                  </button>

                </div>

                {orderItems.map(
                  (item, index) => (

                    <div
                      key={index}
                      className="flex items-center gap-2"
                    >

                      {/* PRODUCT */}

                      <select
                        required
                        value={
                          item.productId
                        }
                        onChange={(e) =>
                          handleItemProductChange(
                            index,
                            e.target
                              .value
                          )
                        }
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                      >

                        <option value="">
                          Select Product
                        </option>

                        {productsList.map(
                          (product) => (

                            <option
                              key={
                                product._id
                              }
                              value={
                                product._id
                              }
                            >
                              {
                                product.name
                              }{" "}
                              - Rs{" "}
                              {
                                product.price
                              }{" "}
                              | Stock:{" "}
                              {
                                product.stock
                              }
                            </option>

                          )
                        )}

                      </select>

                      {/* QUANTITY */}

                      <input
                        type="number"
                        min="1"
                        max={
                          item.stock ||
                          undefined
                        }
                        value={
                          item.quantity
                        }
                        onChange={(e) =>
                          handleItemQtyChange(
                            index,
                            e.target.value
                          )
                        }
                        className="w-20 rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                      />

                      {/* SUBTOTAL */}

                      <div className="w-28 text-right text-sm font-semibold text-slate-700">

                        Rs{" "}
                        {(
                          (Number(
                            item.price
                          ) || 0) *
                          (Number(
                            item.quantity
                          ) || 1)
                        ).toLocaleString()}

                      </div>

                      {/* REMOVE */}

                      <button
                        type="button"
                        disabled={
                          orderItems.length ===
                          1
                        }
                        onClick={() =>
                          removeItemRow(
                            index
                          )
                        }
                        className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                      >
                        <FiTrash2
                          size={16}
                        />
                      </button>

                    </div>

                  )
                )}

              </div>

              {/* TOTAL */}

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-base font-bold text-slate-900">

                <span>
                  Total Amount
                </span>

                <span className="text-blue-600">
                  Rs{" "}
                  {calculatedOrderTotal.toLocaleString()}
                </span>

              </div>

              {/* PAYMENT */}

              <div>

                <label className="text-xs font-semibold text-slate-600">
                  Payment Method
                </label>

                <select
                  value={
                    paymentMethod
                  }
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                >

                  <option value="Cash">
                    Cash
                  </option>

                  <option value="Card">
                    Card
                  </option>

                  <option value="Bank Transfer">
                    Bank Transfer
                  </option>

                  <option value="Online">
                    Online
                  </option>

                </select>

              </div>

              {/* NOTES */}

              <div>

                <label className="text-xs font-semibold text-slate-600">
                  Notes
                </label>

                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  placeholder="Order notes..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-600"
                />

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    setIsCreateOpen(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Creating..."
                    : "Create Order"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          VIEW ORDER MODAL
      ================================================= */}

      {viewingOrder && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">

              <div>

                <h3 className="text-lg font-bold text-slate-900">
                  {viewingOrder.orderNumber ||
                    "Order Details"}
                </h3>

                <p className="text-xs text-slate-400">

                  {viewingOrder.createdAt
                    ? new Date(
                        viewingOrder.createdAt
                      ).toLocaleString()
                    : "N/A"}

                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setViewingOrder(
                    null
                  )
                }
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <FiX size={20} />
              </button>

            </div>

            {/* CUSTOMER */}

            <div className="mt-5 grid grid-cols-2 gap-4">

              <div>

                <span className="text-xs text-slate-400">
                  Customer
                </span>

                <div className="font-semibold text-slate-900">
                  {viewingOrder.customerName ||
                    viewingOrder
                      .customer
                      ?.name ||
                    "Guest"}
                </div>

                <div className="text-xs text-slate-500">
                  {viewingOrder.customerEmail ||
                    viewingOrder
                      .customer
                      ?.email ||
                    ""}
                </div>

              </div>

              <div>

                <span className="text-xs text-slate-400">
                  Status
                </span>

                <div className="mt-1">

                  <select
                    value={
                      viewingOrder.status ||
                      "Pending"
                    }
                    onChange={(e) =>
                      handleUpdateStatus(
                        viewingOrder._id,
                        e.target.value
                      )
                    }
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none ${getStatusClass(
                      viewingOrder.status ||
                        "Pending"
                    )}`}
                  >

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Processing">
                      Processing
                    </option>

                    <option value="Shipped">
                      Shipped
                    </option>

                    <option value="Delivered">
                      Delivered
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>

                  </select>

                </div>

              </div>

            </div>

            {/* PAYMENT */}

            <div className="mt-4 rounded-xl bg-slate-50 p-4">

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <span className="text-xs text-slate-400">
                    Payment Method
                  </span>

                  <div className="font-semibold text-slate-900">
                    {viewingOrder.paymentMethod ||
                      "Cash"}
                  </div>

                </div>

                <div>

                  <span className="text-xs text-slate-400">
                    Payment Status
                  </span>

                  <div className="font-semibold text-slate-900">
                    {viewingOrder.paymentStatus ||
                      "Unpaid"}
                  </div>

                </div>

              </div>

            </div>

            {/* ITEMS */}

            <div className="mt-5">

              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Order Items
              </span>

              <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100 p-3">

                {(
                  viewingOrder.items ||
                  []
                ).map(
                  (item, index) => (

                    <div
                      key={index}
                      className="flex justify-between py-3"
                    >

                      <div>

                        <div className="font-medium text-slate-900">
                          {item.name ||
                            item.product
                              ?.name ||
                            "Item"}
                        </div>

                        <div className="text-xs text-slate-400">

                          {item.quantity} × Rs{" "}
                          {Number(
                            item.price ||
                              0
                          ).toLocaleString()}

                        </div>

                      </div>

                      <div className="font-semibold text-slate-900">

                        Rs{" "}
                        {Number(
                          item.subtotal ??
                            (
                              Number(
                                item.price
                              ) || 0
                            ) *
                              (
                                Number(
                                  item.quantity
                                ) || 1
                              )
                        ).toLocaleString()}

                      </div>

                    </div>
                  )
                )}

              </div>

            </div>

            {/* TOTAL */}

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-lg font-bold">

              <span>
                Total
              </span>

              <span className="text-blue-600">
                Rs{" "}
                {Number(
                  viewingOrder.totalAmount ||
                    0
                ).toLocaleString()}
              </span>

            </div>

            {/* CLOSE */}

            <div className="mt-6 flex justify-end">

              <button
                type="button"
                onClick={() =>
                  setViewingOrder(
                    null
                  )
                }
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
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