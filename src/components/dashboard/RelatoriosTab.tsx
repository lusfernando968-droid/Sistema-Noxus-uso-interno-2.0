import { useState } from "react";
import { useMonthlyReport } from "@/hooks/useMonthlyReport";
import { ReportCard } from "@/components/relatorios/ReportCard";
import {
    FileText, Users, DollarSign, TrendingUp, Calendar,
    Printer, AlertTriangle, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { formatCurrency } from "@/lib/utils";

export function RelatoriosTab() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const { current, previous, isLoading, dateRange } = useMonthlyReport(selectedDate);

    // Month Navigation
    const months = Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(new Date(), i);
        return {
            value: d.toISOString(),
            label: format(d, "MMMM yyyy", { locale: ptBR })
        };
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-sm">Gerando relatório...</p>
                </div>
            </div>
        );
    }

    // --- Calculations ---
    // Financial
    const currentRevenue = current.transacoes?.filter((t: any) => t.tipo === 'receita').reduce((acc: number, t: any) => acc + (Number(t.valor) || 0), 0) || 0;
    const previousRevenue = previous.transacoes?.filter((t: any) => t.tipo === 'receita').reduce((acc: number, t: any) => acc + (Number(t.valor) || 0), 0) || 0;

    const currentExpenses = current.transacoes?.filter((t: any) => t.tipo === 'despesa').reduce((acc: number, t: any) => acc + (Number(t.valor) || 0), 0) || 0;
    const currentProfit = currentRevenue - currentExpenses;

    const transactionCount = current.transacoes?.filter((t: any) => t.tipo === 'receita').length || 0;
    const averageTicket = transactionCount > 0 ? currentRevenue / transactionCount : 0;

    const prevTransactionCount = previous.transacoes?.filter((t: any) => t.tipo === 'receita').length || 0;
    const prevAverageTicket = prevTransactionCount > 0 ? previousRevenue / prevTransactionCount : 0;

    // Clients
    const currentNewClients = current.clientes?.length || 0;
    const previousNewClients = previous.clientes?.length || 0;

    // Projects
    const currentCompletedProjects = current.projetos?.filter((p: any) => p.status === "concluido").length || 0;
    const previousCompletedProjects = previous.projetos?.filter((p: any) => p.status === "concluido").length || 0;

    // Status Distribution
    const statusDistribution = [
        { name: "Planejamento", value: current.projetos?.filter((p: any) => p.status === "planejamento").length || 0, color: "#94a3b8" },
        { name: "Em Andamento", value: current.projetos?.filter((p: any) => p.status === "andamento").length || 0, color: "#3b82f6" },
        { name: "Concluído", value: current.projetos?.filter((p: any) => p.status === "concluido").length || 0, color: "#10b981" },
        { name: "Cancelado", value: current.projetos?.filter((p: any) => p.status === "cancelado").length || 0, color: "#ef4444" },
    ].filter(i => i.value > 0);

    // Conversion Rate (Projects Created / Budgets Created)
    const currentBudgets = current.orcamentos?.length || 0;
    const currentProjectsCreated = current.projetos?.length || 0;
    const currentConversion = currentBudgets > 0 ? (currentProjectsCreated / currentBudgets) * 100 : 0;

    const previousBudgets = previous.orcamentos?.length || 0;
    const previousProjectsCreated = previous.projetos?.length || 0;
    const previousConversion = previousBudgets > 0 ? (previousProjectsCreated / previousBudgets) * 100 : 0;

    // --- Daily Revenue Trend ---
    const revenueByDay = current.transacoes?.reduce((acc: any, t: any) => {
        if (t.tipo !== 'receita') return acc;
        const day = format(new Date(t.created_at || t.data || new Date()), "dd");
        acc[day] = (acc[day] || 0) + Number(t.valor);
        return acc;
    }, {});

    const trendData = Object.entries(revenueByDay || {})
        .map(([day, value]) => ({ day, value: Number(value) }))
        .sort((a, b) => Number(a.day) - Number(b.day));

    // --- Top Clients ---
    const clientsByRevenue = current.transacoes?.reduce((acc: any, t: any) => {
        if (t.tipo !== 'receita' || !t.cliente_id) return acc;
        // Find client name
        const clientName = current.clientes?.find((c: any) => c.id === t.cliente_id)?.nome || "Cliente Desconhecido";
        acc[clientName] = (acc[clientName] || 0) + Number(t.valor);
        return acc;
    }, {});

    const topClients = Object.entries(clientsByRevenue || {})
        .map(([name, value]) => ({ name, value: Number(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // --- Insights Generator ---
    const generateInsights = () => {
        const insights = [];

        // Revenue Insight
        const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        if (revenueGrowth > 10) {
            insights.push({
                type: "positive",
                icon: TrendingUp,
                title: "Crescimento Financeiro",
                text: `O faturamento cresceu ${revenueGrowth.toFixed(1)}% em relação ao mês anterior. Ótimo trabalho!`
            });
        } else if (revenueGrowth < -10) {
            insights.push({
                type: "negative",
                icon: AlertTriangle,
                title: "Queda no Faturamento",
                text: `O faturamento caiu ${Math.abs(revenueGrowth).toFixed(1)}%. Pode ser necessário rever estratégias de vendas ou cobrança.`
            });
        }

        // Profitability Insight
        const profitMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
        if (profitMargin > 30) {
            insights.push({
                type: "positive",
                icon: DollarSign,
                title: "Alta Rentabilidade",
                text: `Sua margem de lucro está em ${profitMargin.toFixed(1)}%. Isso indica uma operação muito saudável!`
            });
        } else if (profitMargin < 10 && currentRevenue > 0) {
            insights.push({
                type: "warning",
                icon: AlertTriangle,
                title: "Margem Apertada",
                text: `Sua margem de lucro está em apenas ${profitMargin.toFixed(1)}%. Revise seus custos operacionais.`
            });
        }

        // Client Acquisition Insight
        if (currentNewClients < previousNewClients) {
            insights.push({
                type: "warning",
                icon: Users,
                title: "Alerta de Aquisição",
                text: "Houve uma queda na entrada de novos clientes. Considere intensificar ações de marketing."
            });
        } else if (currentNewClients > previousNewClients * 1.2) {
            insights.push({
                type: "positive",
                icon: Users,
                title: "Boom de Clientes",
                text: "A aquisição de clientes está acelerada! Garanta que a operação consiga absorver a demanda."
            });
        }

        return insights;
    };

    const insights = generateInsights();

    return (
        <div className="space-y-6">
            {/* Header specific to the Tab */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-4 rounded-xl">
                <div>
                    <h3 className="text-lg font-semibold">Relatório Mensal</h3>
                    <p className="text-sm text-muted-foreground">
                        Período: {format(dateRange.current.start, "dd/MM")} a {format(dateRange.current.end, "dd/MM/yyyy")}
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select
                        value={months.find(m => new Date(m.value).getMonth() === selectedDate.getMonth())?.value}
                        onValueChange={(v) => setSelectedDate(new Date(v))}
                    >
                        <SelectTrigger className="w-full sm:w-[200px] rounded-xl bg-background">
                            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                    {month.label.charAt(0).toUpperCase() + month.label.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" className="rounded-xl shrink-0" onClick={() => window.print()}>
                        <Printer className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportCard
                    title="Faturamento Total"
                    value={currentRevenue}
                    prevValue={previousRevenue}
                    type="currency"
                    icon={DollarSign}
                />
                <ReportCard
                    title="Lucro Líquido"
                    value={currentProfit}
                    prevValue={0} // Difficult to compare without robust historical expense data
                    type="currency"
                    icon={TrendingUp}
                    description="Receitas - Despesas"
                />
                <ReportCard
                    title="Ticket Médio"
                    value={averageTicket}
                    prevValue={prevAverageTicket}
                    type="currency"
                    icon={DollarSign}
                    description="Por transação (Receita)"
                />
                <ReportCard
                    title="Novos Clientes"
                    value={currentNewClients}
                    prevValue={previousNewClients}
                    icon={Users}
                />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Revenue Trend Chart */}
                <Card className="lg:col-span-2 rounded-2xl border shadow-sm">
                    <CardHeader>
                        <CardTitle>Tendência de Faturamento</CardTitle>
                        <p className="text-sm text-muted-foreground">Evolução diária das receitas neste mês</p>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {trendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                            tickFormatter={(d) => `Dia ${d}`}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                            tickFormatter={(value) => `R$${value / 1000}k`}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                                            labelFormatter={(label) => `Dia ${label}`}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#10b981"
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            strokeWidth={3}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    Sem dados de receita para exibir este gráfico.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Clients List */}
                <Card className="rounded-2xl border shadow-sm">
                    <CardHeader>
                        <CardTitle>Top Clientes</CardTitle>
                        <p className="text-sm text-muted-foreground">Maiores pagadores do mês</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topClients.map((client, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                            {i + 1}
                                        </div>
                                        <span className="text-sm font-medium truncate max-w-[120px]" title={client.name}>
                                            {client.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-600">
                                        {formatCurrency(client.value)}
                                    </span>
                                </div>
                            ))}
                            {topClients.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">Sem dados de clientes.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Insights Section */}
                <Card className="lg:col-span-2 rounded-2xl border-none shadow-sm bg-gradient-to-br from-background to-muted/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            Insights e Recomendações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {insights.length > 0 ? (
                            insights.map((insight, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-4 p-4 rounded-xl border ${insight.type === 'positive' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                        insight.type === 'negative' ? 'bg-rose-500/5 border-rose-500/20' :
                                            'bg-amber-500/5 border-amber-500/20'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full shrink-0 ${insight.type === 'positive' ? 'bg-emerald-500/10 text-emerald-600' :
                                        insight.type === 'negative' ? 'bg-rose-500/10 text-rose-600' :
                                            'bg-amber-500/10 text-amber-600'
                                        }`}>
                                        <insight.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{insight.text}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>Nenhum insight relevante encontrado para este período.</p>
                                <p className="text-sm">O desempenho está estável em relação ao mês anterior.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Project Status Distribution */}
                <div className="space-y-4">
                    <Card className="rounded-xl border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Status dos Projetos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {statusDistribution.map((item) => (
                                    <div key={item.name} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">{item.name}</span>
                                            <span className="font-medium">{item.value}</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{ width: `${(item.value / (current.projetos?.length || 1)) * 100}%`, backgroundColor: item.color }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {statusDistribution.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum projeto registrado neste mês.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Conversão</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold">{currentConversion.toFixed(1)}%</div>
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Orçamentos que viraram Projetos</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
