import { Globe } from "lucide-react";
import { Link } from "react-router-dom";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/#features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Get Started", to: "/onboarding" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Login", to: "/login" },
      { label: "Sign Up", to: "/signup" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "#" },
      { label: "Contact Us", to: "#" },
      { label: "Status", to: "#" },
    ],
  },
];

const Footer = () => (
  <footer className="border-t border-border bg-muted/30">
    {/* Gradient top line */}
    <div className="h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

    <div className="container py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand column */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl mb-3">
            <Globe className="w-5 h-5 text-secondary" />
            UgBiz
          </Link>
          <p className="text-sm text-muted-foreground max-w-[220px]">
            AI-powered websites for Ugandan businesses. Go online in minutes.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-display font-semibold text-sm mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted-foreground">
          © 2026 UgBiz. All rights reserved.
        </p>
        <div className="flex gap-5">
          {["Twitter", "Instagram", "LinkedIn"].map((s) => (
            <a key={s} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {s}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
