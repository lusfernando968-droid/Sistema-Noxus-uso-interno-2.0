import { useReducer, useCallback } from 'react';
import { TipoTransacao, Transacao } from '@/services/transacoes.service';
import type { TransacaoFormData } from '@/components/financeiro';

/**
 * Estado do reducer do Financeiro
 */
interface FinanceiroState {
  // Dialog de formulário
  isDialogOpen: boolean;
  isEditMode: boolean;
  editingId: string | null;
  formData: TransacaoFormData;

  // Dialog de liquidação
  isLiquidarOpen: boolean;
  liquidarTargetId: string | null;
  liquidarContaId: string;
  liquidarData: string;

  // Filtros
  filtroTipo: 'TODOS' | TipoTransacao;
  filtroCategoria: string;
  filtroStatus: 'TODOS' | 'LIQUIDADAS' | 'PENDENTES';
  filtroContaId: string;
}

/**
 * Tipos de ações do reducer
 */
type FinanceiroAction =
  // Ações do dialog de formulário
  | { type: 'OPEN_NEW_DIALOG' }
  | { type: 'OPEN_EDIT_DIALOG'; payload: Transacao }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_FORM_DATA'; payload: TransacaoFormData }
  | { type: 'RESET_FORM' }

  // Ações do dialog de liquidação
  | { type: 'OPEN_LIQUIDAR_DIALOG'; payload: Transacao }
  | { type: 'CLOSE_LIQUIDAR_DIALOG' }
  | { type: 'SET_LIQUIDAR_CONTA_ID'; payload: string }
  | { type: 'SET_LIQUIDAR_DATA'; payload: string }

  // Ações de filtros
  | { type: 'SET_FILTRO_TIPO'; payload: 'TODOS' | TipoTransacao }
  | { type: 'SET_FILTRO_CATEGORIA'; payload: string }
  | { type: 'SET_FILTRO_STATUS'; payload: 'TODOS' | 'LIQUIDADAS' | 'PENDENTES' }
  | { type: 'SET_FILTRO_CONTA_ID'; payload: string }
  | { type: 'RESET_FILTROS' }

  // Ação combinada para abrir dialog com data pré-preenchida (calendário)
  | { type: 'OPEN_NEW_DIALOG_WITH_DATE'; payload: string };

/**
 * Dados iniciais do formulário
 */
const INITIAL_FORM_DATA: TransacaoFormData = {
  tipo: 'RECEITA' as TipoTransacao,
  categoria: '',
  valor: '',
  data_vencimento: '',
  descricao: '',
  agendamento_id: '',
  liquidarFuturo: true,
  conta_id: '',
  conta_destino_id: '',
};

/**
 * Estado inicial do reducer
 */
const initialState: FinanceiroState = {
  // Dialog de formulário
  isDialogOpen: false,
  isEditMode: false,
  editingId: null,
  formData: INITIAL_FORM_DATA,

  // Dialog de liquidação
  isLiquidarOpen: false,
  liquidarTargetId: null,
  liquidarContaId: '',
  liquidarData: new Date().toISOString().split('T')[0],

  // Filtros
  filtroTipo: 'TODOS',
  filtroCategoria: 'TODOS',
  filtroStatus: 'TODOS',
  filtroContaId: 'TODAS',
};

/**
 * Função reducer que gerencia todas as transições de estado
 */
function financeiroReducer(state: FinanceiroState, action: FinanceiroAction): FinanceiroState {
  switch (action.type) {
    // ============= DIALOG DE FORMULÁRIO =============
    case 'OPEN_NEW_DIALOG':
      return {
        ...state,
        isDialogOpen: true,
        isEditMode: false,
        editingId: null,
        formData: INITIAL_FORM_DATA,
      };

    case 'OPEN_NEW_DIALOG_WITH_DATE':
      return {
        ...state,
        isDialogOpen: true,
        isEditMode: false,
        editingId: null,
        formData: {
          ...INITIAL_FORM_DATA,
          data_vencimento: action.payload,
        },
      };

    case 'OPEN_EDIT_DIALOG':
      return {
        ...state,
        isDialogOpen: true,
        isEditMode: true,
        editingId: action.payload.id,
        formData: {
          tipo: action.payload.tipo,
          categoria: action.payload.categoria,
          valor: String(Number(action.payload.valor).toFixed(2)),
          data_vencimento: action.payload.data_vencimento,
          descricao: action.payload.descricao,
          agendamento_id: action.payload.agendamento_id || '',
          liquidarFuturo: true,
          conta_id: action.payload.conta_id || '',
          conta_destino_id: '',
        },
      };

    case 'CLOSE_DIALOG':
      return {
        ...state,
        isDialogOpen: false,
        isEditMode: false,
        editingId: null,
        formData: INITIAL_FORM_DATA,
      };

    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: action.payload,
      };

    case 'RESET_FORM':
      return {
        ...state,
        formData: INITIAL_FORM_DATA,
      };

    // ============= DIALOG DE LIQUIDAÇÃO =============
    case 'OPEN_LIQUIDAR_DIALOG':
      return {
        ...state,
        isLiquidarOpen: true,
        liquidarTargetId: action.payload.id,
        liquidarContaId: String(action.payload.conta_id || ''),
        liquidarData: new Date().toISOString().split('T')[0],
      };

    case 'CLOSE_LIQUIDAR_DIALOG':
      return {
        ...state,
        isLiquidarOpen: false,
        liquidarTargetId: null,
      };

    case 'SET_LIQUIDAR_CONTA_ID':
      return {
        ...state,
        liquidarContaId: action.payload,
      };

    case 'SET_LIQUIDAR_DATA':
      return {
        ...state,
        liquidarData: action.payload,
      };

    // ============= FILTROS =============
    case 'SET_FILTRO_TIPO':
      return {
        ...state,
        filtroTipo: action.payload,
      };

    case 'SET_FILTRO_CATEGORIA':
      return {
        ...state,
        filtroCategoria: action.payload,
      };

    case 'SET_FILTRO_STATUS':
      return {
        ...state,
        filtroStatus: action.payload,
      };

    case 'SET_FILTRO_CONTA_ID':
      return {
        ...state,
        filtroContaId: action.payload,
      };

    case 'RESET_FILTROS':
      return {
        ...state,
        filtroTipo: 'TODOS',
        filtroCategoria: 'TODOS',
        filtroStatus: 'TODOS',
        filtroContaId: 'TODAS',
      };

    default:
      return state;
  }
}

/**
 * Hook customizado que encapsula o reducer do Financeiro
 * Fornece estado e ações tipadas para gerenciar o componente
 * 
 * @example
 * ```tsx
 * const { state, actions } = useFinanceiroReducer();
 * 
 * // Abrir novo dialog
 * actions.openNewDialog();
 * 
 * // Editar transação
 * actions.openEditDialog(transacao);
 * 
 * // Atualizar filtro
 * actions.setFiltroTipo('RECEITA');
 * ```
 */
export function useFinanceiroReducer() {
  const [state, dispatch] = useReducer(financeiroReducer, initialState);

  // Actions memoizadas para evitar re-renders desnecessários
  const actions = {
    // Dialog de formulário
    openNewDialog: useCallback(() => dispatch({ type: 'OPEN_NEW_DIALOG' }), []),
    openNewDialogWithDate: useCallback((date: string) => 
      dispatch({ type: 'OPEN_NEW_DIALOG_WITH_DATE', payload: date }), []),
    openEditDialog: useCallback((transacao: Transacao) => 
      dispatch({ type: 'OPEN_EDIT_DIALOG', payload: transacao }), []),
    closeDialog: useCallback(() => dispatch({ type: 'CLOSE_DIALOG' }), []),
    setFormData: useCallback((data: TransacaoFormData) => 
      dispatch({ type: 'SET_FORM_DATA', payload: data }), []),
    resetForm: useCallback(() => dispatch({ type: 'RESET_FORM' }), []),

    // Dialog de liquidação
    openLiquidarDialog: useCallback((transacao: Transacao) => 
      dispatch({ type: 'OPEN_LIQUIDAR_DIALOG', payload: transacao }), []),
    closeLiquidarDialog: useCallback(() => dispatch({ type: 'CLOSE_LIQUIDAR_DIALOG' }), []),
    setLiquidarContaId: useCallback((contaId: string) => 
      dispatch({ type: 'SET_LIQUIDAR_CONTA_ID', payload: contaId }), []),
    setLiquidarData: useCallback((data: string) => 
      dispatch({ type: 'SET_LIQUIDAR_DATA', payload: data }), []),

    // Filtros
    setFiltroTipo: useCallback((tipo: 'TODOS' | TipoTransacao) => 
      dispatch({ type: 'SET_FILTRO_TIPO', payload: tipo }), []),
    setFiltroCategoria: useCallback((categoria: string) => 
      dispatch({ type: 'SET_FILTRO_CATEGORIA', payload: categoria }), []),
    setFiltroStatus: useCallback((status: 'TODOS' | 'LIQUIDADAS' | 'PENDENTES') => 
      dispatch({ type: 'SET_FILTRO_STATUS', payload: status }), []),
    setFiltroContaId: useCallback((contaId: string) => 
      dispatch({ type: 'SET_FILTRO_CONTA_ID', payload: contaId }), []),
    resetFiltros: useCallback(() => dispatch({ type: 'RESET_FILTROS' }), []),

    // Ação para setar o dialog open/close diretamente (compatibilidade com componentes existentes)
    setDialogOpen: useCallback((open: boolean) => {
      if (!open) {
        dispatch({ type: 'CLOSE_DIALOG' });
      }
    }, []),

    setLiquidarOpen: useCallback((open: boolean) => {
      if (!open) {
        dispatch({ type: 'CLOSE_LIQUIDAR_DIALOG' });
      }
    }, []),
  };

  return { state, actions, dispatch };
}

export type { FinanceiroState, FinanceiroAction };
export { INITIAL_FORM_DATA };

