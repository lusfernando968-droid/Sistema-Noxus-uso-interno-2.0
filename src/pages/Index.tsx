import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardData, DateRange } from "@/hooks/useDashboardData";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { ProjectsTab } from "@/components/dashboard/ProjectsTab";
import { FinanceTab } from "@/components/dashboard/FinanceTab";
import { ClientsTab } from "@/components/dashboard/ClientsTab";
import { SchedulesTab } from "@/components/dashboard/SchedulesTab";
import { MetasTab } from "@/components/dashboard/MetasTab";
import { MetaFormDialog } from "@/components/dashboard/MetaFormDialog";
import { SmartInsights } from "@/components/dashboard/SmartInsights";
import { Skeleton } from "@/components/ui/skeleton";
import { MetaComProgresso } from "@/hooks/useMetas";
import { ENABLE_METAS } from "@/lib/config";

const Index = () => {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const { 
    projetos, prevProjetos,
    clientes, prevClientes,
    transacoes, prevTransacoes,
    agendamentos, prevAgendamentos,
    isLoading 
  } = useDashboardData(dateRange);
  
  // Estados para gerenciar metas
  const [metaFormOpen, setMetaFormOpen] = useState(false);
  const [metaFormMode, setMetaFormMode] = useState<'create' | 'edit' | 'progress'>('create');
  const [selectedMeta, setSelectedMeta] = useState<MetaComProgresso | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Funções para gerenciar metas
  const handleCreateMeta = () => {
    setMetaFormMode('create');
    setSelectedMeta(null);
    setMetaFormOpen(true);
  };

  const handleEditMeta = (meta: MetaComProgresso) => {
    setMetaFormMode('edit');
    setSelectedMeta(meta);
    setMetaFormOpen(true);
  };

  const handleUpdateProgress = (meta: MetaComProgresso) => {
    setMetaFormMode('progress');
    setSelectedMeta(meta);
    setMetaFormOpen(true);
  };

  const handleOpenMetasTab = () => {
    setActiveTab("metas");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão completa e detalhada do seu sistema de gestão
          </p>
        </div>
        
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
          <SelectTrigger className="w-[180px] rounded-2xl">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="rounded-2xl p-1.5 bg-muted/50">
            <TabsTrigger value="overview" className="rounded-xl">Visão Geral</TabsTrigger>
            <TabsTrigger value="insights" className="rounded-xl">Insights</TabsTrigger>
            {ENABLE_METAS && (<TabsTrigger value="metas" className="rounded-xl">Metas</TabsTrigger>)}
            <TabsTrigger value="clients" className="rounded-xl">Clientes</TabsTrigger>
            <TabsTrigger value="projects" className="rounded-xl">Projetos</TabsTrigger>
            <TabsTrigger value="schedules" className="rounded-xl">Agendamentos</TabsTrigger>
            <TabsTrigger value="finance" className="rounded-xl">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab 
              projetos={projetos}
              clientes={clientes}
              transacoes={transacoes}
              agendamentos={agendamentos}
              prevProjetos={prevProjetos}
              prevClientes={prevClientes}
              prevTransacoes={prevTransacoes}
              prevAgendamentos={prevAgendamentos}
              onOpenMetasTab={handleOpenMetasTab}
              onCreateMeta={handleCreateMeta}
            />
          </TabsContent>

          {ENABLE_METAS && (
            <TabsContent value="metas" className="space-y-4">
              <MetasTab 
                onCreateMeta={handleCreateMeta}
                onEditMeta={handleEditMeta}
              />
            </TabsContent>
          )}

          <TabsContent value="projects" className="space-y-4">
            <ProjectsTab projetos={projetos} />
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            <FinanceTab transacoes={transacoes} />
          </TabsContent>

          <TabsContent value="clients" className="space-y-4">
            <ClientsTab clientes={clientes} />
          </TabsContent>

          <TabsContent value="schedules" className="space-y-4">
            <SchedulesTab agendamentos={agendamentos} />
          </TabsContent>

          {/* Nova aba principal dedicada aos Insights Inteligentes */}
          <TabsContent value="insights" className="space-y-4">
            <SmartInsights 
              transacoes={transacoes}
              clientes={clientes}
              projetos={projetos}
              agendamentos={agendamentos}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog para gerenciar metas */}
      {ENABLE_METAS && (
        <MetaFormDialog
          open={metaFormOpen}
          onOpenChange={setMetaFormOpen}
          meta={selectedMeta}
          mode={metaFormMode}
        />
      )}
    </div>
  );
};

export default Index;
