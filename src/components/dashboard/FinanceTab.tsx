import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinanceTabProps {
  transacoes: any[];
}

export function FinanceTab({ transacoes }: FinanceTabProps) {
  // Gradiente temático a partir de --primary
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

  // --- Paleta temática derivada de --primary para diferenciação de categorias/status ---
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

  // Paleta fixa de luminosidade mantendo o mesmo matiz e saturação
  const getThemedPalette = (count: number) => {
    const arr: { solid: string; fade: string }[] = [];
    const { h, s } = parsePrimary;
    const lightnessScale = [30, 40, 50, 60, 70];
    for (let i = 0; i < Math.max(count, 1); i++) {
      const lig = lightnessScale[i % lightnessScale.length];
      const solid = toHsl(h, s, lig);
      const fade = toHsl(h, s, lig, 0.8);
      arr.push({ solid, fade });
    }
    return arr;
  };
  // Revenue vs Expenses over time
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  });

  const revenueData = last6Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const receitas = transacoes
      .filter(t => t.tipo === "receita" && new Date(t.data_vencimento) >= monthStart && new Date(t.data_vencimento) <= monthEnd)
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const despesas = transacoes
      .filter(t => t.tipo === "despesa" && new Date(t.data_vencimento) >= monthStart && new Date(t.data_vencimento) <= monthEnd)
      .reduce((sum, t) => sum + Number(t.valor), 0);

    return {
      mes: format(month, "MMM", { locale: ptBR }),
      receita: receitas,
      despesas,
      lucro: receitas - despesas,
    };
  });

  // Categories distribution
  const categorias = transacoes.reduce((acc, t) => {
    acc[t.categoria] = (acc[t.categoria] || 0) + Number(t.valor);
    return acc;
  }, {} as Record<string, number>);

  const categoriaData = Object.entries(categorias).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

  // Payment status
  const pagas = transacoes.filter(t => t.data_liquidacao).reduce((sum, t) => sum + Number(t.valor), 0);
  const pendentes = transacoes.filter(t => !t.data_liquidacao).reduce((sum, t) => sum + Number(t.valor), 0);

  const statusData = [
    { name: "Pagas", value: pagas, color: "#10b981" },
    { name: "Pendentes", value: pendentes, color: "#f59e0b" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="rounded-3xl border-0 shadow-sm md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Receitas vs Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              {(() => {
                const seriesPalette = getThemedPalette(3);
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
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="receita" stroke={seriesPalette[0].solid} strokeWidth={2} name="Receitas" />
                    <Line type="monotone" dataKey="despesas" stroke={seriesPalette[1].solid} strokeWidth={2} name="Despesas" />
                    <Line type="monotone" dataKey="lucro" stroke={seriesPalette[2].solid} strokeWidth={2} name="Lucro" />
                  </>
                );
              })()}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoriaData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(() => {
                  const catPalette = getThemedPalette(categoriaData.length);
                  return categoriaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={catPalette[index].solid} />
                  ));
                })()}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "1rem"
                }}
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Status de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "1rem"
                }}
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {(() => {
                  const statusPalette = getThemedPalette(statusData.length);
                  return statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusPalette[index].solid} />
                  ));
                })()}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
