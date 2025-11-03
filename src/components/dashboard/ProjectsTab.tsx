import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectsTabProps {
  projetos: any[];
}

export function ProjectsTab({ projetos }: ProjectsTabProps) {
  // Captura cor primária do tema (CSS variable --primary)
  const { primaryColor, primaryFade } = useMemo(() => {
    if (typeof window === "undefined") {
      return { primaryColor: "hsl(220 90% 50%)", primaryFade: "hsl(220 90% 50% / 0.5)" };
    }
    const root = document.documentElement;
    const hsl = getComputedStyle(root).getPropertyValue("--primary").trim();
    const base = hsl ? `hsl(${hsl})` : "hsl(220 90% 50%)";
    const fade = hsl ? `hsl(${hsl} / 0.5)` : "hsl(220 90% 50% / 0.5)";
    return { primaryColor: base, primaryFade: fade };
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
  const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
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
  ];

  // Projects over time
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  });

  const timelineData = last6Months.map(month => {
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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Projetos por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
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
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top 5 Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topClients} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="nome" type="category" className="text-xs" width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "1rem"
                }} 
              />
              <Bar dataKey="projetos" radius={[0, 8, 8, 0]}>
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

      <Card className="rounded-3xl border-0 shadow-sm md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Timeline de Projetos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData}>
              {(() => {
                const linePalette = getThemedPalette(2);
                return (
                  <>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "1rem"
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="criados" stroke={linePalette[0].solid} strokeWidth={2} name="Criados" />
                    <Line type="monotone" dataKey="concluidos" stroke={linePalette[1].solid} strokeWidth={2} name="Concluídos" />
                  </>
                );
              })()}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
