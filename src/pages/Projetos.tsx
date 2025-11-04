import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Edit, Calendar as CalendarIcon, LayoutGrid, List, Table2, 
  Search, DollarSign, Clock, Camera, MessageSquare, TrendingUp, Users,
  Eye, FileText, CheckCircle, AlertCircle, XCircle, PlayCircle
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
  planejamento: "bg-muted text-foreground",
  andamento: "bg-muted text-foreground",
  concluido: "bg-muted text-foreground",
  cancelado: "bg-muted text-foreground",
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
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Atualização de status (usado pelo Kanban)
  const handleStatusChange = async (projetoId: string, newStatus: Status) => {
    try {
      // Atualiza otimisticamente no estado local
      setProjetos((prev) => prev.map((p) => (p.id === projetoId ? { ...p, status: newStatus } : p)));

      // Persistir no Supabase
      const { error } = await supabase
        .from("projetos")
        .update({ status: newStatus })
        .eq("id", projetoId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Projeto movido para ${statusLabels[newStatus]}`,
      });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível alterar o status do projeto.",
        variant: "destructive",
      });
      // Em caso de erro, recarrega dados para voltar estado
      fetchProjetos();
    }
  };

  useEffect(() => {
    if (user) {
      fetchClientes();
      fetchProjetos();
    }
  }, [user, clienteIdFilter]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .order("nome");

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  const fetchProjetos = async () => {
    try {
      let query = supabase
        .from("projetos")
        .select(`
          *,
          clientes (
            nome
          )
        `)
        .order("created_at", { ascending: false });

      if (clienteIdFilter) {
        query = query.eq("cliente_id", clienteIdFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Simular dados calculados (em produção, viriam do banco ou seriam calculados)
      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as Status,
        valor_total: item.valor_total || Math.floor(Math.random() * 5000) + 1000,
        valor_pago: item.valor_pago || Math.floor(Math.random() * 3000),
        sessoes_total: Math.floor(Math.random() * 10) + 3,
        sessoes_realizadas: Math.floor(Math.random() * 5) + 1,
        fotos_count: Math.floor(Math.random() * 20) + 5,
        feedback_count: Math.floor(Math.random() * 8) + 2,
        progresso: Math.floor(Math.random() * 100),
      }));
      
      setProjetos(typedData);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      toast({
        title: "Erro ao carregar projetos",
        description: "Não foi possível carregar os projetos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  // Filtros
  const filteredProjetos = projetos.filter(projeto => {
    const matchesStatus = statusFilter === "all" || projeto.status === statusFilter;
    const matchesCliente = clienteFilter === "all" || projeto.cliente_id === clienteFilter;
    const matchesSearch = searchTerm === "" || 
      projeto.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // ===== Kanban =====
  const kanbanStatuses: Status[] = ["planejamento", "andamento", "concluido", "cancelado"];

  const renderKanbanCard = (projeto: Projeto) => {
    const StatusIcon = statusIcons[projeto.status];
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
            <Badge variant="outline" className={statusColors[projeto.status]}>
              {statusLabels[projeto.status]}
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
    const StatusIcon = statusIcons[projeto.status];
    const valorPendente = (projeto.valor_total || 0) - (projeto.valor_pago || 0);
    
    return (
      <Card key={projeto.id} className="rounded-xl hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <StatusIcon className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-lg line-clamp-1">{projeto.titulo}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusColors[projeto.status]}>
                  {statusLabels[projeto.status]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {projeto.clientes?.nome}
                </span>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => navigate(`/projetos/${projeto.id}`)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => handleOpenBuilder(projeto.id)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-destructive"
                onClick={() => handleDelete(projeto.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{projeto.progresso}%</span>
            </div>
            <Progress value={projeto.progresso} className="h-2" />
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Financeiro</span>
              </div>
              <div className="text-sm">
                <div className="font-medium text-foreground">
                  R$ {(projeto.valor_pago || 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  de R$ {(projeto.valor_total || 0).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sessões</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">
                  {projeto.sessoes_realizadas}/{projeto.sessoes_total}
                </div>
                <div className="text-xs text-muted-foreground">realizadas</div>
              </div>
            </div>
          </div>

          {/* Documentação */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                <span>{projeto.fotos_count} fotos</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>{projeto.feedback_count} feedbacks</span>
              </div>
            </div>
            {valorPendente > 0 && (
              <div className="text-foreground font-medium">
                R$ {valorPendente.toLocaleString()} pendente
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 rounded-lg"
              onClick={() => navigate(`/agendamentos?projeto=${projeto.id}`)}
            >
              <CalendarIcon className="w-3 h-3 mr-1" />
              Agendar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 rounded-lg"
              onClick={() => navigate(`/projetos/${projeto.id}`)}
            >
              <Eye className="w-3 h-3 mr-1" />
              Detalhes
            </Button>
          </div>
        </CardContent>
      </Card>
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
        <Card className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Projetos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <PlayCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{stats.andamento}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold">{stats.concluido}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">R$ {stats.valorTotal.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Pago</p>
                <p className="text-2xl font-bold">R$ {stats.valorPago.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Visualização */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              className="pl-10 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status | "all")}>
            <SelectTrigger className="w-full sm:w-48 rounded-lg">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="planejamento">Planejamento</SelectItem>
              <SelectItem value="andamento">Em Andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={clienteFilter} onValueChange={setClienteFilter}>
            <SelectTrigger className="w-full sm:w-48 rounded-lg">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
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
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="icon"
            className="rounded-lg"
            onClick={() => setViewMode("cards")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            className="rounded-lg"
            onClick={() => setViewMode("table")}
          >
            <Table2 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="icon"
            className="rounded-lg"
            onClick={() => setViewMode("kanban")}
          >
            <List className="w-4 h-4 rotate-90" />
          </Button>
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
      ) : viewMode === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjetos.map(renderProjectCard)}
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
                {filteredProjetos.map((projeto) => {
                  const StatusIcon = statusIcons[projeto.status];
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
                        <Badge variant="outline" className={statusColors[projeto.status]}>
                          {statusLabels[projeto.status]}
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
    </div>
  );
}
