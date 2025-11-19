import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinanceTabProps {
  transacoes: any[];
}

export function FinanceTab({ transacoes }: FinanceTabProps) {
  // Cores Semânticas e Vibrantes
  const COLORS = {
    receita: "#10b981", // Emerald 500
    despesa: "#f43f5e", // Rose 500
    lucro: "#3b82f6",   // Blue 500
    pagas: "#10b981",
    pendentes: "#f59e0b", // Amber 500
    palette: [
      "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#6366f1"
    ]
  };

  const norm = (v: any) => String(v || '').toLowerCase();

  // --- DADOS: Receitas vs Despesas (Últimos 6 meses) ---
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  });

  const revenueData = last6Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const receitas = transacoes
      .filter(t => norm(t.tipo) === "receita" && new Date(t.data_vencimento || t.created_at || t.data) >= monthStart && new Date(t.data_vencimento || t.created_at || t.data) <= monthEnd)
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const despesas = transacoes
      .filter(t => norm(t.tipo) === "despesa" && new Date(t.data_vencimento || t.created_at || t.data) >= monthStart && new Date(t.data_vencimento || t.created_at || t.data) <= monthEnd)
      .reduce((sum, t) => sum + Number(t.valor), 0);

    return {
      mes: format(month, "MMM", { locale: ptBR }).toUpperCase(),
      receita: receitas,
      despesas: despesas,
      lucro: receitas - despesas,
    };
  });

  // --- DADOS: Distribuição por Categoria (Geral) ---
  const categorias = transacoes.reduce((acc, t) => {
    const cat = t.categoria || 'Outros';
    acc[cat] = (acc[cat] || 0) + Number(t.valor);
    return acc;
  }, {} as Record<string, number>);

  const categoriaData = Object.entries(categorias)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Ordenar maior para menor

  // --- DADOS: Top 5 Despesas ---
  const despesasPorCategoria = transacoes
    .filter(t => norm(t.tipo) === "despesa")
    .reduce((acc, t) => {
      const cat = t.categoria || 'Outros';
      acc[cat] = (acc[cat] || 0) + Number(t.valor);
      return acc;
    }, {} as Record<string, number>);

  const topDespesasData = Object.entries(despesasPorCategoria)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // --- DADOS: Status de Pagamento ---
  const pagas = transacoes.filter(t => t.data_liquidacao).reduce((sum, t) => sum + Number(t.valor), 0);
  const pendentes = transacoes.filter(t => !t.data_liquidacao).reduce((sum, t) => sum + Number(t.valor), 0);

  const statusData = [
    { name: "Pagas", value: pagas, color: COLORS.pagas },
    { name: "Pendentes", value: pendentes, color: COLORS.pendentes },
  ];

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-xl">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span className="text-muted-foreground capitalize">
                {entry.name}:
              </span>
              <span className="font-semibold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfico de Área: Receitas vs Despesas */}
      <Card className="rounded-3xl border border-border/50 shadow-sm md:col-span-2 bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Fluxo de Caixa
          </CardTitle>
          <CardDescription>Evolução de receitas e despesas nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.receita} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.receita} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.despesa} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.despesa} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `R$${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Area
                  type="monotone"
                  dataKey="receita"
                  name="Receitas"
                  stroke={COLORS.receita}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  name="Despesas"
                  stroke={COLORS.despesa}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDespesa)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Rosca: Distribuição Geral */}
      <Card className="rounded-3xl border border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Distribuição Financeira</CardTitle>
          <CardDescription>Movimentação por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoriaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoriaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.palette[index % COLORS.palette.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  iconType="circle"
                  formatter={(value, entry: any) => (
                    <span className="text-xs text-muted-foreground ml-1">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Novo Gráfico: Top 5 Despesas */}
      <Card className="rounded-3xl border border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top 5 Despesas</CardTitle>
          <CardDescription>Onde você mais gasta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topDespesasData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                <Bar dataKey="value" name="Valor" radius={[0, 4, 4, 0]}>
                  {topDespesasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.despesa} fillOpacity={0.8 - (index * 0.1)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras: Status de Pagamento */}
      <Card className="rounded-3xl border border-border/50 shadow-sm md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Status de Pagamento</CardTitle>
          <CardDescription>Comparativo entre transações pagas e pendentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14, fontWeight: 500 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
