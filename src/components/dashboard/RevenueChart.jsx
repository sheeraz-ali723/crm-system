import { revenueData } from "../../data/dashboardData";

function RevenueChart() {
  const maxRevenue = Math.max(
    ...revenueData.map((item) => item.revenue)
  );

  const points = revenueData
    .map((item, index) => {

      const x =
        (index / (revenueData.length - 1)) * 100;

      const y =
        100 - (item.revenue / maxRevenue) * 85;

      return `${x},${y}`;

    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h3 className="font-semibold text-slate-900">
            Revenue Overview
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Monthly revenue performance
          </p>
        </div>

        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none">
          <option>Last 12 months</option>
          <option>Last 6 months</option>
          <option>Last 30 days</option>
        </select>

      </div>

      <div className="mt-8 h-64">

        <div className="relative h-52">

          {/* Grid */}
          <div className="absolute inset-0 flex flex-col justify-between">

            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="border-t border-dashed border-slate-100"
              />
            ))}

          </div>

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >

            <defs>
              <linearGradient
                id="revenueGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#3b82f6"
                  stopOpacity="0.2"
                />

                <stop
                  offset="100%"
                  stopColor="#3b82f6"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            <polygon
              points={`0,100 ${points} 100,100`}
              fill="url(#revenueGradient)"
            />

            <polyline
              points={points}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

          </svg>

        </div>

        {/* Months */}
        <div className="mt-3 flex justify-between text-[11px] text-slate-400">
          {revenueData.map((item) => (
            <span key={item.month}>
              {item.month}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}

export default RevenueChart;