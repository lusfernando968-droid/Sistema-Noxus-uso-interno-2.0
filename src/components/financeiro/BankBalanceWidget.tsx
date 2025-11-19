import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ContaBancariaRecord } from "@/hooks/useContasBancarias";
import { calcularSaldoConta } from "@/utils/saldoPorConta";
import { Banknote, TrendingUp, TrendingDown, Building2, Wallet, Coins } from "lucide-react";

type Props = {
  contas: ContaBancariaRecord[];
  transacoes: any[];
};

const norm = (v: any) => String(v || "").toLowerCase();

const BankBalanceWidget = ({ contas, transacoes }: Props) => {
  const now = new Date();
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));

  const inRange = (dateStr: string | null | undefined, start: Date, end: Date) => {
    const d = new Date(dateStr || "");
    return d >= start && d <= end;
  };

  const balances = useMemo(() => {
    return (contas || []).filter((c) => c.id).map((c) => {
      const saldo = calcularSaldoConta(String(c.id), contas, transacoes);
      const txConta = (transacoes || []).filter(
        (t) => String(t.conta_id || "") === String(c.id) && !!t.data_liquidacao
      );
      const entradasMes = txConta
        .filter(
          (t) => norm(t.tipo) === "receita" && inRange(t.data_liquidacao || t.data_vencimento || t.created_at || (t as any).data, mStart, mEnd)
        )
        .reduce((s, t) => s + Number(t.valor || 0), 0);
      const saidasMes = txConta
        .filter(
          (t) => norm(t.tipo) === "despesa" && inRange(t.data_liquidacao || t.data_vencimento || t.created_at || (t as any).data, mStart, mEnd)
        )
        .reduce((s, t) => s + Number(t.valor || 0), 0);
      const variacaoMes = entradasMes - saidasMes;

      const entradasPrev = txConta
        .filter(
          (t) => norm(t.tipo) === "receita" && inRange(t.data_liquidacao || t.data_vencimento || t.created_at || (t as any).data, prevStart, prevEnd)
        )
        .reduce((s, t) => s + Number(t.valor || 0), 0);
      const saidasPrev = txConta
        .filter(
          (t) => norm(t.tipo) === "despesa" && inRange(t.data_liquidacao || t.data_vencimento || t.created_at || (t as any).data, prevStart, prevEnd)
        )
        .reduce((s, t) => s + Number(t.valor || 0), 0);
      const prevNet = entradasPrev - saidasPrev;
      const variacaoPct = prevNet ? Number((((variacaoMes - prevNet) / prevNet) * 100).toFixed(1)) : variacaoMes ? 100 : 0;

      return {
        contaId: String(c.id),
        nome: c.nome,
        banco: c.banco || "",
        saldoAtual: saldo.saldoAtual,
        variacaoMes,
        variacaoPct,
        banco_detalhes: c.banco_detalhes,
      };
    });
  }, [contas, transacoes]);

  // Calcular totais gerais
  const totalGeral = balances.reduce((acc, b) => acc + b.saldoAtual, 0);
  const totalVariacao = balances.reduce((acc, b) => acc + b.variacaoMes, 0);

  return (
    <div className="space-y-6">
      {/* Card Principal - Visão Geral */}
      <Card className="rounded-2xl border-0 shadow-xl bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Caixa Atual</CardTitle>
                <p className="text-sm text-muted-foreground">Visão geral dos seus bancos</p>
              </div>
            </div>

          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Saldo Total */}
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Banknote className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Saldo Total</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Variação do Mês */}
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10">
              <div className="flex items-center justify-center gap-2 mb-2">
                {totalVariacao >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-primary" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
                <span className="text-sm font-medium text-primary">
                  Variação {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
                </span>
              </div>
              <p className={`text-2xl font-bold ${totalVariacao >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                {totalVariacao >= 0 ? '+' : '-'} R$ {Math.abs(totalVariacao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Total de Contas */}
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Contas Ativas</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {balances.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards Individuais por Banco */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {balances.map(b => {
          const isPos = b.variacaoMes >= 0;
          return (
            <Card key={b.contaId} className="rounded-lg border-0 shadow transition-all duration-300">
              <CardContent className="p-3">
                <div className="space-y-2.5">
                  {/* Header do Card */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center overflow-hidden"
                        style={{
                          background: b.banco_detalhes
                            ? `linear-gradient(135deg, ${b.banco_detalhes.cor_primaria}20, ${b.banco_detalhes.cor_secundaria}10)`
                            : 'linear-gradient(135deg, rgba(var(--primary), 0.2), rgba(var(--primary), 0.1))'
                        }}
                      >
                        {b.banco_detalhes?.logo_url ? (
                          <img
                            src={b.banco_detalhes.logo_url}
                            alt={b.banco_detalhes.nome_curto}
                            className="w-5 h-5 object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <Building2
                            className="w-3.5 h-3.5"
                            style={{
                              color: b.banco_detalhes?.cor_primaria || 'var(--primary)'
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs">{b.nome}</h3>
                        {!!b.banco_detalhes && (
                          <Badge
                            variant="secondary"
                            className="rounded-full text-[10px]"
                            style={{
                              backgroundColor: `${b.banco_detalhes.cor_primaria}20`,
                              color: b.banco_detalhes.cor_primaria,
                              borderColor: `${b.banco_detalhes.cor_primaria}30`
                            }}
                          >
                            {b.banco_detalhes.nome_curto}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Saldo Atual */}
                  <div className="text-center py-1.5">
                    <p className="text-[11px] text-muted-foreground mb-1">Saldo Atual</p>
                    <p className="text-lg font-bold text-foreground">
                      R$ {b.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Variação do Mês */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                    <span className="text-[11px] text-muted-foreground">Variação mês</span>
                    <Badge
                      variant={isPos ? "default" : "destructive"}
                      className="rounded-full text-[11px] flex items-center gap-1"
                    >
                      {isPos ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {isPos ? "+" : "-"} R$ {Math.abs(b.variacaoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Badge>
                  </div>

                  {/* Percentual */}
                  <div className="text-right">
                    <span className={`text-[11px] font-medium ${b.variacaoPct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                      {b.variacaoPct >= 0 ? '+' : ''}{b.variacaoPct}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {balances.length === 0 && (
        <Card className="rounded-xl border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <Building2 className="w-12 h-12 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">Nenhuma conta bancária encontrada</p>
              <p className="text-sm text-muted-foreground/70">Cadastre suas contas para visualizar os saldos</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BankBalanceWidget;
