import React from "react";
import { useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();

  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }
  return (
    <footer className="bg-surface-container-lowest dark:bg-tertiary-container w-full py-stack-lg border-t border-outline-variant dark:border-tertiary mt-auto">
      <div className="flex flex-col items-center space-y-stack-sm max-w-reading-column-max mx-auto px-margin-mobile text-center">
        <h2 className="font-display-lg text-headline-sm text-on-surface">The Manuscript</h2>
        <nav className="flex flex-wrap justify-center gap-6 mb-4">
          <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">
            The Manifesto
          </a>
          <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">
            Submission Guidelines
          </a>
          <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">
            Colophon
          </a>
        </nav>
        <p className="font-ui-small text-ui-small text-on-surface-variant opacity-80">
          © {new Date().getFullYear()} The Manuscript Editorial. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
