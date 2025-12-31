import { Home, Users, Briefcase, DollarSign, Calendar, Package, Moon, Sun, Loader2, BookOpen, FileText, LayoutGrid, Clipboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { useBrandingContext } from "@/contexts/BrandingContext";
import { useAuth } from "@/contexts/AuthContext";

const allMenuItems = [
  { icon: Home, label: "Dashboard", path: "/", role: ["admin", "manager"] },
  { icon: Users, label: "Clientes", path: "/clientes", role: ["admin", "manager", "assistant"] },
  { icon: Briefcase, label: "Projetos", path: "/projetos", role: ["admin", "manager", "assistant"] },
  { icon: Calendar, label: "Agendamentos", path: "/agendamentos", role: ["admin", "manager", "assistant"] },
  { icon: FileText, label: "Orçamentos", path: "/orcamento", role: ["admin", "manager", "assistant"] },
  { icon: LayoutGrid, label: "Central de Atendimento", path: "/central-atendente", role: ["admin", "assistant"] },
  { icon: Clipboard, label: "Leads e Orçamentos", path: "/leads-orcamentos", role: ["admin", "assistant"] },
  { icon: DollarSign, label: "Financeiro", path: "/tattoo/financeiro", role: ["admin", "manager"] },
  { icon: DollarSign, label: "Financeiro Tattoo", path: "/financeiro", role: ["admin", "manager"] },
  { icon: BookOpen, label: "Conhecimento", path: "/conhecimento", role: ["admin", "manager"] },
];

export function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { studioName, logoUrl, studioNameUrl } = useBrandingContext();
  const { userRole } = useAuth();

  const menuItems = allMenuItems.filter(item => {
    if (!userRole) return false;
    return item.role && item.role.includes(userRole);
  });

  return (
    <aside className="w-52 h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
        ) : (
          <Loader2 className="w-10 h-10 text-primary" />
        )}
        <div>
          {studioNameUrl ? (
            <img src={studioNameUrl} alt={studioName} className="h-6 w-auto object-contain max-w-[120px]" />
          ) : (
            <h1 className="text-xl font-semibold tracking-tight">{studioName}</h1>
          )}
          <p className="text-sm text-muted-foreground">Gestor para Tatuadores</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary text-foreground"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 rounded-xl"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
          <span className="font-medium">
            {theme === "light" ? "Modo Escuro" : "Modo Claro"}
          </span>
        </Button>
      </div>
    </aside>
  );
}
