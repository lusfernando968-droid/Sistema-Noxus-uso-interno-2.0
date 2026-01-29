import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from "recharts";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpRight, ArrowDownRight, Users, UserCheck, UserX, DollarSign, Activity } from "lucide-react";

interface ClientsTabProps {
  clientes: any[];
  projetos: any[];
}

export function ClientsTab({ clientes, projetos }: ClientsTabProps) {
  // Cores do módulo Clientes
  const COLORS = {
    primary: "hsl(220 90% 50%)",
    success: "hsl(142 76% 36%)",
    destructive: "hsl(0 84% 60%)",
    muted: "hsl(220 14% 96%)",
    pie: ["#10b981", "#ef4444"] // Emerald-500, Red-500
  };

  // 1. Cálculos de KPIs
  const kpis = useMemo(() => {
    const total = clientes.length;
    // Consideramos inativo APENAS quem tem status 'inativo'. Todo o resto (null, 'ativo', undefined) é ativo.
    const inativos = clientes.filter(c => c.status === 'inativo').length;
    const ativos = total - inativos;
    const churnRate = total > 0 ? (inativos / total) * 100 : 0;

    // LTV Estimado
    const receitaTotal = projetos.reduce((acc, p) => acc + (p.valor_total || 0), 0);
    const ltv = total > 0 ? receitaTotal / total : 0;

    // Novos (30 dias)
    const novos30d = clientes.filter(c => new Date(c.created_at) >= subMonths(new Date(), 1)).length;

    return { total, ativos, inativos, churnRate, ltv, novos30d };
  }, [clientes, projetos]);

  // 2. Dados para o Gráfico de Crescimento (Linha)
  const growthData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return last6Months.map(month => {
      const monthEnd = endOfMonth(month);
      const totalAteMes = clientes.filter(c => new Date(c.created_at) <= monthEnd).length;
      const novosNoMes = clientes.filter(c => {
        const date = new Date(c.created_at);
        return date >= startOfMonth(month) && date <= monthEnd;
      }).length;

      // Churn no mês (clientes que ficaram inativos neste mês ou antes)
      // Nota: Como não temos histórico de data de inativação, vamos considerar o status ATUAL.
      // Para um gráfico real de churn histórico, precisaríamos de uma tabela de logs de status.
      // Como aproximação, vamos mostrar o acumulado de inativos se a data de atualização for até o fim do mês,
      // ou apenas mostrar 0 se não tivermos essa info precisa.
      // Melhor abordagem com os dados atuais: Mostrar inativos acumulados que foram criados até a data e estão inativos hoje.
      // Isso é uma aproximação (mostra "Inativos Acumulados").
      const inativosAteMes = clientes.filter(c =>
        c.status === 'inativo' && new Date(c.created_at) <= monthEnd
      ).length;

      return {
        mes: format(month, "MMM", { locale: ptBR }),
        total: totalAteMes,
        novos: novosNoMes,
        churn: inativosAteMes
      };
    });
  }, [clientes]);

  // 3. Dados para o Gráfico de Status (Pizza)
  const statusData = useMemo(() => [
    { name: 'Ativos', value: kpis.ativos },
    { name: 'Inativos', value: kpis.inativos },
  ], [kpis]);

  // 4. Dados para Top 5 Clientes (Barra Horizontal)
  const topClientsData = useMemo(() => {
    // Agrupar valor de projetos por cliente
    const clientRevenue: Record<string, number> = {};
    projetos.forEach(p => {
      if (p.cliente_id && p.valor_total) {
        clientRevenue[p.cliente_id] = (clientRevenue[p.cliente_id] || 0) + p.valor_total;
      }
    });

    // Mapear para array e ordenar
    return Object.entries(clientRevenue)
      .map(([id, valor]) => {
        const cliente = clientes.find(c => c.id === id);
        return {
          name: cliente ? cliente.nome.split(' ')[0] : 'Desconhecido', // Primeiro nome para caber no gráfico
          fullName: cliente ? cliente.nome : 'Desconhecido',
          valor
        };
      })
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [projetos, clientes]);


  return (
    <div className="space-y-6">

      {/* 1. KPIs Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl shadow-sm border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-emerald-500 font-medium flex items-center mr-1">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                +{kpis.novos30d}
              </span>
              nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Ativação</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.total > 0 ? ((kpis.ativos / kpis.total) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.ativos} clientes ativos
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio (LTV)</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {kpis.ltv.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita por cliente
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {kpis.churnRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <UserX className="h-3 w-3 mr-1" />
              {kpis.inativos} clientes inativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-7">

        {/* Crescimento (Major chart) */}
        <Card className="col-span-4 rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Crescimento da Base</CardTitle>
            <CardDescription>Evolução de novos clientes, total acumulado e churn (inativos)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
                <YAxis axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem"
                  }}
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="total" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Total Acumulado" />
                <Line type="monotone" dataKey="novos" stroke={COLORS.success} strokeWidth={3} dot={{ r: 4 }} name="Novos no Mês" />
                <Line type="monotone" dataKey="churn" stroke={COLORS.destructive} strokeWidth={3} dot={{ r: 4 }} name="Inativos Acumulados" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Status & Top Clientes */}
        <div className="col-span-3 space-y-4">

          {/* Status Distribution */}
          <Card className="rounded-3xl border-0 shadow-sm h-[320px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Status da Carteira</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-0">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* 3. Top Clientes (Full Width or large) */}
      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top 5 Clientes por Receita</CardTitle>
          <CardDescription>Clientes que geraram maior volume de projetos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topClientsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border p-2 rounded-lg shadow-sm">
                          <p className="font-semibold">{data.fullName}</p>
                          <p className="text-sm">R$ {Number(payload[0].value).toLocaleString('pt-BR')}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="valor" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
