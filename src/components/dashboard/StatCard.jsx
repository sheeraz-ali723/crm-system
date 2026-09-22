import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiTrendingUp,
  FiArrowUpRight,
} from "react-icons/fi";

const icons = {
  revenue: FiDollarSign,
  orders: FiShoppingBag,
  customers: FiUsers,
  conversion: FiTrendingUp,
};

function StatCard({
  title,
  value,
  change,
  description,
  type,
}) {
  const Icon = icons[type];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lg">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={21} />
        </div>

      </div>

      <div className="mt-4 flex items-center gap-2">

        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
          <FiArrowUpRight size={13} />
          {change}
        </span>

        <span className="text-xs text-slate-400">
          {description}
        </span>

      </div>

    </div>
  );
}

export default StatCard;