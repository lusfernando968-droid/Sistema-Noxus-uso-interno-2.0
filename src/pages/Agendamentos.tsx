import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Plus, Edit, Trash2, Clock, User, MapPin, CheckCircle, AlertCircle, CalendarDays, List, Search } from "lucide-react";
import { useToastWithSound } from "@/hooks/useToastWithSound";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useAchievementNotifications } from "@/hooks/useAchievementNotifications";
import { CalendarView } from "@/components/calendar/CalendarView";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Interfaces
interface Agendamento {
  id: string;
  cliente_nome: string;
  cliente_id: string;
  data_agendamento: string;
  hora_inicio: string;
  hora_fim: string;
  servico: string;
  status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
  observacoes: string;
  valor_estimado: number;
  tatuador: string;
  local: string;
}

export default function Agendamentos() {
  const { toast } = useToastWithSound();
  const { playSound } = useSoundEffects();
  const { checkAgendamentosMilestone } = useAchievementNotifications();
  const { user } = useAuth();

  // Estados
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [projetos, setProjetos] = useState<{ id: string; nome: string; valor_por_sessao?: number }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState('');

  const [formData, setFormData] = useState<{
    cliente_nome: string;
    cliente_id: string;
    data_agendamento: string;
    hora_inicio: string;
    hora_fim: string;
    servico: string;
    status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
    observacoes: string;
    valor_estimado: number;
    tatuador: string;
    local: string;
  }>({
    cliente_nome: "",
    cliente_id: "",
    data_agendamento: "",
    hora_inicio: "",
    hora_fim: "",
    servico: "",
    status: "agendado",
    observacoes: "",
    valor_estimado: 0,
    tatuador: "",
    local: "Estúdio Principal"
  });

  // Buscar lista de clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("id, nome")
          .order("nome");
        if (error) throw error;
        setClientes(data || []);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
      }
    };
    fetchClientes();
  }, []);

  // Buscar lista de projetos
  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        const { data, error } = await supabase
          .from("projetos")
          .select("id, nome, valor_por_sessao")
          .order("nome");
        if (error) throw error;
        setProjetos(data || []);
      } catch (err) {
        console.error("Erro ao buscar projetos:", err);
      }
    };
    fetchProjetos();
  }, []);

  // Dados simulados iniciais
  useEffect(() => {
    const agendamentosIniciais: Agendamento[] = [
      {
        id: "1",
        cliente_nome: "Ana Silva",
        cliente_id: "1",
        data_agendamento: "2024-01-15",
        hora_inicio: "14:00",
        hora_fim: "17:00",
        servico: "Tatuagem Braço",
        status: "confirmado",
        observacoes: "Primeira sessão - desenho floral",
        valor_estimado: 450.00,
        tatuador: "João Silva",
        local: "Estúdio Principal"
      },
      {
        id: "2",
        cliente_nome: "Carlos Santos",
        cliente_id: "2", 
        data_agendamento: "2024-01-16",
        hora_inicio: "10:00",
        hora_fim: "12:00",
        servico: "Retoque",
        status: "agendado",
        observacoes: "Retoque na tatuagem das costas",
        valor_estimado: 150.00,
        tatuador: "Maria Santos",
        local: "Estúdio Secundário"
      }
    ];

    setAgendamentos(agendamentosIniciais);
    checkAgendamentosMilestone(agendamentosIniciais.length);
  }, [checkAgendamentosMilestone]);

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-primary/10 text-primary border-primary/20';
      case 'confirmado': return 'bg-primary/10 text-primary border-primary/20';
      case 'em_andamento': return 'bg-primary/10 text-primary border-primary/20';
      case 'concluido': return 'bg-success/10 text-success border-success/20';
      case 'cancelado': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'confirmado': return 'Confirmado';
      case 'em_andamento': return 'Em Andamento';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'agendado': return <Calendar className="w-4 h-4" />;
      case 'confirmado': return <CheckCircle className="w-4 h-4" />;
      case 'em_andamento': return <Clock className="w-4 h-4" />;
      case 'concluido': return <CheckCircle className="w-4 h-4" />;
      case 'cancelado': return <AlertCircle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  // Filtros
  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    const matchStatus = filtroStatus === 'todos' || agendamento.status === filtroStatus;
    const matchBusca = agendamento.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
                      agendamento.servico.toLowerCase().includes(busca.toLowerCase()) ||
                      agendamento.tatuador.toLowerCase().includes(busca.toLowerCase());
    
    return matchStatus && matchBusca;
  });

  // Métricas
  const totalAgendamentos = agendamentos.length;
  const agendamentosHoje = agendamentos.filter(a => {
    const hoje = new Date().toISOString().split('T')[0];
    return a.data_agendamento === hoje;
  }).length;
  const agendamentosConfirmados = agendamentos.filter(a => a.status === 'confirmado').length;
  const agendamentosConcluidos = agendamentos.filter(a => a.status === 'concluido').length;

  // Lista de agendamentos apenas do dia atual
  const agendamentosDoDia = agendamentos
    .filter(a => a.data_agendamento === new Date().toISOString().split('T')[0])
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  // Confirmar sessão realizada: atualiza status local e registra em tabelas relacionadas
  const handleConfirmSessao = async (agendamento: Agendamento) => {
    try {
      playSound('success');

      // Atualiza status local para concluído
      setAgendamentos(prev => prev.map(a => a.id === agendamento.id ? { ...a, status: 'concluido' } : a));

      // Se não estiver logado, apenas feedback visual
      if (!user) {
        toast({ title: 'Sessão confirmada localmente', description: 'Faça login para registrar nas tabelas.' });
        return;
      }

      // Encontrar projeto pelo nome selecionado no agendamento (campo tatuador armazena o nome do projeto)
      const projeto = projetos.find(p => p.nome === agendamento.tatuador);

      // Registrar sessão do projeto, se conseguirmos resolver o projeto
      if (projeto?.id) {
        // Descobrir próximo número de sessão
        const { data: sessoesExistentes, error: countError } = await supabase
          .from('projeto_sessoes')
          .select('id')
          .eq('projeto_id', projeto.id);

        if (countError) throw countError;

        const numeroSessao = (sessoesExistentes?.length || 0) + 1;

        const { error: sessaoError } = await supabase
          .from('projeto_sessoes')
          .insert({
            projeto_id: projeto.id,
            agendamento_id: null,
            numero_sessao: numeroSessao,
            data_sessao: agendamento.data_agendamento,
            valor_sessao: agendamento.valor_estimado || null,
            status_pagamento: 'pendente',
            metodo_pagamento: null,
            observacoes_tecnicas: agendamento.observacoes || null,
          });

        if (sessaoError) throw sessaoError;
      }

      // Registrar transação (receita) referente à sessão
      if (agendamento.valor_estimado && agendamento.valor_estimado > 0) {
        const { error: transacaoError } = await supabase
          .from('transacoes')
          .insert({
            user_id: user.id,
            tipo: 'RECEITA',
            categoria: 'Serviços',
            valor: agendamento.valor_estimado,
            data_vencimento: agendamento.data_agendamento,
            descricao: `Sessão realizada: ${agendamento.servico}`,
            agendamento_id: null,
          });

        if (transacaoError) throw transacaoError;
      }

      toast({ title: 'Sessão confirmada!', description: 'Registro salvo nas tabelas relacionadas.' });
    } catch (err) {
      console.error('Erro ao confirmar sessão:', err);
      toast({ title: 'Erro ao confirmar sessão', description: 'Tente novamente mais tarde.' });
    }
  };

  // Handlers
  const handleSubmit = () => {
    playSound('click');
    // Preserva a posição de rolagem do container principal
    const scrollContainer = document.querySelector('main.flex-1') as HTMLElement | null;
    const prevScrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
    
    if (editingAgendamento) {
      // Editando agendamento existente
      const agendamentoAtualizado: Agendamento = {
        ...editingAgendamento,
        ...formData
      };
      setAgendamentos(prev => prev.map(a => a.id === editingAgendamento.id ? agendamentoAtualizado : a));
      toast({ title: "Agendamento atualizado com sucesso!" });
    } else {
      // Criando novo agendamento
      const novoAgendamento: Agendamento = {
        id: Date.now().toString(),
        ...formData
      };
      setAgendamentos(prev => {
        const novosAgendamentos = [...prev, novoAgendamento];
        checkAgendamentosMilestone(novosAgendamentos.length);
        return novosAgendamentos;
      });
      toast({ title: "Agendamento criado com sucesso!" });
    }

    setIsDialogOpen(false);
    setEditingAgendamento(null);
    setFormData({
      cliente_nome: "",
      cliente_id: "",
      data_agendamento: "",
      hora_inicio: "",
      hora_fim: "",
      servico: "",
      status: "agendado",
      observacoes: "",
      valor_estimado: 0,
      tatuador: "",
      local: "Estúdio Principal"
    });

    // Restaura a rolagem após o re-render
    requestAnimationFrame(() => {
      if (scrollContainer) {
        scrollContainer.scrollTop = prevScrollTop;
      } else {
        window.scrollTo(0, prevScrollTop);
      }
    });
  };

  const handleEdit = (agendamento: Agendamento) => {
    playSound('click');
    setEditingAgendamento(agendamento);
    setFormData({
      cliente_nome: agendamento.cliente_nome,
      cliente_id: agendamento.cliente_id,
      data_agendamento: agendamento.data_agendamento,
      hora_inicio: agendamento.hora_inicio,
      hora_fim: agendamento.hora_fim,
      servico: agendamento.servico,
      status: agendamento.status,
      observacoes: agendamento.observacoes,
      valor_estimado: agendamento.valor_estimado,
      tatuador: agendamento.tatuador,
      local: agendamento.local
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    playSound('click');
    setAgendamentos(prev => prev.filter(a => a.id !== id));
    toast({ title: "Agendamento removido com sucesso!" });
  };

  const handleStatusChange = (id: string, novoStatus: string) => {
    playSound('click');
    setAgendamentos(prev => prev.map(a => 
      a.id === id ? { ...a, status: novoStatus as any } : a
    ));
    toast({ title: `Status alterado para ${getStatusLabel(novoStatus)}` });
  };

  // Funções do calendário
  const handleAppointmentMove = (appointmentId: string, newDate: string) => {
    playSound('success');
    setAgendamentos(prev => prev.map(a => 
      a.id === appointmentId ? { ...a, data_agendamento: newDate } : a
    ));
    toast({ title: "Agendamento movido com sucesso!" });
  };

  const handleAppointmentClick = (appointment: Agendamento) => {
    handleEdit(appointment);
  };

  const handleDateClick = (date: string) => {
    setFormData(prev => ({ ...prev, data_agendamento: date }));
    setIsDialogOpen(true);
  };

  // Helpers de moeda BRL para o campo Valor Estimado
  const formatCurrencyBR = (value: number) => {
    if (!isFinite(value)) return "";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleValorEstimadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    const cents = parseInt(digitsOnly || "0", 10);
    const value = cents / 100;
    setFormData(prev => ({ ...prev, valor_estimado: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              Agendamentos
            </h1>
            <p className="text-muted-foreground">
              Gerencie sessões de tatuagem e compromissos
            </p>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{totalAgendamentos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold text-primary">{agendamentosHoje}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Confirmados</p>
                  <p className="text-2xl font-bold text-primary">{agendamentosConfirmados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold text-primary">{agendamentosConcluidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agendamentos de Hoje */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Agendamentos de Hoje</CardTitle>
            <CardDescription>Mostra apenas os compromissos do dia atual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {agendamentosDoDia.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>
            ) : (
              agendamentosDoDia.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {a.cliente_nome} — {a.servico}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {a.hora_inicio} - {a.hora_fim} • {format(parse(a.data_agendamento, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(a.status)}>
                    {getStatusLabel(a.status)}
                  </Badge>
                  {a.status !== 'concluido' && a.status !== 'cancelado' && (
                    <Button size="sm" className="ml-3 rounded-xl" onClick={() => handleConfirmSessao(a)}>
                      Confirmar Sessão
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Visualizações de Agendamentos (TabsList acima dos filtros) */}

        {/* Visualizações de Agendamentos */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <div className="flex justify-center mb-4">
            <TabsList className="inline-flex w-auto rounded-2xl bg-gradient-to-r from-muted/30 to-muted/10 p-1.5 backdrop-blur-sm border border-border/20 shadow-lg">
              <TabsTrigger value="calendar" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">
                <CalendarDays className="w-5 h-5 transition-colors" />
                <span className="font-medium text-sm hidden sm:inline">Visualização em Calendário</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="rounded-xl gap-2 px-4 py-2.5 transition-all duration-300 hover:scale-105 active:scale-95 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-muted/50 flex items-center">
                <List className="w-5 h-5 transition-colors" />
                <span className="font-medium text-sm hidden sm:inline">Visualização em Lista</span>
              </TabsTrigger>
          </TabsList>
          </div>

          {/* Filtros e Busca */}
          <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por cliente, serviço ou projeto..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-10 rounded-lg border-muted/50 bg-background/50 backdrop-blur-sm h-9"
                    />
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="rounded-lg h-9">Filtros</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[360px] rounded-xl p-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="todos">Todos Status</SelectItem>
                              <SelectItem value="agendado">Agendado</SelectItem>
                              <SelectItem value="confirmado">Confirmado</SelectItem>
                              <SelectItem value="em_andamento">Em Andamento</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
                              <SelectItem value="cancelado">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="ghost" className="rounded-xl" onClick={() => setFiltroStatus('todos')}>Limpar</Button>
                          <Button className="rounded-xl">Aplicar</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => playSound('click')} className="rounded-lg gap-2 h-9 px-3">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Novo Agendamento</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="max-w-2xl"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    <DialogHeader>
                      <DialogTitle>{editingAgendamento ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
                    </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cliente</Label>
                      <Select
                        value={formData.cliente_id}
                        onValueChange={(value) => {
                          const c = clientes.find((cl) => cl.id === value);
                          setFormData(prev => ({
                            ...prev,
                            cliente_id: value,
                            cliente_nome: c?.nome || ""
                          }))
                        }}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Serviço</Label>
                      <Select
                        value={formData.servico}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, servico: value }))}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Continuação">Continuação</SelectItem>
                          <SelectItem value="Retoque">Retoque</SelectItem>
                          <SelectItem value="Orçamento">Orçamento</SelectItem>
                          <SelectItem value="Início de projeto">Início de projeto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-9 w-full justify-start text-left font-normal rounded-xl"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {formData.data_agendamento
                              ? format(
                                  parse(formData.data_agendamento, "yyyy-MM-dd", new Date()),
                                  "dd/MM/yyyy",
                                  { locale: ptBR }
                                )
                              : "dd/mm/aaaa"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComp
                            mode="single"
                            selected={formData.data_agendamento ? parse(formData.data_agendamento, "yyyy-MM-dd", new Date()) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setFormData(prev => ({ ...prev, data_agendamento: format(date, "yyyy-MM-dd") }));
                              }
                            }}
                            locale={ptBR}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>Projeto</Label>
                      <Select
                        value={formData.tatuador}
                        onValueChange={(value) => {
                          const p = projetos.find((pr) => pr.nome === value) || projetos.find((pr) => pr.id === value);
                          setFormData(prev => ({
                            ...prev,
                            tatuador: p?.nome || value,
                            // Preenche o valor estimado com o valor por sessão do projeto, se existir
                            valor_estimado: typeof p?.valor_por_sessao === 'number' ? (p!.valor_por_sessao as number) : prev.valor_estimado
                          }))
                        }}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecione o projeto" />
                        </SelectTrigger>
                        <SelectContent>
                          {projetos.map((projeto) => (
                            <SelectItem key={projeto.id} value={projeto.nome}>
                              {projeto.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Hora Início</Label>
                      <Input
                        type="time"
                        value={formData.hora_inicio}
                        onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Hora Fim</Label>
                      <Input
                        type="time"
                        value={formData.hora_fim}
                        onChange={(e) => setFormData(prev => ({ ...prev, hora_fim: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Valor Estimado</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatCurrencyBR(formData.valor_estimado)}
                        onChange={handleValorEstimadoChange}
                        placeholder="R$ 0,00"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={formData.observacoes}
                        onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                        className="rounded-xl"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      playSound('click');
                      setIsDialogOpen(false);
                      setEditingAgendamento(null);
                    }} className="rounded-xl">
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmit} className="rounded-xl">
                      {editingAgendamento ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </DialogContent>
                </Dialog>
              </div>

          {/* Aba do Calendário */}
          <TabsContent value="calendar" className="space-y-6">
            <CalendarView
              appointments={agendamentosFiltrados}
              onAppointmentMove={handleAppointmentMove}
              onAppointmentClick={handleAppointmentClick}
              onDateClick={handleDateClick}
            />
          </TabsContent>

          {/* Aba da Lista */}
          <TabsContent value="list" className="space-y-6">
            <Card className="rounded-2xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agendamentosFiltrados.map((agendamento) => (
                      <TableRow key={agendamento.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{agendamento.cliente_nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{format(parse(agendamento.data_agendamento, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy', { locale: ptBR })}</p>
                            <p className="text-sm text-muted-foreground">
                              {agendamento.hora_inicio} - {agendamento.hora_fim}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{agendamento.servico}</TableCell>
                        <TableCell>{agendamento.tatuador}</TableCell>
                        <TableCell>
                          <Select value={agendamento.status} onValueChange={(value) => handleStatusChange(agendamento.id, value)}>
                            <SelectTrigger className="w-32 rounded-xl">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(agendamento.status)}
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="agendado">Agendado</SelectItem>
                              <SelectItem value="confirmado">Confirmado</SelectItem>
                              <SelectItem value="em_andamento">Em Andamento</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
                              <SelectItem value="cancelado">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{formatCurrencyBR(agendamento.valor_estimado)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(agendamento)}
                              className="rounded-xl"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(agendamento.id)}
                              className="rounded-xl text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            {agendamento.status !== 'concluido' && agendamento.status !== 'cancelado' && (
                              <Button
                                variant="default"
                                onClick={() => handleConfirmSessao(agendamento)}
                                className="rounded-xl"
                              >
                                Confirmar Sessão
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}