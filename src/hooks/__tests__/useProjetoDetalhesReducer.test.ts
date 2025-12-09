/**
 * Testes de integração para useProjetoDetalhesReducer
 * 
 * Testa as transições de estado para edição de sessões,
 * agendamentos e dialogs do componente ProjetoDetalhes.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjetoDetalhesReducer } from '../useProjetoDetalhesReducer';

describe('useProjetoDetalhesReducer', () => {
  describe('Estado Inicial', () => {
    it('deve inicializar com todos os dialogs fechados', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      expect(result.current.state.isAgendamentosDialogOpen).toBe(false);
      expect(result.current.state.cancelDialogOpen).toBe(false);
      expect(result.current.state.editDialogOpen).toBe(false);
      expect(result.current.state.editSessaoDialogOpen).toBe(false);
      expect(result.current.state.manualSessaoDialogOpen).toBe(false);
    });

    it('deve ter objetos de edição como null', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      expect(result.current.state.agendamentoToCancel).toBeNull();
      expect(result.current.state.editingAgendamento).toBeNull();
      expect(result.current.state.editingSessao).toBeNull();
    });

    it('deve ter formulários com valores padrão', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      expect(result.current.state.editForm).toEqual({
        titulo: '',
        descricao: '',
        data: '',
        hora: '',
        status: 'agendado',
      });

      expect(result.current.state.editSessaoForm).toEqual({
        data: '',
        valor: 0,
        descricao: '',
        status: 'agendada',
      });

      expect(result.current.state.manualSessaoForm).toEqual({
        data: '',
        valor: 0,
        descricao: '',
        status: 'concluida',
      });
    });
  });

  describe('Dialog de Agendamentos', () => {
    it('deve abrir e fechar dialog de agendamentos', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      act(() => {
        result.current.actions.openAgendamentosDialog();
      });

      expect(result.current.state.isAgendamentosDialogOpen).toBe(true);

      act(() => {
        result.current.actions.closeAgendamentosDialog();
      });

      expect(result.current.state.isAgendamentosDialogOpen).toBe(false);
    });

    it('deve funcionar com setAgendamentosDialogOpen', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      act(() => {
        result.current.actions.setAgendamentosDialogOpen(true);
      });

      expect(result.current.state.isAgendamentosDialogOpen).toBe(true);

      act(() => {
        result.current.actions.setAgendamentosDialogOpen(false);
      });

      expect(result.current.state.isAgendamentosDialogOpen).toBe(false);
    });
  });

  describe('Dialog de Cancelamento', () => {
    it('deve abrir dialog de cancelamento com agendamento', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      const agendamento = {
        id: 'ag-1',
        titulo: 'Sessão de Tattoo',
        data: '2024-06-15',
        hora: '14:00',
        status: 'agendado' as const,
        descricao: 'Braço direito',
      };

      act(() => {
        result.current.actions.openCancelDialog(agendamento);
      });

      expect(result.current.state.cancelDialogOpen).toBe(true);
      expect(result.current.state.agendamentoToCancel).toEqual(agendamento);
    });

    it('deve fechar dialog e limpar agendamento', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      const agendamento = {
        id: 'ag-2',
        titulo: 'Retoque',
        data: '2024-07-01',
        hora: '10:00',
        status: 'confirmado' as const,
      };

      act(() => {
        result.current.actions.openCancelDialog(agendamento);
      });

      expect(result.current.state.agendamentoToCancel).not.toBeNull();

      act(() => {
        result.current.actions.closeCancelDialog();
      });

      expect(result.current.state.cancelDialogOpen).toBe(false);
      expect(result.current.state.agendamentoToCancel).toBeNull();
    });
  });

  describe('Edição de Agendamento', () => {
    it('deve abrir dialog de edição com dados do agendamento', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      const agendamento = {
        id: 'ag-edit',
        titulo: 'Finalização',
        data: '2024-08-10',
        hora: '16:00',
        status: 'agendado' as const,
        descricao: 'Últimos detalhes',
      };

      act(() => {
        result.current.actions.openEditAgendamentoDialog(agendamento);
      });

      expect(result.current.state.editDialogOpen).toBe(true);
      expect(result.current.state.editingAgendamento).toEqual(agendamento);
      expect(result.current.state.editForm.titulo).toBe('Finalização');
      expect(result.current.state.editForm.data).toBe('2024-08-10');
      expect(result.current.state.editForm.hora).toBe('16:00');
      expect(result.current.state.editForm.descricao).toBe('Últimos detalhes');
    });

    it('deve atualizar campos do formulário de edição', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      const agendamento = {
        id: 'ag-3',
        titulo: 'Sessão',
        data: '2024-09-01',
        hora: '09:00',
        status: 'agendado' as const,
      };

      act(() => {
        result.current.actions.openEditAgendamentoDialog(agendamento);
      });

      act(() => {
        result.current.actions.setEditForm({
          titulo: 'Sessão Atualizada',
          hora: '10:30',
        });
      });

      expect(result.current.state.editForm.titulo).toBe('Sessão Atualizada');
      expect(result.current.state.editForm.hora).toBe('10:30');
      // Outros campos mantidos
      expect(result.current.state.editForm.data).toBe('2024-09-01');
    });

    it('deve fechar e limpar estado de edição', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      const agendamento = {
        id: 'ag-4',
        titulo: 'Teste',
        data: '2024-10-01',
        hora: '11:00',
        status: 'agendado' as const,
      };

      act(() => {
        result.current.actions.openEditAgendamentoDialog(agendamento);
      });

      act(() => {
        result.current.actions.closeEditAgendamentoDialog();
      });

      expect(result.current.state.editDialogOpen).toBe(false);
      expect(result.current.state.editingAgendamento).toBeNull();
      expect(result.current.state.editForm.titulo).toBe('');
    });
  });

  describe('Edição de Sessão', () => {
    it('deve abrir dialog de edição com dados da sessão', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      const sessao = {
        id: 'sess-1',
        data: '2024-06-20',
        duracao: 120,
        descricao: 'Contorno completo',
        valor: 500,
        status: 'concluida' as const,
        avaliacao: 5,
      };

      act(() => {
        result.current.actions.openEditSessaoDialog(sessao);
      });

      expect(result.current.state.editSessaoDialogOpen).toBe(true);
      expect(result.current.state.editingSessao).toEqual(sessao);
      expect(result.current.state.editSessaoForm.data).toBe('2024-06-20');
      expect(result.current.state.editSessaoForm.valor).toBe(500);
      expect(result.current.state.editSessaoForm.status).toBe('concluida');
    });

    it('deve atualizar campos do formulário de sessão', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      const sessao = {
        id: 'sess-2',
        data: '2024-07-15',
        duracao: 90,
        descricao: 'Sombreamento',
        valor: 400,
        status: 'agendada' as const,
      };

      act(() => {
        result.current.actions.openEditSessaoDialog(sessao);
      });

      act(() => {
        result.current.actions.setEditSessaoForm({
          valor: 450,
          status: 'concluida',
        });
      });

      expect(result.current.state.editSessaoForm.valor).toBe(450);
      expect(result.current.state.editSessaoForm.status).toBe('concluida');
      // Mantém outros campos
      expect(result.current.state.editSessaoForm.data).toBe('2024-07-15');
    });

    it('deve fechar e limpar estado de edição de sessão', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      const sessao = {
        id: 'sess-3',
        data: '2024-08-01',
        duracao: 60,
        descricao: 'Touch-up',
        valor: 200,
        status: 'agendada' as const,
      };

      act(() => {
        result.current.actions.openEditSessaoDialog(sessao);
      });

      act(() => {
        result.current.actions.closeEditSessaoDialog();
      });

      expect(result.current.state.editSessaoDialogOpen).toBe(false);
      expect(result.current.state.editingSessao).toBeNull();
      expect(result.current.state.editSessaoForm.valor).toBe(0);
    });
  });

  describe('Sessão Manual', () => {
    it('deve abrir dialog de sessão manual com valores padrão', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      act(() => {
        result.current.actions.openManualSessaoDialog();
      });

      expect(result.current.state.manualSessaoDialogOpen).toBe(true);
      expect(result.current.state.manualSessaoForm.status).toBe('concluida');
      expect(result.current.state.manualSessaoForm.valor).toBe(0);
    });

    it('deve atualizar campos do formulário manual', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      act(() => {
        result.current.actions.openManualSessaoDialog();
      });

      act(() => {
        result.current.actions.setManualSessaoForm({
          data: '2024-09-10',
          valor: 350,
          descricao: 'Sessão extra',
        });
      });

      expect(result.current.state.manualSessaoForm.data).toBe('2024-09-10');
      expect(result.current.state.manualSessaoForm.valor).toBe(350);
      expect(result.current.state.manualSessaoForm.descricao).toBe('Sessão extra');
    });

    it('deve fechar e resetar formulário manual', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      act(() => {
        result.current.actions.openManualSessaoDialog();
        result.current.actions.setManualSessaoForm({
          data: '2024-10-01',
          valor: 600,
        });
      });

      expect(result.current.state.manualSessaoForm.valor).toBe(600);

      act(() => {
        result.current.actions.closeManualSessaoDialog();
      });

      expect(result.current.state.manualSessaoDialogOpen).toBe(false);
      expect(result.current.state.manualSessaoForm.valor).toBe(0);
      expect(result.current.state.manualSessaoForm.data).toBe('');
    });

    it('deve funcionar com setManualSessaoDialogOpen', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      act(() => {
        result.current.actions.setManualSessaoDialogOpen(true);
      });

      expect(result.current.state.manualSessaoDialogOpen).toBe(true);

      act(() => {
        result.current.actions.setManualSessaoDialogOpen(false);
      });

      expect(result.current.state.manualSessaoDialogOpen).toBe(false);
    });
  });

  describe('Fluxos Completos', () => {
    it('deve completar fluxo de cancelar agendamento', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      const agendamento = {
        id: 'ag-cancel',
        titulo: 'Agendamento para cancelar',
        data: '2024-11-01',
        hora: '15:00',
        status: 'agendado' as const,
      };

      // 1. Abre dialog de cancelamento
      act(() => {
        result.current.actions.openCancelDialog(agendamento);
      });

      expect(result.current.state.cancelDialogOpen).toBe(true);
      expect(result.current.state.agendamentoToCancel?.id).toBe('ag-cancel');

      // 2. Confirma cancelamento (fecha dialog)
      act(() => {
        result.current.actions.closeCancelDialog();
      });

      expect(result.current.state.cancelDialogOpen).toBe(false);
      expect(result.current.state.agendamentoToCancel).toBeNull();
    });

    it('deve completar fluxo de edição de sessão', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      const sessao = {
        id: 'sess-flow',
        data: '2024-12-01',
        duracao: 180,
        descricao: 'Projeto grande',
        valor: 1500,
        status: 'agendada' as const,
      };

      // 1. Abre para edição
      act(() => {
        result.current.actions.openEditSessaoDialog(sessao);
      });

      expect(result.current.state.editSessaoDialogOpen).toBe(true);

      // 2. Atualiza valores
      act(() => {
        result.current.actions.setEditSessaoForm({
          valor: 1800,
          status: 'concluida',
          descricao: 'Projeto grande - finalizado',
        });
      });

      expect(result.current.state.editSessaoForm.valor).toBe(1800);

      // 3. Salva (fecha dialog)
      act(() => {
        result.current.actions.closeEditSessaoDialog();
      });

      expect(result.current.state.editSessaoDialogOpen).toBe(false);
    });

    it('deve completar fluxo de registrar sessão manual', () => {
      const { result } = renderHook(() => useProjetoDetalhesReducer());

      // 1. Abre dialog
      act(() => {
        result.current.actions.openManualSessaoDialog();
      });

      expect(result.current.state.manualSessaoDialogOpen).toBe(true);

      // 2. Preenche dados
      act(() => {
        result.current.actions.setManualSessaoForm({
          data: '2024-12-15',
          valor: 700,
          descricao: 'Sessão avulsa registrada manualmente',
          status: 'concluida',
        });
      });

      expect(result.current.state.manualSessaoForm.data).toBe('2024-12-15');
      expect(result.current.state.manualSessaoForm.valor).toBe(700);

      // 3. Salva (fecha dialog)
      act(() => {
        result.current.actions.closeManualSessaoDialog();
      });

      expect(result.current.state.manualSessaoDialogOpen).toBe(false);
      // Verifica reset
      expect(result.current.state.manualSessaoForm.valor).toBe(0);
    });
  });
});

