import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, TrendingUp, FileText, Users, Globe } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface PageView {
  id: string;
  website_id: string;
  page_slug: string;
  viewed_at: string;
  referer: string | null;
  country: string | null;
}

interface Website {
  id: string;
  name: string;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(160, 60%, 45%)",
];

export default function WebsiteAnalytics({ websites }: { websites: Website[] }) {
  const [views, setViews] = useState<PageView[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [range, setRange] = useState<string>("7");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViews = async () => {
      setLoading(true);
      const since = subDays(new Date(), parseInt(range)).toISOString();

      let query = supabase
        .from("page_views")
        .select("id, website_id, page_slug, viewed_at, referer, country")
        .gte("viewed_at", since)
        .order("viewed_at", { ascending: false });

      if (selectedSite !== "all") {
        query = query.eq("website_id", selectedSite);
      } else if (websites.length > 0) {
        query = query.in("website_id", websites.map((w) => w.id));
      }

      const { data, error } = await query;
      if (error) {
        console.error("Analytics fetch error:", error);
        setViews([]);
      } else {
        setViews(data || []);
      }
      setLoading(false);
    };

    if (websites.length > 0) fetchViews();
    else setLoading(false);
  }, [websites, selectedSite, range]);

  const dailyData = useMemo(() => {
    const days = parseInt(range);
    const interval = eachDayOfInterval({
      start: subDays(new Date(), days - 1),
      end: new Date(),
    });

    return interval.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const count = views.filter((v) => {
        const d = new Date(v.viewed_at);
        return d >= dayStart && d < dayEnd;
      }).length;
      return { date: format(day, "MMM d"), views: count };
    });
  }, [views, range]);

  const pageBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      const slug = v.page_slug || "index";
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [views]);

  const countryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      const country = v.country || "Unknown";
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [views]);

  const totalViews = views.length;
  const uniquePages = new Set(views.map((v) => v.page_slug)).size;

  // Estimate unique visitors by grouping views that share same day + referer pattern
  const todayViews = views.filter(
    (v) => new Date(v.viewed_at) >= startOfDay(new Date())
  ).length;

  if (websites.length === 0) return null;

  return (
    <div className="bg-card rounded-xl shadow-card p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Website Analytics
        </h2>
        <div className="flex items-center gap-3">
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All websites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All websites</SelectItem>
              {websites.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Eye className="w-4 h-4" />} label="Total Views" value={totalViews} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Today" value={todayViews} />
        <StatCard icon={<FileText className="w-4 h-4" />} label="Pages Viewed" value={uniquePages} />
        <StatCard icon={<Users className="w-4 h-4" />} label="Avg/Day" value={Math.round(totalViews / parseInt(range))} />
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">
          Loading analytics...
        </div>
      ) : totalViews === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          No page views yet. Share your website to start tracking visitors!
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Bar chart - views over time */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Views Over Time</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart - page breakdown */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Pages</h3>
            {pageBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pageBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pageBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {pageBreakdown.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-muted-foreground capitalize">{p.name}</span>
                      </div>
                      <span className="font-medium">{p.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Country breakdown */}
        {countryBreakdown.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Visitor Countries
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={countryBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {countryBreakdown.map((c, i) => {
                  const pct = totalViews > 0 ? Math.round((c.value / totalViews) * 100) : 0;
                  return (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-medium w-12 text-right">{c.value} <span className="text-muted-foreground text-xs">({pct}%)</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
