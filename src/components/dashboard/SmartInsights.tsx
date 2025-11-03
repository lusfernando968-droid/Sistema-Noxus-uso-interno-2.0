import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Brain,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  Lightbulb,
  Users,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  RefreshCw
} from "lucide-react";

interface SmartInsightsProps {
  transacoes: any[];
  clientes: any[];
  projetos: any[];
  agendamentos: any[];
}

interface Insight {
  id: string;
  type: 'warning' | 'opportunity' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action?: string;
  icon: any;
  color: string;
  bgColor: string;
}

// Dados mockados de clientes para demonstração
const mockClients = [
  {
    id: 1,
    name: "João Silva",
    email: "joao@empresa.com",
    phone: "(11) 99999-9999",
    company: "Tech Solutions Ltda",
    value: 15000,
    status: "Ativo",
    lastContact: "2024-01-15",
    opportunity: "Upgrade para plano Premium"
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria@startup.com",
    phone: "(11) 88888-8888",
    company: "Startup Inovadora",
    value: 8500,
    status: "Potencial",
    lastContact: "2024-01-12",
    opportunity: "Serviços de consultoria adicional"
  },
  {
    id: 3,
    name: "Carlos Oliveira",
    email: "carlos@comercio.com",
    phone: "(11) 77777-7777",
    company: "Comércio Digital",
    value: 22000,
    status: "Negociação",
    lastContact: "2024-01-10",
    opportunity: "Expansão para novos módulos"
  }
];

export function SmartInsights({ transacoes, clientes, projetos, agendamentos }: SmartInsightsProps) {
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<number>(Date.now());

  const handleInsightClick = (insight: Insight) => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  const renderDetailedContent = () => {
    if (!selectedInsight) return null;

    switch (selectedInsight.type) {
      case 'Oportunidade':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Detalhes da Oportunidade</h4>
              <p className="text-green-700 text-sm">{selectedInsight.description}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clientes Relevantes ({mockClients.length})
              </h4>
              <div className="space-y-3">
                {mockClients.map((client) => (
                  <Card key={client.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{client.name}</h5>
                          <Badge variant={client.status === 'Ativo' ? 'default' : client.status === 'Potencial' ? 'secondary' : 'outline'}>
                            {client.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{client.company}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-green-600">{client.opportunity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">R$ {client.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Potencial</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 'Alerta':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">Detalhes do Alerta</h4>
              <p className="text-red-700 text-sm">{selectedInsight.description}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Ações Recomendadas
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Entrar em contato com clientes em até 24h</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Revisar estratégia de retenção</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Oferecer benefícios exclusivos</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Tendência':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Análise de Tendência</h4>
              <p className="text-blue-700 text-sm">{selectedInsight.description}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Métricas de Crescimento
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">+23%</div>
                  <div className="text-sm text-muted-foreground">Crescimento mensal</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">R$ 45K</div>
                  <div className="text-sm text-muted-foreground">Receita projetada</div>
                </Card>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">{selectedInsight.description}</p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Mais detalhes sobre este insight estarão disponíveis em breve.
              </p>
            </div>
          </div>
        );
    }
  };
  
  // Simulação de insights baseados em IA (em produção, viriam de análise real dos dados)
  const insights: Insight[] = [
    {
      id: '1',
      type: 'warning',
      title: 'Clientes Inativos Detectados',
      description: '12 clientes não fazem agendamentos há mais de 60 dias. Risco de churn alto.',
      impact: 'high',
      action: 'Enviar campanha de reativação',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10'
    },
    {
      id: '2',
      type: 'opportunity',
      title: 'Oportunidade de Upsell',
      description: '8 clientes com histórico de tatuagens pequenas podem estar prontos para projetos maiores.',
      impact: 'high',
      action: 'Criar proposta personalizada',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      id: '3',
      type: 'trend',
      title: 'Tendência Sazonal Identificada',
      description: 'Aumento de 35% em agendamentos nas sextas-feiras. Considere expandir horários.',
      impact: 'medium',
      action: 'Otimizar agenda',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: '4',
      type: 'recommendation',
      title: 'Preço Sugerido para Novos Serviços',
      description: 'Baseado no mercado local, tatuagens coloridas podem ter preço 20% maior.',
      impact: 'medium',
      action: 'Revisar tabela de preços',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10'
    },
    {
      id: '5',
      type: 'opportunity',
      title: 'Horário de Pico Subutilizado',
      description: 'Terças-feiras têm 40% menos agendamentos. Oportunidade para promoções.',
      impact: 'low',
      action: 'Criar promoção especial',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10'
    }
  ];

  // Contadores para cards de topo padronizados
  const totalInsights = insights.length;
  const oportunidadesAtivas = insights.filter(i => i.type === 'opportunity').length;
  const recomendacoesAtivas = insights.filter(i => i.type === 'recommendation').length;

  const getImpactBadge = (impact: string) => {
    const label = impact === 'high' ? 'Alto Impacto' : impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto';
    return <Badge variant="outline" className="rounded-full text-xs">{label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'opportunity':
        return Lightbulb;
      case 'trend':
        return TrendingUp;
      case 'recommendation':
        return Brain;
      default:
        return Brain;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header minimalista */}
      <Card className="rounded-2xl border border-border/40 bg-background shadow-sm">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Insights Inteligentes</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Análises baseadas em IA para otimizar seu negócio
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => { setIsRefreshing(true); setLastRefreshAt(Date.now()); setTimeout(() => setIsRefreshing(false), 700); }}
              data-clickable="true"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando…' : 'Atualizar'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Cards de resumo no topo - padrão das outras páginas */}
      {/* Marcador de última atualização (sutil) */}
      <div className="text-xs text-muted-foreground pl-1">Última atualização: {new Date(lastRefreshAt).toLocaleTimeString()}</div>
      {/* Cards de Estatísticas no topo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Insights Ativos</p>
          </div>
          <p className="text-xl font-semibold">
            {totalInsights}
          </p>
        </Card>

        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Potencial de Receita</p>
          </div>
          <p className="text-xl font-semibold">
            R$ 15K
          </p>
        </Card>

        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Clientes Impactados</p>
          </div>
          <p className="text-xl font-semibold">
            20
          </p>
        </Card>

        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Oportunidades Ativas</p>
          </div>
          <p className="text-xl font-semibold">
            {oportunidadesAtivas}
          </p>
        </Card>
      </div>

      {/* Insights Grid minimalista */}
      <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
        {insights.map((insight) => {
          const IconComponent = insight.icon;
          const TypeIcon = getTypeIcon(insight.type);
          
          return (
            <Card 
              key={insight.id} 
              className="rounded-2xl border border-border/40 bg-background shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
              onClick={() => handleInsightClick(insight)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {insight.type}
                        </span>
                      </div>
                    </div>
                    {getImpactBadge(insight.impact)}
                  </div>

                  {/* Content compacto */}
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-sm text-foreground">{insight.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>

                  {/* Indicador de clique */}
                  <div className="flex items-center justify-end pt-2">
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedInsight && (
                <>
                  <div className="p-2 rounded-xl bg-primary/10">
                    {(() => {
                      const IconComponent = selectedInsight.icon;
                      return <IconComponent className="w-5 h-5 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-lg font-semibold">{selectedInsight.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const TypeIcon = getTypeIcon(selectedInsight.type);
                        return <TypeIcon className="w-4 h-4 text-muted-foreground" />;
                      })()}
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {selectedInsight.type}
                      </span>
                      {getImpactBadge(selectedInsight.impact)}
                    </div>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-6">
            {renderDetailedContent()}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}