import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, Plus, Eye, Pencil, RefreshCw, ExternalLink } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Website {
  id: string;
  name: string;
  subdomain: string;
  industry: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebsites = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("websites")
      .select("id, name, subdomain, industry, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load websites");
    } else {
      setWebsites(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWebsites();
  }, [user]);

  const handleRegenerate = async (websiteId: string) => {
    toast.info("Regenerating website...");
    const { error } = await supabase.functions.invoke("generate-website", {
      body: { websiteId },
    });
    if (error) {
      toast.error("Failed to regenerate");
    } else {
      toast.success("Regeneration started!");
      // Poll for update
      const poll = setInterval(async () => {
        const { data } = await supabase
          .from("websites")
          .select("status")
          .eq("id", websiteId)
          .single();
        if (data?.status === "live" || data?.status === "failed") {
          clearInterval(poll);
          fetchWebsites();
        }
      }, 3000);
    }
  };

  const statusStyles = (status: string) => {
    switch (status) {
      case "live":
        return "bg-primary/10 text-primary";
      case "generating":
        return "bg-accent/20 text-accent-foreground";
      case "failed":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

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

          {loading ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse">
              Loading your websites...
            </div>
          ) : websites.length === 0 ? (
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
                  <div className="h-40 bg-gradient-hero flex items-center justify-center">
                    <Globe className="w-10 h-10 text-primary-foreground/50" />
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{site.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles(site.status)}`}>
                        {site.status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-1">
                      {site.subdomain}.ugbiz.com
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">{site.industry}</p>

                    <div className="flex gap-2">
                      {site.status === "live" && (
                        <>
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link to={`/preview?id=${site.id}`}>
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link to={`/editor?id=${site.id}`}>
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </Link>
                          </Button>
                        </>
                      )}
                      {site.status === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRegenerate(site.id)}
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry
                        </Button>
                      )}
                      {site.status === "generating" && (
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...
                        </Button>
                      )}
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
