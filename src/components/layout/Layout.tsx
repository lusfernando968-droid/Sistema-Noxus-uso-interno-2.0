import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { DockNav } from "./DockNav";
import { Sidebar } from "./Sidebar";
import { useNavigation } from "@/contexts/NavigationContext";
import { FloatingAIChat } from "@/components/layout/FloatingAIChat";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { navigationType, isNavigationVisible } = useNavigation();
  const [isHoveringMenuArea, setIsHoveringMenuArea] = useState(false);
  const location = useLocation();

  // Rotas onde o dock global deve ficar oculto
  const hideDockRoutes = ["/tattoo/financeiro", "/carteira"];
  const shouldHideDock = hideDockRoutes.includes(location.pathname);
  
  const showSidebar = navigationType === "sidebar";
  const showDock = navigationType === "dock";
  const sidebarVisible = showSidebar && (isNavigationVisible || isHoveringMenuArea);
  const dockVisible = showDock && (isNavigationVisible || isHoveringMenuArea);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Área de hover para sidebar */}
      {showSidebar && !isNavigationVisible && (
        <div
          className="fixed left-0 top-0 w-8 h-full z-50 bg-transparent"
          onMouseEnter={() => setIsHoveringMenuArea(true)}
          onMouseLeave={() => setIsHoveringMenuArea(false)}
        />
      )}
      
      {/* Sidebar */}
      {showSidebar && (
        <div
          className={`transition-transform duration-300 ease-in-out ${
            sidebarVisible ? 'translate-x-0' : '-translate-x-full'
          }`}
          onMouseEnter={() => setIsHoveringMenuArea(true)}
          onMouseLeave={() => setIsHoveringMenuArea(false)}
        >
          <Sidebar />
        </div>
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 pb-24">{children}</main>
        
        {/* Dock */}
        {showDock && isNavigationVisible && !shouldHideDock && (
          <DockNav />
        )}

        {/* Chat de IA flutuante */}
        <FloatingAIChat />
      </div>
      
      {/* Dock suspenso quando visibilidade desabilitada */}
      {showDock && !isNavigationVisible && !shouldHideDock && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 ease-in-out ${
            dockVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-8 opacity-0 scale-95'
          }`}
          onMouseEnter={() => setIsHoveringMenuArea(true)}
          onMouseLeave={() => setIsHoveringMenuArea(false)}
        >
          <div className="bg-background/90 backdrop-blur-xl border border-foreground/20 rounded-full shadow-2xl p-2">
            <DockNav />
          </div>
        </div>
      )}
      
      {/* Área de hover para dock */}
      {showDock && !isNavigationVisible && !shouldHideDock && (
        <div
          className="fixed bottom-0 left-0 right-0 h-20 z-50 bg-transparent pointer-events-auto"
          onMouseEnter={() => setIsHoveringMenuArea(true)}
          onMouseLeave={() => setIsHoveringMenuArea(false)}
        />
      )}
    </div>
  );
}
