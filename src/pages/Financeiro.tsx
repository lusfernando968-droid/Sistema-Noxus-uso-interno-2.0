import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FinancialCalendar } from "@/components/calendar/FinancialCalendar";
import { FinanceiroSkeleton } from "@/components/ui/skeletons";
import { useAuth } from "@/contexts/AuthContext";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { useCarteira } from "@/hooks/useCarteira";
import { useFinanceiroReducer } from "@/hooks/useFinanceiroReducer";
import { calcularSaldoConta, saldoPosTransacao } from "@/utils/saldoPorConta";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  // Filtro de Mês
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

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

      // Filtrar agendamentos cancelados para não aparecerem na lista de "A Vencer" ou para vincular
      const agendamentosAtivos = agendamentosData.filter(a => {
        const s = (a.status || '').toLowerCase();
        return s !== 'cancelado' && s !== 'cancelada';
      });
      setAgendamentos(agendamentosAtivos);



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

  // Filtragem de transações by Month (memoizado para performance)
  const transacoesFiltradas = useMemo(() => {
    const { filtroTipo, filtroCategoria, filtroStatus, filtroContaId } = state;
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    return transacoes.filter((t) => {
      // Filtro de Mês (Prioritário)
      if (!t.data_vencimento) return false;

      // Fix: Usar split para evitar problemas de timezone com new Date("YYYY-MM-DD")
      // que interpreta como UTC e pode recuar um dia (ex: dia 01 vira dia 30/31 do mês anterior)
      const [anoStr, mesStr] = t.data_vencimento.split('-');
      const ano = parseInt(anoStr);
      const mes = parseInt(mesStr) - 1; // Mês 0-indexado para comparar com getMonth()

      if (
        ano !== currentDate.getFullYear() ||
        mes !== currentDate.getMonth()
      ) {
        return false;
      }

      // Filtro de Status do Agendamento (conforme solicitado pelo usuário)
      // Se a transação estiver vinculada a um agendamento, só mostrar se estiver 'concluido'
      if (t.agendamentos && t.agendamentos.status !== 'concluido') {
        // PERMITIR SINAL: Se for adiantamento/sinal, mostrar independente do status do agendamento
        const isSinal = t.descricao.toLowerCase().startsWith('sinal');
        if (!isSinal) {
          return false;
        }
      }

      if (filtroTipo !== "TODOS" && t.tipo !== filtroTipo) return false;
      if (filtroCategoria !== "TODOS" && t.categoria !== filtroCategoria) return false;
      if (filtroStatus === "LIQUIDADAS" && !t.data_liquidacao) return false;
      if (filtroStatus === "PENDENTES" && t.data_liquidacao) return false;
      if (filtroContaId !== "TODAS" && (t.conta_id ?? "") !== filtroContaId) return false;
      return true;
    });
  }, [transacoes, state.filtroTipo, state.filtroCategoria, state.filtroStatus, state.filtroContaId, currentDate]);



  // Loading state
  if (loading || loadingContas || loadingCarteira) {
    return <FinanceiroSkeleton />;
  }




  return (
    <div className="space-y-8 pb-20">
      {/* Header com Navegação de Mês Integrada */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Financeiro Tattoo</h1>

          </div>
          <p className="text-muted-foreground mt-1 text-lg">
            Gestão completa de receitas e despesas
          </p>
        </div>

        {/* Month Navigator Integrado */}
        <div className="flex items-center bg-background border shadow-sm rounded-full p-1 pl-4">
          <div className="text-sm font-semibold capitalize mr-2">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="h-8 w-8 rounded-full hover:bg-muted">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-full hover:bg-muted">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <FinanceiroSummaryCards
        transacoes={transacoesFiltradas}
        agendamentos={agendamentos.filter(a => {
          // Excluir agendamentos cancelados do cálculo de pendentes
          const s = (a.status || '').toLowerCase();
          if (s === 'cancelado' || s === 'cancelada') return false;

          if (!a.data) return false;
          const [anoStr, mesStr] = a.data.split('-');
          const ano = parseInt(anoStr);
          const mes = parseInt(mesStr) - 1;
          return (
            ano === currentDate.getFullYear() &&
            mes === currentDate.getMonth()
          );
        })}
      />

      {/* Main Content Area */}
      <Tabs defaultValue="tabela" className="space-y-6">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          {/* Custom Tabs List */}
          <TabsList className="bg-background/50 backdrop-blur-sm p-1 rounded-full border shadow-sm inline-flex h-auto">
            <TabsTrigger value="tabela" className="rounded-full px-6 py-2.5 data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">
              Tabela
            </TabsTrigger>
            <TabsTrigger value="agenda" className="rounded-full px-6 py-2.5 data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">
              Calendário
            </TabsTrigger>
            <TabsTrigger value="lista" className="rounded-full px-6 py-2.5 data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">
              Lista
            </TabsTrigger>
          </TabsList>

          {/* Unified Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
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

            <div className="h-8 w-px bg-border hidden sm:block mx-1" />

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
        </div>

        {/* Tab Content Areas */}
        <div className="min-h-[500px]">
          <TabsContent value="lista" className="mt-0">
            <TransacoesListView
              transacoes={transacoesFiltradas}
              onLiquidar={actions.openLiquidarDialog}
              onEdit={actions.openEditDialog}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="tabela" className="mt-0">
            <TransacoesTableView
              transacoes={transacoesFiltradas}
              onLiquidar={actions.openLiquidarDialog}
              onEdit={actions.openEditDialog}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="agenda" className="mt-0 space-y-6">
            <Card className="p-6 rounded-3xl border-0 shadow-xl overflow-hidden bg-background/50 backdrop-blur-sm">
              <FinancialCalendar
                transacoes={transacoesFiltradas}
                onTransacaoClick={actions.openEditDialog}
                onDateClick={actions.openNewDialogWithDate}
              />
            </Card>
          </TabsContent>
        </div>
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
