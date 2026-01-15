import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CheckCircle2, CalendarDays, TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

interface Agendamento {
  id: string;
  data: string;
  status: string;
  [key: string]: any;
}

interface SchedulesTabProps {
  agendamentos: Agendamento[];
}

export function SchedulesTab({ agendamentos }: SchedulesTabProps) {
  // Theme logic
  const { primaryColor } = useMemo(() => {
    if (typeof window === "undefined") {
      return { primaryColor: "hsl(220 90% 50%)" };
    }
    const root = document.documentElement;
    const moduleVar = getComputedStyle(root).getPropertyValue("--schedules").trim();
    const hsl = moduleVar || getComputedStyle(root).getPropertyValue("--primary").trim();
    const base = hsl ? `hsl(${hsl})` : "hsl(220 90% 50%)";
    return { primaryColor: base };
  }, []);

  const parsePrimary = useMemo(() => {
    const raw = primaryColor.replace(/hsl\(|\)/g, "");
    const parts = raw.split(/\s+/);
    const h = Number(parts[0]);
    const s = Number((parts[1] || "0").replace("%", ""));
    const l = Number((parts[2] || "0").replace("%", ""));
    return { h, s, l };
  }, [primaryColor]);

  const toHsl = (h: number, s: number, l: number, a?: number) => a != null ? `hsl(${h} ${s}% ${l}% / ${a})` : `hsl(${h} ${s}% ${l}%)`;

  const getThemedPalette = (count: number) => {
    const arr: { solid: string; fade: string }[] = [];
    const { h, s } = parsePrimary;
    const lightnessScale = [30, 40, 50, 60, 70];
    for (let i = 0; i < Math.max(count, 1); i++) {
      const lig = lightnessScale[i % lightnessScale.length];
      arr.push({ solid: toHsl(h, s, lig), fade: toHsl(h, s, lig, 0.8) });
    }
    return arr;
  };

  // --- KPI Calculations ---
  const metrics = useMemo(() => {
    // Basic Counts
    const total = agendamentos.length;
    const concluidos = agendamentos.filter(a => a.status === 'concluido').length;
    const cancelados = agendamentos.filter(a => a.status === 'cancelado').length;
    const agendados = agendamentos.filter(a => a.status === 'agendado').length;

    // 1. Taxa de Comparecimento
    const finalizedTotal = concluidos + cancelados;
    const attendanceRate = finalizedTotal > 0 ? (concluidos / finalizedTotal) * 100 : 0;

    // 2. Agenda da Próxima Semana
    const today = new Date();
    const nextWeekEnd = addDays(today, 7);
    const nextWeekCount = agendamentos.filter(a => {
      if (!a.data) return false;
      const date = new Date(a.data);
      return isWithinInterval(date, { start: today, end: nextWeekEnd });
    }).length;

    // 3. Dia Mais Movimentado
    const daysCount: Record<string, number> = agendamentos.reduce((acc: Record<string, number>, a) => {
      if (!a.data) return acc;
      const date = new Date(a.data);
      const dayName = format(date, 'EEEE', { locale: ptBR });
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {});

    const sortedDays = Object.entries(daysCount).sort((a, b) => (Number(b[1]) - Number(a[1])));
    const busiestDayEntry = sortedDays[0];

    // Format busiest day name capitalized
    let busiestDayName = 'N/A';
    let busiestDayValue = 0;

    if (busiestDayEntry) {
      busiestDayName = busiestDayEntry[0].charAt(0).toUpperCase() + busiestDayEntry[0].slice(1);
      busiestDayValue = Number(busiestDayEntry[1]);
    }

    // 4. Valor Agendado (Mês Atual)
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());

    const totalReceivable = agendamentos
      .filter(a => {
        if (!a.data || a.status === 'cancelado') return false;
        const date = new Date(a.data);
        return isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd });
      })
      .reduce((sum, a) => sum + (Number(a.valor_estimado) || 0), 0);

    // Formatter
    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return {
      total,
      concluidos,
      cancelados,
      agendados,
      attendanceRate,
      nextWeekCount,
      busiestDayName,
      busiestDayValue,
      totalReceivable: currencyFormatter.format(totalReceivable)
    };
  }, [agendamentos]);

  // Status chart data
  const statusData = useMemo(() => [
    { name: "Agendado", value: metrics.agendados, color: "#3b82f6" },
    { name: "Concluído", value: metrics.concluidos, color: "#10b981" },
    { name: "Cancelado", value: metrics.cancelados, color: "#ef4444" },
  ].filter(d => d.value > 0), [metrics]);

  // Timeline chart data
  const timelineData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const countAgendados = agendamentos.filter(a => {
        if (!a.data) return false;
        const date = new Date(a.data);
        return date >= monthStart && date <= monthEnd;
      }).length;

      const countConcluidos = agendamentos.filter(a => {
        if (!a.data) return false;
        const date = new Date(a.data);
        return a.status === "concluido" && date >= monthStart && date <= monthEnd;
      }).length;

      return {
        mes: format(month, "MMM", { locale: ptBR }),
        agendados: countAgendados,
        concluidos: countConcluidos,
      };
    });
  }, [agendamentos]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Período</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Agendamentos listados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Valor Agendado (Mês)</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{metrics.totalReceivable}</div>
              <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                Previsão de receita
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comparecimento</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.attendanceRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Taxa de realização
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Próximos 7 Dias</CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{metrics.nextWeekCount}</div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                Agendamentos futuros
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dia + Movimentado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={metrics.busiestDayName}>
                {metrics.busiestDayName}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.busiestDayValue} agendamentos
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Graphs */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={item}>
          <Card className="rounded-3xl border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Status dos Agendamentos</CardTitle>
              <CardDescription>Distribuição atual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(() => {
                      const statusPalette = getThemedPalette(statusData.length);
                      return statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={statusPalette[index].solid} />
                      ));
                    })()}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "1rem"
                    }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="rounded-3xl border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Evolução Mensal</CardTitle>
              <CardDescription>Comparativo Agendados vs Concluídos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="mes" className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "1rem"
                    }}
                  />
                  <Legend iconType="circle" />
                  {(() => {
                    const seriesPalette = getThemedPalette(2);
                    return (
                      <>
                        <Bar dataKey="agendados" fill={seriesPalette[0].solid} radius={[4, 4, 0, 0]} name="Total" />
                        <Bar dataKey="concluidos" fill={seriesPalette[1].solid} radius={[4, 4, 0, 0]} name="Concluídos" />
                      </>
                    );
                  })()}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
