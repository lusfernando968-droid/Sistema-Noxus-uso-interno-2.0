import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Activity, Eye, FileText, UserPlus, Calendar, BarChart as BarChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAssistantActivityLogger } from "@/hooks/useAssistantActivityLogger";

export default function AssistantDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assistant, setAssistant] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [recentClients, setRecentClients] = useState<any[]>([]);
    const [recentProjects, setRecentProjects] = useState<any[]>([]);
    const [recentBudgets, setRecentBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { getLogsForAssistant } = useAssistantActivityLogger();

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            const { data: assistantData, error: assistantError } = await supabase
                .from("assistants")
                .select("*")
                .eq("id", id)
                .single();

            if (assistantError || !assistantData) {
                console.error("Assistant not found", assistantError);
                return;
            }
            setAssistant(assistantData);

            // Buscar logs do localStorage
            const logsData = getLogsForAssistant(assistantData.assistant_email);
            setLogs(logsData);

            // Fetch details for created entities
            const clientIds = logsData
                .filter(l => l.action_type === 'CREATE_CLIENT' && l.entity_id)
                .map(l => l.entity_id);

            const projectIds = logsData
                .filter(l => l.action_type === 'CREATE_PROJECT' && l.entity_id)
                .map(l => l.entity_id);

            const budgetIds = logsData
                .filter(l => l.action_type === 'CREATE_BUDGET' && l.entity_id)
                .map(l => l.entity_id);

            if (clientIds.length > 0) {
                const { data: clients } = await supabase
                    .from('clientes')
                    .select('id, nome, email, created_at')
                    .in('id', [...new Set(clientIds)])
                    .limit(10);
                setRecentClients(clients || []);
            }

            if (projectIds.length > 0) {
                const { data: projects } = await supabase
                    .from('projetos')
                    .select('id, nome, status, created_at')
                    .in('id', [...new Set(projectIds)])
                    .limit(10);
                setRecentProjects(projects || []);
            }

            if (budgetIds.length > 0) {
                const { data: budgets } = await supabase
                    .from('orcamentos')
                    .select('id, titulo, valor_total, created_at')
                    .in('id', [...new Set(budgetIds)])
                    .limit(10);
                setRecentBudgets(budgets || []);
            }

            setLoading(false);
        };

        fetchData();
    }, [id, getLogsForAssistant]);

    // Analytics Calculation
    const totalViews = logs.filter(l => l.action_type === 'PAGE_VIEW').length;
    const createdClientsCount = logs.filter(l => l.action_type === 'CREATE_CLIENT').length;
    const createdProjectsCount = logs.filter(l => l.action_type === 'CREATE_PROJECT').length;

    // Most visited page
    const pageCounts: Record<string, number> = {};
    logs.filter(l => l.action_type === 'PAGE_VIEW').forEach(l => {
        const path = l.details?.path || 'unknown';
        pageCounts[path] = (pageCounts[path] || 0) + 1;
    });
    const mostVisited = Object.entries(pageCounts).sort((a, b) => b[1] - a[1])[0];

    // Chart Data Preparation (Last 7 Days)
    const chartData = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayLogs = logs.filter(l => l.created_at.startsWith(dateStr));

        return {
            name: format(date, 'EEE', { locale: ptBR }),
            fullDate: format(date, 'dd/MM'),
            views: dayLogs.filter(l => l.action_type === 'PAGE_VIEW').length,
            creates: dayLogs.filter(l => l.action_type.startsWith('CREATE')).length,
        };
    });

    return (
        <div className="container mx-auto p-6 space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/perfil')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Detalhes do Assistente</h1>
                        <p className="text-muted-foreground">{assistant?.assistant_email}</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center bg-card rounded-xl border border-dashed">
                    <Activity className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-muted-foreground">Carregando dados...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Páginas Acessadas"
                            value={totalViews}
                            icon={<Eye className="w-5 h-5 text-blue-500" />}
                            description="Visualizações recentes"
                        />
                        <StatCard
                            title="Página Favorita"
                            value={mostVisited ? formatPath(mostVisited[0]) : '-'}
                            subtitle={mostVisited ? `${mostVisited[1]} acessos` : ''}
                            icon={<Activity className="w-5 h-5 text-purple-500" />}
                            description="Mais acessada"
                        />
                        <StatCard
                            title="Clientes Criados"
                            value={createdClientsCount}
                            icon={<UserPlus className="w-5 h-5 text-green-500" />}
                            description="Total de cadastros"
                        />
                        <StatCard
                            title="Projetos/Orçamentos"
                            value={createdProjectsCount}
                            icon={<FileText className="w-5 h-5 text-orange-500" />}
                            description="Atividades comerciais"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Productivity Chart */}
                        <Card className="lg:col-span-2 border-border/50 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChartIcon className="w-5 h-5" />
                                    Produtividade Semanal
                                </CardTitle>
                                <CardDescription>Volume de visualizações e ações de criação nos últimos 7 dias</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <XAxis
                                                dataKey="name"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `${value}`}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                            />
                                            <Bar dataKey="views" name="Visualizações" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                                            <Bar dataKey="creates" name="Criações (Clientes/Projetos)" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Items Lists */}
                        <Card className="border-border/50 shadow-sm h-full">
                            <CardHeader>
                                <CardTitle>Itens Recentes</CardTitle>
                                <CardDescription>Últimos registros criados</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Tabs defaultValue="clients" className="w-full">
                                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                                        <TabsTrigger value="clients" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                            Clientes
                                        </TabsTrigger>
                                        <TabsTrigger value="projects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                            Projetos
                                        </TabsTrigger>
                                        <TabsTrigger value="budgets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                            Orçamentos
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="p-4 h-[250px] overflow-y-auto">
                                        <TabsContent value="clients" className="mt-0 space-y-4">
                                            {recentClients.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente criado recentemente.</p>
                                            ) : (
                                                recentClients.map(client => (
                                                    <div key={client.id} className="flex items-center justify-between group">
                                                        <div>
                                                            <p className="font-medium text-sm group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/clientes/${client.id}`)}>
                                                                {client.nome}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">{new Date(client.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => navigate(`/clientes/${client.id}`)}>
                                                            <ArrowLeft className="h-3 w-3 rotate-180" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </TabsContent>

                                        <TabsContent value="projects" className="mt-0 space-y-4">
                                            {recentProjects.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto criado recentemente.</p>
                                            ) : (
                                                recentProjects.map(project => (
                                                    <div key={project.id} className="flex items-center justify-between group">
                                                        <div>
                                                            <p className="font-medium text-sm group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/projetos/${project.id}`)}>
                                                                {project.nome}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">{project.status} • {new Date(project.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => navigate(`/projetos/${project.id}`)}>
                                                            <ArrowLeft className="h-3 w-3 rotate-180" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </TabsContent>

                                        <TabsContent value="budgets" className="mt-0 space-y-4">
                                            {recentBudgets.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-8">Nenhum orçamento criado recentemente.</p>
                                            ) : (
                                                recentBudgets.map(budget => (
                                                    <div key={budget.id} className="flex items-center justify-between group">
                                                        <div>
                                                            <p className="font-medium text-sm group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/orcamento?id=${budget.id}`)}>
                                                                {budget.titulo || 'Orçamento sem título'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {budget.valor_total ? `R$ ${budget.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Valor não definido'} • {new Date(budget.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => navigate(`/orcamento?id=${budget.id}`)}>
                                                            <ArrowLeft className="h-3 w-3 rotate-180" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Full Activity Log */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Histórico Completo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data e Hora</TableHead>
                                            <TableHead>Ação</TableHead>
                                            <TableHead>Detalhes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                                    Nenhuma atividade registrada.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            logs.map(log => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        {new Date(log.created_at).toLocaleString('pt-BR')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeClass(log.action_type)}`}>
                                                            {formatAction(log.action_type)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {formatDetails(log)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, subtitle, icon, description }: any) {
    return (
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    {icon && <div className="p-2 bg-secondary/50 rounded-full">{icon}</div>}
                </div>
                <div className="flex flex-col gap-1">
                    <div className="text-2xl font-bold">{value}</div>
                    {subtitle && <div className="text-xs font-medium text-primary">{subtitle}</div>}
                    {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                </div>
            </CardContent>
        </Card>
    )
}

function formatAction(action: string) {
    switch (action) {
        case 'PAGE_VIEW': return 'Acessou Página';
        case 'CREATE_CLIENT': return 'Criou Cliente';
        case 'CREATE_PROJECT': return 'Criou Projeto';
        case 'CREATE_APPOINTMENT': return 'Criou Agendamento';
        default: return action;
    }
}

function getActionBadgeClass(action: string) {
    switch (action) {
        case 'PAGE_VIEW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case 'CREATE_CLIENT': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case 'CREATE_PROJECT': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
}

function formatDetails(log: any) {
    if (log.action_type === 'PAGE_VIEW') return formatPath(log.details?.path);
    if (log.details?.table) return `Tabela: ${log.details.table}`;
    return JSON.stringify(log.details);
}

function formatPath(path: string) {
    if (!path) return '-';
    // Clean up path for display
    return path.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Início';
}
