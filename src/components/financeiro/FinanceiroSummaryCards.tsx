import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { Transacao, Agendamento } from "@/services/transacoes.service";

interface FinanceiroSummaryCardsProps {
  transacoes: Transacao[];
  agendamentos?: Agendamento[];
}

interface Totais {
  totalReceitas: number;
  totalDespesas: number;
  receitasPendentes: number;
  despesasPendentes: number;
  saldo: number;
  pendentesCount: number;
}

function calcularTotais(transacoes: Transacao[], agendamentos: Agendamento[] = []): Totais {
  // Total Receitas: Sum of all RECEITA transactions + all future agendamentos
  // User request: "quero que apartir do momento que registre o agendamento, ja fique o total ali"

  // 1. Transactions Revenue (All created transactions)
  const transacoesReceita = transacoes
    .filter((t) => t.tipo === "RECEITA")
    .reduce((acc, t) => acc + Number(t.valor), 0);

  // 2. Future Appointments Revenue (Not yet concluded/transacted)
  // IMPORTANTE: Exclui agendamentos cancelados do cálculo de pendentes
  // Normaliza o status para considerar variações (cancelado/cancelada)
  const agendamentosPendentes = agendamentos.filter(a => {
    const status = (a.status || '').toLowerCase();
    return status !== 'concluido' &&
      status !== 'concluida' &&
      status !== 'cancelado' &&
      status !== 'cancelada';
  });

  // User request: "quero que as informações venha da agenda e nao do financeiro"
  // Cálculo simplificado: Soma dos valores estimados de todos os agendamentos ativos não concluídos
  const agendamentosReceita = agendamentosPendentes
    .reduce((acc, a) => acc + (Number(a.valor_estimado) || 0), 0);

  const totalReceitas = transacoesReceita;

  const totalDespesas = transacoes
    .filter((t) => t.tipo === "DESPESA")
    .reduce((acc, t) => acc + Number(t.valor), 0);

  // Receitas Pendentes:
  // Agora considera EXCLUSIVAMENTE os agendamentos, sem somar transações pendentes
  const receitasPendentes = agendamentosReceita;

  const despesasPendentes = transacoes
    .filter((t) => t.tipo === "DESPESA" && !t.data_liquidacao)
    .reduce((acc, t) => acc + Number(t.valor), 0);

  // Saldo Real (Liquidated Revenue - Liquidated Expense) or Projected?
  // Usually "Saldo" means Cash on Hand.
  const saldoReal = transacoes
    .filter(t => t.data_liquidacao)
    .reduce((acc, t) => {
      if (t.tipo === 'RECEITA') return acc + Number(t.valor);
      if (t.tipo === 'DESPESA') return acc - Number(t.valor);
      return acc;
    }, 0);

  return {
    totalReceitas,
    totalDespesas,
    receitasPendentes,
    despesasPendentes,
    saldo: saldoReal,
    pendentesCount: transacoes.filter(t => !t.data_liquidacao).length,
  };
}

export function FinanceiroSummaryCards({ transacoes, agendamentos }: FinanceiroSummaryCardsProps) {
  const totais = calcularTotais(transacoes, agendamentos);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="relative overflow-hidden p-5 rounded-3xl border-0 shadow-lg bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent backdrop-blur-xl transition-all hover:scale-[1.02]">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp className="w-20 h-20 text-emerald-500" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-emerald-600/90 uppercase tracking-wider">Receitas</p>
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              R$ {totais.totalReceitas.toFixed(2)}
            </p>
            <p className="text-xs font-medium text-muted-foreground/80 mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Pendente: R$ {totais.receitasPendentes.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="relative overflow-hidden p-5 rounded-3xl border-0 shadow-lg bg-gradient-to-br from-rose-500/20 via-rose-500/5 to-transparent backdrop-blur-xl transition-all hover:scale-[1.02]">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingDown className="w-20 h-20 text-rose-500" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 ring-1 ring-rose-500/30">
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-xs font-bold text-rose-600/90 uppercase tracking-wider">Despesas</p>
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              R$ {totais.totalDespesas.toFixed(2)}
            </p>
            <p className="text-xs font-medium text-muted-foreground/80 mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Pendente: R$ {totais.despesasPendentes.toFixed(2)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="relative overflow-hidden p-5 rounded-3xl border-0 shadow-lg bg-gradient-to-br from-indigo-500/20 via-indigo-500/5 to-transparent backdrop-blur-xl transition-all hover:scale-[1.02]">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <DollarSign className="w-20 h-20 text-indigo-500" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-500/30">
              <DollarSign className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-xs font-bold text-indigo-600/90 uppercase tracking-wider">Saldo</p>
          </div>
          <div>
            <p className={`text-3xl font-bold tracking-tight ${totais.saldo >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400"}`}>
              R$ {totais.saldo.toFixed(2)}
            </p>
            <p className="text-xs font-medium text-muted-foreground/80 mt-1.5">
              Saldo em conta
            </p>
          </div>
        </div>
      </Card>

      <Card className="relative overflow-hidden p-5 rounded-3xl border-0 shadow-lg bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent backdrop-blur-xl transition-all hover:scale-[1.02]">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Calendar className="w-20 h-20 text-amber-500" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 ring-1 ring-amber-500/30">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-xs font-bold text-amber-600/90 uppercase tracking-wider">A Vencer</p>
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {totais.pendentesCount}
            </p>
            <p className="text-xs font-medium text-muted-foreground/80 mt-1.5">
              Transações pendentes
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default FinanceiroSummaryCards;
