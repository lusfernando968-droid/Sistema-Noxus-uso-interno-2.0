import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Calendar, Download } from "lucide-react";
import { useFinanceiroGeral } from "@/hooks/useFinanceiroGeral";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RelatoriosCarteira() {
  const { items, stats, loading } = useFinanceiroGeral();

  const gerarRelatorioMensal = () => {
    const inicioMes = startOfMonth(new Date());
    const fimMes = endOfMonth(new Date());
    
    const despesasMes = items.filter(item => {
      const dataItem = new Date(item.data);
      return item.tipo === 'saida' && dataItem >= inicioMes && dataItem <= fimMes;
    });

    const totalMes = despesasMes.reduce((sum, item) => sum + Number(item.valor), 0);
    
    const relatorio = {
      periodo: `${format(inicioMes, 'MMMM yyyy', { locale: ptBR })}`,
      totalDespesas: totalMes,
      quantidadeTransacoes: despesasMes.length,
      mediaPorTransacao: despesasMes.length > 0 ? totalMes / despesasMes.length : 0,
      categorias: {} as Record<string, number>
    };

    // Agrupar por categoria
    despesasMes.forEach(item => {
      const categoria = item.categoria || 'Outros';
      relatorio.categorias[categoria] = (relatorio.categorias[categoria] || 0) + Number(item.valor);
    });

    // Gerar texto do relatório
    const textoRelatorio = `
RELATÓRIO CARTEIRA - ${relatorio.periodo.toUpperCase()}

📊 RESUMO GERAL
Total de Despesas: R$ ${relatorio.totalDespesas.toFixed(2)}
Quantidade de Transações: ${relatorio.quantidadeTransacoes}
Média por Transação: R$ ${relatorio.mediaPorTransacao.toFixed(2)}

📈 DESPESAS POR CATEGORIA
${Object.entries(relatorio.categorias)
  .map(([categoria, valor]) => `${categoria}: R$ ${valor.toFixed(2)}`)
  .join('\n')}

📅 PERÍODO
${format(inicioMes, 'dd/MM/yyyy', { locale: ptBR })} até ${format(fimMes, 'dd/MM/yyyy', { locale: ptBR })}
    `;

    // Criar e download do arquivo
    const blob = new Blob([textoRelatorio], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-carteira-${format(inicioMes, 'MM-yyyy')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getUltimos7Dias = () => {
    const hoje = new Date();
    const seteDiasAtras = subDays(hoje, 7);
    
    return items.filter(item => {
      const dataItem = new Date(item.data);
      return item.tipo === 'saida' && dataItem >= seteDiasAtras && dataItem <= hoje;
    });
  };

  const despesas7Dias = getUltimos7Dias();
  const total7Dias = despesas7Dias.reduce((sum, item) => sum + Number(item.valor), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {Number((stats?.totalSaidas ?? 0)).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Todas as despesas registradas</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Últimos 7 Dias</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {total7Dias.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{despesas7Dias.length} transações</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-media">Categorias</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats?.porCategoriaSaidas ?? {}).length}</div>
            <p className="text-xs text-muted-foreground">Categorias diferentes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Relatórios da Carteira</CardTitle>
              <p className="text-sm text-muted-foreground">Gerencie e exporte relatórios de despesas</p>
            </div>
            <Button onClick={gerarRelatorioMensal} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar Relatório Mensal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30">
                <h3 className="font-medium mb-2">Relatório Mensal</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Exporte um relatório completo com todas as despesas do mês atual
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Total de despesas por categoria</li>
                  <li>• Número de transações</li>
                  <li>• Média por transação</li>
                  <li>• Período completo do mês</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-muted/30">
                <h3 className="font-medium mb-2">Análise por Categoria</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Visualize o detalhamento das despesas organizadas por categoria
                </p>
                <div className="space-y-2">
                  {Object.entries(stats?.porCategoriaSaidas ?? {}).map(([categoria, valor]) => (
                    <div key={categoria} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{categoria}:</span>
                      <span className="font-medium">R$ {Number(valor ?? 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-3">Dicas para Controle Financeiro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p>💡 <strong>Registre todas as despesas</strong> - Mantenha o controle completo de todos os gastos</p>
                  <p>📊 <strong>Categorize corretamente</strong> - Isso ajuda na análise e tomada de decisão</p>
                </div>
                <div className="space-y-2">
                  <p>📅 <strong>Exporte relatórios mensais</strong> - Acompanhe a evolução dos gastos</p>
                  <p>🎯 <strong>Estabeleça metas</strong> - Defina limites de gastos por categoria</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
