import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Globe, MessageSquare, MapPin, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Progress } from "@/components/ui/progress";
import { format, subDays, startOfDay } from "date-fns";

interface PageView {
  website_id: string;
  page_slug: string;
  viewed_at: string;
  country: string | null;
}

interface Website {
  id: string;
  name: string;
  subdomain: string;
  chat_widget_enabled: boolean;
}

const COLORS = ["hsl(var(--primary))", "hsl(210, 70%, 50%)", "hsl(150, 60%, 45%)", "hsl(45, 80%, 50%)", "hsl(280, 60%, 55%)", "hsl(0, 70%, 55%)"];

const AdminAnalytics = () => {
  const [views, setViews] = useState<PageView[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [viewsRes, websitesRes] = await Promise.all([
        supabase.from("page_views").select("website_id, page_slug, viewed_at, country").order("viewed_at", { ascending: false }),
        supabase.from("websites").select("id, name, subdomain, chat_widget_enabled"),
      ]);
      setViews(viewsRes.data || []);
      setWebsites(websitesRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Total views
  const totalViews = views.length;
  const today = startOfDay(new Date());
  const todayViews = views.filter((v) => new Date(v.viewed_at) >= today).length;

  // Views per day (14 days)
  const dailyData = [];
  for (let i = 13; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const nextDay = startOfDay(subDays(new Date(), i - 1));
    dailyData.push({
      date: format(day, "MMM d"),
      views: views.filter((v) => {
        const d = new Date(v.viewed_at);
        return d >= day && d < nextDay;
      }).length,
    });
  }

  // Top websites by views
  const siteViewCounts: Record<string, number> = {};
  views.forEach((v) => {
    siteViewCounts[v.website_id] = (siteViewCounts[v.website_id] || 0) + 1;
  });
  const topSites = Object.entries(siteViewCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([id, count]) => {
      const site = websites.find((w) => w.id === id);
      return { name: site?.name || id.slice(0, 8), views: count };
    });

  // Country breakdown
  const countryCounts: Record<string, number> = {};
  views.forEach((v) => {
    if (v.country) countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
  });
  const countries = Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  const maxCountryViews = countries.length > 0 ? countries[0][1] : 1;

  // Chat widget stats
  const chatEnabled = websites.filter((w) => w.chat_widget_enabled).length;
  const chatDisabled = websites.length - chatEnabled;

  // Top pages
  const pageCounts: Record<string, number> = {};
  views.forEach((v) => {
    pageCounts[v.page_slug] = (pageCounts[v.page_slug] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([slug, count]) => ({ slug, count }));

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Platform Analytics</h1>
      {loading ? (
        <div className="text-muted-foreground animate-pulse">Loading analytics...</div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Page Views</CardTitle>
                <Eye className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{totalViews.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Views</CardTitle>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{todayViews}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Countries Reached</CardTitle>
                <MapPin className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{Object.keys(countryCounts).length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Chat Widgets Active</CardTitle>
                <MessageSquare className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatEnabled} <span className="text-sm font-normal text-muted-foreground">/ {websites.length}</span></div>
              </CardContent>
            </Card>
          </div>

          {/* Views trend + Top sites */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Views Over Time (14 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Views" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Top Websites by Traffic</CardTitle>
              </CardHeader>
              <CardContent>
                {topSites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No traffic data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {topSites.map((site, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium truncate">{site.name}</span>
                          <span className="text-muted-foreground">{site.views}</span>
                        </div>
                        <Progress value={(site.views / (topSites[0]?.views || 1)) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Countries + Top pages */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Visitor Countries</CardTitle>
              </CardHeader>
              <CardContent>
                {countries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No country data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {countries.map(([country, count]) => (
                      <div key={country} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{country}</span>
                          <span className="text-muted-foreground">{count} views</span>
                        </div>
                        <Progress value={(count / maxCountryViews) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                {topPages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No page data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={topPages} dataKey="count" nameKey="slug" cx="50%" cy="50%" outerRadius={100} label={({ slug, percent }) => `${slug} (${(percent * 100).toFixed(0)}%)`}>
                        {topPages.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAnalytics;
