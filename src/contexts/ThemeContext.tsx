import { createContext, useContext, useEffect, useState } from "react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

type Theme = "light" | "dark";
type ColorTheme = "default" | "ocean" | "sunset" | "forest" | "purple" | "rose" | "black" | "custom";

type ThemeContextType = {
  theme: Theme;
  colorTheme: ColorTheme;
  customColor: string;
  toggleTheme: () => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  setCustomColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { playSound } = useSoundEffects();
  
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    return savedTheme || "light";
  });

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const savedColorTheme = localStorage.getItem("colorTheme") as ColorTheme;
    return savedColorTheme || "default";
  });

  const [customColor, setCustomColorState] = useState<string>(() => {
    const savedCustomColor = localStorage.getItem("customColor");
    return savedCustomColor || "#3b82f6";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove todas as classes de tema
    root.classList.remove("light", "dark");
    root.classList.remove("theme-ocean", "theme-sunset", "theme-forest", "theme-purple", "theme-rose", "theme-black", "theme-custom");
    
    // Adiciona o tema de luz/escuridão
    root.classList.add(theme);
    
    // Adiciona o tema de cor se não for default
    if (colorTheme !== "default") {
      root.classList.add(`theme-${colorTheme}`);
    }

    // Se for tema customizado, aplica a cor personalizada
    if (colorTheme === "custom") {
      const hsl = hexToHsl(customColor);
      root.style.setProperty("--primary", `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty("--primary-foreground", hsl.l > 50 ? "0 0% 0%" : "0 0% 100%");
    } else {
      // Remove propriedades customizadas se não for tema custom
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
    }
    
    localStorage.setItem("theme", theme);
    localStorage.setItem("colorTheme", colorTheme);
    localStorage.setItem("customColor", customColor);
  }, [theme, colorTheme, customColor]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      playSound(newTheme === "dark" ? "darkMode" : "toggle");
      return newTheme;
    });
  };

  const setColorTheme = (newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
    playSound("chime");
  };

  const setCustomColor = (color: string) => {
    setCustomColorState(color);
    playSound("pop");
  };

  return (
    <ThemeContext.Provider value={{ theme, colorTheme, customColor, toggleTheme, setColorTheme, setCustomColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
