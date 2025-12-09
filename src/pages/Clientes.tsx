import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table2, Network, LayoutList, LayoutGrid, DollarSign, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useClientes } from "@/hooks/useClientes";

// Componentes
import {
  ClienteForm,
  ClienteTable,
  ClienteCards,
  ClienteGrid,
  ClienteFilters,
  ReferralNetwork,
  StatCardsSkeleton,
  ClienteControlsSkeleton,
  ClienteTableSkeleton
} from "@/components/clientes";

type ColKey = 'nome' | 'email' | 'telefone' | 'instagram' | 'cidade' | 'data_aniversario' | 'ltv' | 'categoria' | 'indicado_por' | 'indicados' | 'projetos' | 'acoes';

const colLabels: Record<ColKey, string> = {
  nome: 'Nome',
  email: 'Email',
  telefone: 'Telefone',
  instagram: 'Instagram',
  cidade: 'Cidade',
  data_aniversario: 'Data',
  ltv: 'LTV',
  categoria: 'Categoria',
  indicado_por: 'Indicado por',
  indicados: 'Indicados',
  projetos: 'Projetos',
  acoes: 'Ações',
};

const Clientes = () => {
  const {
    // State
    clientes,
    sortedClientes,
    filteredClientes,
    loading,
    filtros,
    searchTerm,
    sortBy,
    availableCities,
    cityUsageCounts,
    editingRows,
    editedData,
    
    // Stats
    totalLTV,
    maxLTV,
    avgLTV,
    activeFiltersCount,
    
    // Setters
    setFiltros,
    setSearchTerm,
    setSortBy,
    
    // Actions
    createCliente,
    deleteCliente,
    startEditing,
    cancelEditing,
    saveEdit,
    updateEditedData,
    saveAllEdits,
    resetFilters,
    
    // Constants
    initialFormData
  } = useClientes();

  const [viewMode, setViewMode] = useState<"cards" | "grid" | "table" | "network">("table");
  const [visibleCols, setVisibleCols] = useState<Record<ColKey, boolean>>({
    nome: true,
    email: true,
    telefone: true,
    instagram: true,
    cidade: true,
    data_aniversario: true,
    ltv: true,
    categoria: true,
    indicado_por: true,
    indicados: true,
    projetos: true,
    acoes: true,
  });

  const toggleCol = (key: string) => setVisibleCols(prev => ({ ...prev, [key]: !prev[key as ColKey] }));

  const { colorTheme } = useTheme();
  
  // Loading state com skeleton que reflete o layout
  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua base de clientes e acompanhe o LTV
          </p>
        </div>
        
        <StatCardsSkeleton />
        
        <div className="flex justify-center mb-4">
          <div className="inline-flex w-auto rounded-2xl bg-muted/30 p-1.5 backdrop-blur-sm border border-border/20 shadow-lg">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl px-4 py-2.5 bg-muted/20 mx-1 animate-pulse">
                <div className="h-5 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
        
        <ClienteControlsSkeleton />
        <ClienteTableSkeleton />
      </div>
    );
  }

  const accentStrongThemes = new Set(["ocean", "sunset", "forest", "purple", "rose"]);
  const cardGradientClass = accentStrongThemes.has(colorTheme)
    ? "bg-gradient-to-br from-primary/10 to-accent/5"
    : "bg-gradient-to-br from-primary/10 to-primary/5";

  return (
    <div className="space-y-6 pb-20">
      {/* Banner Informativo */}
      <Card className="rounded-3xl border-0 bg-gradient-to-r from-blue-500/10 to-blue-600/5 shadow-lg" />

      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie sua base de clientes e acompanhe o LTV
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`p-4 rounded-xl ${cardGradientClass}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">LTV Total</p>
          </div>
          <p className="text-xl font-semibold">{formatCurrency(totalLTV)}</p>
        </Card>

        <Card className={`p-4 rounded-xl ${cardGradientClass}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">LTV Médio</p>
          </div>
          <p className="text-xl font-semibold">{formatCurrency(avgLTV)}</p>
        </Card>

        <Card className={`p-4 rounded-xl ${cardGradientClass}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Maior LTV</p>
          </div>
          <p className="text-xl font-semibold">{formatCurrency(maxLTV)}</p>
        </Card>

        <Card className={`p-4 rounded-xl ${cardGradientClass}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Total Clientes</p>
          </div>
          <p className="text-xl font-semibold">{clientes.length}</p>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={v => setViewMode(v as any)} className="w-full">
        <div className="flex justify-center mb-4">
          <TabsList className="inline-flex w-auto rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 p-1.5 backdrop-blur-sm border border-border/20 shadow-lg">
            <TabsTrigger 
              value="table" 
              className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50"
            >
              <Table2 className="w-5 h-5 transition-colors" />
              <span className="font-medium text-sm hidden sm:inline">Tabela</span>
            </TabsTrigger>
            <TabsTrigger 
              value="network" 
              className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50"
            >
              <Network className="w-5 h-5 transition-colors" />
              <span className="font-medium text-sm hidden sm:inline">Rede</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cards" 
              className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50"
            >
              <LayoutList className="w-5 h-5 transition-colors" />
              <span className="font-medium text-sm hidden sm:inline">Lista</span>
            </TabsTrigger>
            <TabsTrigger 
              value="grid" 
              className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50"
            >
              <LayoutGrid className="w-5 h-5 transition-colors" />
              <span className="font-medium text-sm hidden sm:inline">Grid</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Barra de filtros */}
        {viewMode !== 'network' && (
          <ClienteFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filtros={filtros}
            setFiltros={setFiltros}
            resetFilters={resetFilters}
            activeFiltersCount={activeFiltersCount}
            clientes={clientes}
            availableCities={availableCities}
            cityUsageCounts={cityUsageCounts}
            visibleCols={visibleCols}
            toggleCol={toggleCol}
            colLabels={colLabels}
            sortBy={sortBy}
            setSortBy={setSortBy}
            filteredCount={filteredClientes.length}
          >
            <ClienteForm
              clientes={clientes}
              availableCities={availableCities}
              cityUsageCounts={cityUsageCounts}
              onSubmit={createCliente}
              initialFormData={initialFormData}
            />
          </ClienteFilters>
        )}

        {/* Visualização em Lista (Cards) */}
        <TabsContent value="cards" className="mt-6 animate-in fade-in-50 duration-300">
          <ClienteCards
            sortedClientes={sortedClientes}
            maxLTV={maxLTV}
            editingRows={editingRows}
            editedData={editedData}
            startEditing={startEditing}
            cancelEditing={cancelEditing}
            saveEdit={saveEdit}
            updateEditedData={updateEditedData}
            deleteCliente={deleteCliente}
          />
        </TabsContent>

        {/* Visualização em Grid */}
        <TabsContent value="grid" className="mt-6 animate-in fade-in-50 duration-300">
          <ClienteGrid
            sortedClientes={sortedClientes}
            maxLTV={maxLTV}
            deleteCliente={deleteCliente}
          />
        </TabsContent>

        {/* Visualização em Tabela */}
        <TabsContent value="table" className="mt-6 animate-in fade-in-50 duration-300">
          <ClienteTable
            clientes={clientes}
            sortedClientes={sortedClientes}
            maxLTV={maxLTV}
            editingRows={editingRows}
            editedData={editedData}
            visibleCols={visibleCols}
            startEditing={startEditing}
            cancelEditing={cancelEditing}
            saveEdit={saveEdit}
            updateEditedData={updateEditedData}
            saveAllEdits={saveAllEdits}
            deleteCliente={deleteCliente}
          />
        </TabsContent>

        {/* Visualização em Rede */}
        <TabsContent value="network" className="mt-6 animate-in fade-in-50 duration-300">
          <ReferralNetwork clientes={clientes} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Clientes;
