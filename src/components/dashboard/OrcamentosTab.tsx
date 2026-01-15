import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, CheckCircle, Clock, XCircle, Calculator, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, Legend } from "recharts";
import { useMemo } from "react";

interface Orcamento {
    id: string;
    valor_total?: number;
    status: string;
    plataforma_contato: string;
    created_at: string;
}

interface OrcamentosTabProps {
    orcamentos: Orcamento[];
    prevOrcamentos: Orcamento[];
}

export function OrcamentosTab({ orcamentos, prevOrcamentos }: OrcamentosTabProps) {
    // KPI Calculations optimized with useMemo
    const metrics = useMemo(() => {
        const totalLeads = orcamentos.length;
        const prevTotalLeads = prevOrcamentos.length;
        const leadsGrowth = prevTotalLeads > 0
            ? ((totalLeads - prevTotalLeads) / prevTotalLeads) * 100
            : 0;

        const fechados = orcamentos.filter(o => o.status === 'fechado');
        const fechadosCount = fechados.length;
        const conversaoRate = totalLeads > 0 ? (fechadosCount / totalLeads) * 100 : 0;

        const pendentes = orcamentos.filter(o => o.status === 'pendente');
        const valorEmAberto = pendentes.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);

        // Novos KPIs
        const receitaGarantida = fechados.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
        const valorTotalGeral = orcamentos.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
        const ticketMedio = totalLeads > 0 ? valorTotalGeral / totalLeads : 0;

        return {
            totalLeads,
            leadsGrowth,
            fechadosCount,
            conversaoRate,
            pendentesCount: pendentes.length,
            perdidosCount: orcamentos.filter(o => o.status === 'perdido').length,
            valorEmAberto,
            receitaGarantida,
            ticketMedio
        };
    }, [orcamentos, prevOrcamentos]);

    // Chart Data Preparation
    const statusData = useMemo(() => [
        { name: 'Pendente', value: metrics.pendentesCount, color: '#eab308' },
        { name: 'Fechado', value: metrics.fechadosCount, color: '#22c55e' },
        { name: 'Perdido', value: metrics.perdidosCount, color: '#ef4444' },
    ].filter(d => d.value > 0), [metrics]);

    const plataformaData = useMemo(() => {
        const counts = orcamentos.reduce((acc, curr) => {
            const plat = curr.plataforma_contato || 'Outros';
            acc[plat] = (acc[plat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        })).sort((a, b) => b.value - a.value);
    }, [orcamentos]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg p-2 shadow-sm text-sm">
                    <p className="font-medium">{label}</p>
                    <p className="text-muted-foreground">
                        {payload[0].value} leads
                    </p>
                </div>
            );
        }
        return null;
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
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
            className="space-y-4"
        >
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <motion.div variants={item}>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.leadsGrowth > 0 ? "+" : ""}{metrics.leadsGrowth.toFixed(1)}% vs anterior
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conversão</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.conversaoRate.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.fechadosCount} fechados
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Em Potencial</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(metrics.valorEmAberto)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Pendentes
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="hover:shadow-md transition-shadow bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Receita Garantida</CardTitle>
                            <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(metrics.receitaGarantida)}</div>
                            <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                                Já fechados
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(metrics.ticketMedio)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Por orçamento
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
                <motion.div variants={item}>
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Status dos Orçamentos</CardTitle>
                            <CardDescription>Distribuição atual dos leads</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
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
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
                                    <div className="p-3 bg-muted rounded-full">
                                        <PieChartIcon className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p>Sem dados para exibir</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Origem dos Leads</CardTitle>
                            <CardDescription>Principais canais de contato</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {plataformaData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={plataformaData} layout="vertical" margin={{ left: 20 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
                                    <div className="p-3 bg-muted rounded-full">
                                        <BarChartIcon className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <p>Sem dados de origem</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

// Icons for empty states
function PieChartIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
    )
}

function BarChartIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" x2="12" y1="20" y2="10" />
            <line x1="18" x2="18" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="16" />
        </svg>
    )
}
