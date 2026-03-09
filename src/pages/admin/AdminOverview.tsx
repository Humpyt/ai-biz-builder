import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, CreditCard, TrendingUp, Activity, UserPlus, Globe2, DollarSign } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalUsers: number;
  totalWebsites: number;
  activeSubscriptions: number;
  revenue: number;
}

interface ActivityItem {
  type: "user" | "website" | "subscription";
  label: string;
  detail: string;
  time: string;
}

interface ChartPoint {
  date: string;
  users: number;
  websites: number;
  revenue: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalWebsites: 0, activeSubscriptions: 0, revenue: 0 });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [profilesRes, websitesRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("id, created_at"),
        supabase.from("websites").select("id, name, created_at"),
        supabase.from("subscriptions").select("id, plan, amount, status, created_at, user_id"),
      ]);

      const profiles = profilesRes.data || [];
      const websites = websitesRes.data || [];
      const subs = subsRes.data || [];
      const activeSubs = subs.filter((s) => s.status === "active");
      const revenue = activeSubs.reduce((sum, s) => sum + (s.amount || 0), 0);

      setStats({
        totalUsers: profiles.length,
        totalWebsites: websites.length,
        activeSubscriptions: activeSubs.length,
        revenue,
      });

      // Build 14-day chart data
      const days: ChartPoint[] = [];
      for (let i = 13; i >= 0; i--) {
        const day = startOfDay(subDays(new Date(), i));
        const dayStr = format(day, "MMM d");
        const nextDay = startOfDay(subDays(new Date(), i - 1));
        days.push({
          date: dayStr,
          users: profiles.filter((p) => {
            const d = new Date(p.created_at);
            return d >= day && d < nextDay;
          }).length,
          websites: websites.filter((w) => {
            const d = new Date(w.created_at);
            return d >= day && d < nextDay;
          }).length,
          revenue: subs.filter((s) => {
            const d = new Date(s.created_at);
            return d >= day && d < nextDay;
          }).reduce((sum, s) => sum + (s.amount || 0), 0),
        });
      }
      setChartData(days);

      // Build activity feed (last 20 events sorted by time)
      const events: ActivityItem[] = [
        ...profiles.map((p) => ({
          type: "user" as const,
          label: "New user signed up",
          detail: p.id.slice(0, 8),
          time: p.created_at,
        })),
        ...websites.map((w) => ({
          type: "website" as const,
          label: "Website created",
          detail: w.name,
          time: w.created_at,
        })),
        ...subs.map((s) => ({
          type: "subscription" as const,
          label: `${s.plan} subscription`,
          detail: `${s.status} - UGX ${s.amount.toLocaleString()}`,
          time: s.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 20);

      setActivity(events);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Websites", value: stats.totalWebsites, icon: Globe, color: "text-blue-500" },
    { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: CreditCard, color: "text-emerald-500" },
    { label: "Total Revenue", value: `UGX ${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: "text-amber-500" },
  ];

  const activityIcon = (type: string) => {
    if (type === "user") return <UserPlus className="h-4 w-4 text-primary" />;
    if (type === "website") return <Globe2 className="h-4 w-4 text-blue-500" />;
    return <DollarSign className="h-4 w-4 text-emerald-500" />;
  };

  const activityBadge = (type: string) => {
    if (type === "user") return "default" as const;
    if (type === "website") return "secondary" as const;
    return "outline" as const;
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      {loading ? (
        <div className="text-muted-foreground animate-pulse">Loading stats...</div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
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

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Signups & Websites (14 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Users" />
                    <Bar dataKey="websites" fill="hsl(210, 70%, 50%)" radius={[4, 4, 0, 0]} name="Websites" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue Trend (14 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => [`UGX ${v.toLocaleString()}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(45, 80%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent activity.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {activity.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className="shrink-0">{activityIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <Badge variant={activityBadge(item.type)} className="text-[10px] capitalize">{item.type}</Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(item.time), "MMM d, HH:mm")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOverview;
