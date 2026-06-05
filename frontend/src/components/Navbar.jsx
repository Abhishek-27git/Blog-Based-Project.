import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isReadActive = location.pathname === "/";
  const isDashboardActive = location.pathname === "/dashboard" || location.pathname === "/admin/dashboard";
  const isWriteActive = location.pathname === "/new-manuscript";

  return (
    <header className="bg-background/90 backdrop-blur-md w-full sticky top-0 flex items-center justify-between px-6 md:px-12 h-16 border-b border-outline/50 z-50">
      {/* Brand logo (Gold square with dark 'M', uppercase tracked text) */}
      <div className="flex items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-primary text-on-primary w-8 h-8 rounded-sm flex items-center justify-center font-black text-sm transition-transform duration-500 group-hover:scale-105">
            M
          </div>
          <h1 className="font-sans text-xs md:text-sm tracking-widest uppercase font-bold text-on-surface">
            The Manuscript
          </h1>
        </Link>
      </div>

      {/* Navigation Links with custom gold active indicators */}
      <nav className="hidden md:flex gap-8 items-center h-full">
        <Link
          to="/"
          className={`font-sans text-[11px] uppercase tracking-widest transition-colors duration-300 relative py-5 h-full flex items-center ${
            isReadActive
              ? "text-on-surface font-bold border-b-2 border-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Read
        </Link>
        {user && (
          <>
            <Link
              to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
              className={`font-sans text-[11px] uppercase tracking-widest transition-colors duration-300 relative py-5 h-full flex items-center ${
                isDashboardActive
                  ? "text-on-surface font-bold border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {user.role === "admin" ? "Admin Panel" : "My Workspace"}
            </Link>
            {user.role !== "admin" && (
              <Link
                to="/new-manuscript"
                className={`font-sans text-[11px] uppercase tracking-widest transition-colors duration-300 relative py-5 h-full flex items-center ${
                  isWriteActive
                    ? "text-on-surface font-bold border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Write
              </Link>
            )}
          </>
        )}
      </nav>

      {/* User Auth Section */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="text-on-surface hover:text-primary transition-colors flex items-center justify-center p-1.5 cursor-pointer rounded-full hover:bg-surface-container"
          title="Toggle Theme"
        >
          <span className="material-symbols-outlined text-[20px]">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant hidden sm:inline">
              Writer: <span className="font-bold text-on-surface">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="border border-outline hover:border-primary text-on-surface hover:text-primary px-4 py-1.5 font-sans text-[10px] uppercase tracking-widest transition-all duration-300 cursor-pointer"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors duration-300 px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-primary border border-primary text-on-primary hover:bg-transparent hover:text-primary px-5 py-2 font-sans text-[10px] uppercase tracking-widest transition-all duration-300 font-bold"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
