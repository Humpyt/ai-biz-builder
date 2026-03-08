import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, CreditCard, TrendingUp } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalWebsites: number;
  activeSubscriptions: number;
  revenue: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalWebsites: 0, activeSubscriptions: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, websitesRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("websites").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("amount, status"),
      ]);

      const activeSubs = subsRes.data?.filter((s) => s.status === "active") || [];
      const revenue = activeSubs.reduce((sum, s) => sum + (s.amount || 0), 0);

      setStats({
        totalUsers: profilesRes.count || 0,
        totalWebsites: websitesRes.count || 0,
        activeSubscriptions: activeSubs.length,
        revenue,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Websites", value: stats.totalWebsites, icon: Globe, color: "text-secondary" },
    { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: CreditCard, color: "text-accent-foreground" },
    { label: "Total Revenue", value: `UGX ${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      {loading ? (
        <div className="text-muted-foreground animate-pulse">Loading stats...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOverview;
