import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type NavigationType = "dock" | "sidebar";

interface NavigationContextType {
  navigationType: NavigationType;
  setNavigationType: (type: NavigationType) => void;
  isNavigationVisible: boolean;
  setIsNavigationVisible: (visible: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navigationType, setNavigationTypeState] = useState<NavigationType>(() => {
    const saved = localStorage.getItem("navigation-type");
    return (saved as NavigationType) || "dock";
  });

  const [isNavigationVisible, setIsNavigationVisibleState] = useState(() => {
    // Sempre visível; ignoramos qualquer valor salvo previamente
    localStorage.setItem("navigation-visible", "true");
    return true;
  });

  const setNavigationType = (type: NavigationType) => {
    setNavigationTypeState(type);
    localStorage.setItem("navigation-type", type);
  };

  const setIsNavigationVisible = (_visible: boolean) => {
    // Mantém o menu sempre visível
    setIsNavigationVisibleState(true);
    localStorage.setItem("navigation-visible", "true");
  };

  return (
    <NavigationContext.Provider
      value={{
        navigationType,
        setNavigationType,
        isNavigationVisible,
        setIsNavigationVisible,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}
