import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import { BrandingProvider } from "@/contexts/BrandingContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Perfil from "./pages/Perfil";
import Clientes from "./pages/Clientes";
import ClienteDetalhes from "./pages/ClienteDetalhes";
import Projetos from "./pages/Projetos";
import ProjetoDetalhes from "./pages/ProjetoDetalhes";
import Agendamentos from "./pages/Agendamentos";
import Financeiro from "./pages/Financeiro";
import Tattoo from "./pages/Tattoo";
import Carteira from "./pages/Carteira";
import Conhecimento from "./pages/Conhecimento";
import Marketing from "./pages/Marketing";
import Estoque from "./pages/Estoque";
import CursoMVP from "./pages/CursoMVP";

import NotFound from "./pages/NotFound";
import Vendas from "./pages/Vendas";

const queryClient = new QueryClient();

const AppContent = () => {

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/vendas" element={<Vendas />} />
      <Route path="/" element={<ProtectedRoute><Layout><Tattoo /></Layout></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>} />
      <Route path="/tattoo" element={<Navigate to="/" replace />} />
      <Route path="/dashboard" element={<Navigate to="/noxus" replace />} />
      <Route path="/tattoo/marketing" element={<Navigate to="/marketing" replace />} />
      <Route path="/carteira" element={<ProtectedRoute><Layout><Carteira /></Layout></ProtectedRoute>} />
      <Route path="/tattoo/financeiro" element={<Navigate to="/carteira" replace />} />
      <Route path="/conhecimento" element={<ProtectedRoute><Layout><Conhecimento /></Layout></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
      <Route path="/clientes/:id" element={<ProtectedRoute><Layout><ClienteDetalhes /></Layout></ProtectedRoute>} />
      <Route path="/projetos" element={<ProtectedRoute><Layout><Projetos /></Layout></ProtectedRoute>} />
      <Route path="/projetos/:id" element={<ProtectedRoute><Layout><ProjetoDetalhes /></Layout></ProtectedRoute>} />
      <Route path="/agendamentos" element={<ProtectedRoute><Layout><Agendamentos /></Layout></ProtectedRoute>} />
      <Route path="/financeiro" element={<ProtectedRoute><Layout><Financeiro /></Layout></ProtectedRoute>} />
      <Route path="/marketing" element={<ProtectedRoute><Layout><Marketing /></Layout></ProtectedRoute>} />
      <Route path="/estoque" element={<ProtectedRoute><Layout><Estoque /></Layout></ProtectedRoute>} />
      <Route path="/tattoo/estoque" element={<Navigate to="/estoque" replace />} />
      <Route path="/curso-mvp" element={<ProtectedRoute><Layout><CursoMVP /></Layout></ProtectedRoute>} />
      <Route path="/noxus" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrandingProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </BrandingProvider>
  </QueryClientProvider>
);

export default App;
