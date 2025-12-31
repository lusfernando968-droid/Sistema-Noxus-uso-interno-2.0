import { useAgendamentosData } from "./useAgendamentosData";
import { useAgendamentosCrud } from "./useAgendamentosCrud";
import { useAgendamentosFeedback } from "./useAgendamentosFeedback";

/**
 * Hook principal de Agendamentos
 * Composto por hooks menores para melhor manutenibilidade:
 * - useAgendamentosData: Carregamento de dados
 * - useAgendamentosCrud: Operações CRUD e filtros
 * - useAgendamentosFeedback: Fluxo de feedback e confirmação
 */
export function useAgendamentos() {
  // Carrega dados base
  const {
    agendamentos,
    setAgendamentos,
    clientes,
    projetos,
    loading,
    checkAgendamentosMilestone,
  } = useAgendamentosData();

  // Operações CRUD e filtros
  const {
    formData,
    setFormData,
    editingAgendamento,
    isDialogOpen,
    setIsDialogOpen,
    filtroStatus,
    setFiltroStatus,
    busca,
    setBusca,
    agendamentosFiltrados,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleStatusChange,
    handleAppointmentMove,
    handleAppointmentClick,
    handleDateClick,
    resetForm,
  } = useAgendamentosCrud({
    agendamentos,
    setAgendamentos,
    clientes,
    projetos,
    checkAgendamentosMilestone,
  });

  // Fluxo de feedback
  const {
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
    handleConfirmSessao,
    openFeedbackPrompt,
    confirmWithoutFeedback,
    confirmWithFeedback,
    submitFeedbackAndConfirm,
    cancelFeedbackDialog,
    handleAnaliseDialogConfirm,
    openVincularAnalise,
  } = useAgendamentosFeedback({
    agendamentos,
    setAgendamentos,
    clientes,
    projetos,
  });

  return {
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
  };
}
