import { useState } from "react";
import {
  FiMenu,
  FiSearch,
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function Navbar({ setIsOpen }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  // Get logged-in user
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const userName = user?.name || "User";
  const userEmail = user?.email || "";

  // Get initials
  const initials = userName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-white px-4 shadow-sm sm:px-6">

      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
        >
          <FiMenu size={24} />
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Dashboard
          </h2>

          <p className="hidden text-sm text-slate-500 sm:block">
            Welcome back, {userName}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="hidden w-64 md:block">
        <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2">
          <FiSearch className="text-slate-400" />

          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent outline-none"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        {/* Notifications */}
        <button className="relative rounded-lg p-2 hover:bg-slate-100">
          <FiBell size={21} />

          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* Profile */}
        <div className="relative">

          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
              {initials}
            </div>

            <FiChevronDown
              className={`hidden transition-transform sm:block ${
                showProfile ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {showProfile && (
            <div className="absolute right-0 mt-3 w-64 rounded-xl border bg-white p-2 shadow-lg">

              {/* User information */}
              <div className="border-b px-3 py-3">
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">
                      {userName}
                    </p>

                    <p className="truncate text-sm text-slate-500">
                      {userEmail}
                    </p>
                  </div>

                </div>
              </div>

              {/* Profile */}
              <button
                onClick={() => setShowProfile(false)}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                <FiUser size={18} />
                Profile
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <FiLogOut size={18} />
                Logout
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default Navbar;
