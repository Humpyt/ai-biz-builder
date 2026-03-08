import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  phone_number: string | null;
  expires_at: string | null;
  created_at: string;
}

const AdminSubscriptions = () => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    setSubs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("subscriptions").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status updated to ${newStatus}`);
      setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
    }
  };

  const filtered = subs.filter((s) => {
    const matchSearch =
      s.plan.toLowerCase().includes(search.toLowerCase()) ||
      s.user_id.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone_number || "").includes(search);
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusColor = (s: string) => {
    if (s === "active") return "default" as const;
    if (s === "expired") return "secondary" as const;
    if (s === "cancelled") return "destructive" as const;
    return "outline" as const;
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
      </div>
      {loading ? (
        <div className="text-muted-foreground animate-pulse">Loading subscriptions...</div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-36">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">No subscriptions found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium capitalize">{s.plan}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{s.user_id.slice(0, 8)}...</TableCell>
                    <TableCell>{s.currency} {s.amount.toLocaleString()}</TableCell>
                    <TableCell>{s.payment_method || "—"}</TableCell>
                    <TableCell><Badge variant={statusColor(s.status)}>{s.status}</Badge></TableCell>
                    <TableCell>{s.expires_at ? format(new Date(s.expires_at), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell>
                      <Select value={s.status} onValueChange={(v) => handleStatusChange(s.id, v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSubscriptions;
