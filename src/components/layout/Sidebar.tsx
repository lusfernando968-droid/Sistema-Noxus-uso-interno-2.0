import { Home, Users, Briefcase, DollarSign, Calendar, Package, Moon, Sun, Loader2, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: Briefcase, label: "Projetos", path: "/projetos" },
  { icon: Calendar, label: "Agendamentos", path: "/agendamentos" },
  { icon: DollarSign, label: "Financeiro", path: "/tattoo/financeiro" },
  { icon: DollarSign, label: "Financeiro Tattoo", path: "/financeiro" },
  { icon: BookOpen, label: "Conhecimento", path: "/conhecimento" },
];

export function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-52 h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <Loader2 className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sistema Noxus</h1>
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
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
