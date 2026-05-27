import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-background/80 backdrop-blur-md w-full sticky top-0 flex items-center justify-between px-6 md:px-12 h-16 border-b border-outline-variant/50 z-50">
      {/* Brand logo */}
      <div className="flex items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="material-symbols-outlined text-primary text-[20px] transition-transform duration-500 group-hover:rotate-12">
            menu_book
          </span>
          <h1 className="font-display-lg text-headline-sm tracking-widest uppercase font-bold text-on-surface">
            The Manuscript
          </h1>
        </Link>
      </div>

      {/* Navigation Links with custom micro-animations */}
      <nav className="hidden md:flex gap-8 items-center">
        <Link
          to="/"
          className="font-ui-label text-[11px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-300 relative py-1 group"
        >
          Read
          <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-primary transition-all duration-300 group-hover:w-full" />
        </Link>
        {user && (
          <>
            <Link
              to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
              className="font-ui-label text-[11px] uppercase tracking-widest text-on-surface hover:text-primary transition-colors duration-300 relative py-1 group font-bold"
            >
              {user.role === "admin" ? "Admin Panel" : "My Workspace"}
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
            {user.role !== "admin" && (
              <Link
                to="/new-manuscript"
                className="font-ui-label text-[11px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-300 relative py-1 group"
              >
                Write
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            )}
          </>
        )}
      </nav>

      {/* User Auth Section */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="font-ui-label text-[11px] uppercase tracking-widest text-on-surface-variant hidden sm:inline">
              Writer: <span className="font-bold text-on-surface">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="border border-on-surface text-on-surface hover:bg-on-surface hover:text-background px-4 py-1.5 font-ui-label text-[11px] uppercase tracking-widest transition-all duration-300 cursor-pointer"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="font-ui-label text-[11px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors duration-300 px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-primary border border-primary text-on-primary hover:bg-transparent hover:text-primary px-5 py-2 font-ui-label text-[11px] uppercase tracking-widest transition-all duration-300"
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
