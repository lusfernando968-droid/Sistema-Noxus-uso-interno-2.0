import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus,
  ArrowRight,
  Calendar,
  Trophy
} from "lucide-react";
import { useMetas, MetaComProgresso } from "@/hooks/useMetas";
import { Skeleton } from "@/components/ui/skeleton";

interface MetasOverviewCardProps {
  onOpenMetasTab?: () => void;
  onCreateMeta?: () => void;
}

export function MetasOverviewCard({ onOpenMetasTab, onCreateMeta }: MetasOverviewCardProps) {
  const { metas, metasStats, isLoading } = useMetas();

  if (isLoading) {
    return (
      <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-purple-500/10">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <CardTitle className="text-lg">Metas</CardTitle>
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const metasAtivas = metas.filter(m => m.status === 'ativa');
  const metasProximasVencimento = metas.filter(m => m.status_calculado === 'proxima_vencimento');
  const metasVencidas = metas.filter(m => m.status_calculado === 'vencida');
  const metasConcluidas = metas.filter(m => m.percentual_progresso >= 100);

  const getMetasPrioritarias = (): MetaComProgresso[] => {
    return metasAtivas
      .filter(m => m.prioridade === 'alta' || m.prioridade === 'critica')
      .slice(0, 3);
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica': return 'text-red-500 bg-red-500/10';
      case 'alta': return 'text-orange-500 bg-orange-500/10';
      case 'media': return 'text-blue-500 bg-blue-500/10';
      case 'baixa': return 'text-green-500 bg-green-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'financeiro': return '💰';
      case 'clientes': return '👥';
      case 'projetos': return '📋';
      case 'vendas': return '📈';
      case 'pessoal': return '🎯';
      case 'operacional': return '⚙️';
      default: return '📊';
    }
  };

  if (metas.length === 0) {
    return (
      <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-purple-500/10">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <CardTitle className="text-lg">Metas</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-muted/50 inline-block">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Nenhuma meta definida</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Comece definindo suas primeiras metas para acompanhar seu progresso
              </p>
              <Button 
                onClick={onCreateMeta}
                className="rounded-xl gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Criar primeira meta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-purple-500/10 group-hover:scale-110 transition-transform duration-300">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <CardTitle className="text-lg">Metas</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onOpenMetasTab}
            className="rounded-xl gap-1 text-xs"
          >
            Ver todas
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Estatísticas Rápidas - Layout Horizontal Otimizado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Concluídas</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-green-600">{metasConcluidas.length}</span>
              <span className="text-sm text-muted-foreground">de {metas.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Progresso</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-blue-600">
                {metasStats?.progressoMedio.toFixed(0) || 0}%
              </span>
              <span className="text-sm text-muted-foreground">médio</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Próx. Venc.</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-orange-600">{metasProximasVencimento.length}</span>
              <span className="text-sm text-muted-foreground">metas</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Vencidas</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-red-600">{metasVencidas.length}</span>
              <span className="text-sm text-muted-foreground">metas</span>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {(metasVencidas.length > 0 || metasProximasVencimento.length > 0) && (
          <div className="space-y-2">
            {metasVencidas.length > 0 && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    {metasVencidas.length} meta(s) vencida(s)
                  </span>
                </div>
              </div>
            )}
            
            {metasProximasVencimento.length > 0 && (
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    {metasProximasVencimento.length} meta(s) próxima(s) do vencimento
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metas Prioritárias - Layout Otimizado */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Metas Prioritárias</h4>
            {getMetasPrioritarias().length === 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCreateMeta}
                className="text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar meta
              </Button>
            )}
          </div>

          {getMetasPrioritarias().length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getMetasPrioritarias().map((meta) => (
                <div key={meta.id} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg">{getCategoriaIcon(meta.categoria)}</span>
                      <span className="text-sm font-medium truncate">{meta.titulo}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs rounded-full ${getPrioridadeColor(meta.prioridade)}`}
                    >
                      {meta.prioridade}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {meta.valor_atual.toLocaleString()} / {meta.valor_meta.toLocaleString()} {meta.unidade}
                      </span>
                      <span className="font-bold" style={{ color: meta.cor }}>
                        {meta.percentual_progresso.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={meta.percentual_progresso} 
                      className="h-2"
                      style={{ 
                        '--progress-background': meta.cor 
                      } as React.CSSProperties}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {meta.dias_restantes > 0 
                            ? `${meta.dias_restantes} dias restantes`
                            : meta.dias_restantes === 0 
                            ? 'Vence hoje'
                            : `Venceu há ${Math.abs(meta.dias_restantes)} dias`
                          }
                        </span>
                      </div>
                      {meta.percentual_progresso >= 100 && (
                        <div className="flex items-center gap-1 text-green-500">
                          <Trophy className="w-3 h-3" />
                          <span>Concluída</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 rounded-2xl bg-muted/50 inline-block mb-4">
                <Target className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhuma meta prioritária ativa
              </p>
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCreateMeta}
            className="rounded-xl gap-2 flex-1"
          >
            <Plus className="w-4 h-4" />
            Nova Meta
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenMetasTab}
            className="rounded-xl gap-2 flex-1"
          >
            <Target className="w-4 h-4" />
            Gerenciar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}