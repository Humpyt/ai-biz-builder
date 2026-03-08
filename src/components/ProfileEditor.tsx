import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Save, Loader2, X } from "lucide-react";

const ProfileEditor = () => {
  const { user, profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: avatarUrl || null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
      setEditing(false);
      // Reload to reflect changes in context
      window.location.reload();
    }
    setSaving(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url || ""} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{profile?.display_name || "No name set"}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => {
          setDisplayName(profile?.display_name || "");
          setAvatarUrl(profile?.avatar_url || "");
          setEditing(true);
        }}>
          <Pencil className="w-4 h-4" /> Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {displayName?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">Display Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Avatar URL</label>
        <Input
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
        />
        <p className="text-xs text-muted-foreground mt-1">Paste a link to your profile photo</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
          <X className="w-4 h-4" /> Cancel
        </Button>
      </div>
    </div>
  );
};

export default ProfileEditor;
