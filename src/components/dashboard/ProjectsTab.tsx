import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { FolderKanban, CheckCircle2, PlusCircle, User, Briefcase } from "lucide-react";

interface ProjectsTabProps {
  projetos: any[];
}

export function ProjectsTab({ projetos }: ProjectsTabProps) {
  // Captura cor do módulo Projetos (CSS variable --projects), com fallback para --primary
  const { primaryColor } = useMemo(() => {
    if (typeof window === "undefined") {
      return { primaryColor: "hsl(220 90% 50%)" };
    }
    const root = document.documentElement;
    const moduleVar = getComputedStyle(root).getPropertyValue("--projects").trim();
    const hsl = moduleVar || getComputedStyle(root).getPropertyValue("--primary").trim();
    const base = hsl ? `hsl(${hsl})` : "hsl(220 90% 50%)";
    return { primaryColor: base };
  }, []);

  // Paleta temática derivada de --primary para categorias/status
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
    const total = projetos.length;
    const active = projetos.filter(p => p.status === 'planejamento' || p.status === 'em-andamento').length;

    // Projetos concluídos e novos este mês
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    const completedThisMonth = projetos.filter(p => {
      const date = new Date(p.updated_at);
      return p.status === 'concluido' && isWithinInterval(date, { start: startOfCurrentMonth, end: endOfCurrentMonth });
    }).length;

    const newThisMonth = projetos.filter(p => {
      const date = new Date(p.created_at);
      return isWithinInterval(date, { start: startOfCurrentMonth, end: endOfCurrentMonth });
    }).length;

    // Principal Cliente
    const clientCounts = projetos.reduce((acc, p) => {
      if (!p.clientes?.nome) return acc;
      acc[p.clientes.nome] = (acc[p.clientes.nome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topClientEntry = Object.entries(clientCounts).sort((a, b) => b[1] - a[1])[0];
    const topClientName = topClientEntry ? topClientEntry[0] : "N/A";
    const topClientCount = topClientEntry ? topClientEntry[1] : 0;

    return {
      total,
      active,
      completedThisMonth,
      newThisMonth,
      topClientName,
      topClientCount
    };
  }, [projetos]);

  // Status distribution
  const statusCounts = projetos.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = [
    { name: "Planejamento", value: statusCounts.planejamento || 0, color: "#3b82f6" },
    { name: "Em Andamento", value: statusCounts["em-andamento"] || 0, color: "#8b5cf6" },
    { name: "Concluído", value: statusCounts.concluido || 0, color: "#10b981" },
    { name: "Cancelado", value: statusCounts.cancelado || 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Projects over time
  const timelineData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const created = projetos.filter(p => {
        const date = new Date(p.created_at);
        return date >= monthStart && date <= monthEnd;
      }).length;

      const concluidos = projetos.filter(p => {
        const date = new Date(p.updated_at);
        return p.status === "concluido" && date >= monthStart && date <= monthEnd;
      }).length;

      return {
        mes: format(month, "MMM", { locale: ptBR }),
        criados: created,
        concluidos,
      };
    });
  }, [projetos]);

  // Projects by client
  const clientProjects = projetos.reduce((acc, p) => {
    const clientName = p.clientes?.nome || "Sem cliente";
    acc[clientName] = (acc[clientName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topClients = Object.entries(clientProjects)
    .map(([nome, count]) => ({ nome, projetos: Number(count) }))
    .sort((a, b) => Number(b.projetos) - Number(a.projetos))
    .slice(0, 5);

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registrados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Em andamento
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos (Mês)</CardTitle>
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.newThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Iniciados este mês
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos (Mês)</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completedThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Finalizados este mês
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-md transition-shadow bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Principal Cliente</CardTitle>
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={metrics.topClientName}>{metrics.topClientName}</div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                {metrics.topClientCount} projetos
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={item}>
          <Card className="rounded-3xl border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Projetos por Status</CardTitle>
              <CardDescription>Distribuição atual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  {/* cores sólidas por status */}
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
              <CardTitle className="text-lg font-semibold">Top 5 Clientes</CardTitle>
              <CardDescription>Por volume de projetos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topClients} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                  <XAxis type="number" className="text-xs" hide />
                  <YAxis dataKey="nome" type="category" className="text-xs" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "1rem"
                    }}
                  />
                  <Bar dataKey="projetos" radius={[0, 4, 4, 0]} barSize={20}>
                    {(() => {
                      const clientsPalette = getThemedPalette(topClients.length);
                      return topClients.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={clientsPalette[index].solid} />
                      ));
                    })()}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="md:col-span-2">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Timeline de Projetos</CardTitle>
              <CardDescription>Evolução nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelineData}>
                  {(() => {
                    const linePalette = getThemedPalette(2);
                    return (
                      <>
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
                        <Line type="monotone" dataKey="criados" stroke={linePalette[0].solid} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Criados" />
                        <Line type="monotone" dataKey="concluidos" stroke={linePalette[1].solid} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Concluídos" />
                      </>
                    );
                  })()}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

