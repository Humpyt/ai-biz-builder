import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.banned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="text-4xl">🚫</div>
          <h1 className="text-xl font-bold text-foreground">Account Suspended</h1>
          <p className="text-muted-foreground text-sm">
            Your account has been suspended by an administrator. If you believe this is a mistake, please contact support.
          </p>
          <button
            onClick={() => signOut()}
            className="text-sm text-primary hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
