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
    <header className="bg-surface dark:bg-tertiary-container w-full top-0 sticky flex items-center justify-between px-margin-mobile md:px-margin-page h-16 border-b border-outline-variant dark:border-tertiary z-40">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary dark:text-tertiary-fixed text-[24px]">
            menu_book
          </span>
          <h1 className="font-display-lg text-headline-sm md:text-headline-md text-on-surface dark:text-tertiary-fixed tracking-tight">
            The Manuscript
          </h1>
        </Link>
      </div>

      <nav className="hidden md:flex gap-8 items-center">
        <Link
          to="/"
          className="font-ui-label text-ui-label text-on-surface-variant hover:text-secondary transition-colors duration-300"
        >
          Read
        </Link>
        {user && (
          <>
            <Link
              to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
              className="font-ui-label text-ui-label text-on-surface-variant hover:text-secondary transition-colors duration-300 font-bold"
            >
              {user.role === "admin" ? "Admin Panel" : "My Workspace"}
            </Link>
            {user.role !== "admin" && (
              <Link
                to="/new-manuscript"
                className="font-ui-label text-ui-label text-on-surface-variant hover:text-secondary transition-colors duration-300"
              >
                Write
              </Link>
            )}
          </>
        )}
      </nav>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="font-ui-label text-ui-label text-on-surface-variant hidden sm:inline">
              Welcome, <span className="font-bold text-on-surface">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="border border-outline text-on-surface hover:bg-on-surface hover:text-background px-4 py-1.5 font-ui-label text-ui-label uppercase tracking-widest transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="font-ui-label text-ui-label text-on-surface-variant hover:text-primary transition-colors duration-300 px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-primary text-on-primary px-4 py-1.5 font-ui-label text-ui-label uppercase tracking-widest hover:bg-on-surface-variant transition-colors duration-300"
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
