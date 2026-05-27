import React from "react";
import { useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();

  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }
  return (
    <footer className="w-full bg-background border-t border-outline-variant/50 mt-auto pt-16 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 border-b border-outline-variant/20 pb-12 mb-8">
        
        {/* Left Column: Manifesto teaser */}
        <div className="max-w-sm space-y-4">
          <h2 className="font-display-lg text-headline-sm uppercase tracking-widest font-bold">
            The Manuscript
          </h2>
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed italic">
            A distraction-free sanctuary for slow contemplation, literary design, and academic essays. Margins for ideas to breathe.
          </p>
        </div>

        {/* Right Columns: Nav Links */}
        <div className="grid grid-cols-2 gap-16">
          <div className="space-y-4">
            <h4 className="font-ui-label text-[10px] uppercase tracking-widest text-secondary font-bold">
              Editorial
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="font-ui-label text-xs text-on-surface-variant hover:text-primary transition-colors">
                  The Manifesto
                </a>
              </li>
              <li>
                <a href="#" className="font-ui-label text-xs text-on-surface-variant hover:text-primary transition-colors">
                  Submission Rules
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-ui-label text-[10px] uppercase tracking-widest text-secondary font-bold">
              Publishing
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="font-ui-label text-xs text-on-surface-variant hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="font-ui-label text-xs text-on-surface-variant hover:text-primary transition-colors">
                  Colophon
                </a>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Bottom bar matching Reference Image 1 layout */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <p className="font-ui-small text-[10px] uppercase tracking-widest text-on-surface-variant/75">
          © {new Date().getFullYear()} The Manuscript.
        </p>
        <div className="flex gap-6">
          <a href="#" className="font-ui-small text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
            Twitter
          </a>
          <a href="#" className="font-ui-small text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
