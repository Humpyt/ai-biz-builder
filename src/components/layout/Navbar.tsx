import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => (
  <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
    <div className="container flex items-center justify-between h-16">
      <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
        <Globe className="w-6 h-6 text-secondary" />
        UgBiz
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <Link to="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Features
        </Link>
        <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Pricing
        </Link>
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Dashboard
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/login">Log In</Link>
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link to="/onboarding">Get Started</Link>
        </Button>
      </div>
    </div>
  </nav>
);

export default Navbar;
