import { Loader2, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { HeaderNotifications } from "./HeaderNotifications";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "react-router-dom";
import { useBrandingContext } from "@/contexts/BrandingContext";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { studioName, logoUrl, studioNameUrl } = useBrandingContext();

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 group">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 relative">
            {/* Logo Section */}
            <div className="relative">
              <Link to="/">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain max-w-[150px]" />
                ) : (
                  <Loader2 className="w-6 h-6 text-primary" />
                )}
              </Link>
            </div>

            {/* Name Section */}
            <div className="relative min-h-[32px] flex items-center">
              {studioNameUrl ? (
                // Image Mode
                <div className="relative">
                  <Link to="/">
                    <img src={studioNameUrl} alt={studioName} className="h-8 w-auto object-contain max-w-[200px]" />
                  </Link>
                </div>
              ) : (
                // Text Mode
                <div className="flex items-center gap-2">
                  <Link to="/">
                    <h1 className="tracking-tight text-foreground text-2xl font-black uppercase tracking-wide"
                      style={{ fontFamily: "'Montserrat', 'Oswald', 'Impact', sans-serif", letterSpacing: "0.05em" }}>
                      {studioName}
                    </h1>
                  </Link>
                </div>
              )}
            </div>
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
        </div>
        <HeaderNotifications />
        <ProfileDropdown />
      </div>
    </header>
  );
}
