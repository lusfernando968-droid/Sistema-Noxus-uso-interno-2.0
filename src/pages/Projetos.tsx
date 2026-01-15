import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus, Trash2, Edit, Calendar as CalendarIcon, LayoutGrid, List, Table2,
  Search, DollarSign, Clock, Camera, MessageSquare, TrendingUp, Users,
  Eye, FileText, CheckCircle, AlertCircle, XCircle, PlayCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ProjectBuilder } from "@/components/projetos/ProjectBuilder";
import { ProjetosSkeleton } from "@/components/ui/skeletons";

type Status = "planejamento" | "andamento" | "concluido" | "cancelado";

type Projeto = {
  id: string;
  titulo: string;
  descricao: string;
  status: Status;
  cliente_id: string;
  valor_total?: number;
  valor_pago?: number;
  data_inicio?: string;
  data_fim?: string;
  categoria?: string;
  observacoes?: string;
  conclusao_final?: string;
  created_at: string;
  clientes?: {
    nome: string;
  };
  // Dados calculados
  sessoes_total?: number;
  sessoes_realizadas?: number;
  fotos_count?: number;
  feedback_count?: number;
  progresso?: number;
  capa_url?: string;
};

type Cliente = {
  id: string;
  nome: string;
};

const statusLabels: Record<Status, string> = {
  planejamento: "Planejamento",
  andamento: "Em Andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const statusColors: Record<Status, string> = {
  planejamento: "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted/10",
  andamento: "bg-blue-500/15 text-blue-700 border-blue-200 hover:bg-blue-500/25",
  concluido: "bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/25",
  cancelado: "bg-red-500/15 text-red-700 border-red-200 hover:bg-red-500/25",
};

const statusIcons: Record<Status, any> = {
  planejamento: FileText,
  andamento: PlayCircle,
  concluido: CheckCircle,
  cancelado: XCircle,
};

export default function Projetos() {
  const [searchParams] = useSearchParams();
  const clienteIdFilter = searchParams.get("cliente");

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingProjetoId, setEditingProjetoId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table" | "kanban">("cards");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [clienteFilter, setClienteFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const { user, masterId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProjetos = async () => {
    // ... (logic remains same)
    if (!masterId) return; // Wait for masterId

    setLoading(true);

    try {
      // 1. Tenta buscar projetos via RPC otimizado (v4)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_projects_v4', { p_user_id: masterId });

      if (rpcError) throw rpcError;

      const projectsRaw = (rpcData as any[]) || [];

      // 2. Processa os dados recebidos
      const processedProjects = projectsRaw.map((item: any) => {
        const sessoesTotal = item.quantidade_sessoes || 0;
        const sessoesRealizadas = item.sessoes_realizadas || 0;

        // Cálculo de progresso
        let progressoCalc = 0;
        if (sessoesTotal > 0) {
          progressoCalc = Math.round((sessoesRealizadas / sessoesTotal) * 100);
          if (progressoCalc > 100) progressoCalc = 100;
        }

        return {
          ...item,
          status: item.status as Status,
          valor_total: item.valor_total || 0,
          valor_pago: item.valor_pago || 0,
          sessoes_total: sessoesTotal,
          sessoes_realizadas: sessoesRealizadas,
          fotos_count: item.fotos_count || 0,
          feedback_count: item.feedback_count || 0,
          progresso: progressoCalc,
        } as Projeto;
      });

      setProjetos(processedProjects);

    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
      toast({
        title: "Erro ao carregar projetos",
        description: "Não foi possível carregar a lista de projetos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    if (!masterId) return;
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .eq("user_id", masterId)
        .order("nome");

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  useEffect(() => {
    if (masterId) {
      fetchProjetos();
      fetchClientes();
    }
  }, [masterId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, clienteFilter, debouncedSearchTerm]); // Updated dependency

  const handleOpenBuilder = (projetoId?: string) => {
    setEditingProjetoId(projetoId);
    setBuilderOpen(true);
  };

  const handleBuilderSuccess = () => {
    fetchProjetos();
    setBuilderOpen(false);
    setEditingProjetoId(undefined);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("projetos").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Projeto removido!",
        description: "O projeto foi removido com sucesso.",
      });

      fetchProjetos();
    } catch (error) {
      console.error("Erro ao deletar projeto:", error);
      toast({
        title: "Erro ao remover projeto",
        description: "Não foi possível remover o projeto.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: Status) => {
    try {
      const { error } = await supabase
        .from("projetos")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status do projeto foi atualizado com sucesso.",
      });

      fetchProjetos();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  // Filtros
  const filteredProjetos = projetos.filter(projeto => {
    const matchesStatus = statusFilter === "all" || projeto.status === statusFilter;
    const matchesCliente = clienteFilter === "all" || projeto.cliente_id === clienteFilter;
    const matchesSearch = debouncedSearchTerm === "" || // Updated to use debounced term
      projeto.titulo.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      projeto.clientes?.nome.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    return matchesStatus && matchesCliente && matchesSearch;
  });

  // Estatísticas baseadas na lista filtrada
  const stats = {
    total: filteredProjetos.length,
    planejamento: filteredProjetos.filter(p => p.status === "planejamento").length,
    andamento: filteredProjetos.filter(p => p.status === "andamento").length,
    concluido: filteredProjetos.filter(p => p.status === "concluido").length,
    cancelado: filteredProjetos.filter(p => p.status === "cancelado").length,
    valorTotal: filteredProjetos.reduce((acc, p) => acc + (p.valor_total || 0), 0),
    valorPago: filteredProjetos.reduce((acc, p) => acc + (p.valor_pago || 0), 0),
  };

  // ===== Kanban =====
  const kanbanStatuses: Status[] = ["planejamento", "andamento", "concluido", "cancelado"];

  const renderKanbanCard = (projeto: Projeto) => {
    const StatusIcon = statusIcons[projeto.status] || AlertCircle;
    const statusColor = statusColors[projeto.status] || "bg-muted text-foreground";
    const statusLabel = statusLabels[projeto.status] || projeto.status;
    const valorPendente = (projeto.valor_total || 0) - (projeto.valor_pago || 0);
    return (
      <Card
        key={projeto.id}
        className="rounded-xl hover:shadow transition-all"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", projeto.id);
          e.dataTransfer.effectAllowed = "move";
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <StatusIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <CardTitle className="text-sm font-semibold truncate">{projeto.titulo}</CardTitle>
            </div>
            <Badge variant="outline" className={statusColor}>
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-muted-foreground truncate">{projeto.clientes?.nome}</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{projeto.progresso}%</span>
            </div>
            <Progress value={projeto.progresso} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="font-medium text-foreground">R$ {(projeto.valor_pago || 0).toLocaleString()}</div>
              <div className="text-muted-foreground">de R$ {(projeto.valor_total || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="font-medium text-foreground">R$ {valorPendente.toLocaleString()}</div>
              <div className="text-muted-foreground">pendente</div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigate(`/projetos/${projeto.id}`)}
              title="Abrir"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleOpenBuilder(projeto.id)}
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderKanbanColumn = (status: Status) => {
    const columnProjects = filteredProjetos.filter((p) => p.status === status);
    return (
      <div
        key={status}
        className="bg-muted/30 rounded-xl p-3 flex flex-col gap-3 min-h-[300px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const draggedId = e.dataTransfer.getData("text/plain");
          if (draggedId) {
            handleStatusChange(draggedId, status);
          }
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {status === "planejamento" && <FileText className="w-4 h-4 text-muted-foreground" />}
            {status === "andamento" && <PlayCircle className="w-4 h-4 text-muted-foreground" />}
            {status === "concluido" && <CheckCircle className="w-4 h-4 text-muted-foreground" />}
            {status === "cancelado" && <XCircle className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm font-medium">{statusLabels[status]}</span>
          </div>
          <Badge variant="outline" className="text-xs">{columnProjects.length}</Badge>
        </div>

        {columnProjects.length === 0 ? (
          <div className="text-xs text-muted-foreground py-8 text-center border border-dashed rounded-lg">
            Arraste projetos para cá
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {columnProjects.map(renderKanbanCard)}
          </div>
        )}
      </div>
    );
  };

  const renderProjectCard = (projeto: Projeto) => {
    const StatusIcon = statusIcons[projeto.status] || AlertCircle;
    const statusColor = statusColors[projeto.status] || "bg-muted text-foreground";
    const statusLabel = statusLabels[projeto.status] || projeto.status;
    const valorPendente = (projeto.valor_total || 0) - (projeto.valor_pago || 0);

    // Removed motion.div wrapper for performance
    return (
      <div key={projeto.id} className="h-full">
        <Card className="h-full rounded-2xl border border-muted/40 shadow-sm hover:shadow-xl transition-all duration-300 group bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">

          {projeto.capa_url && (
            <div className="w-full h-32 relative overflow-hidden">
              <img
                src={projeto.capa_url}
                alt={projeto.titulo}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            </div>
          )}

          <CardHeader className="pb-3 pt-5 relative">


            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor}`}>
                    {statusLabel}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                  {projeto.titulo}
                </CardTitle>
                <div
                  className="flex items-center gap-1.5 text-sm text-muted-foreground group/client cursor-pointer hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/clientes/${projeto.cliente_id}`);
                  }}
                  title="Ver perfil do cliente"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="truncate group-hover/client:underline">{projeto.clientes?.nome}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                  onClick={() => handleOpenBuilder(projeto.id)}
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(projeto.id)}
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pb-5">
            {/* Progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Progresso</span>
                <span className={projeto.progresso === 100 ? "text-emerald-500" : "text-primary"}>
                  {projeto.progresso}%
                </span>
              </div>
              <Progress
                value={projeto.progresso}
                className="h-2 rounded-full bg-muted/50"
              // Note: The inner bar color is controlled by the Progress component or CSS vars, 
              // generally adhering to --primary. We can rely on that or wrap it to customize.
              />
            </div>

            {/* Grid de Informações */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-muted/30">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pago</span>
                </div>
                <div className="font-semibold text-sm">
                  R$ {(projeto.valor_pago || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  de R$ {(projeto.valor_total || 0).toLocaleString()}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <CalendarIcon className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sessões</span>
                </div>
                <div className="font-semibold text-sm">
                  {projeto.sessoes_realizadas}/{projeto.sessoes_total}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  realizadas
                </div>
              </div>
            </div>

            {/* Footer / Ações */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <div className="flex -space-x-2 overflow-hidden">
                {/* Placeholder para avatares ou ícones extras, por enquanto apenas info */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pl-1">
                  <span className="flex items-center gap-1" title="Fotos">
                    <Camera className="w-3.5 h-3.5" /> {projeto.fotos_count}
                  </span>
                  <span className="flex items-center gap-1" title="Feedbacks">
                    <MessageSquare className="w-3.5 h-3.5" /> {projeto.feedback_count}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm" // smaller button
                  className="rounded-lg h-9 text-xs font-medium px-3"
                  onClick={() => navigate(`/projetos/${projeto.id}`)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Detalhes
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-lg h-9 text-xs font-medium shadow-sm bg-primary hover:bg-primary/90"
                  onClick={() => navigate(`/agendamentos?projeto=${projeto.id}`)}
                >
                  Agendar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">Gerencie os projetos dos seus clientes</p>
        </div>

        <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenBuilder()} className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProjetoId ? "Editar Projeto" : "Novo Projeto"}
              </DialogTitle>
            </DialogHeader>
            <ProjectBuilder
              open={builderOpen}
              onOpenChange={setBuilderOpen}
              projetoId={editingProjetoId}
              clientes={clientes}
              onSuccess={handleBuilderSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            title: "Total",
            value: stats.total,
            icon: FileText,
            color: "text-muted-foreground",
            bgColor: "bg-muted/50",
            subtitle: "Cadastrados"
          },
          {
            title: "Em Andamento",
            value: stats.andamento,
            icon: PlayCircle,
            color: "text-primary",
            bgColor: "bg-primary/10",
            subtitle: "Ativos"
          },
          {
            title: "Concluídos",
            value: stats.concluido,
            icon: CheckCircle,
            color: "text-muted-foreground",
            bgColor: "bg-muted/50",
            subtitle: "Finalizados"
          },
          {
            title: "Total",
            value: `R$ ${(stats.valorTotal / 1000).toFixed(1)}K`,
            icon: DollarSign,
            color: "text-muted-foreground",
            bgColor: "bg-muted/50",
            subtitle: "Valor Total"
          },
          {
            title: "Recebido",
            value: `R$ ${(stats.valorPago / 1000).toFixed(1)}K`,
            icon: TrendingUp,
            color: "text-muted-foreground",
            bgColor: "bg-muted/50",
            subtitle: "Valor Pago"
          }
        ].map((stat) => (
          <div
            key={stat.title}
          >
            <Card className="rounded-2xl border shadow-sm bg-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${stat.bgColor} shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                  <p className="text-xl font-bold tracking-tight text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Filtros e Visualização */}
      <div className="bg-background border rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos..."
                className="pl-10 rounded-xl bg-background border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status | "all")}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl bg-background border-muted-foreground/20">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="planejamento">Planejamento</SelectItem>
                <SelectItem value="andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={clienteFilter} onValueChange={setClienteFilter}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl bg-background border-muted-foreground/20">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            {/* Pagination Controls */}
            {filteredProjetos.length > itemsPerPage && viewMode !== "kanban" && (
              <div className="flex items-center gap-1 bg-background border rounded-xl p-1 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-2 min-w-[3rem] text-center text-muted-foreground">
                  {currentPage} / {Math.ceil(filteredProjetos.length / itemsPerPage)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredProjetos.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(filteredProjetos.length / itemsPerPage)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                className={`rounded-lg transition-all ${viewMode === "cards" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setViewMode("cards")}
                title="Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className={`rounded-lg transition-all ${viewMode === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setViewMode("table")}
                title="Lista"
              >
                <Table2 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                className={`rounded-lg transition-all ${viewMode === "kanban" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setViewMode("kanban")}
                title="Kanban"
              >
                <List className="w-4 h-4 rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {filteredProjetos.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-2">Nenhum projeto encontrado</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" || clienteFilter !== "all"
                ? "Tente ajustar os filtros ou criar um novo projeto"
                : "Comece criando seu primeiro projeto"
              }
            </p>
            <Button onClick={() => handleOpenBuilder()} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "cards" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjetos
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(renderProjectCard)}
            </div>
          ) : viewMode === "kanban" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {kanbanStatuses
                .filter((s) => (statusFilter === "all" ? true : s === statusFilter))
                .map(renderKanbanColumn)}
            </div>
          ) : (
            <Card className="rounded-xl">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Sessões</TableHead>
                      <TableHead>Documentação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjetos
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((projeto) => {
                        const StatusIcon = statusIcons[projeto.status] || AlertCircle;
                        const statusColor = statusColors[projeto.status] || "bg-muted text-foreground";
                        const statusLabel = statusLabels[projeto.status] || projeto.status;
                        return (
                          <TableRow key={projeto.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <StatusIcon className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{projeto.titulo}</div>
                                  <div className="text-sm text-muted-foreground line-clamp-1">
                                    {projeto.descricao}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{projeto.clientes?.nome}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColor}>
                                {statusLabel}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={projeto.progresso} className="h-2 w-16" />
                                <span className="text-sm">{projeto.progresso}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium text-foreground">
                                  R$ {(projeto.valor_pago || 0).toLocaleString()}
                                </div>
                                <div className="text-muted-foreground">
                                  de R$ {(projeto.valor_total || 0).toLocaleString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{projeto.sessoes_realizadas}/{projeto.sessoes_total}</div>
                                <div className="text-muted-foreground">realizadas</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Camera className="w-3 h-3" />
                                  {projeto.fotos_count}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {projeto.feedback_count}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => navigate(`/projetos/${projeto.id}`)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleOpenBuilder(projeto.id)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDelete(projeto.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* Pagination Controls */}
        </>
      )}
    </div>
  );
}
