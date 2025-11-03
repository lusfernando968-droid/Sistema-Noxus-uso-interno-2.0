import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { SoundProvider } from "./contexts/SoundContext";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <SoundProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationProvider>
            <App />
          </NavigationProvider>
        </AuthProvider>
      </ThemeProvider>
    </SoundProvider>
  </BrowserRouter>
);
