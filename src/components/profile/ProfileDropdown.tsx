import { User, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "./UserAvatar";
import { Badge } from "@/components/ui/badge";

export function ProfileDropdown() {
  const { profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (!profile) return null;

  const roleLabels = {
    admin: "Administrador",
    manager: "Gerente",
    user: "Usuário",
    assistant: "Assistente",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity rounded-xl p-2 hover:bg-accent">
          <UserAvatar
            avatarUrl={profile.avatar_url}
            name={profile.nome_completo}
            className="h-9 w-9"
          />
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium">{profile.nome_completo}</p>
            {userRole && (
              <Badge variant="secondary" className="text-xs mt-1">
                {roleLabels[userRole]}
              </Badge>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userRole !== 'assistant' && (
          <DropdownMenuItem onClick={() => navigate("/perfil")} className="rounded-lg">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
        )}
        {userRole !== 'assistant' && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={handleSignOut} className="rounded-lg text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
