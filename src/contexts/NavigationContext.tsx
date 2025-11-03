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
    const saved = localStorage.getItem("navigation-visible");
    return saved !== null ? saved === "true" : true;
  });

  const setNavigationType = (type: NavigationType) => {
    setNavigationTypeState(type);
    localStorage.setItem("navigation-type", type);
  };

  const setIsNavigationVisible = (visible: boolean) => {
    setIsNavigationVisibleState(visible);
    localStorage.setItem("navigation-visible", visible.toString());
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
