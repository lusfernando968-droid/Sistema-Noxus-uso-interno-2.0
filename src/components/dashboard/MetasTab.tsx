import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Target, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trophy,
  Edit,
  Trash2,
  BarChart3,
  PieChart,
  Activity,
  Zap
} from "lucide-react";
import { useMetas, MetaComProgresso } from "@/hooks/useMetas";
import { Skeleton } from "@/components/ui/skeleton";

interface MetasTabProps {
  onCreateMeta?: () => void;
  onEditMeta?: (meta: MetaComProgresso) => void;
}

export function MetasTab({ onCreateMeta, onEditMeta }: MetasTabProps) {
  const { metas, metasStats, isLoading, deleteMeta } = useMetas();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPrioridade, setFilterPrioridade] = useState<string>("all");

  // Filtrar metas
  const filteredMetas = metas.filter(meta => {
    const matchesSearch = meta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meta.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === "all" || meta.categoria === filterCategoria;
    const matchesStatus = filterStatus === "all" || meta.status === filterStatus;
    const matchesPrioridade = filterPrioridade === "all" || meta.prioridade === filterPrioridade;

    return matchesSearch && matchesCategoria && matchesStatus && matchesPrioridade;
  });

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

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica': return 'bg-red-500 text-white';
      case 'alta': return 'bg-orange-500 text-white';
      case 'media': return 'bg-blue-500 text-white';
      case 'baixa': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (meta: MetaComProgresso) => {
    if (meta.percentual_progresso >= 100) return 'text-green-500';
    if (meta.status_calculado === 'vencida') return 'text-red-500';
    if (meta.status_calculado === 'proxima_vencimento') return 'text-orange-500';
    return 'text-blue-500';
  };

  const handleDeleteMeta = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      await deleteMeta(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Metas</p>
                <p className="text-2xl font-bold">{metasStats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{metasStats?.concluidas || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/20">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próx. Vencimento</p>
                <p className="text-2xl font-bold">{metasStats?.proximasVencimento || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progresso Médio</p>
                <p className="text-2xl font-bold">{metasStats?.progressoMedio.toFixed(0) || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles e Filtros */}
      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Gerenciar Metas
            </CardTitle>
            <Button onClick={onCreateMeta} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              Nova Meta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Seção de Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar metas por título ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-2xl border-2 border-muted/50 focus:border-primary/50 transition-all duration-200 text-base bg-background/50 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Seção de Filtros */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-muted-foreground">Filtros</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filtro de Categoria */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Categoria
                </label>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="rounded-xl border-2 border-muted/50 hover:border-muted transition-colors bg-background/50 backdrop-blur-sm">
                    <SelectValue placeholder="Todas categorias" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    <SelectItem value="all" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        Todas categorias
                      </div>
                    </SelectItem>
                    <SelectItem value="financeiro" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        Financeiro
                      </div>
                    </SelectItem>
                    <SelectItem value="clientes" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        Clientes
                      </div>
                    </SelectItem>
                    <SelectItem value="projetos" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>📋</span>
                        Projetos
                      </div>
                    </SelectItem>
                    <SelectItem value="vendas" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>📈</span>
                        Vendas
                      </div>
                    </SelectItem>
                    <SelectItem value="pessoal" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>🎯</span>
                        Pessoal
                      </div>
                    </SelectItem>
                    <SelectItem value="operacional" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>⚙️</span>
                        Operacional
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Status */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="rounded-xl border-2 border-muted/50 hover:border-muted transition-colors bg-background/50 backdrop-blur-sm">
                    <SelectValue placeholder="Todos status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    <SelectItem value="all" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
                        Todos status
                      </div>
                    </SelectItem>
                    <SelectItem value="ativa" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Ativa
                      </div>
                    </SelectItem>
                    <SelectItem value="pausada" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Pausada
                      </div>
                    </SelectItem>
                    <SelectItem value="concluida" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Concluída
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelada" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Cancelada
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Prioridade */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Prioridade
                </label>
                <Select value={filterPrioridade} onValueChange={setFilterPrioridade}>
                  <SelectTrigger className="rounded-xl border-2 border-muted/50 hover:border-muted transition-colors bg-background/50 backdrop-blur-sm">
                    <SelectValue placeholder="Todas prioridades" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    <SelectItem value="all" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-green-500"></div>
                        Todas prioridades
                      </div>
                    </SelectItem>
                    <SelectItem value="critica" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Crítica
                      </div>
                    </SelectItem>
                    <SelectItem value="alta" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        Alta
                      </div>
                    </SelectItem>
                    <SelectItem value="media" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Média
                      </div>
                    </SelectItem>
                    <SelectItem value="baixa" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Baixa
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Indicadores de Filtros Ativos */}
            {(filterCategoria !== 'all' || filterStatus !== 'all' || filterPrioridade !== 'all' || searchTerm) && (
              <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground">Filtros ativos:</span>
                    {searchTerm && (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        Busca: "{searchTerm}"
                      </Badge>
                    )}
                    {filterCategoria !== 'all' && (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {filterCategoria}
                      </Badge>
                    )}
                    {filterStatus !== 'all' && (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {filterStatus}
                      </Badge>
                    )}
                    {filterPrioridade !== 'all' && (
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {filterPrioridade}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterCategoria('all');
                      setFilterStatus('all');
                      setFilterPrioridade('all');
                    }}
                    className="text-xs rounded-lg"
                  >
                    Limpar filtros
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Lista de Metas */}
          {filteredMetas.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-2xl bg-muted/50 inline-block mb-4">
                <Target className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {metas.length === 0 ? 'Nenhuma meta criada' : 'Nenhuma meta encontrada'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {metas.length === 0 
                  ? 'Comece criando sua primeira meta para acompanhar seu progresso'
                  : 'Tente ajustar os filtros para encontrar suas metas'
                }
              </p>
              {metas.length === 0 && (
                <Button onClick={onCreateMeta} className="rounded-xl gap-2">
                  <Plus className="w-4 h-4" />
                  Criar primeira meta
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMetas.map((meta) => (
                <Card key={meta.id} className="rounded-xl hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Header da Meta */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg">{getCategoriaIcon(meta.categoria)}</span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate">{meta.titulo}</h3>
                            {meta.descricao && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {meta.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditMeta?.(meta)}
                            className="h-8 w-8 p-0 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMeta(meta.id)}
                            className="h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={`text-xs rounded-full ${getPrioridadeColor(meta.prioridade)}`}>
                          {meta.prioridade}
                        </Badge>
                        <Badge variant="outline" className="text-xs rounded-full">
                          {meta.categoria}
                        </Badge>
                        {meta.percentual_progresso >= 100 && (
                          <Badge className="text-xs rounded-full bg-green-500 text-white">
                            <Trophy className="w-3 h-3 mr-1" />
                            Concluída
                          </Badge>
                        )}
                      </div>

                      {/* Progresso */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {meta.valor_atual.toLocaleString()} / {meta.valor_meta.toLocaleString()} {meta.unidade}
                          </span>
                          <span className={`font-medium ${getStatusColor(meta)}`}>
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
                      </div>

                      {/* Informações de Prazo */}
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
                        {meta.status_calculado === 'vencida' && (
                          <div className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Vencida</span>
                          </div>
                        )}
                        {meta.status_calculado === 'proxima_vencimento' && (
                          <div className="flex items-center gap-1 text-orange-500">
                            <Clock className="w-3 h-3" />
                            <span>Próx. vencimento</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}