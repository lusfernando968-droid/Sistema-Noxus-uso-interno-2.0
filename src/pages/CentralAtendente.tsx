import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Users, Briefcase, Plus, Phone, ArrowRight, HeartPulse, Sparkles, DollarSign, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, subDays, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useAgendamentosData } from "@/components/agendamento/useAgendamentosData";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { OrcamentosRemarketingWidgets } from "@/components/central/OrcamentosRemarketingWidgets";
import { LeadOrcamentoForm } from "@/components/orcamentos/LeadOrcamentoForm";

export default function CentralAtendente() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const firstName = profile?.nome_completo?.split(' ')[0] || 'Atendente';

    // Widgets Data
    const { agendamentos, loading } = useAgendamentosData();

    // Filtros de Data
    const hoje = new Date();
    const amanha = addDays(hoje, 1);
    const seteDiasAtras = subDays(hoje, 7);
    const trintaDiasAtras = subDays(hoje, 30);

    const hojeStr = format(hoje, 'yyyy-MM-dd');
    const amanhaStr = format(amanha, 'yyyy-MM-dd');
    const seteDiasStr = format(seteDiasAtras, 'yyyy-MM-dd');
    const trintaDiasStr = format(trintaDiasAtras, 'yyyy-MM-dd');

    // 1. Agenda de Hoje
    const agendamentosHoje = agendamentos
        .filter(a => a.data_agendamento === hojeStr)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

    // 2. Confirmações para Amanhã
    const agendamentosAmanha = agendamentos
        .filter(a => a.data_agendamento === amanhaStr)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

    // 3. Pós-care (7 dias)
    const agendamentos7Dias = agendamentos
        .filter(a => a.data_agendamento === seteDiasStr && a.status === 'concluido');

    // 4. Cicatrização (30 dias)
    const agendamentos30Dias = agendamentos
        .filter(a => a.data_agendamento === trintaDiasStr && a.status === 'concluido');

    const shortcuts = [
        {
            title: "Novo Agendamento",
            description: "Agendar um novo cliente na agenda",
            icon: Calendar,
            action: () => navigate("/agendamentos"),
            color: "text-blue-500",
            bgColor: "bg-blue-500/10"
        },
        {
            title: "Criar Orçamento",
            description: "Gerar novo orçamento rápido",
            icon: FileText,
            action: () => navigate("/orcamento"),
            color: "text-green-500",
            bgColor: "bg-green-500/10"
        },
        {
            title: "Buscar Cliente",
            description: "Acessar base de clientes",
            icon: Users,
            action: () => navigate("/clientes"),
            color: "text-purple-500",
            bgColor: "bg-purple-500/10"
        },
        {
            title: "Projetos em Andamento",
            description: "Ver projetos ativos",
            icon: Briefcase,
            action: () => navigate("/projetos"),
            color: "text-orange-500",
            bgColor: "bg-orange-500/10"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 p-6 pb-24">
            <div className="flex justify-between items-center gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Olá, {firstName} 👋</h1>
                    <p className="text-muted-foreground text-lg">
                        Bem-vindo à sua central de comando. O que vamos fazer hoje?
                    </p>
                </div>
                <LeadOrcamentoForm onSave={() => window.location.reload()} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {shortcuts.map((shortcut, index) => (
                    <Card
                        key={index}
                        className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border hover:border-primary/50"
                        onClick={shortcut.action}
                    >
                        <CardHeader className="space-y-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${shortcut.bgColor} transition-colors group-hover:scale-110 duration-300`}>
                                <shortcut.icon className={`w-6 h-6 ${shortcut.color}`} />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                    {shortcut.title}
                                </CardTitle>
                                <CardDescription>
                                    {shortcut.description}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="ghost"
                                className="w-full justify-between group-hover:bg-primary/5"
                            >
                                Acessar <Plus className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Agendamentos de Hoje */}
                <Card className="rounded-2xl border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            Agenda de Hoje
                            <Badge variant="secondary" className="ml-auto">{agendamentosHoje.length}</Badge>
                        </CardTitle>
                        <CardDescription>Sessões programadas para o dia atual.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
                        ) : agendamentosHoje.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum agendamento para hoje.</p>
                        ) : (
                            <div className="space-y-3">
                                {agendamentosHoje.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border hover:bg-muted transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{a.cliente_nome}</span>
                                            <span className="text-xs text-muted-foreground">{a.servico}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs bg-background">{a.hora_inicio}</Badge>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="link" className="w-full h-8 text-xs text-muted-foreground" onClick={() => navigate('/agendamentos')}>
                                    Ver agenda completa
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Confirmações para Amanhã */}
                <Card className="rounded-2xl border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Phone className="w-5 h-5 text-amber-500" />
                            Confirmar para Amanhã
                            <Badge variant="secondary" className="ml-auto">{agendamentosAmanha.length}</Badge>
                        </CardTitle>
                        <CardDescription>Clientes para entrar em contato e confirmar.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
                        ) : agendamentosAmanha.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Tudo limpo! Nada para confirmar amanhã.</p>
                        ) : (
                            <div className="space-y-3">
                                {agendamentosAmanha.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{a.cliente_nome}</span>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>Amanhã às {a.hora_inicio}</span>
                                                {a.status === 'confirmado' && <Badge className="h-4 px-1 text-[10px] bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none">Confirmado</Badge>}
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" title="Entrar em contato">
                                            <ArrowRight className="w-4 h-4 text-amber-600" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Follow-up: 7 Dias */}
                <Card className="rounded-2xl border-l-4 border-l-pink-500 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <HeartPulse className="w-5 h-5 text-pink-500" />
                            Pós-Care (7 Dias)
                            <Badge variant="secondary" className="ml-auto">{agendamentos7Dias.length}</Badge>
                        </CardTitle>
                        <CardDescription>Verificar cicatrização inicial.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
                        ) : agendamentos7Dias.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum cliente completou 7 dias hoje.</p>
                        ) : (
                            <div className="space-y-3">
                                {agendamentos7Dias.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-pink-500/5 border border-pink-500/10 hover:bg-pink-500/10 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{a.cliente_nome}</span>
                                            <span className="text-xs text-muted-foreground">Tatuou em {format(new Date(a.data_agendamento), 'dd/MM')}</span>
                                        </div>
                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" title="Enviar mensagem">
                                            <ArrowRight className="w-4 h-4 text-pink-600" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Follow-up: 30 Dias */}
                <Card className="rounded-2xl border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            Cicatrização (30 Dias)
                            <Badge variant="secondary" className="ml-auto">{agendamentos30Dias.length}</Badge>
                        </CardTitle>
                        <CardDescription>Verificar resultado final e fotos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <p className="text-sm text-muted-foreground animate-pulse">Carregando...</p>
                        ) : agendamentos30Dias.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum cliente completou 30 dias hoje.</p>
                        ) : (
                            <div className="space-y-3">
                                {agendamentos30Dias.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{a.cliente_nome}</span>
                                            <span className="text-xs text-muted-foreground">Tatuou em {format(new Date(a.data_agendamento), 'dd/MM')}</span>
                                        </div>
                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" title="Solicitar foto">
                                            <ArrowRight className="w-4 h-4 text-purple-600" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Widgets de Remarketing de Orçamentos */}
                <OrcamentosRemarketingWidgets />
            </div>
        </div>
    );
}
