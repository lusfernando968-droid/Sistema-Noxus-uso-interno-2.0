import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientsTabProps {
  clientes: any[];
}

export function ClientsTab({ clientes }: ClientsTabProps) {
  // Cores do tema
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

  // Paleta mantendo o matiz do tema e variando claro-escuro
  const parsePrimary = useMemo(() => {
    const raw = primaryColor.replace(/hsl\(|\)/g, "");
    const parts = raw.split(/\s+/);
    const h = Number(parts[0]);
    const s = Number((parts[1] || "0").replace("%", ""));
    const l = Number((parts[2] || "0").replace("%", ""));
    return { h, s, l };
  }, [primaryColor]);
  const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
  const toHsl = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`;
  const getThemedPalette = (count: number) => {
    const { h, s } = parsePrimary;
    const lightnessScale = [30, 40, 50, 60, 70];
    const arr: string[] = [];
    for (let i = 0; i < Math.max(count, 1); i++) {
      const lig = lightnessScale[i % lightnessScale.length];
      arr.push(toHsl(h, s, lig));
    }
    return arr;
  };
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  });

  const clientGrowth = last6Months.map(month => {
    const monthEnd = endOfMonth(month);
    
    const total = clientes.filter(c => new Date(c.created_at) <= monthEnd).length;
    const novos = clientes.filter(c => {
      const date = new Date(c.created_at);
      return date >= startOfMonth(month) && date <= monthEnd;
    }).length;

    return {
      mes: format(month, "MMM", { locale: ptBR }),
      total,
      novos,
    };
  });

  return (
    <div className="grid gap-4">
      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Crescimento de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={clientGrowth}>
              {/* cores sólidas temáticas com escala claro-escuro */}
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
                const lines = getThemedPalette(2);
                return (
                  <>
                    <Line type="monotone" dataKey="total" stroke={lines[0]} strokeWidth={2} name="Total de Clientes" />
                    <Line type="monotone" dataKey="novos" stroke={lines[1]} strokeWidth={2} name="Novos Clientes" />
                  </>
                );
              })()}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clientes.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Novos (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {clientes.filter(c => new Date(c.created_at) >= subMonths(new Date(), 1)).length}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {clientes.filter(c => c.email).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
