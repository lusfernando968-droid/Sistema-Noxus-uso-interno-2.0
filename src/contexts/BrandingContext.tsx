import React, { createContext, useContext, useState, useEffect } from "react";

interface BrandingContextType {
    studioName: string;
    setStudioName: (name: string) => void;
    logoUrl: string;
    setLogoUrl: (url: string) => void;
    studioNameUrl: string;
    setStudioNameUrl: (url: string) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const [studioName, setStudioNameState] = useState(() => localStorage.getItem("studioName") || "NOXUS");
    const [logoUrl, setLogoUrlState] = useState(() => localStorage.getItem("studioLogoUrl") || "");
    const [studioNameUrl, setStudioNameUrlState] = useState(() => localStorage.getItem("studioNameUrl") || "");

    const setStudioName = (name: string) => {
        setStudioNameState(name);
        localStorage.setItem("studioName", name);
    };

    const setLogoUrl = (url: string) => {
        setLogoUrlState(url);
        localStorage.setItem("studioLogoUrl", url);
    };

    const setStudioNameUrl = (url: string) => {
        setStudioNameUrlState(url);
        if (url) {
            localStorage.setItem("studioNameUrl", url);
        } else {
            localStorage.removeItem("studioNameUrl");
        }
    };

    // Sync with localStorage changes from other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "studioName") setStudioNameState(e.newValue || "NOXUS");
            if (e.key === "studioLogoUrl") setLogoUrlState(e.newValue || "");
            if (e.key === "studioNameUrl") setStudioNameUrlState(e.newValue || "");
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    return (
        <BrandingContext.Provider
            value={{
                studioName,
                setStudioName,
                logoUrl,
                setLogoUrl,
                studioNameUrl,
                setStudioNameUrl,
            }}
        >
            {children}
        </BrandingContext.Provider>
    );
}

export function useBrandingContext() {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error("useBrandingContext must be used within a BrandingProvider");
    }
    return context;
}
