import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

type UserRole = "admin" | "manager" | "user" | "assistant";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Strict check: If roles are required, user MUST have a matching role.
  // Exception: 'user' role (often used as fallback for admin with RLS issues) is allowed if 'admin' is in allowedRoles.
  const isUnauthorized = allowedRoles && (
    !userRole ||
    (!allowedRoles.includes(userRole) && !(userRole === 'user' && allowedRoles.includes('admin')))
  );

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (isUnauthorized) {
        let target = "/";
        if (userRole === "assistant") {
          target = "/agendamentos";
        } else {
          // If role is null/user and they are trying to access restricted admin page, send to home
          // BUT if home is also restricted (which it is), sending to "/" causes loop.
          // Send to /perfil or stay put?
          // If we are already at root, send to perfil or auth
          if (location.pathname === "/") {
            target = "/perfil"; // Fallback for "zombie" users with no role
          }
        }

        if (location.pathname !== target) {
          navigate(target);
        }
      }
    }
  }, [user, loading, userRole, isUnauthorized, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <p className="text-muted-foreground animate-pulse">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Prevent flash of unauthorized content
  if (isUnauthorized) {
    return null;
  }

  return <>{children}</>;
}
