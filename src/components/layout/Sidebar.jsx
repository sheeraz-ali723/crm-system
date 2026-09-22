import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiTarget,
  FiDollarSign,
  FiPackage,
  FiShoppingBag,
  FiFileText,
  FiBarChart2,
  FiCpu,
  FiCheckSquare,
  FiActivity,
  FiBell,
  FiSettings,
  FiLogOut,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

function Sidebar({
  isOpen,
  setIsOpen,
  collapsed = false,
  setCollapsed,
}) {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: FiHome,
    },
    {
      name: "Customers",
      path: "/customers",
      icon: FiUsers,
    },
    {
      name: "Leads",
      path: "/leads",
      icon: FiTarget,
    },
    {
      name: "Deals",
      path: "/deals",
      icon: FiDollarSign,
    },
    {
      name: "Products",
      path: "/products",
      icon: FiPackage,
    },
    {
      name: "Orders",
      path: "/orders",
      icon: FiShoppingBag,
    },
    {
      name: "Invoices",
      path: "/invoices",
      icon: FiFileText,
    },
    {
      name: "Tasks",
      path: "/tasks",
      icon: FiCheckSquare,
    },
    {
      name: "Activities",
      path: "/activities",
      icon: FiActivity,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: FiBell,
    },
  ];

  const managementItems = [
    {
      name: "Analytics",
      path: "/analytics",
      icon: FiBarChart2,
    },
    {
      name: "AI Assistant",
      path: "/ai-assistant",
      icon: FiCpu,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: FiSettings,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-slate-200 bg-white
          transition-all duration-300

          ${collapsed ? "w-20" : "w-64"}

          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* ============================= */}
        {/* Logo */}
        {/* ============================= */}

        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <span className="text-lg font-bold">C</span>
            </div>

            {!collapsed && (
              <div className="whitespace-nowrap">
                <h1 className="text-lg font-bold text-slate-800">
                  CRM System
                </h1>

                <p className="text-xs text-slate-400">
                  Management Dashboard
                </p>
              </div>
            )}
          </div>

          {/* Mobile Close */}
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* ============================= */}
        {/* Main Navigation */}
        {/* ============================= */}

        <div className="flex-1 overflow-y-auto px-3 py-5">
          {!collapsed && (
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Main Menu
            </p>
          )}

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  title={collapsed ? item.name : ""}
                  className={({ isActive }) =>
                    `
                    group flex items-center rounded-xl
                    px-3 py-2.5 text-sm font-medium
                    transition-all duration-200

                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                    }

                    ${collapsed ? "justify-center" : "gap-3"}
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`
                          h-5 w-5 shrink-0
                          ${
                            isActive
                              ? "text-blue-600"
                              : "text-slate-500 group-hover:text-blue-600"
                          }
                        `}
                      />

                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* ============================= */}
          {/* Management */}
          {/* ============================= */}

          {!collapsed && (
            <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Management
            </p>
          )}

          <nav className="space-y-1">
            {managementItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  title={collapsed ? item.name : ""}
                  className={({ isActive }) =>
                    `
                    group flex items-center rounded-xl
                    px-3 py-2.5 text-sm font-medium
                    transition-all duration-200

                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                    }

                    ${collapsed ? "justify-center" : "gap-3"}
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`
                          h-5 w-5 shrink-0
                          ${
                            isActive
                              ? "text-blue-600"
                              : "text-slate-500 group-hover:text-blue-600"
                          }
                        `}
                      />

                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* ============================= */}
        {/* Collapse Button */}
        {/* ============================= */}

        <div className="hidden border-t border-slate-200 p-3 lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <FiChevronRight className="h-5 w-5" />
            ) : (
              <FiChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* ============================= */}
        {/* Logout */}
        {/* ============================= */}

        <div className="border-t border-slate-200 p-3">
          <button
            onClick={handleLogout}
            className={`
              group flex w-full items-center rounded-xl
              px-3 py-2.5 text-sm font-medium
              text-red-500 transition
              hover:bg-red-50 hover:text-red-600

              ${collapsed ? "justify-center" : "gap-3"}
            `}
            title={collapsed ? "Logout" : ""}
          >
            <FiLogOut className="h-5 w-5 shrink-0" />

            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;