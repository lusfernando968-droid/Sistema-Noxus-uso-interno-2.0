import { useState, useRef } from "react";
import { TrendingUp, TrendingDown, BarChart3, Building2, Banknote, Wallet } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DockCarteiraProps {
  activeTab?: "despesas" | "relatorios" | "bancos" | "creditos" | "dividas" | "patrimonio";
  onSelectTab?: (tab: "despesas" | "relatorios" | "bancos" | "creditos" | "dividas" | "patrimonio") => void;
}

export function DockCarteira({
  activeTab = "despesas",
  onSelectTab,
}: DockCarteiraProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  const items = [
    { icon: TrendingDown, label: "Fluxo", value: "despesas" as const },
    { icon: BarChart3, label: "Relatórios", value: "relatorios" as const },
    { icon: Building2, label: "Bancos", value: "bancos" as const },
    { icon: TrendingUp, label: "Crédito", value: "creditos" as const },
    { icon: Banknote, label: "Dívidas", value: "dividas" as const },
    { icon: Wallet, label: "Patrimônio", value: "patrimonio" as const },
  ];

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
    const iconWidth = 60;
    const iconCenterX = index * iconWidth + iconWidth / 2;
    const distance = Math.abs(mousePosition.x - iconCenterX);
    const maxDistance = 120;
    if (distance > maxDistance) return 1;
    const scale = 1 + 0.3 * (1 - distance / maxDistance);
    return Math.max(1, Math.min(1.3, scale));
  };

  const getDockScale = () => {
    if (!isHovering) return 1;
    const maxScale = Math.max(...items.map((_, idx) => getIconScale(idx)));
    return 1 + (maxScale - 1) * 0.2;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="relative">
        {/* Glow effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/20 to-emerald-500/10 blur-2xl rounded-full transition-transform duration-200 ease-out"
          style={{ transform: `scale(${getDockScale()})` }}
        />

        {/* Main dock container */}
        <div
          ref={dockRef}
          className="relative bg-background/90 backdrop-blur-3xl border border-emerald-500/30 rounded-full shadow-2xl px-4 py-3 transition-transform duration-200 ease-out"
          style={{ transform: `scale(${getDockScale()})` }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <TooltipProvider>
            <div className="flex items-center gap-2">
              {items.map((item, index) => {
                const Icon = item.icon;
                const scale = getIconScale(index);
                const isActive = activeTab === item.value;
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSelectTab?.(item.value)}
                        className={cn(
                          "relative p-2.5 rounded-full transition-all duration-200 ease-out",
                          isActive
                            ? "bg-emerald-500/30 backdrop-blur-xl border border-emerald-500/40 text-emerald-600 shadow-2xl shadow-emerald-500/30"
                            : "bg-foreground/15 backdrop-blur-md border border-foreground/25 hover:bg-emerald-500/20 hover:border-emerald-500/45 hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95"
                        )}
                        style={{
                          transform: `scale(${scale})`,
                          zIndex: Math.round(scale * 10),
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        {isActive && (
                          <>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-emerald-500/80 rounded-full shadow-lg shadow-emerald-500/30" />
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-emerald-500/60 rounded-full animate-pulse" />
                          </>
                        )}
                      </button>
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
