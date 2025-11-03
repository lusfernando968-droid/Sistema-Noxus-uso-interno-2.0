import { useState, useRef, useEffect } from "react";
import { Home, Users, Briefcase, Calendar, DollarSign, Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigation } from "@/contexts/NavigationContext";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: Briefcase, label: "Projetos", path: "/projetos" },
  { icon: Calendar, label: "Agendamentos", path: "/agendamentos" },
  { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
  { icon: Package, label: "Estoque", path: "/estoque" },
];

export function DockNav() {
  const location = useLocation();
  const { isNavigationVisible } = useNavigation();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const getIconScale = (index: number) => {
    if (!isHovering) return 1;
    
    const iconWidth = 60; // Largura aproximada de cada ícone + gap
    const iconCenterX = (index * iconWidth) + (iconWidth / 2);
    const distance = Math.abs(mousePosition.x - iconCenterX);
    const maxDistance = 120; // Distância máxima para o efeito
    
    if (distance > maxDistance) return 1;
    
    // Escala de 1 a 1.3 baseada na proximidade (mais sutil)
    const scale = 1 + (0.3 * (1 - distance / maxDistance));
    return Math.max(1, Math.min(1.3, scale));
  };

  const getDockScale = () => {
    if (!isHovering) return 1;
    
    // Calcula a escala máxima dos ícones atualmente visíveis
    const maxScale = Math.max(...menuItems.map((_, index) => getIconScale(index)));
    
    // O container cresce proporcionalmente, mas de forma mais sutil
    return 1 + (maxScale - 1) * 0.2; // 20% do crescimento dos ícones
  };

  return (
    <div className={isNavigationVisible ? "fixed bottom-6 left-1/2 -translate-x-1/2 z-50" : "relative"}>
      <div className="relative">
        {/* Glow effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-foreground/10 via-foreground/20 to-foreground/10 blur-2xl rounded-full transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${getDockScale()})`,
          }}
        />
        
        {/* Main dock container */}
        <div 
          ref={dockRef}
          className="relative bg-background/90 backdrop-blur-3xl border border-foreground/20 rounded-full shadow-2xl px-4 py-3 transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${getDockScale()})`,
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <TooltipProvider>
            <div className="flex items-center gap-2">
              {menuItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                const scale = getIconScale(index);
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <Link to={item.path}>
                        <div
                          className={`
                            relative p-2.5 rounded-full transition-all duration-200 ease-out group
                            ${isActive 
                              ? "bg-primary/30 backdrop-blur-xl border border-primary/40 text-primary shadow-2xl shadow-primary/30" 
                              : "bg-foreground/15 backdrop-blur-md border border-foreground/25 hover:bg-foreground/25 hover:border-foreground/45 hover:shadow-xl hover:shadow-foreground/20 active:scale-95"
                            }
                          `}
                          style={{
                            transform: `scale(${scale})`,
                            zIndex: Math.round(scale * 10),
                          }}
                        >
                          <Icon className={`w-4 h-4 transition-all duration-300 ${
                            isActive 
                              ? "drop-shadow-lg text-primary" 
                              : "text-foreground/90 group-hover:text-foreground group-hover:drop-shadow-md"
                          }`} />
                          {isActive && (
                              <>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-primary/80 rounded-full shadow-lg shadow-primary/30" />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-primary/60 rounded-full animate-pulse" />
                              </>
                            )}
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="rounded-2xl bg-card/95 backdrop-blur-xl border-border/50">
                      <p className="font-medium text-sm">{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
