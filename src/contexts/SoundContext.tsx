import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SoundContextType {
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isSoundEnabled, setIsSoundEnabledState] = useState(() => {
    const saved = localStorage.getItem("sound-enabled");
    return saved !== null ? saved === "true" : true;
  });

  const setIsSoundEnabled = (enabled: boolean) => {
    setIsSoundEnabledState(enabled);
    localStorage.setItem("sound-enabled", enabled.toString());
  };

  return (
    <SoundContext.Provider
      value={{
        isSoundEnabled,
        setIsSoundEnabled,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSoundContext must be used within SoundProvider");
  }
  return context;
}