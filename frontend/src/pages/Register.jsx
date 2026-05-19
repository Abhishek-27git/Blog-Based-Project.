import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Scroll progress bar effect
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      const progressBar = document.getElementById("scrollProgress");
      if (progressBar) {
        progressBar.style.width = scrolled + "%";
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!name || !email || !password) {
      setValidationError("Please fill in all fields.");
      return;
    }

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setValidationError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setValidationError("Password must contain at least one number.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setValidationError(err.message || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="font-body-md text-on-surface bg-[#fbf9f5] min-h-screen flex flex-col items-center justify-center selection:bg-secondary-fixed">
      {/* Reading Bar */}
      <div className="reading-bar" id="scrollProgress"></div>

      <main className="w-full max-w-reading-column-max px-margin-mobile flex flex-col items-center py-stack-lg animate-in fade-in duration-700">
        
        {/* Brand Logo / Anchor */}
        <header className="mb-stack-lg text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-primary text-4xl">
              menu_book
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight mb-2">
            The Manuscript
          </h1>
          <p className="font-ui-label text-ui-small text-on-surface-variant uppercase tracking-widest text-[11px]">
            ESTABLISHED 2024
          </p>
        </header>

        {/* Centered Modal-style Card */}
        <div className="w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant p-8 md:p-12 transition-all duration-300">
          
          <div className="text-center mb-8">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Join The Manuscript</h2>
            <p className="font-body-md text-on-surface-variant italic">
              Enter a sanctuary for the written word.
            </p>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="mb-6 p-4 bg-error-container border border-error/20 text-on-error-container text-ui-label font-ui-label text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-[18px]">
                error
              </span>
              <span>{validationError}</span>
            </div>
          )}

          {/* Google Sign up */}
          <div className="space-y-4 mb-8">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 py-4 px-6 border border-primary hover:bg-surface-container-low transition-colors duration-200 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                ></path>
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                ></path>
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                ></path>
              </svg>
              <span className="font-ui-label text-ui-label text-primary">Sign up with Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant"></div>
            </div>
            <span className="relative px-4 bg-surface-container-lowest text-ui-small font-ui-small text-on-surface-variant italic">
              or
            </span>
          </div>

          {/* Email Registration Logic */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="font-ui-label text-ui-small text-on-surface-variant uppercase tracking-tighter text-xs" htmlFor="name">
                Your Name
              </label>
              <input
                className="ink-input w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 font-body-md text-on-surface transition-all placeholder-outline-variant/60"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="claire levis"
                required
                type="text"
              />
            </div>

            <div className="space-y-1">
              <label className="font-ui-label text-ui-small text-on-surface-variant uppercase tracking-tighter text-xs" htmlFor="email">
                Your Email
              </label>
              <input
                className="ink-input w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 font-body-md text-on-surface transition-all placeholder-outline-variant/60"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="claire.levis@writer.com"
                required
                type="email"
              />
            </div>

            <div className="space-y-1">
              <label className="font-ui-label text-ui-small text-on-surface-variant uppercase tracking-tighter text-xs" htmlFor="password">
                Choose Password
              </label>
              <input
                className="ink-input w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 font-body-md text-on-surface transition-all placeholder-outline-variant/60"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                type="password"
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-primary text-on-primary py-4 px-6 font-ui-label text-ui-label uppercase tracking-widest hover:bg-on-surface-variant transition-colors duration-300 disabled:opacity-50 mt-4"
              type="submit"
            >
              {loading ? "Inscribing..." : "Create Account"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4">
            <p className="font-ui-small text-ui-small text-on-surface-variant">
              Already have an account?{" "}
              <Link
                className="text-primary font-bold underline underline-offset-4 decoration-outline-variant hover:decoration-primary transition-all"
                to="/login"
              >
                Sign in
              </Link>
            </p>
            <div className="pt-8 border-t border-outline-variant">
              <p className="font-ui-small text-ui-small text-on-tertiary-container leading-relaxed">
                By signing up, you agree to our <a className="underline" href="#">Terms of Service</a> and{" "}
                <a className="underline" href="#">Privacy Policy</a>.
              </p>
            </div>
          </div>

        </div>

        {/* Decorative Flourish */}
        <div className="mt-stack-lg flex items-center justify-center gap-4 text-secondary opacity-40">
          <div className="h-[1px] w-12 bg-outline-variant"></div>
          <span className="material-symbols-outlined text-sm">auto_stories</span>
          <div className="h-[1px] w-12 bg-outline-variant"></div>
        </div>

      </main>

      {/* Contextual Footer (Lightweight) */}
      <footer className="w-full py-stack-sm mt-auto border-t border-outline-variant bg-surface-container-low">
        <div className="max-w-reading-column-max mx-auto px-margin-mobile flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-ui-small text-ui-small text-on-surface-variant">
            © {new Date().getFullYear()} The Manuscript Editorial
          </span>
          <div className="flex gap-6">
            <a className="font-ui-small text-ui-small text-on-surface-variant hover:text-primary transition-colors" href="#">
              Manifesto
            </a>
            <a className="font-ui-small text-ui-small text-on-surface-variant hover:text-primary transition-colors" href="#">
              Colophon
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Register;
