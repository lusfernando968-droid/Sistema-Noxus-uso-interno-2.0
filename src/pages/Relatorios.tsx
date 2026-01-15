import { useState } from "react";
import { useMonthlyReport } from "@/hooks/useMonthlyReport";
import { ReportCard } from "@/components/relatorios/ReportCard";
import {
    FileText, Users, DollarSign, TrendingUp, Calendar,
    ArrowLeft, Download, Printer, AlertTriangle, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Relatorios() {
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Gerando relatório...</p>
                </div>
            </div>
        );
    }

    // --- Calculations ---

    // Financial
    const currentRevenue = current.transacoes.reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    const previousRevenue = previous.transacoes.reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

    // Clients
    const currentNewClients = current.clientes.length;
    const previousNewClients = previous.clientes.length;

    // Projects
    const currentCompletedProjects = current.projetos.filter(p => p.status === "concluido").length;
    const previousCompletedProjects = previous.projetos.filter(p => p.status === "concluido").length;

    // Conversion Rate (Projects Created / Budgets Created)
    // Assuming 'orcamentos' are budgets. If not available, we skip.
    const currentBudgets = current.orcamentos.length;
    const currentProjectsCreated = current.projetos.length;
    const currentConversion = currentBudgets > 0 ? (currentProjectsCreated / currentBudgets) * 100 : 0;

    const previousBudgets = previous.orcamentos.length;
    const previousProjectsCreated = previous.projetos.length;
    const previousConversion = previousBudgets > 0 ? (previousProjectsCreated / previousBudgets) * 100 : 0;

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
        <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Relatório Mensal</h1>
                    <p className="text-muted-foreground">
                        Análise de desempenho: {format(dateRange.current.start, "dd/MM")} a {format(dateRange.current.end, "dd/MM/yyyy")}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={months.find(m => new Date(m.value).getMonth() === selectedDate.getMonth())?.value}
                        onValueChange={(v) => setSelectedDate(new Date(v))}
                    >
                        <SelectTrigger className="w-[200px] rounded-xl bg-background">
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

                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => window.print()}>
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
                    title="Novos Clientes"
                    value={currentNewClients}
                    prevValue={previousNewClients}
                    icon={Users}
                />
                <ReportCard
                    title="Projetos Concluídos"
                    value={currentCompletedProjects}
                    prevValue={previousCompletedProjects}
                    icon={FileText}
                />
                <ReportCard
                    title="Taxa de Conversão"
                    value={currentConversion}
                    prevValue={previousConversion}
                    type="percentage"
                    icon={TrendingUp}
                    description="Orçamentos → Projetos"
                />
            </div>

            {/* Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                {/* Mini Summary / Project Status Distributions? */}
                <div className="space-y-4">
                    {/* Can add more specific breakdown charts here if needed later */}
                </div>
            </div>
        </div>
    );
}
