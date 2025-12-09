import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialCalendar } from "@/components/calendar/FinancialCalendar";
import { FinanceiroSkeleton } from "@/components/ui/skeletons";
import { useAuth } from "@/contexts/AuthContext";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { useCarteira } from "@/hooks/useCarteira";
import { useFinanceiroReducer } from "@/hooks/useFinanceiroReducer";
import { calcularSaldoConta, saldoPosTransacao } from "@/utils/saldoPorConta";

// Componentes do financeiro
import {
  FinanceiroSummaryCards,
  TransacoesFilters,
  TransacaoFormDialog,
  TransacaoLiquidarDialog,
  TransacoesListView,
  TransacoesTableView,
  TabelaGestaoBancos,
} from "@/components/financeiro";

// Serviço de transações
import {
  TransacoesService,
  Transacao,
  Agendamento,
} from "@/services/transacoes.service";

const Financeiro = () => {
  // Set document title
  useEffect(() => {
    document.title = "Financeiro Tattoo - Noxus";
  }, []);

  const { user } = useAuth();
  const { items: contas, loading: loadingContas } = useContasBancarias();
  const { items: carteiraItems, loading: loadingCarteira } = useCarteira();

  // Reducer para estados complexos (dialog, liquidação, filtros)
  const { state, actions } = useFinanceiroReducer();

  // Estado das transações e agendamentos (dados do servidor)
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  // Cálculos de saldo (derivados do estado)
  const contaSelecionadaId = state.formData.conta_id || "";
  const saldoConta = calcularSaldoConta(
    contaSelecionadaId,
    contas,
    carteiraItems as unknown as Array<{ conta_id: string; tipo: string; valor: number; data_liquidacao?: string }>
  );
  const previewSaldoPos = saldoPosTransacao(
    Number(saldoConta.saldoAtual || 0),
    state.formData.tipo,
    Number(parseFloat(state.formData.valor || "0") || 0),
    true
  );

  // Fetch inicial
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [transacoesData, agendamentosData] = await Promise.all([
        TransacoesService.fetchAll(user!.id),
        TransacoesService.fetchAgendamentos(),
      ]);
      setTransacoes(transacoesData);
      setAgendamentos(agendamentosData);

      // Sincronizar com carteira em background
      TransacoesService.syncAllToCarteira(transacoesData);
    } catch (error) {
      toast.error("Erro ao carregar dados");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handler de submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    const { formData, isEditMode, editingId } = state;

    try {
      if (isEditMode && editingId) {
        const result = await TransacoesService.update(editingId, {
          tipo: formData.tipo,
          categoria: formData.categoria,
          valor: parseFloat(formData.valor),
          data_vencimento: formData.data_vencimento,
          descricao: formData.descricao,
          agendamento_id: formData.agendamento_id || null,
          conta_id: formData.conta_id || null,
        });

        if (result.warning) {
          toast.warning(result.warning);
        } else {
          toast.success("Transação atualizada com sucesso!");
        }
      } else {
        const hoje = new Date().toISOString().split('T')[0];

        if (formData.tipo === "APORTE") {
          if (!formData.conta_id || !formData.conta_destino_id) {
            toast.error("Selecione a conta de origem e a conta destino");
            return;
          }
          if (formData.conta_id === formData.conta_destino_id) {
            toast.error("Conta origem e destino devem ser diferentes");
            return;
          }

          const result = await TransacoesService.createAporte(user.id, {
            valor: parseFloat(formData.valor),
            data_vencimento: formData.data_vencimento,
            descricao: formData.descricao,
            conta_origem_id: formData.conta_id,
            conta_destino_id: formData.conta_destino_id,
            liquidarImediatamente: !formData.liquidarFuturo,
            agendamento_id: formData.agendamento_id || null,
          });

          if (result.warning) {
            toast.warning(result.warning);
          } else {
            toast.success("Aporte criado com sucesso!");
          }
        } else {
          const result = await TransacoesService.create(user.id, {
            tipo: formData.tipo,
            categoria: formData.categoria,
            valor: parseFloat(formData.valor),
            data_vencimento: formData.data_vencimento,
            descricao: formData.descricao,
            agendamento_id: formData.agendamento_id || null,
            data_liquidacao: formData.liquidarFuturo ? null : hoje,
            conta_id: formData.conta_id || null,
          });

          if (result.warning) {
            toast.warning(result.warning);
          } else {
            toast.success("Transação criada com sucesso!");
          }
        }
      }

      actions.closeDialog();
      loadData();
    } catch (error) {
      toast.error("Erro ao salvar transação");
      console.error(error);
    }
  };

  // Handler de confirmação de liquidação
  const handleConfirmLiquidar = async () => {
    const { liquidarTargetId, liquidarContaId, liquidarData } = state;

    if (!liquidarTargetId || !user) return;

    if (!liquidarContaId) {
      toast.error("Selecione um banco/conta para a baixa");
      return;
    }

    const transacaoAlvo = transacoes.find((t) => t.id === liquidarTargetId);
    if (!transacaoAlvo) return;

    try {
      const result = await TransacoesService.liquidar(
        liquidarTargetId,
        user.id,
        {
          data_liquidacao: liquidarData,
          conta_id: liquidarContaId,
        },
        transacaoAlvo
      );

      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success("Transação liquidada!");
      }

      actions.closeLiquidarDialog();
      loadData();
    } catch (error) {
      toast.error("Erro ao liquidar transação");
      console.error(error);
    }
  };

  // Handler de exclusão
  const handleDelete = async (id: string) => {
    try {
      await TransacoesService.delete(id);
      toast.success("Transação deletada!");
      loadData();
    } catch (error) {
      toast.error("Erro ao deletar transação");
      console.error(error);
    }
  };

  // Filtragem de transações (memoizado para performance)
  const transacoesFiltradas = useMemo(() => {
    const { filtroTipo, filtroCategoria, filtroStatus, filtroContaId } = state;

    return transacoes.filter((t) => {
      if (filtroTipo !== "TODOS" && t.tipo !== filtroTipo) return false;
      if (filtroCategoria !== "TODOS" && t.categoria !== filtroCategoria) return false;
      if (filtroStatus === "LIQUIDADAS" && !t.data_liquidacao) return false;
      if (filtroStatus === "PENDENTES" && t.data_liquidacao) return false;
      if (filtroContaId !== "TODAS" && (t.conta_id ?? "") !== filtroContaId) return false;
      return true;
    });
  }, [transacoes, state.filtroTipo, state.filtroCategoria, state.filtroStatus, state.filtroContaId]);

  // Loading state
  if (loading || loadingContas || loadingCarteira) {
    return <FinanceiroSkeleton />;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Financeiro Tattoo</h1>
          <p className="text-muted-foreground mt-1">
            Gestão completa de receitas e despesas
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <FinanceiroSummaryCards transacoes={transacoesFiltradas} />

      {/* Tabs */}
      <Tabs defaultValue="tabela" className="space-y-4">
        <div className="flex justify-center">
          <TabsList className="inline-flex w-auto rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 p-1.5 backdrop-blur-sm border border-border/20 shadow-lg">
            <TabsTrigger value="tabela" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">
              Tabela
            </TabsTrigger>
            <TabsTrigger value="agenda" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">
              Calendário
            </TabsTrigger>
            <TabsTrigger value="lista" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">
              Lista
            </TabsTrigger>
            <TabsTrigger value="bancos" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">
              Bancos
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Barra de ações */}
        <div className="flex justify-end gap-2">
          <TransacoesFilters
            filtroTipo={state.filtroTipo}
            setFiltroTipo={actions.setFiltroTipo}
            filtroCategoria={state.filtroCategoria}
            setFiltroCategoria={actions.setFiltroCategoria}
            filtroStatus={state.filtroStatus}
            setFiltroStatus={actions.setFiltroStatus}
            filtroContaId={state.filtroContaId}
            setFiltroContaId={actions.setFiltroContaId}
            contas={contas as Array<{ id: string; nome: string; banco_detalhes?: { nome_curto?: string } | null; banco?: string }>}
            resultCount={transacoesFiltradas.length}
          />
          <TransacaoFormDialog
            isOpen={state.isDialogOpen}
            onOpenChange={actions.setDialogOpen}
            isEditMode={state.isEditMode}
            formData={state.formData}
            setFormData={actions.setFormData}
            onSubmit={handleSubmit}
            contas={contas as Array<{ id: string; nome: string; banco_detalhes?: { nome_curto?: string } | null; banco?: string }>}
            agendamentos={agendamentos}
            saldoConta={saldoConta}
            previewSaldoPos={previewSaldoPos}
            onOpenNew={actions.openNewDialog}
          />
        </div>

        {/* Tab: Lista */}
        <TabsContent value="lista">
          <TransacoesListView
            transacoes={transacoesFiltradas}
            onLiquidar={actions.openLiquidarDialog}
            onEdit={actions.openEditDialog}
            onDelete={handleDelete}
          />
        </TabsContent>

        {/* Tab: Tabela */}
        <TabsContent value="tabela">
          <TransacoesTableView
            transacoes={transacoesFiltradas}
            onLiquidar={actions.openLiquidarDialog}
            onEdit={actions.openEditDialog}
            onDelete={handleDelete}
          />
        </TabsContent>

        {/* Tab: Calendário */}
        <TabsContent value="agenda" className="space-y-6">
          <FinancialCalendar
            transacoes={transacoesFiltradas}
            onTransacaoClick={actions.openEditDialog}
            onDateClick={actions.openNewDialogWithDate}
          />
        </TabsContent>

        {/* Tab: Bancos */}
        <TabsContent value="bancos" className="space-y-6">
          <TabelaGestaoBancos />
        </TabsContent>
      </Tabs>

      {/* Dialog de Liquidação */}
      {state.isLiquidarOpen && (
        <TransacaoLiquidarDialog
          isOpen={state.isLiquidarOpen}
          onOpenChange={actions.setLiquidarOpen}
          contaId={state.liquidarContaId}
          setContaId={actions.setLiquidarContaId}
          data={state.liquidarData}
          setData={actions.setLiquidarData}
          contas={contas as Array<{ id: string; nome: string; banco_detalhes?: { nome_curto?: string } | null; banco?: string }>}
          onConfirm={handleConfirmLiquidar}
        />
      )}
    </div>
  );
};

export default Financeiro;
