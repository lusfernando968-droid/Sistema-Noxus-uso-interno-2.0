import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { useMateriaisEstoque } from "@/hooks/useMateriaisEstoque";
import { Skeleton } from "@/components/ui/skeleton";

export function InventoryTab() {
    const { items, loading } = useMateriaisEstoque();

    // Cores personalizadas
    const COLORS = {
        pie: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"], // Cores vibrantes
        barCritical: "#ef4444", // Vermelho para crítico
        barCost: "#10b981", // Verde para custo
    };

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-[300px] w-full rounded-xl" />
                <Skeleton className="h-[300px] w-full rounded-xl" />
                <Skeleton className="h-[300px] w-full rounded-xl" />
            </div>
        );
    }

    // 1. Dados para Distribuição por Tipo (Pie Chart)
    const distByType = items.reduce((acc, item) => {
        const type = item.tipo_material || "Outros";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(distByType).map(([name, value]) => ({
        name,
        value,
    }));

    // 2. Itens Críticos (Quantidade < 5) (Bar Chart)
    const criticalItems = items
        .filter((i) => (Number(i.quantidade) || 0) < 5)
        .map((i) => ({
            name: i.nome,
            quantidade: Number(i.quantidade) || 0,
        }))
        .slice(0, 7); // Top 7 críticos

    // 3. Top Fornecedores por Custo Total (Bar Chart)
    const costBySupplier = items.reduce((acc, item) => {
        const supplier = item.fornecedor || "Não informado";
        const total = (Number(item.quantidade) || 0) * (Number(item.custo_unitario) || 0);
        acc[supplier] = (acc[supplier] || 0) + total;
        return acc;
    }, {} as Record<string, number>);

    const supplierData = Object.entries(costBySupplier)
        .map(([name, value]) => ({
            name,
            value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-xl">
                    <p className="font-medium mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="font-semibold" style={{ color: entry.color || entry.fill }}>
                                {entry.name}: {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const CustomCurrencyTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-xl shadow-xl">
                    <p className="font-medium mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="font-semibold" style={{ color: entry.color || entry.fill }}>
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                                    entry.value
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Gráfico 1: Distribuição por Tipo */}
            <Card className="rounded-3xl border border-border/50 shadow-sm col-span-1">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Tipos de Materiais</CardTitle>
                    <CardDescription>Distribuição do estoque por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Gráfico 2: Itens Críticos */}
            <Card className="rounded-3xl border border-border/50 shadow-sm col-span-1 lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-destructive">Estoque Baixo (Críticos)</CardTitle>
                    <CardDescription>Itens com menos de 5 unidades</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={criticalItems} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.4} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={120}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                                <Bar dataKey="quantidade" name="Qtd" radius={[0, 4, 4, 0]} barSize={20} fill={COLORS.barCritical}>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Gráfico 3: Top Fornecedores por Custo */}
            <Card className="rounded-3xl border border-border/50 shadow-sm col-span-1 lg:col-span-3">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Custo por Fornecedor (Top 5)</CardTitle>
                    <CardDescription>Valor total investido em estoque por fornecedor</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={supplierData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    tickFormatter={(value) => `R$${value}`}
                                />
                                <Tooltip content={<CustomCurrencyTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                                <Bar dataKey="value" name="Valor Total" radius={[4, 4, 0, 0]} fill={COLORS.barCost}>
                                    {supplierData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} fillOpacity={0.8} />
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
