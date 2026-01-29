import { useReducer, useCallback } from 'react';

/**
 * Tipos de status de sessão e agendamento
 */
type SessaoStatus = 'agendada' | 'concluida' | 'cancelada';
type AgendamentoStatus = 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';

/**
 * Interfaces de dados
 */
interface Sessao {
  id: string;
  data: string;
  duracao: number;
  descricao: string;
  valor: number;
  status: SessaoStatus;
  feedback_cliente?: string;
  observacoes_tecnicas?: string;
  avaliacao?: number;
  agendamento_id?: string | null;
  numero_sessao?: number;
}

interface Agendamento {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  status: AgendamentoStatus;
  descricao?: string;
}

/**
 * Formulários de edição
 */
interface EditSessaoForm {
  data: string;
  valor: number;
  descricao: string;
  status: SessaoStatus;
}

interface EditAgendamentoForm {
  titulo: string;
  descricao: string;
  data: string;
  hora: string;
  status: AgendamentoStatus;
}

interface ManualSessaoForm {
  data: string;
  valor: number;
  descricao: string;
  status: SessaoStatus;
}

/**
 * Estado do reducer
 */
interface ProjetoDetalhesState {
  // Dialog de agendamentos
  isAgendamentosDialogOpen: boolean;

  // Cancelamento de agendamento
  cancelDialogOpen: boolean;
  agendamentoToCancel: Agendamento | null;

  // Edição de agendamento
  editingAgendamento: Agendamento | null;
  editDialogOpen: boolean;
  editForm: EditAgendamentoForm;

  // Edição de sessão
  editingSessao: Sessao | null;
  editSessaoDialogOpen: boolean;
  editSessaoForm: EditSessaoForm;

  // Sessão manual
  manualSessaoDialogOpen: boolean;
  manualSessaoForm: ManualSessaoForm;
}

/**
 * Tipos de ações
 */
type ProjetoDetalhesAction =
  // Dialog de agendamentos
  | { type: 'OPEN_AGENDAMENTOS_DIALOG' }
  | { type: 'CLOSE_AGENDAMENTOS_DIALOG' }

  // Cancelamento de agendamento
  | { type: 'OPEN_CANCEL_DIALOG'; payload: Agendamento }
  | { type: 'CLOSE_CANCEL_DIALOG' }

  // Edição de agendamento
  | { type: 'OPEN_EDIT_AGENDAMENTO_DIALOG'; payload: Agendamento }
  | { type: 'CLOSE_EDIT_AGENDAMENTO_DIALOG' }
  | { type: 'SET_EDIT_FORM'; payload: Partial<EditAgendamentoForm> }

  // Edição de sessão
  | { type: 'OPEN_EDIT_SESSAO_DIALOG'; payload: Sessao }
  | { type: 'CLOSE_EDIT_SESSAO_DIALOG' }
  | { type: 'SET_EDIT_SESSAO_FORM'; payload: Partial<EditSessaoForm> }

  // Sessão manual
  | { type: 'OPEN_MANUAL_SESSAO_DIALOG' }
  | { type: 'CLOSE_MANUAL_SESSAO_DIALOG' }
  | { type: 'SET_MANUAL_SESSAO_FORM'; payload: Partial<ManualSessaoForm> }
  | { type: 'RESET_MANUAL_SESSAO_FORM' };

/**
 * Valores iniciais dos formulários
 */
const INITIAL_EDIT_FORM: EditAgendamentoForm = {
  titulo: '',
  descricao: '',
  data: '',
  hora: '',
  status: 'agendado',
};

const INITIAL_EDIT_SESSAO_FORM: EditSessaoForm = {
  data: '',
  valor: 0,
  descricao: '',
  status: 'agendada',
};

const INITIAL_MANUAL_SESSAO_FORM: ManualSessaoForm = {
  data: '',
  valor: 0,
  descricao: '',
  status: 'concluida',
};

/**
 * Estado inicial
 */
const initialState: ProjetoDetalhesState = {
  isAgendamentosDialogOpen: false,
  cancelDialogOpen: false,
  agendamentoToCancel: null,
  editingAgendamento: null,
  editDialogOpen: false,
  editForm: INITIAL_EDIT_FORM,
  editingSessao: null,
  editSessaoDialogOpen: false,
  editSessaoForm: INITIAL_EDIT_SESSAO_FORM,
  manualSessaoDialogOpen: false,
  manualSessaoForm: INITIAL_MANUAL_SESSAO_FORM,
};

/**
 * Função reducer
 */
function projetoDetalhesReducer(
  state: ProjetoDetalhesState,
  action: ProjetoDetalhesAction
): ProjetoDetalhesState {
  switch (action.type) {
    // ============= DIALOG DE AGENDAMENTOS =============
    case 'OPEN_AGENDAMENTOS_DIALOG':
      return { ...state, isAgendamentosDialogOpen: true };

    case 'CLOSE_AGENDAMENTOS_DIALOG':
      return { ...state, isAgendamentosDialogOpen: false };

    // ============= CANCELAMENTO DE AGENDAMENTO =============
    case 'OPEN_CANCEL_DIALOG':
      return {
        ...state,
        cancelDialogOpen: true,
        agendamentoToCancel: action.payload,
      };

    case 'CLOSE_CANCEL_DIALOG':
      return {
        ...state,
        cancelDialogOpen: false,
        agendamentoToCancel: null,
      };

    // ============= EDIÇÃO DE AGENDAMENTO =============
    case 'OPEN_EDIT_AGENDAMENTO_DIALOG':
      return {
        ...state,
        editDialogOpen: true,
        editingAgendamento: action.payload,
        editForm: {
          titulo: action.payload.titulo,
          descricao: action.payload.descricao || '',
          data: action.payload.data,
          hora: action.payload.hora,
          status: action.payload.status,
        },
      };

    case 'CLOSE_EDIT_AGENDAMENTO_DIALOG':
      return {
        ...state,
        editDialogOpen: false,
        editingAgendamento: null,
        editForm: INITIAL_EDIT_FORM,
      };

    case 'SET_EDIT_FORM':
      return {
        ...state,
        editForm: { ...state.editForm, ...action.payload },
      };

    // ============= EDIÇÃO DE SESSÃO =============
    case 'OPEN_EDIT_SESSAO_DIALOG':
      return {
        ...state,
        editSessaoDialogOpen: true,
        editingSessao: action.payload,
        editSessaoForm: {
          data: action.payload.data || '',
          valor: action.payload.valor ?? 0,
          descricao: action.payload.descricao || '',
          status: action.payload.status || 'agendada',
        },
      };

    case 'CLOSE_EDIT_SESSAO_DIALOG':
      return {
        ...state,
        editSessaoDialogOpen: false,
        editingSessao: null,
        editSessaoForm: INITIAL_EDIT_SESSAO_FORM,
      };

    case 'SET_EDIT_SESSAO_FORM':
      return {
        ...state,
        editSessaoForm: { ...state.editSessaoForm, ...action.payload },
      };

    // ============= SESSÃO MANUAL =============
    case 'OPEN_MANUAL_SESSAO_DIALOG':
      return {
        ...state,
        manualSessaoDialogOpen: true,
        manualSessaoForm: INITIAL_MANUAL_SESSAO_FORM,
      };

    case 'CLOSE_MANUAL_SESSAO_DIALOG':
      return {
        ...state,
        manualSessaoDialogOpen: false,
        manualSessaoForm: INITIAL_MANUAL_SESSAO_FORM,
      };

    case 'SET_MANUAL_SESSAO_FORM':
      return {
        ...state,
        manualSessaoForm: { ...state.manualSessaoForm, ...action.payload },
      };

    case 'RESET_MANUAL_SESSAO_FORM':
      return {
        ...state,
        manualSessaoForm: INITIAL_MANUAL_SESSAO_FORM,
      };

    default:
      return state;
  }
}

/**
 * Hook customizado que encapsula o reducer do ProjetoDetalhes
 * 
 * @example
 * ```tsx
 * const { state, actions } = useProjetoDetalhesReducer();
 * 
 * // Abrir edição de sessão
 * actions.openEditSessaoDialog(sessao);
 * 
 * // Atualizar formulário
 * actions.setEditSessaoForm({ valor: 100 });
 * ```
 */
export function useProjetoDetalhesReducer() {
  const [state, dispatch] = useReducer(projetoDetalhesReducer, initialState);

  const actions = {
    // Dialog de agendamentos
    openAgendamentosDialog: useCallback(() =>
      dispatch({ type: 'OPEN_AGENDAMENTOS_DIALOG' }), []),
    closeAgendamentosDialog: useCallback(() =>
      dispatch({ type: 'CLOSE_AGENDAMENTOS_DIALOG' }), []),
    setAgendamentosDialogOpen: useCallback((open: boolean) => {
      dispatch({ type: open ? 'OPEN_AGENDAMENTOS_DIALOG' : 'CLOSE_AGENDAMENTOS_DIALOG' });
    }, []),

    // Cancelamento de agendamento
    openCancelDialog: useCallback((agendamento: Agendamento) =>
      dispatch({ type: 'OPEN_CANCEL_DIALOG', payload: agendamento }), []),
    closeCancelDialog: useCallback(() =>
      dispatch({ type: 'CLOSE_CANCEL_DIALOG' }), []),
    setCancelDialogOpen: useCallback((open: boolean) => {
      if (!open) dispatch({ type: 'CLOSE_CANCEL_DIALOG' });
    }, []),

    // Edição de agendamento
    openEditAgendamentoDialog: useCallback((agendamento: Agendamento) =>
      dispatch({ type: 'OPEN_EDIT_AGENDAMENTO_DIALOG', payload: agendamento }), []),
    closeEditAgendamentoDialog: useCallback(() =>
      dispatch({ type: 'CLOSE_EDIT_AGENDAMENTO_DIALOG' }), []),
    setEditForm: useCallback((form: Partial<EditAgendamentoForm>) =>
      dispatch({ type: 'SET_EDIT_FORM', payload: form }), []),
    setEditDialogOpen: useCallback((open: boolean) => {
      if (!open) dispatch({ type: 'CLOSE_EDIT_AGENDAMENTO_DIALOG' });
    }, []),

    // Edição de sessão
    openEditSessaoDialog: useCallback((sessao: Sessao) =>
      dispatch({ type: 'OPEN_EDIT_SESSAO_DIALOG', payload: sessao }), []),
    closeEditSessaoDialog: useCallback(() =>
      dispatch({ type: 'CLOSE_EDIT_SESSAO_DIALOG' }), []),
    setEditSessaoForm: useCallback((form: Partial<EditSessaoForm>) =>
      dispatch({ type: 'SET_EDIT_SESSAO_FORM', payload: form }), []),
    setEditSessaoDialogOpen: useCallback((open: boolean) => {
      if (!open) dispatch({ type: 'CLOSE_EDIT_SESSAO_DIALOG' });
    }, []),

    // Sessão manual
    openManualSessaoDialog: useCallback(() =>
      dispatch({ type: 'OPEN_MANUAL_SESSAO_DIALOG' }), []),
    closeManualSessaoDialog: useCallback(() =>
      dispatch({ type: 'CLOSE_MANUAL_SESSAO_DIALOG' }), []),
    setManualSessaoForm: useCallback((form: Partial<ManualSessaoForm>) =>
      dispatch({ type: 'SET_MANUAL_SESSAO_FORM', payload: form }), []),
    resetManualSessaoForm: useCallback(() =>
      dispatch({ type: 'RESET_MANUAL_SESSAO_FORM' }), []),
    setManualSessaoDialogOpen: useCallback((open: boolean) => {
      dispatch({ type: open ? 'OPEN_MANUAL_SESSAO_DIALOG' : 'CLOSE_MANUAL_SESSAO_DIALOG' });
    }, []),
  };

  return { state, actions, dispatch };
}

export type {
  ProjetoDetalhesState,
  ProjetoDetalhesAction,
  Sessao,
  Agendamento,
  EditSessaoForm,
  EditAgendamentoForm,
  ManualSessaoForm,
  SessaoStatus,
  AgendamentoStatus,
};

