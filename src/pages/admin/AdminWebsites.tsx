import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Website {
  id: string;
  name: string;
  subdomain: string;
  industry: string;
  status: string;
  user_id: string;
  created_at: string;
}

const statusVariant = (s: string) => {
  if (s === "live") return "default" as const;
  if (s === "failed") return "destructive" as const;
  return "secondary" as const;
};

const AdminWebsites = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const { data } = await supabase
      .from("websites")
      .select("id, name, subdomain, industry, status, user_id, created_at")
      .order("created_at", { ascending: false });
    setWebsites(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("websites").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Website deleted");
      setWebsites((prev) => prev.filter((w) => w.id !== id));
    }
  };

  const filtered = websites.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.subdomain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Websites</h1>
        <Input placeholder="Search websites..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>
      {loading ? (
        <div className="text-muted-foreground animate-pulse">Loading websites...</div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No websites found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell>
                      <a
                        href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serve-website?subdomain=${w.subdomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        {w.subdomain} <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                    <TableCell>{w.industry}</TableCell>
                    <TableCell><Badge variant={statusVariant(w.status)}>{w.status}</Badge></TableCell>
                    <TableCell>{format(new Date(w.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{w.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(w.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

export default AdminWebsites;
