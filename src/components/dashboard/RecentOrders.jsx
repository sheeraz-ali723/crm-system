import { FiArrowUpRight } from "react-icons/fi";
import { recentOrders } from "../../data/dashboardData";

function RecentOrders() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-soft">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-5">

        <div>
          <h3 className="font-semibold text-slate-900">
            Recent Orders
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Latest customer transactions
          </p>
        </div>

        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
          View all
          <FiArrowUpRight size={14} />
        </button>

      </div>

      {/* Table */}
      <div className="overflow-x-auto">

        <table className="w-full min-w-[650px]">

          <thead>
            <tr className="border-b border-slate-100 text-left">

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Order
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Customer
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Product
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Amount
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </th>

            </tr>
          </thead>

          <tbody>

            {recentOrders.map((order) => (

              <tr
                key={order.id}
                className="border-b border-slate-50 transition hover:bg-slate-50/70"
              >

                <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                  {order.id}
                </td>

                <td className="px-5 py-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      {order.customer
                        .split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </div>

                    <span className="text-sm font-medium text-slate-700">
                      {order.customer}
                    </span>

                  </div>

                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {order.product}
                </td>

                <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                  {order.amount}
                </td>

                <td className="px-5 py-4">

                  <span
                    className={`
                      rounded-full px-2.5 py-1
                      text-xs font-semibold
                      ${
                        order.status === "Completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : order.status === "Processing"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-amber-50 text-amber-600"
                      }
                    `}
                  >
                    {order.status}
                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default RecentOrders;