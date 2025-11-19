import {
    AlertTriangle,
    TrendingUp,
    Lightbulb,
    Brain,
    Target,
    DollarSign,
    Users,
    Clock,
    Package,
    Calendar
} from "lucide-react";
import { differenceInDays, parseISO, isAfter, isBefore, subDays } from "date-fns";

export interface Insight {
    id: string;
    type: 'warning' | 'opportunity' | 'trend' | 'recommendation';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    action?: string;
    icon: any;
    color: string;
    bgColor: string;
    data?: any; // Dados relacionados para o modal de detalhes
}

export function generateDataDrivenInsights(data: any): Insight[] {
    const {
        clientes = [],
        projetos = [],
        transacoes = [],
        agendamentos = [],
        campanhas = [],
        estoque = [],
        metas = [],
        financeiroGeral = []
    } = data;

    const insights: Insight[] = [];

    // --- 1. WARNINGS (Alertas) ---

    // Clientes Inativos (sem agendamento há 60 dias)
    const inactiveClients = clientes.filter((c: any) => {
        // Verifica se tem agendamentos recentes
        const clientAgendamentos = agendamentos.filter((a: any) => a.cliente_id === c.id || a.clienteId === c.id);
        if (clientAgendamentos.length === 0) return false; // Novo ou sem histórico

        const lastAgendamento = clientAgendamentos.sort((a: any, b: any) =>
            new Date(b.data).getTime() - new Date(a.data).getTime()
        )[0];

        if (!lastAgendamento) return false;

        const daysSince = differenceInDays(new Date(), parseISO(lastAgendamento.data));
        return daysSince > 60;
    });

    if (inactiveClients.length > 0) {
        insights.push({
            id: 'warning-inactive-clients',
            type: 'warning',
            title: `${inactiveClients.length} Clientes Inativos Detectados`,
            description: `Clientes importantes não agendam serviços há mais de 60 dias. Risco de churn.`,
            impact: 'high',
            action: 'Ver lista e reativar',
            icon: Users,
            color: 'text-red-600',
            bgColor: 'bg-red-500/10',
            data: { clients: inactiveClients }
        });
    }

    // Projetos Atrasados
    const overdueProjects = projetos.filter((p: any) => {
        if (p.status === 'Concluído' || p.status === 'Cancelado') return false;
        if (!p.data_fim) return false;
        return isAfter(new Date(), parseISO(p.data_fim));
    });

    if (overdueProjects.length > 0) {
        insights.push({
            id: 'warning-overdue-projects',
            type: 'warning',
            title: `${overdueProjects.length} Projetos Atrasados`,
            description: `Existem projetos com prazo de entrega vencido que precisam de atenção imediata.`,
            impact: 'high',
            action: 'Revisar prazos',
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-500/10',
            data: { projects: overdueProjects }
        });
    }

    // Estoque Baixo
    const lowStockItems = estoque.filter((item: any) => item.quantidade <= 5); // Threshold fixo de 5 por enquanto

    if (lowStockItems.length > 0) {
        insights.push({
            id: 'warning-low-stock',
            type: 'warning',
            title: 'Estoque Crítico Detectado',
            description: `${lowStockItems.length} materiais estão com quantidade abaixo do mínimo recomendado.`,
            impact: 'medium',
            action: 'Fazer pedido de reposição',
            icon: Package,
            color: 'text-red-600',
            bgColor: 'bg-red-500/10',
            data: { items: lowStockItems }
        });
    }

    // --- 2. OPPORTUNITIES (Oportunidades) ---

    // Oportunidade de Upsell (Clientes recorrentes com ticket médio aumentando)
    // Simplificado: Clientes com mais de 3 agendamentos
    const frequentClients = clientes.filter((c: any) => {
        const count = agendamentos.filter((a: any) => a.cliente_id === c.id || a.clienteId === c.id).length;
        return count >= 3;
    });

    if (frequentClients.length > 0) {
        insights.push({
            id: 'opp-loyal-clients',
            type: 'opportunity',
            title: 'Oportunidade de Fidelização',
            description: `${frequentClients.length} clientes são recorrentes. Crie um programa de fidelidade ou ofereça pacotes.`,
            impact: 'medium',
            action: 'Criar oferta exclusiva',
            icon: Target,
            color: 'text-green-600',
            bgColor: 'bg-green-500/10',
            data: { clients: frequentClients }
        });
    }

    // Campanhas de Alto Desempenho (se houver dados)
    const activeCampaigns = campanhas.filter((c: any) => c.status === 'ATIVA');
    if (activeCampaigns.length > 0) {
        insights.push({
            id: 'opp-active-campaigns',
            type: 'opportunity',
            title: 'Otimizar Campanhas Ativas',
            description: `Você tem ${activeCampaigns.length} campanhas rodando. Verifique o ROI e ajuste o orçamento nas melhores.`,
            impact: 'medium',
            action: 'Analisar campanhas',
            icon: TrendingUp,
            color: 'text-blue-600',
            bgColor: 'bg-blue-500/10',
            data: { campaigns: activeCampaigns }
        });
    }

    // --- 3. TRENDS (Tendências) ---

    // Crescimento de Receita (Mês atual vs Mês anterior)
    // Simplificado: Pega transacoes dos ultimos 30 dias vs 30-60 dias
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    const currentRevenue = transacoes
        .filter((t: any) => t.tipo === 'receita' && isAfter(parseISO(t.data), thirtyDaysAgo))
        .reduce((sum: number, t: any) => sum + Number(t.valor), 0);

    const previousRevenue = transacoes
        .filter((t: any) => t.tipo === 'receita' && isAfter(parseISO(t.data), sixtyDaysAgo) && isBefore(parseISO(t.data), thirtyDaysAgo))
        .reduce((sum: number, t: any) => sum + Number(t.valor), 0);

    if (currentRevenue > 0 && previousRevenue > 0) {
        const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
        const isPositive = growth >= 0;

        insights.push({
            id: 'trend-revenue-growth',
            type: 'trend',
            title: isPositive ? 'Crescimento de Receita' : 'Queda na Receita',
            description: `Sua receita ${isPositive ? 'aumentou' : 'diminuiu'} ${Math.abs(growth).toFixed(1)}% nos últimos 30 dias comparado ao período anterior.`,
            impact: isPositive ? 'high' : 'medium',
            action: 'Ver relatório financeiro',
            icon: DollarSign,
            color: isPositive ? 'text-green-600' : 'text-red-600',
            bgColor: isPositive ? 'bg-green-500/10' : 'bg-red-500/10',
            data: { current: currentRevenue, previous: previousRevenue, growth }
        });
    }

    // --- 4. RECOMMENDATIONS (Recomendações) ---

    // Metas em Risco
    const metasEmRisco = metas.filter((m: any) => {
        if (m.status !== 'ativa') return false;
        if (!m.data_fim) return false;

        const daysLeft = differenceInDays(parseISO(m.data_fim), new Date());
        const progress = m.valor_meta > 0 ? (m.valor_atual / m.valor_meta) : 0;

        // Faltam menos de 15 dias e progresso < 70%
        return daysLeft < 15 && daysLeft > 0 && progress < 0.7;
    });

    if (metasEmRisco.length > 0) {
        insights.push({
            id: 'rec-goals-risk',
            type: 'recommendation',
            title: 'Atenção às Metas',
            description: `${metasEmRisco.length} metas estão próximas do prazo e precisam de um empurrão final.`,
            impact: 'high',
            action: 'Revisar plano de ação',
            icon: Target,
            color: 'text-purple-600',
            bgColor: 'bg-purple-500/10',
            data: { goals: metasEmRisco }
        });
    }

    // Se não houver insights suficientes, adicionar genéricos baseados em boas práticas
    if (insights.length < 3) {
        insights.push({
            id: 'rec-generic-marketing',
            type: 'recommendation',
            title: 'Invista em Marketing',
            description: 'Para crescer, considere iniciar uma nova campanha de anúncios ou conteúdo orgânico.',
            impact: 'medium',
            action: 'Criar nova campanha',
            icon: Lightbulb,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-500/10'
        });
    }

    return insights;
}
