import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, Plus, Eye, Pencil, RefreshCw, ExternalLink, Trash2, CreditCard, CalendarClock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Website {
  id: string;
  name: string;
  subdomain: string;
  industry: string;
  status: string;
  created_at: string;
}

interface Subscription {
  plan: string;
  status: string;
  expires_at: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
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

  const fetchSubscription = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("plan, status, expires_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription(data);
  };

  useEffect(() => {
    fetchWebsites();
    fetchSubscription();
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

  const handleDelete = async (websiteId: string) => {
    const { error } = await supabase.from("websites").delete().eq("id", websiteId);
    if (error) {
      toast.error("Failed to delete website");
    } else {
      toast.success("Website deleted");
      setWebsites((prev) => prev.filter((s) => s.id !== websiteId));
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

          {/* Subscription status */}
          <div className="bg-card rounded-xl shadow-card p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-semibold capitalize">{subscription?.plan || "Free"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="w-4 h-4" />
                {subscription?.expires_at
                  ? `Expires ${format(new Date(subscription.expires_at), "MMM d, yyyy")}`
                  : "No expiry"}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                subscription?.status === "active"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {subscription?.status || "active"}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link to="/pricing">Upgrade</Link>
              </Button>
            </div>
          </div>


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

                    <a
                      href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serve-website?subdomain=${site.subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 mb-1"
                    >
                      {site.subdomain}.ugbiz.com <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-xs text-muted-foreground mb-4">{site.industry}</p>

                    <div className="flex gap-2 flex-wrap">
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{site.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this website and all its generated content. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(site.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
