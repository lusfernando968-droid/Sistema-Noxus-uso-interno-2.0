import { Loader2, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { HeaderNotifications } from "./HeaderNotifications";
import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";
// Removed seeding hook to avoid dados fictícios

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const studioName = useMemo(() => "Sistema Noxus", []);
  return <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 text-primary" />
            <h1 className="tracking-tight text-foreground text-xl font-medium">{studioName}</h1>
          </div>
        </div>
      </div>



      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-muted-foreground" />
          <Switch 
            checked={theme === "dark"} 
            onCheckedChange={toggleTheme}
            className="data-[state=checked]:bg-primary"
          />
          <Moon className="w-4 h-4 text-muted-foreground" />
          {/* Botão de povoação removido para manter apenas dados reais */}
        </div>
        <HeaderNotifications />
        <ProfileDropdown />
      </div>
    </header>;
}