import { Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t py-12 bg-muted/30">
    <div className="container">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <Globe className="w-5 h-5 text-secondary" />
          UgBiz
        </Link>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/onboarding" className="hover:text-foreground transition-colors">Get Started</Link>
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        </div>
        <p className="text-sm text-muted-foreground">
          (c) 2026 UgBiz. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
