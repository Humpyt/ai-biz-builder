import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Globe, CreditCard, Shield, Ban } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  banned: boolean;
}

interface UserWebsite {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

interface UserSub {
  id: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  expires_at: string | null;
}

interface UserRole {
  id: string;
  role: "admin" | "moderator" | "user";
}

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userWebsites, setUserWebsites] = useState<UserWebsite[]>([]);
  const [userSubs, setUserSubs] = useState<UserSub[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [banConfirm, setBanConfirm] = useState<{ userId: string; name: string; currentlyBanned: boolean } | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setProfiles(data || []);
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  const toggleExpand = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(userId);
    setDetailLoading(true);

    const [websitesRes, subsRes, rolesRes] = await Promise.all([
      supabase.from("websites").select("id, name, subdomain, status").eq("user_id", userId),
      supabase.from("subscriptions").select("id, plan, status, amount, currency, expires_at").eq("user_id", userId),
      supabase.from("user_roles").select("id, role").eq("user_id", userId),
    ]);

    setUserWebsites(websitesRes.data || []);
    setUserSubs(subsRes.data || []);
    setUserRoles(rolesRes.data || []);
    setDetailLoading(false);
  };

  const handleAddRole = async (userId: string, role: "admin" | "moderator" | "user") => {
    const exists = userRoles.find((r) => r.role === role);
    if (exists) {
      toast.info("User already has this role");
      return;
    }
    const { data, error } = await supabase.from("user_roles").insert({ user_id: userId, role }).select().single();
    if (error) {
      toast.error("Failed to add role");
    } else {
      toast.success(`Added ${role} role`);
      setUserRoles((prev) => [...prev, data as UserRole]);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) {
      toast.error("Failed to remove role");
    } else {
      toast.success("Role removed");
      setUserRoles((prev) => prev.filter((r) => r.id !== roleId));
    }
  };

  const handleToggleBan = async () => {
    if (!banConfirm) return;
    const newBanned = !banConfirm.currentlyBanned;
    const { error } = await supabase
      .from("profiles")
      .update({ banned: newBanned })
      .eq("user_id", banConfirm.userId);
    if (error) {
      toast.error("Failed to update user status");
    } else {
      toast.success(newBanned ? "User has been banned" : "User has been unbanned");
      setProfiles((prev) =>
        prev.map((p) => (p.user_id === banConfirm.userId ? { ...p, banned: newBanned } : p))
      );
    }
    setBanConfirm(null);
  };

  const filtered = profiles.filter(
    (p) =>
      (p.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      p.user_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      {loading ? (
        <div className="text-muted-foreground animate-pulse">Loading users...</div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <>
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(p.user_id)}
                    >
                      <TableCell>
                        {expandedUser === p.user_id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{p.display_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {p.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {p.banned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={p.banned ? "outline" : "destructive"}
                          size="sm"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBanConfirm({ userId: p.user_id, name: p.display_name || "this user", currentlyBanned: p.banned });
                          }}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          {p.banned ? "Unban" : "Ban"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedUser === p.user_id && (
                      <TableRow key={`${p.id}-detail`}>
                        <TableCell colSpan={5} className="bg-muted/30 p-4">
                          {detailLoading ? (
                            <div className="text-muted-foreground animate-pulse text-sm">Loading details...</div>
                          ) : (
                            <div className="grid md:grid-cols-3 gap-4">
                              {/* Websites */}
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    <Globe className="h-4 w-4" /> Websites ({userWebsites.length})
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  {userWebsites.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No websites</p>
                                  ) : (
                                    userWebsites.map((w) => (
                                      <div key={w.id} className="flex items-center justify-between text-sm">
                                        <span className="truncate">{w.name}</span>
                                        <Badge variant={w.status === "live" ? "default" : "secondary"} className="text-[10px]">
                                          {w.status}
                                        </Badge>
                                      </div>
                                    ))
                                  )}
                                </CardContent>
                              </Card>

                              {/* Subscription */}
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" /> Subscriptions ({userSubs.length})
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  {userSubs.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No subscriptions</p>
                                  ) : (
                                    userSubs.map((s) => (
                                      <div key={s.id} className="text-sm space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium capitalize">{s.plan}</span>
                                          <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px]">
                                            {s.status}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {s.currency} {s.amount.toLocaleString()}
                                          {s.expires_at && ` · Exp: ${format(new Date(s.expires_at), "MMM d, yyyy")}`}
                                        </p>
                                      </div>
                                    ))
                                  )}
                                </CardContent>
                              </Card>

                              {/* Roles */}
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    <Shield className="h-4 w-4" /> Roles
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="flex flex-wrap gap-1">
                                    {userRoles.length === 0 ? (
                                      <p className="text-xs text-muted-foreground">No roles assigned</p>
                                    ) : (
                                      userRoles.map((r) => (
                                        <Badge key={r.id} variant="outline" className="gap-1 text-xs">
                                          {r.role}
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveRole(r.id); }}
                                            className="ml-1 text-destructive hover:text-destructive/80 font-bold"
                                          >
                                            ×
                                          </button>
                                        </Badge>
                                      ))
                                    )}
                                  </div>
                                  <Select onValueChange={(v) => handleAddRole(p.user_id, v as "admin" | "moderator" | "user")}>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Add role..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="moderator">Moderator</SelectItem>
                                      <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
