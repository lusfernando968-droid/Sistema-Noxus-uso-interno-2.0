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
import { Calendar, Plus, Edit, Trash2, Clock, User, MapPin, CheckCircle, AlertCircle, CalendarDays, List } from "lucide-react";
import { useToastWithSound } from "@/hooks/useToastWithSound";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useAchievementNotifications } from "@/hooks/useAchievementNotifications";
import { CalendarView } from "@/components/calendar/CalendarView";

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

  // Estados
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
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
      case 'agendado': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'confirmado': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'em_andamento': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'concluido': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'cancelado': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
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

  // Handlers
  const handleSubmit = () => {
    playSound('click');
    
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
                <Calendar className="w-5 h-5 text-blue-500" />
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
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold text-orange-500">{agendamentosHoje}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Confirmados</p>
                  <p className="text-2xl font-bold text-green-500">{agendamentosConfirmados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold text-purple-500">{agendamentosConcluidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por cliente, serviço ou tatuador..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-full md:w-48 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => playSound('click')} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingAgendamento ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cliente</Label>
                      <Input
                        value={formData.cliente_nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Serviço</Label>
                      <Input
                        value={formData.servico}
                        onChange={(e) => setFormData(prev => ({ ...prev, servico: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={formData.data_agendamento}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_agendamento: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Tatuador</Label>
                      <Input
                        value={formData.tatuador}
                        onChange={(e) => setFormData(prev => ({ ...prev, tatuador: e.target.value }))}
                        className="rounded-xl"
                      />
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
                        type="number"
                        step="0.01"
                        value={formData.valor_estimado}
                        onChange={(e) => setFormData(prev => ({ ...prev, valor_estimado: parseFloat(e.target.value) || 0 }))}
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
          </CardContent>
        </Card>

        {/* Visualizações de Agendamentos */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl">
            <TabsTrigger value="calendar" className="rounded-xl flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Visualização em Calendário
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-xl flex items-center gap-2">
              <List className="w-4 h-4" />
              Visualização em Lista
            </TabsTrigger>
          </TabsList>

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
                      <TableHead>Tatuador</TableHead>
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
                            <p className="font-medium">{new Date(agendamento.data_agendamento).toLocaleDateString()}</p>
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
                        <TableCell>R$ {agendamento.valor_estimado.toFixed(2)}</TableCell>
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