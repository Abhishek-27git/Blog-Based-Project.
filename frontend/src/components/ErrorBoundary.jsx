import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an analytics service or console
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-background text-on-surface flex flex-col justify-center items-center px-6 py-12 select-none">
          <div className="max-w-md w-full border border-outline-variant bg-surface-container-low p-8 text-center shadow-sm relative">
            {/* Top ornament */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-secondary">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>

            <span className="font-ui-small text-[10px] text-secondary uppercase tracking-widest block mb-4 mt-2">
              System Anomaly
            </span>

            <h2 className="font-display-lg text-headline-md mb-4 leading-tight">
              An Interruption in the Archive
            </h2>

            <p className="font-body-md text-sm text-on-surface-variant mb-6 leading-relaxed">
              We apologize, but an unexpected error occurred while loading this page. The system was unable to compile the manuscript layout.
            </p>

            {this.state.error && (
              <details className="text-left bg-surface-container border border-outline-variant p-4 mb-6 cursor-pointer">
                <summary className="font-ui-label text-xs uppercase tracking-wider text-on-surface-variant select-none">
                  Technical details
                </summary>
                <pre className="font-mono text-xs text-error mt-3 whitespace-pre-wrap overflow-x-auto select-text">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto bg-primary text-on-primary px-6 py-2 border border-primary font-ui-label text-xs uppercase tracking-widest hover:bg-transparent hover:text-primary transition-all duration-300 cursor-pointer"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary px-6 py-2 font-ui-label text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer"
              >
                Go Home
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
