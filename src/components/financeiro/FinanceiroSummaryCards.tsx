import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { Transacao } from "@/services/transacoes.service";

interface FinanceiroSummaryCardsProps {
  transacoes: Transacao[];
}

interface Totais {
  totalReceitas: number;
  totalDespesas: number;
  receitasPendentes: number;
  despesasPendentes: number;
  saldo: number;
  pendentesCount: number;
}

function calcularTotais(transacoes: Transacao[]): Totais {
  const totalReceitas = transacoes
    .filter((t) => t.tipo === "RECEITA" && t.data_liquidacao)
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const totalDespesas = transacoes
    .filter((t) => t.tipo === "DESPESA" && t.data_liquidacao)
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const receitasPendentes = transacoes
    .filter((t) => t.tipo === "RECEITA" && !t.data_liquidacao)
    .reduce((acc, t) => acc + Number(t.valor), 0);

  const despesasPendentes = transacoes
    .filter((t) => t.tipo === "DESPESA" && !t.data_liquidacao)
    .reduce((acc, t) => acc + Number(t.valor), 0);

  return {
    totalReceitas,
    totalDespesas,
    receitasPendentes,
    despesasPendentes,
    saldo: totalReceitas - totalDespesas,
    pendentesCount: transacoes.filter(t => !t.data_liquidacao).length,
  };
}

export function FinanceiroSummaryCards({ transacoes }: FinanceiroSummaryCardsProps) {
  const totais = calcularTotais(transacoes);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6 rounded-xl bg-gradient-to-br from-success/10 to-success/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-success/20">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <p className="text-sm text-muted-foreground">Receitas</p>
        </div>
        <p className="text-2xl font-semibold">
          R$ {totais.totalReceitas.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Pendente: R$ {totais.receitasPendentes.toFixed(2)}
        </p>
      </Card>

      <Card className="p-6 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-destructive/20">
            <TrendingDown className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">Despesas</p>
        </div>
        <p className="text-2xl font-semibold">
          R$ {totais.totalDespesas.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Pendente: R$ {totais.despesasPendentes.toFixed(2)}
        </p>
      </Card>

      <Card className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/20">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Saldo</p>
        </div>
        <p className={`text-2xl font-semibold ${totais.saldo >= 0 ? "text-success" : "text-destructive"}`}>
          R$ {totais.saldo.toFixed(2)}
        </p>
      </Card>

      <Card className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-accent/20">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">A Vencer</p>
        </div>
        <p className="text-2xl font-semibold">
          {totais.pendentesCount}
        </p>
      </Card>
    </div>
  );
}

export default FinanceiroSummaryCards;

