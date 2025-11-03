import { Bell, Moon, Sun, Edit2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { IconSelector, iconOptions } from "@/components/ui/icon-selector";
import { HeaderNotifications } from "./HeaderNotifications";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
// Removed seeding hook to avoid dados fictícios

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [studioName, setStudioName] = useState("Sistema do Luiz");
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(studioName);
  const [selectedIcon, setSelectedIcon] = useState("Coroa");
  const [isEditMode, setIsEditMode] = useState(false);
  // Seeding removido: usar apenas dados reais do banco local

  useEffect(() => {
    const savedName = localStorage.getItem("studioName");
    const savedIcon = localStorage.getItem("studioIcon");
    if (savedName) {
      setStudioName(savedName);
      setTempName(savedName);
    }
    if (savedIcon) {
      setSelectedIcon(savedIcon);
    }
  }, []);

  const handleSave = () => {
    setStudioName(tempName);
    localStorage.setItem("studioName", tempName);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempName(studioName);
    setIsEditing(false);
  };

  const handleIconChange = (iconName: string) => {
    setSelectedIcon(iconName);
    localStorage.setItem("studioIcon", iconName);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.name === iconName);
    return iconOption ? iconOption.icon : iconOptions[0].icon;
  };

  const SelectedIconComponent = getIconComponent(selectedIcon);
  return <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="h-8 w-64 text-xl font-medium"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 group">
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <IconSelector 
                  selectedIcon={selectedIcon}
                  onIconChange={(iconName) => {
                    handleIconChange(iconName);
                    setIsEditMode(false);
                  }}
                  size="md"
                />
              ) : (
                <SelectedIconComponent className="w-6 h-6 text-primary" />
              )}
              <h1 className="tracking-tight text-foreground text-xl font-medium">{studioName}</h1>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  if (isEditMode) {
                    setIsEditMode(false);
                  } else {
                    setIsEditMode(true);
                  }
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              {isEditMode && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
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