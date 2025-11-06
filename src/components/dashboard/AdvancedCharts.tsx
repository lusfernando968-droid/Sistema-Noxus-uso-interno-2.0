import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, PieChart, LineChart, Calendar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { eachMonthOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ChartData {
  name: string;
  value: number;
  change?: number;
}

interface AdvancedChartsProps {
  transacoes: any[];
  clientes: any[];
  projetos: any[];
  agendamentos: any[];
}

export function AdvancedCharts({ transacoes, clientes, projetos, agendamentos }: AdvancedChartsProps) {
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'clients' | 'projects'>('revenue');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  // Utilitário para normalizar strings (evita problemas entre "RECEITA"/"receita")
  const norm = (v: any) => String(v || '').toLowerCase();

  // Carregar filtros persistidos
  useEffect(() => {
    try {
      const chart = localStorage.getItem('noxus:charts:selectedChart');
      if (chart === 'revenue' || chart === 'clients' || chart === 'projects') {
        setSelectedChart(chart as 'revenue' | 'clients' | 'projects');
      }

      const year = localStorage.getItem('noxus:charts:selectedYear');
      if (year) {
        const y = parseInt(year);
        if (!Number.isNaN(y)) setSelectedYear(y);
      }

      const months = localStorage.getItem('noxus:charts:selectedMonths');
      if (months) {
        const arr = JSON.parse(months);
        if (Array.isArray(arr)) setSelectedMonths(arr);
      }
    } catch {}
  }, []);

  // Persistir filtros quando mudarem
  useEffect(() => {
    try { localStorage.setItem('noxus:charts:selectedChart', selectedChart); } catch {}
  }, [selectedChart]);
  useEffect(() => {
    try { localStorage.setItem('noxus:charts:selectedYear', String(selectedYear)); } catch {}
  }, [selectedYear]);
  useEffect(() => {
    try { localStorage.setItem('noxus:charts:selectedMonths', JSON.stringify(selectedMonths)); } catch {}
  }, [selectedMonths]);

  // Todos os meses do ano atual
  const monthsOfYear = useMemo(() => {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);
    return eachMonthOfInterval({ start, end });
  }, [selectedYear]);

  // Labels dos meses (ex.: jan, fev, ...)
  const monthLabels = useMemo(() => monthsOfYear.map((m) => format(m, 'MMM', { locale: ptBR })), [monthsOfYear]);

  // Resetar seleção para todos os meses quando o ano mudar ou labels mudarem
  useEffect(() => {
    if (monthLabels.length) {
      setSelectedMonths((prev) => prev.length ? prev : monthLabels.map((_, idx) => idx));
    }
  }, [selectedYear, monthLabels.length]);

  const availableYears = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current];
  }, []);

  // Receita por mês (somente tipo receita)
  const revenueData: ChartData[] = useMemo(() => {
    const arr = monthsOfYear.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const valorMes = transacoes
        .filter(t => norm(t.tipo) === 'receita')
        .filter(t => {
          const d = new Date(t.data_vencimento || t.created_at || t.data);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((sum, t) => sum + Number(t.valor || 0), 0);

      return { name: format(month, 'MMM', { locale: ptBR }), value: valorMes };
    });

    // calcular variação percentual mês a mês
    return arr.map((item, idx) => {
      const prev = arr[idx - 1]?.value ?? 0;
      const isFuture = endOfMonth(monthsOfYear[idx]) > new Date();
      let change: number | undefined;
      if (isFuture) {
        // Não mostrar variação para meses futuros/incompletos
        change = undefined;
      } else if (prev > 0) {
        change = Number((((item.value - prev) / prev) * 100).toFixed(1));
      } else {
        // Se o mês anterior foi 0, mostrar +100% quando houver receita agora
        if (item.value > 0) change = 100;
        // Se ambos forem 0, não mostrar variação
        else change = undefined;
      }
      return { ...item, change };
    });
  }, [monthsOfYear, transacoes]);

  // Novos clientes por mês
  const clientGrowthData: ChartData[] = useMemo(() => {
    const arr = monthsOfYear.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const qtd = clientes.filter(c => {
        const d = new Date(c.created_at || c.data || new Date());
        return d >= monthStart && d <= monthEnd;
      }).length;
      return { name: format(month, 'MMM', { locale: ptBR }), value: qtd };
    });
    return arr.map((item, idx) => {
      const prev = arr[idx - 1]?.value ?? 0;
      const isFuture = endOfMonth(monthsOfYear[idx]) > new Date();
      let change: number | undefined;
      if (isFuture) {
        change = undefined;
      } else if (prev > 0) {
        change = Number((((item.value - prev) / prev) * 100).toFixed(1));
      } else {
        // Se o mês anterior foi 0, e agora temos novos clientes, mostrar +100%
        if (item.value > 0) change = 100;
        else change = undefined;
      }
      return { ...item, change };
    });
  }, [monthsOfYear, clientes]);

  // Performance de projetos atual por status
  const projectPerformanceData: ChartData[] = useMemo(() => {
    const statusCount = (status: string) => projetos.filter(p => norm(p.status) === status).length;
    return [
      { name: 'Concluídos', value: statusCount('concluido') },
      { name: 'Em Andamento', value: statusCount('em_andamento') || statusCount('andamento') },
      { name: 'Planejamento', value: statusCount('planejamento') },
      { name: 'Cancelados', value: statusCount('cancelado') },
    ];
  }, [projetos]);

  const getCurrentData = () => {
    switch (selectedChart) {
      case 'revenue':
        return revenueData;
      case 'clients':
        return clientGrowthData;
      case 'projects':
        return projectPerformanceData;
      default:
        return revenueData;
    }
  };

  const getChartTitle = () => {
    switch (selectedChart) {
      case 'revenue':
        return 'Receitas por Período';
      case 'clients':
        return 'Crescimento de Clientes';
      case 'projects':
        return 'Performance de Projetos';
      default:
        return 'Analytics';
    }
  };

  // Dados filtrados pelos meses selecionados (apenas para charts mensais)
  const filteredData: ChartData[] = useMemo(() => {
    const data = getCurrentData();
    if (selectedChart === 'projects') return data;
    return data.filter((_, idx) => selectedMonths.includes(idx));
  }, [selectedChart, selectedMonths, revenueData, clientGrowthData, projectPerformanceData]);

  const getMaxValue = () => {
    const data = filteredData;
    if (!data.length) return 0;
    return Math.max(0, ...data.map(d => d.value));
  };

  // Métricas rápidas calculadas
  const monthlyGrowthPercent = useMemo(() => {
    const last = revenueData[revenueData.length - 1]?.value ?? 0;
    const prev = revenueData[revenueData.length - 2]?.value ?? 0;
    if (!prev) return '+0%';
    const pct = ((last - prev) / prev) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  }, [revenueData]);

  const ticketMedio = useMemo(() => {
    const receitas = transacoes.filter(t => norm(t.tipo) === 'receita');
    const total = receitas.reduce((s, t) => s + Number(t.valor || 0), 0);
    const avg = receitas.length ? total / receitas.length : 0;
    return `R$ ${Math.round(avg).toLocaleString('pt-BR')}`;
  }, [transacoes]);

  const taxaConversao = useMemo(() => {
    const total = agendamentos.length;
    const concluidos = agendamentos.filter(a => norm(a.status) === 'concluido').length;
    const pct = total ? Math.round((concluidos / total) * 100) : 0;
    return `${pct}%`;
  }, [agendamentos]);

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
      {/* Gráfico Principal */}
      <Card className="lg:col-span-2 rounded-3xl border-0 bg-gradient-to-br from-background to-muted/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">{getChartTitle()}</CardTitle>
            <div className="flex gap-2">
              {/* Seletor de ano */}
              {selectedChart !== 'projects' && (
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="h-9 w-28">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <button
                onClick={() => setSelectedChart('revenue')}
                className={`p-2 rounded-xl transition-all ${
                  selectedChart === 'revenue' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <LineChart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedChart('clients')}
                className={`p-2 rounded-xl transition-all ${
                  selectedChart === 'clients' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedChart('projects')}
                className={`p-2 rounded-xl transition-all ${
                  selectedChart === 'projects' 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <PieChart className="w-4 h-4" />
              </button>
              {/* Filtro de meses */}
              {selectedChart !== 'projects' && (
                <DropdownMenu open={monthMenuOpen} onOpenChange={setMonthMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`p-2 rounded-xl transition-all bg-muted/50 hover:bg-muted`}
                      aria-label="Filtrar meses"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="bottom"
                    sideOffset={8}
                    avoidCollisions
                    collisionPadding={12}
                    className="max-h-[60vh] overflow-auto"
                  >
                    <DropdownMenuLabel>Meses</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {monthLabels.map((label, idx) => (
                      <DropdownMenuCheckboxItem
                        key={idx}
                        checked={selectedMonths.includes(idx)}
                        onCheckedChange={(checked) => {
                          setSelectedMonths((prev) => {
                            if (checked) return Array.from(new Set([...prev, idx])).sort((a,b)=>a-b);
                            return prev.filter((i) => i !== idx);
                          });
                          // manter menu aberto após alterar seleção
                          setMonthMenuOpen(true);
                        }}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedMonths(monthLabels.map((_, i) => i));
                        setMonthMenuOpen(true);
                      }}
                    >
                      Selecionar todos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedMonths([]);
                        setMonthMenuOpen(true);
                      }}
                    >
                      Limpar seleção
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setMonthMenuOpen(false)}>
                      Confirmar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredData.map((item) => {
              const maxValue = getMaxValue();
              // Evita barras cheias quando todos os valores são 0 (divisão por zero)
              const rawPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              const percentage = Math.max(0, Math.min(100, Number.isFinite(rawPercentage) ? rawPercentage : 0));
              const isPositive = (item.change || 0) >= 0;
              
              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {selectedChart === 'revenue' ? `R$ ${item.value.toLocaleString()}` : item.value}
                      </span>
                      {item.change && (
                        <div className={`flex items-center gap-1 text-xs ${
                          isPositive ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(item.change)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Rápidas (padronizadas ao tema) */}
      <div className="space-y-4">
        <Card className="rounded-3xl border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Crescimento Mensal</p>
                <p className="text-2xl font-bold text-primary">{monthlyGrowthPercent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold text-primary">{ticketMedio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <PieChart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-2xl font-bold text-primary">{taxaConversao}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}