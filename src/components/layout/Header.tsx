import { Loader2, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { HeaderNotifications } from "./HeaderNotifications";
import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
// Removed seeding hook to avoid dados fictícios

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const studioName = useMemo(() => "NOXUS", []);
  return <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 text-primary" />
            <h1 className="tracking-tight text-foreground text-2xl font-black uppercase tracking-wide" style={{fontFamily: "'Montserrat', 'Oswald', 'Impact', sans-serif", letterSpacing: "0.05em"}}>{studioName}</h1>
          </div>
        </Link>
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
        </div>
        <HeaderNotifications />
        <ProfileDropdown />
      </div>
    </header>;
}
