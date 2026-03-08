import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink, Settings, Plus, Eye, Pencil } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

interface Website {
  id: string;
  name: string;
  subdomain: string;
  industry: string;
  status: "generating" | "live" | "draft";
  createdAt: string;
}

const Dashboard = () => {
  const [websites, setWebsites] = useState<Website[]>([]);

  useEffect(() => {
    // Load from onboarding data if available
    const saved = localStorage.getItem("ugbiz_onboarding");
    if (saved) {
      const data = JSON.parse(saved);
      setWebsites([
        {
          id: "1",
          name: data.businessName || "My Website",
          subdomain: data.subdomain || "my-site",
          industry: data.industry || "General",
          status: "live",
          createdAt: new Date().toISOString(),
        },
      ]);
    } else {
      // Demo data
      setWebsites([
        {
          id: "demo",
          name: "Demo Business",
          subdomain: "demo",
          industry: "Restaurant / Food",
          status: "live",
          createdAt: "2026-03-01",
        },
      ]);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Websites</h1>
              <p className="text-muted-foreground">Manage and update your AI-generated websites.</p>
            </div>
            <Button asChild>
              <Link to="/onboarding">
                <Plus className="w-4 h-4" /> New Website
              </Link>
            </Button>
          </div>

          {websites.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-card p-12 text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No websites yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first AI-generated website in minutes.
              </p>
              <Button variant="hero" asChild>
                <Link to="/onboarding">Get Started</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {websites.map((site) => (
                <div
                  key={site.id}
                  className="bg-card rounded-xl shadow-card hover:shadow-card-hover transition-shadow overflow-hidden"
                >
                  {/* Preview placeholder */}
                  <div className="h-40 bg-gradient-hero flex items-center justify-center">
                    <Globe className="w-10 h-10 text-primary-foreground/50" />
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{site.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        site.status === "live"
                          ? "bg-primary/10 text-primary"
                          : site.status === "generating"
                          ? "bg-accent/20 text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {site.status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-1">
                      {site.subdomain}.ugbiz.com
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">{site.industry}</p>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
