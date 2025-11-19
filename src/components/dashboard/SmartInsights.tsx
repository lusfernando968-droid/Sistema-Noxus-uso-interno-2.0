import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Target,
  Lightbulb,
  Users,
  ArrowRight,
  RefreshCw,
  Package,
  Clock,
  MessageCircle,
  ExternalLink,
  Calendar
} from "lucide-react";
import { useInsightsData } from "@/hooks/useInsightsData";
import { generateDataDrivenInsights, Insight } from "@/lib/insightsEngine";
import { Skeleton } from "@/components/ui/skeleton";

interface SmartInsightsProps {
  transacoes?: any[];
  clientes?: any[];
  projetos?: any[];
  agendamentos?: any[];
}

export function SmartInsights({ transacoes, clientes, projetos, agendamentos }: SmartInsightsProps) {
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<number>(Date.now());

  // Usar o hook centralizado para garantir que temos todos os dados necessários
  // Mesmo que alguns venham via props, o hook busca o resto (estoque, metas, campanhas)
  const {
    clientes: dataClientes,
    projetos: dataProjetos,
    transacoes: dataTransacoes,
    agendamentos: dataAgendamentos,
    campanhas,
    estoque,
    metas,
    financeiroGeral,
    isLoading
  } = useInsightsData("30d");

  const [insights, setInsights] = useState<Insight[]>([]);

  // Combinar dados das props (se existirem) com dados do hook
  // Isso permite que o componente funcione tanto isolado quanto com dados passados pelo pai
  const allData = {
    clientes: clientes || dataClientes,
    projetos: projetos || dataProjetos,
    transacoes: transacoes || dataTransacoes,
    agendamentos: agendamentos || dataAgendamentos,
    campanhas,
    estoque,
    metas,
    financeiroGeral
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simular um pequeno delay para UX de "processando"
    setTimeout(() => {
      const generated = generateDataDrivenInsights(allData);
      setInsights(generated);
      setLastRefreshAt(Date.now());
      setIsRefreshing(false);
    }, 800);
  };

  // Gerar insights iniciais quando os dados estiverem carregados
  useEffect(() => {
    if (!isLoading) {
      const generated = generateDataDrivenInsights(allData);
      setInsights(generated);
    }
  }, [isLoading, dataClientes, dataProjetos, dataTransacoes, dataAgendamentos, campanhas, estoque, metas]);

  const handleInsightClick = (insight: Insight) => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  const getImpactBadge = (impact: string) => {
    const label = impact === 'high' ? 'Alto Impacto' : impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto';
    const color = impact === 'high' ? 'bg-red-100 text-red-700 border-red-200' : impact === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-blue-100 text-blue-700 border-blue-200';
    return <Badge variant="outline" className={`rounded-full text-xs border ${color}`}>{label}</Badge>;
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  const handleWhatsApp = (phone: string) => {
    const formatted = formatPhone(phone);
    if (formatted) {
      window.open(`https://wa.me/${formatted}`, '_blank');
    }
  };

  // Contadores para cards de topo
  const totalInsights = insights.length;
  const oportunidadesAtivas = insights.filter(i => i.type === 'opportunity').length;
  // const alertasAtivos = insights.filter(i => i.type === 'warning').length; // This variable was not used, removed for consistency

  // Calcular potencial de receita (soma de oportunidades ou projetos em aberto)
  const potencialReceita = (allData.projetos || [])
    .filter((p: any) => p.status === 'Em Andamento' || p.status === 'Aprovado')
    .reduce((sum: number, p: any) => sum + Number(p.valor || 0), 0);

  const clientesImpactados = new Set(
    insights.flatMap(i => i.data?.clients?.map((c: any) => c.id) || [])
  ).size;

  const renderDetailedContent = () => {
    if (!selectedInsight) return null;

    return (
      <div className="space-y-6">
        <div className={`p-4 rounded-lg border ${selectedInsight.bgColor.replace('/10', '/20')} border-opacity-50`}>
          <h4 className={`font-semibold mb-2 ${selectedInsight.color}`}>Análise Detalhada</h4>
          <p className="text-sm text-foreground/80">{selectedInsight.description}</p>
        </div>

        {/* Renderizar lista de itens afetados se houver */}
        {selectedInsight.data?.clients && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clientes Relacionados ({selectedInsight.data.clients.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {selectedInsight.data.clients.map((c: any) => (
                <div key={c.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg text-sm hover:bg-muted/50 transition-colors">
                  <div>
                    <span className="font-medium block">{c.nome}</span>
                    <span className="text-muted-foreground text-xs">{c.email || c.telefone || 'Sem contato'}</span>
                  </div>
                  <div className="flex gap-2">
                    {c.telefone && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={() => handleWhatsApp(c.telefone)}
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Ver Perfil">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedInsight.data?.projects && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Projetos Afetados ({selectedInsight.data.projects.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {selectedInsight.data.projects.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg text-sm hover:bg-muted/50 transition-colors">
                  <div>
                    <span className="font-medium block">{p.titulo}</span>
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Venceu em: {new Date(p.data_fim).toLocaleDateString()}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    Ver Projeto
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedInsight.data?.items && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Materiais em Baixa ({selectedInsight.data.items.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {selectedInsight.data.items.map((i: any) => (
                <div key={i.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg text-sm hover:bg-muted/50 transition-colors">
                  <div>
                    <span className="font-medium block">{i.nome}</span>
                    <span className="text-red-600 font-bold text-xs">{i.quantidade} {i.unidade} restantes</span>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    Repor
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ação Recomendada */}
        {selectedInsight.action && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Ação Recomendada
            </h4>
            <Button className="w-full sm:w-auto" onClick={() => setIsModalOpen(false)}>
              {selectedInsight.action}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (isLoading && insights.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

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
                  Análises automáticas baseadas nos dados do seu negócio
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando…' : 'Atualizar Análise'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Marcador de última atualização */}
      <div className="text-xs text-muted-foreground pl-1">
        Última análise: {new Date(lastRefreshAt).toLocaleTimeString()}
      </div>

      {/* Cards de Estatísticas no topo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Insights Ativos</p>
          </div>
          <p className="text-xl font-semibold">{totalInsights}</p>
        </Card>

        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Potencial em Aberto</p>
          </div>
          <p className="text-xl font-semibold">
            R$ {potencialReceita > 1000 ? `${(potencialReceita / 1000).toFixed(1)}K` : potencialReceita}
          </p>
        </Card>

        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Clientes Impactados</p>
          </div>
          <p className="text-xl font-semibold">{clientesImpactados}</p>
        </Card>

        <Card className="p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Oportunidades</p>
          </div>
          <p className="text-xl font-semibold">{oportunidadesAtivas}</p>
        </Card>
      </div>

      {/* Insights Grid */}
      {insights.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
          {insights.map((insight) => {
            const IconComponent = insight.icon;

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
                        <div className={`p-2 rounded-xl ${insight.bgColor}`}>
                          <IconComponent className={`w-5 h-5 ${insight.color}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {insight.type === 'warning' ? 'Alerta' :
                              insight.type === 'opportunity' ? 'Oportunidade' :
                                insight.type === 'trend' ? 'Tendência' : 'Recomendação'}
                          </span>
                        </div>
                      </div>
                      {getImpactBadge(insight.impact)}
                    </div>

                    {/* Content compacto */}
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-sm text-foreground">{insight.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
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
      ) : (
        <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed">
          <div className="p-3 bg-muted/20 rounded-full w-fit mx-auto mb-4">
            <Brain className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Tudo parece em ordem!</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
            Não encontramos alertas críticos ou anomalias nos seus dados no momento. Continue assim!
          </p>
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedInsight && (
                <>
                  <div className={`p-2 rounded-xl ${selectedInsight.bgColor}`}>
                    {(() => {
                      const IconComponent = selectedInsight.icon;
                      return <IconComponent className={`w-5 h-5 ${selectedInsight.color}`} />;
                    })()}
                  </div>
                  <div>
                    <span className="text-lg font-semibold">{selectedInsight.title}</span>
                    <div className="flex items-center gap-2 mt-1">
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