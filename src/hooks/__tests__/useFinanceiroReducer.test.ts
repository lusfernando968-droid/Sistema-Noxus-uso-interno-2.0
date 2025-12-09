/**
 * Testes de integração para useFinanceiroReducer
 * 
 * Testa as transições de estado do reducer, ações e
 * comportamento do hook customizado.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFinanceiroReducer, INITIAL_FORM_DATA } from '../useFinanceiroReducer';

describe('useFinanceiroReducer', () => {
  describe('Estado Inicial', () => {
    it('deve inicializar com estado padrão', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      expect(result.current.state.isDialogOpen).toBe(false);
      expect(result.current.state.isEditMode).toBe(false);
      expect(result.current.state.editingId).toBeNull();
      expect(result.current.state.isLiquidarOpen).toBe(false);
      expect(result.current.state.filtroTipo).toBe('TODOS');
      expect(result.current.state.filtroCategoria).toBe('TODOS');
      expect(result.current.state.filtroStatus).toBe('TODOS');
      expect(result.current.state.filtroContaId).toBe('TODAS');
    });

    it('deve ter formData inicial correto', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      expect(result.current.state.formData).toEqual(INITIAL_FORM_DATA);
      expect(result.current.state.formData.tipo).toBe('RECEITA');
      expect(result.current.state.formData.liquidarFuturo).toBe(true);
    });
  });

  describe('Ações do Dialog de Formulário', () => {
    it('deve abrir dialog para nova transação', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      act(() => {
        result.current.actions.openNewDialog();
      });

      expect(result.current.state.isDialogOpen).toBe(true);
      expect(result.current.state.isEditMode).toBe(false);
      expect(result.current.state.editingId).toBeNull();
    });

    it('deve abrir dialog com data pré-preenchida (calendário)', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      act(() => {
        result.current.actions.openNewDialogWithDate('2024-06-15');
      });

      expect(result.current.state.isDialogOpen).toBe(true);
      expect(result.current.state.formData.data_vencimento).toBe('2024-06-15');
      expect(result.current.state.isEditMode).toBe(false);
    });

    it('deve abrir dialog para edição de transação', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      const transacao = {
        id: 'trans-123',
        tipo: 'DESPESA' as const,
        categoria: 'Fornecedor',
        valor: 500,
        data_vencimento: '2024-03-10',
        data_liquidacao: null,
        descricao: 'Compra de material',
        agendamento_id: null,
        conta_id: 'conta-1',
      };

      act(() => {
        result.current.actions.openEditDialog(transacao);
      });

      expect(result.current.state.isDialogOpen).toBe(true);
      expect(result.current.state.isEditMode).toBe(true);
      expect(result.current.state.editingId).toBe('trans-123');
      expect(result.current.state.formData.tipo).toBe('DESPESA');
      expect(result.current.state.formData.categoria).toBe('Fornecedor');
      expect(result.current.state.formData.valor).toBe('500.00');
      expect(result.current.state.formData.conta_id).toBe('conta-1');
    });

    it('deve fechar dialog e resetar estado', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      // Primeiro abre o dialog
      act(() => {
        result.current.actions.openNewDialog();
        result.current.actions.setFormData({
          ...INITIAL_FORM_DATA,
          descricao: 'Teste',
        });
      });

      expect(result.current.state.isDialogOpen).toBe(true);

      // Depois fecha
      act(() => {
        result.current.actions.closeDialog();
      });

      expect(result.current.state.isDialogOpen).toBe(false);
      expect(result.current.state.formData).toEqual(INITIAL_FORM_DATA);
    });

    it('deve atualizar formData corretamente', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      const novoFormData = {
        ...INITIAL_FORM_DATA,
        tipo: 'DESPESA' as const,
        categoria: 'Infraestrutura',
        valor: '250.00',
        descricao: 'Pagamento servidor',
      };

      act(() => {
        result.current.actions.setFormData(novoFormData);
      });

      expect(result.current.state.formData.tipo).toBe('DESPESA');
      expect(result.current.state.formData.categoria).toBe('Infraestrutura');
      expect(result.current.state.formData.valor).toBe('250.00');
    });
  });

  describe('Ações do Dialog de Liquidação', () => {
    it('deve abrir dialog de liquidação', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      const transacao = {
        id: 'trans-456',
        tipo: 'RECEITA' as const,
        categoria: 'Pagamento de Cliente',
        valor: 1000,
        data_vencimento: '2024-04-20',
        data_liquidacao: null,
        descricao: 'Sessão completa',
        agendamento_id: null,
        conta_id: 'conta-principal',
      };

      act(() => {
        result.current.actions.openLiquidarDialog(transacao);
      });

      expect(result.current.state.isLiquidarOpen).toBe(true);
      expect(result.current.state.liquidarTargetId).toBe('trans-456');
      expect(result.current.state.liquidarContaId).toBe('conta-principal');
    });

    it('deve fechar dialog de liquidação', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      const transacao = {
        id: 'trans-789',
        tipo: 'RECEITA' as const,
        categoria: 'Outros',
        valor: 200,
        data_vencimento: '2024-05-01',
        data_liquidacao: null,
        descricao: 'Extra',
        agendamento_id: null,
        conta_id: null,
      };

      act(() => {
        result.current.actions.openLiquidarDialog(transacao);
      });

      expect(result.current.state.isLiquidarOpen).toBe(true);

      act(() => {
        result.current.actions.closeLiquidarDialog();
      });

      expect(result.current.state.isLiquidarOpen).toBe(false);
      expect(result.current.state.liquidarTargetId).toBeNull();
    });

    it('deve atualizar conta e data de liquidação', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      act(() => {
        result.current.actions.setLiquidarContaId('conta-nova');
        result.current.actions.setLiquidarData('2024-07-15');
      });

      expect(result.current.state.liquidarContaId).toBe('conta-nova');
      expect(result.current.state.liquidarData).toBe('2024-07-15');
    });
  });

  describe('Ações de Filtros', () => {
    it('deve atualizar filtro de tipo', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      act(() => {
        result.current.actions.setFiltroTipo('RECEITA');
      });

      expect(result.current.state.filtroTipo).toBe('RECEITA');

      act(() => {
        result.current.actions.setFiltroTipo('DESPESA');
      });

      expect(result.current.state.filtroTipo).toBe('DESPESA');
    });

    it('deve atualizar filtro de categoria', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      act(() => {
        result.current.actions.setFiltroCategoria('Fornecedor');
      });

      expect(result.current.state.filtroCategoria).toBe('Fornecedor');
    });

    it('deve atualizar filtro de status', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      act(() => {
        result.current.actions.setFiltroStatus('LIQUIDADAS');
      });

      expect(result.current.state.filtroStatus).toBe('LIQUIDADAS');

      act(() => {
        result.current.actions.setFiltroStatus('PENDENTES');
      });

      expect(result.current.state.filtroStatus).toBe('PENDENTES');
    });

    it('deve atualizar filtro de conta', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      act(() => {
        result.current.actions.setFiltroContaId('conta-específica');
      });

      expect(result.current.state.filtroContaId).toBe('conta-específica');
    });

    it('deve resetar todos os filtros', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      // Primeiro aplica alguns filtros
      act(() => {
        result.current.actions.setFiltroTipo('DESPESA');
        result.current.actions.setFiltroCategoria('Fornecedor');
        result.current.actions.setFiltroStatus('PENDENTES');
        result.current.actions.setFiltroContaId('conta-1');
      });

      expect(result.current.state.filtroTipo).toBe('DESPESA');
      expect(result.current.state.filtroCategoria).toBe('Fornecedor');

      // Depois reseta
      act(() => {
        result.current.actions.resetFiltros();
      });

      expect(result.current.state.filtroTipo).toBe('TODOS');
      expect(result.current.state.filtroCategoria).toBe('TODOS');
      expect(result.current.state.filtroStatus).toBe('TODOS');
      expect(result.current.state.filtroContaId).toBe('TODAS');
    });
  });

  describe('Ações de Compatibilidade', () => {
    it('deve fechar dialog via setDialogOpen(false)', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      act(() => {
        result.current.actions.openNewDialog();
      });

      expect(result.current.state.isDialogOpen).toBe(true);

      act(() => {
        result.current.actions.setDialogOpen(false);
      });

      expect(result.current.state.isDialogOpen).toBe(false);
    });

    it('deve fechar liquidar dialog via setLiquidarOpen(false)', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      const transacao = {
        id: 't-1',
        tipo: 'RECEITA' as const,
        categoria: 'Outros',
        valor: 100,
        data_vencimento: '2024-01-01',
        data_liquidacao: null,
        descricao: 'Test',
        agendamento_id: null,
        conta_id: null,
      };

      act(() => {
        result.current.actions.openLiquidarDialog(transacao);
      });

      expect(result.current.state.isLiquidarOpen).toBe(true);

      act(() => {
        result.current.actions.setLiquidarOpen(false);
      });

      expect(result.current.state.isLiquidarOpen).toBe(false);
    });
  });

  describe('Fluxos Completos', () => {
    it('deve completar fluxo de criação de transação', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      // 1. Abre dialog
      act(() => {
        result.current.actions.openNewDialog();
      });

      expect(result.current.state.isDialogOpen).toBe(true);

      // 2. Preenche formulário
      act(() => {
        result.current.actions.setFormData({
          tipo: 'RECEITA',
          categoria: 'Pagamento de Cliente',
          valor: '1500.00',
          data_vencimento: '2024-08-01',
          descricao: 'Pagamento projeto X',
          agendamento_id: '',
          liquidarFuturo: true,
          conta_id: '',
          conta_destino_id: '',
        });
      });

      expect(result.current.state.formData.valor).toBe('1500.00');

      // 3. Fecha dialog (simulando submit bem sucedido)
      act(() => {
        result.current.actions.closeDialog();
      });

      expect(result.current.state.isDialogOpen).toBe(false);
      expect(result.current.state.formData).toEqual(INITIAL_FORM_DATA);
    });

    it('deve completar fluxo de edição de transação', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      const transacaoExistente = {
        id: 'trans-edit',
        tipo: 'DESPESA' as const,
        categoria: 'Material',
        valor: 300,
        data_vencimento: '2024-06-01',
        data_liquidacao: null,
        descricao: 'Tinta preta',
        agendamento_id: null,
        conta_id: null,
      };

      // 1. Abre para edição
      act(() => {
        result.current.actions.openEditDialog(transacaoExistente);
      });

      expect(result.current.state.isEditMode).toBe(true);
      expect(result.current.state.editingId).toBe('trans-edit');

      // 2. Modifica valor
      act(() => {
        result.current.actions.setFormData({
          ...result.current.state.formData,
          valor: '350.00',
        });
      });

      expect(result.current.state.formData.valor).toBe('350.00');

      // 3. Fecha
      act(() => {
        result.current.actions.closeDialog();
      });

      expect(result.current.state.isEditMode).toBe(false);
      expect(result.current.state.editingId).toBeNull();
    });

    it('deve completar fluxo de liquidação', () => {
      const { result } = renderHook(() => useFinanceiroReducer());

      const transacaoPendente = {
        id: 'trans-liq',
        tipo: 'RECEITA' as const,
        categoria: 'Consultoria',
        valor: 2000,
        data_vencimento: '2024-05-15',
        data_liquidacao: null,
        descricao: 'Consultoria técnica',
        agendamento_id: null,
        conta_id: null,
      };

      // 1. Abre dialog de liquidação
      act(() => {
        result.current.actions.openLiquidarDialog(transacaoPendente);
      });

      expect(result.current.state.isLiquidarOpen).toBe(true);
      expect(result.current.state.liquidarTargetId).toBe('trans-liq');

      // 2. Seleciona conta
      act(() => {
        result.current.actions.setLiquidarContaId('conta-bb');
      });

      expect(result.current.state.liquidarContaId).toBe('conta-bb');

      // 3. Define data
      act(() => {
        result.current.actions.setLiquidarData('2024-05-20');
      });

      expect(result.current.state.liquidarData).toBe('2024-05-20');

      // 4. Fecha (simulando confirmação)
      act(() => {
        result.current.actions.closeLiquidarDialog();
      });

      expect(result.current.state.isLiquidarOpen).toBe(false);
    });
  });
});

