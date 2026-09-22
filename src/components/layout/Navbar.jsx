import { useState, useEffect } from "react";
import {
  FiMenu,
  FiSearch,
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiShield,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function Navbar({ setIsOpen }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Listen for real-time user profile/avatar changes triggered in Settings
  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const stored = localStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleProfileUpdate);
    window.addEventListener("userProfileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("storage", handleProfileUpdate);
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, []);

  const userName = user?.name || "Admin User";
  const userEmail = user?.email || "";
  const userAvatar = user?.avatar || "";
  const userRole = user?.role || "Admin";

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowProfile(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-white px-4 shadow-sm sm:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <FiMenu size={24} />
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-800">Workspace</h2>
          <p className="hidden text-sm text-slate-500 sm:block">
            Welcome back, {userName}
          </p>
        </div>
      </div>

      {/* Global quick search */}
      <div className="hidden w-64 md:block">
        <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2">
          <FiSearch className="text-slate-400" />
          <input
            type="text"
            placeholder="Search CRM..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Button */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
        >
          <FiBell size={21} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 transition"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white shadow-sm text-sm">
                {initials}
              </div>
            )}

            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{userName}</p>
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                {userRole}
              </span>
            </div>

            <FiChevronDown
              className={`hidden text-slate-400 transition-transform sm:block ${
                showProfile ? "rotate-180" : ""
              }`}
              size={16}
            />
          </button>

          {/* User Menu Dropdown */}
          {showProfile && (
            <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="border-b border-slate-100 px-3 py-3">
                <div className="flex items-center gap-3">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="h-11 w-11 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-semibold text-white text-sm">
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800 text-sm">{userName}</p>
                    <p className="truncate text-xs text-slate-500">{userEmail}</p>
                  </div>
                </div>
              </div>

              <div className="mt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <FiUser size={16} className="text-slate-500" />
                  Profile & Photo
                </button>

                <button
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <FiShield size={16} className="text-slate-500" />
                  Account Security
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition mt-1 border-t border-slate-100 pt-2"
                >
                  <FiLogOut size={16} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;