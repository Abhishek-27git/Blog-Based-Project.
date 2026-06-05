import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!email || !password) {
      setValidationError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);
      if (response && response.user) {
        if (response.user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setValidationError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="bg-background min-h-screen flex flex-col items-center justify-center py-12 px-6">
      
      {/* Centered card container with sharp borders */}
      <main className="w-full max-w-[420px] bg-surface border border-outline shadow-md p-8 md:p-12 text-left relative rounded-sm">
        
        {/* Brand logo heading */}
        <header className="mb-8 pb-6 border-b border-outline/30 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-xl">menu_book</span>
            <h1 className="font-sans text-lg tracking-widest uppercase font-bold text-on-surface">
              The Manuscript
            </h1>
          </Link>
          <p className="font-sans text-[11px] text-on-surface-variant italic mt-1 leading-relaxed">
            Slow contemplation, literary design, distraction-free.
          </p>
        </header>

        <h2 className="font-sans text-xl font-bold text-on-surface mb-6 text-center">Welcome Back</h2>

        {/* Validation Errors */}
        {validationError && (
          <div className="mb-6 p-4 bg-error-container border border-error/20 text-on-error-container text-xs font-sans flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">error</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Google OAuth Login Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 border border-outline hover:bg-on-surface/5 transition-colors duration-250 cursor-pointer mb-6 rounded-md bg-white text-zinc-800 font-bold"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-800 font-bold">
            Sign In with Google
          </span>
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline/30" />
          </div>
          <span className="relative px-3 bg-surface text-[9px] font-sans text-on-surface-variant uppercase tracking-widest font-bold">
            Or
          </span>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white text-zinc-900 px-3 py-2 text-xs font-sans outline-none rounded-md transition-all border border-outline focus:border-primary placeholder:text-zinc-400"
              placeholder="you@manuscript.com"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold" htmlFor="password">
                Password
              </label>
              <a href="#" className="font-sans text-[10px] text-primary hover:text-secondary transition-colors uppercase tracking-wider font-bold">
                Forgot?
              </a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white text-zinc-900 px-3 py-2 text-xs font-sans outline-none rounded-md transition-all border border-outline focus:border-primary placeholder:text-zinc-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3 px-6 font-sans text-xs uppercase tracking-widest hover:bg-secondary transition-all duration-300 disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-1.5 font-bold rounded-sm"
            type="submit"
          >
            <span>{loading ? "Verifying..." : "Continue"}</span>
            {!loading && <span className="text-xs">→</span>}
          </button>
        </form>

        <p className="mt-8 text-center font-sans text-[10px] text-on-surface-variant uppercase tracking-wider">
          New here?{" "}
          <Link
            className="text-primary font-bold hover:text-secondary transition-all"
            to="/register"
          >
            Create an Account
          </Link>
        </p>

      </main>
    </div>
  );
};

export default Login;
