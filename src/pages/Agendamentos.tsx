import { Calendar, CalendarDays, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "@/components/calendar/CalendarView";
import { AgendamentosSkeleton } from "@/components/ui/skeletons";
import AnaliseUsoDialog from "@/components/agendamento/AnaliseUsoDialog";

import {
  useAgendamentos,
  AgendamentosMetrics,
  AgendamentosHoje,
  AgendamentoFormDialog,
  AgendamentosTable,
  AgendamentosFilters,
  FeedbackPromptDialog,
  FeedbackFormDialog,
  INITIAL_FORM_DATA,
} from "@/components/agendamento";

export default function Agendamentos() {
  const {
    // Dados
    agendamentos,
    agendamentosFiltrados,
    clientes,
    projetos,
    loading,

    // Form
    formData,
    setFormData,
    editingAgendamento,
    isDialogOpen,
    setIsDialogOpen,

  // Filtros
    filtroStatus,
    setFiltroStatus,
    busca,
    setBusca,

    // Feedback
    isFeedbackPromptOpen,
    setIsFeedbackPromptOpen,
    isFeedbackDialogOpen,
    setIsFeedbackDialogOpen,
    feedbackCliente,
    setFeedbackCliente,
    avaliacao,
    setAvaliacao,
    observacoesTecnicas,
    setObservacoesTecnicas,
    agendamentoParaAnalise,
    setAgendamentoParaAnalise,
    isAnaliseDialogOpen,
    setIsAnaliseDialogOpen,

  // Handlers
    handleSubmit,
    handleEdit,
    handleDelete,
    handleStatusChange,
    handleConfirmSessao,
    openFeedbackPrompt,
    confirmWithoutFeedback,
    confirmWithFeedback,
    submitFeedbackAndConfirm,
    cancelFeedbackDialog,
    handleAnaliseDialogConfirm,
    handleAppointmentMove,
    handleAppointmentClick,
    handleDateClick,
    resetForm,
    openVincularAnalise,
  } = useAgendamentos();

  // Loading state com skeleton
  if (loading) {
    return <AgendamentosSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              Agendamentos
            </h1>
            <p className="text-muted-foreground">
              Gerencie sessões de tatuagem e compromissos
            </p>
          </div>
        </div>

        {/* Métricas */}
        <AgendamentosMetrics agendamentos={agendamentos} />

        {/* Diálogos de Feedback */}
        <FeedbackPromptDialog
          isOpen={isFeedbackPromptOpen}
          onOpenChange={setIsFeedbackPromptOpen}
          onConfirmWithoutFeedback={confirmWithoutFeedback}
          onConfirmWithFeedback={confirmWithFeedback}
        />

        <FeedbackFormDialog
          isOpen={isFeedbackDialogOpen}
          onOpenChange={setIsFeedbackDialogOpen}
          feedbackCliente={feedbackCliente}
          onFeedbackChange={setFeedbackCliente}
          observacoesTecnicas={observacoesTecnicas}
          onObservacoesChange={setObservacoesTecnicas}
          avaliacao={avaliacao}
          onAvaliacaoChange={setAvaliacao}
          onCancel={cancelFeedbackDialog}
          onSubmit={submitFeedbackAndConfirm}
        />

        {/* Agendamentos de Hoje */}
        <AgendamentosHoje
          agendamentos={agendamentos}
          onConfirmarSessao={openFeedbackPrompt}
          onVincularAnalise={openVincularAnalise}
        />

        {/* Visualizações de Agendamentos */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <div className="flex justify-center mb-4">
            <TabsList className="inline-flex w-auto rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 p-1.5 backdrop-blur-sm border border-border/20 shadow-lg">
              <TabsTrigger
                value="calendar"
                className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center"
              >
                <CalendarDays className="w-5 h-5 transition-colors" />
                <span className="font-medium text-sm hidden sm:inline">Visualização em Calendário</span>
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center"
              >
                <List className="w-5 h-5 transition-colors" />
                <span className="font-medium text-sm hidden sm:inline">Visualização em Lista</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filtros e Busca */}
          <div className="flex items-center justify-between gap-3">
            <AgendamentosFilters
              busca={busca}
              onBuscaChange={setBusca}
              filtroStatus={filtroStatus}
              onFiltroStatusChange={setFiltroStatus}
            />

            <AgendamentoFormDialog
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              formData={formData}
              setFormData={setFormData}
              editingAgendamento={editingAgendamento}
              clientes={clientes}
              projetos={projetos}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              onVincularAnalise={editingAgendamento ? () => openVincularAnalise(editingAgendamento) : undefined}
            />
          </div>

          {/* Aba do Calendário */}
          <TabsContent value="calendar" className="space-y-6">
            <CalendarView
              appointments={agendamentosFiltrados}
              onAppointmentMove={handleAppointmentMove}
              onAppointmentClick={handleAppointmentClick}
              onDateClick={handleDateClick}
              onAppointmentDelete={handleDelete}
            />
          </TabsContent>

          {/* Aba da Lista */}
          <TabsContent value="list" className="space-y-6">
            <AgendamentosTable
              agendamentos={agendamentosFiltrados}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onConfirmarSessao={(a) => handleConfirmSessao(a)}
              onVincularAnalise={openVincularAnalise}
            />
          </TabsContent>
        </Tabs>

        {/* Diálogo de Análise de Uso */}
        <AnaliseUsoDialog
          open={isAnaliseDialogOpen}
          onOpenChange={(open) => {
            setIsAnaliseDialogOpen(open);
            if (!open) setAgendamentoParaAnalise(null);
          }}
          onConfirm={handleAnaliseDialogConfirm}
          sessionId={agendamentoParaAnalise?.id}
        />
      </div>
    </div>
  );
}
