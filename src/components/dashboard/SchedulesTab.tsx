import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SchedulesTabProps {
  agendamentos: any[];
}

export function SchedulesTab({ agendamentos }: SchedulesTabProps) {
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
  // Paleta temática derivada de --primary para diferenciação de categorias
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
  const statusCounts = agendamentos.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = [
    { name: "Agendado", value: statusCounts.agendado || 0, color: "#3b82f6" },
    { name: "Concluído", value: statusCounts.concluido || 0, color: "#10b981" },
    { name: "Cancelado", value: statusCounts.cancelado || 0, color: "#ef4444" },
  ];

  // Schedules over time
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  });

  const timelineData = last6Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const agendados = agendamentos.filter(a => {
      const date = new Date(a.data);
      return date >= monthStart && date <= monthEnd;
    }).length;

    const concluidos = agendamentos.filter(a => {
      const date = new Date(a.data);
      return a.status === "concluido" && date >= monthStart && date <= monthEnd;
    }).length;

    return {
      mes: format(month, "MMM", { locale: ptBR }),
      agendados,
      concluidos,
    };
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Status dos Agendamentos</CardTitle>
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
          <CardTitle className="text-lg font-semibold">Agendamentos ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timelineData}>
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
              {(() => {
                const seriesPalette = getThemedPalette(2);
                return (
                  <>
                    <Bar dataKey="agendados" fill={seriesPalette[0].solid} radius={[8, 8, 0, 0]} name="Agendados" />
                    <Bar dataKey="concluidos" fill={seriesPalette[1].solid} radius={[8, 8, 0, 0]} name="Concluídos" />
                  </>
                );
              })()}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
