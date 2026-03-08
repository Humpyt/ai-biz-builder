import { Button } from "@/components/ui/button";
import { Globe, LogOut, Menu, Moon, Shield, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useTheme } from "next-themes";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const navLinks = (
    <>
      <Link to="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>
        Features
      </Link>
      <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>
        Pricing
      </Link>
      {user && (
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>
          Dashboard
        </Link>
      )}
      {isAdmin && (
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1" onClick={() => setMobileOpen(false)}>
          <Shield className="w-3.5 h-3.5" />
          Admin
        </Link>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <Globe className="w-6 h-6 text-secondary" />
          UgBiz
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="h-8 w-8"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>
          {user ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/onboarding">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-secondary" />
                  UgBiz
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navLinks}
                {!user && (
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/login" onClick={() => setMobileOpen(false)}>Log In</Link>
                    </Button>
                    <Button variant="default" size="sm" asChild>
                      <Link to="/onboarding" onClick={() => setMobileOpen(false)}>Get Started</Link>
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
