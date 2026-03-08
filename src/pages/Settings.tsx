import Navbar from "@/components/layout/Navbar";
import ProfileEditor from "@/components/ProfileEditor";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-8">Manage your account and profile.</p>

          {/* Profile */}
          <div className="bg-card rounded-xl shadow-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">Profile</span>
            </div>
            <ProfileEditor />
          </div>

          {/* Account Info */}
          <div className="bg-card rounded-xl shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">Account</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">User ID</label>
                <p className="font-mono text-sm text-muted-foreground">{user?.id}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
