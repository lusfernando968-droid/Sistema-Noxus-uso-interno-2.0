import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

type Theme = "light" | "dark" | "system";
type ColorTheme = "default" | "ocean" | "sunset" | "forest" | "purple" | "rose" | "black";

type ThemeContextType = {
  theme: Theme;
  colorTheme: ColorTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    return savedTheme ?? "system";
  });

  // Armazena o tema atual do sistema (claro/escuro)
  const [systemTheme, setSystemTheme] = useState<Exclude<Theme, "system">>(() =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem("colorTheme");
    const validThemes: ColorTheme[] = [
      "default",
      "ocean",
      "sunset",
      "forest",
      "purple",
      "rose",
      "black",
      // "custom" é ignorado como inválido para evitar regressões
    ];
    const fallback: ColorTheme = "black"; // padrão solicitado: cor preta
    const candidate = (saved as ColorTheme) ?? fallback;
    return validThemes.includes(candidate) ? candidate : fallback;
  });

  // Tema customizado removido

  // Computa o tema efetivo que será aplicado à UI
  const effectiveTheme = useMemo<Exclude<Theme, "system">>(() => (theme === "system" ? systemTheme : theme), [theme, systemTheme]);

  // Observa alterações do tema do SO quando em modo 'system'
  useEffect(() => {
    const mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (!mq) return;

    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    // Atualiza imediatamente para garantir consistência
    setSystemTheme(mq.matches ? "dark" : "light");

    if (theme === "system") {
      mq.addEventListener?.("change", handler);
    }

    return () => mq.removeEventListener?.("change", handler);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove todas as classes de tema
    root.classList.remove("light", "dark");
    root.classList.remove(
      "theme-noxus",
      "theme-ocean",
      "theme-sunset",
      "theme-forest",
      "theme-purple",
      "theme-rose",
      "theme-black",
      "theme-custom"
    );
    
    // Adiciona o tema de luz/escuridão efetivo
    root.classList.add(effectiveTheme);

    // Comunica ao navegador os esquemas de cor suportados e o esquema atual
    // Isso melhora controles nativos (inputs, scrollbar, etc.)
    root.style.setProperty("color-scheme", effectiveTheme);
    
    // Adiciona o tema de cor se não for default
    if (colorTheme !== "default") {
      root.classList.add(`theme-${colorTheme}`);
    }

    // Removido suporte ao tema customizado
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-foreground");
    
    localStorage.setItem("theme", theme);
    localStorage.setItem("colorTheme", colorTheme);
  }, [effectiveTheme, theme, colorTheme]);

  // Remove possíveis overrides de tema dinâmico quando mudar de rota
  // (não há mais variação por módulo após remoção do tema Noxus)
  useEffect(() => {
    const root = window.document.documentElement;
    root.style.removeProperty("--primary");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--primary-foreground");
  }, [location.pathname]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      return newTheme;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const { user, profile } = useAuth();

  // Ao carregar o perfil, aplicar a preferência de cor salva no banco (se válida)
  useEffect(() => {
    const validThemes: ColorTheme[] = [
      "default",
      "ocean",
      "sunset",
      "forest",
      "purple",
      "rose",
      "black",
    ];
    const profileTheme = profile?.color_theme as ColorTheme | undefined;
    if (profileTheme && validThemes.includes(profileTheme) && profileTheme !== colorTheme) {
      setColorThemeState(profileTheme);
    } else if (user && !profileTheme && isSupabaseConfigured) {
      // Garante que novos perfis recebam 'black' como valor persistido
      void supabase
        .from("profiles")
        .update({ color_theme: "black" })
        .eq("id", user.id);
    }
  }, [profile?.color_theme, user]);

  const setColorTheme = (newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
    // Persistir no banco quando o usuário estiver autenticado
    if (user && isSupabaseConfigured) {
      void supabase
        .from("profiles")
        .update({ color_theme: newColorTheme })
        .eq("id", user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, colorTheme, toggleTheme, setTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Funções auxiliares do tema customizado removidas

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
