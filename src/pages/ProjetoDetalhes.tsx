import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Calendar, DollarSign, User, Clock, FileText, Image, CheckCircle, MessageSquare, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackManager } from "@/components/projetos/FeedbackManager";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";

// Interfaces
interface Projeto {
  id: string;
  titulo: string;
  descricao: string;
  cliente_nome: string;
  cliente_id: string;
  status: 'planejamento' | 'andamento' | 'pausado' | 'concluido' | 'cancelado';
  data_inicio: string;
  data_fim?: string;
  valor_total: number;
  valor_pago: number;
  categoria: string;
  prioridade: 'baixa' | 'media' | 'alta';
  observacoes: string;
  quantidade_sessoes: number;
}

interface Sessao {
  id: string;
  data: string;
  duracao: number;
  descricao: string;
  valor: number;
  status: 'agendada' | 'concluida' | 'cancelada';
  feedback_cliente?: string;
  observacoes_tecnicas?: string;
  avaliacao?: number;
  agendamento_id?: string | null;
  numero_sessao?: number;
}

interface AgendamentoProjeto {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
  descricao?: string;
}

export default function ProjetoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoProjeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAgendamentosDialogOpen, setIsAgendamentosDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [agendamentoToCancel, setAgendamentoToCancel] = useState<AgendamentoProjeto | null>(null);
  const [editingAgendamento, setEditingAgendamento] = useState<AgendamentoProjeto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ titulo: string; descricao: string; data: string; hora: string; status: AgendamentoProjeto['status'] }>({
    titulo: '',
    descricao: '',
    data: '',
    hora: '',
    status: 'agendado'
  });

  // Edição de sessão
  const [editingSessao, setEditingSessao] = useState<Sessao | null>(null);
  const [editSessaoDialogOpen, setEditSessaoDialogOpen] = useState(false);
  const [editSessaoForm, setEditSessaoForm] = useState<{ data: string; valor: number; descricao: string; status: Sessao['status'] }>({
    data: '',
    valor: 0,
    descricao: '',
    status: 'agendada'
  });
  const [manualSessaoDialogOpen, setManualSessaoDialogOpen] = useState(false);
  const [manualSessaoForm, setManualSessaoForm] = useState<{ data: string; valor: number; descricao: string; status: Sessao['status'] }>({
    data: '',
    valor: 0,
    descricao: '',
    status: 'concluida'
  });
  const [editSessaoCalendarOpen, setEditSessaoCalendarOpen] = useState(false);
  const [manualSessaoCalendarOpen, setManualSessaoCalendarOpen] = useState(false);
  const parseDateOnly = (s: string) => {
    const [y, m, d] = (s || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
  };

  const abrirEdicaoSessao = (s: Sessao) => {
    setEditingSessao(s);
    setEditSessaoForm({
      data: s.data || '',
      valor: s.valor || 0,
      descricao: s.descricao || '',
      status: s.status || 'agendada'
    });
    setEditSessaoDialogOpen(true);
  };

  const mapSessaoStatusToPagamento = (status: Sessao['status']) => {
    switch (status) {
      case 'concluida':
        return 'pago';
      case 'cancelada':
        return 'cancelado';
      default:
        return 'pendente';
    }
  };

  // Normaliza a descrição para ajustar rótulos antigos como "Local:" para o novo texto
  const formatDescricao = (d?: string) => {
    if (!d) return '';
    return d.replace(/^Local:\s*/i, 'Estúdio: ');
  };

  // Usa a observação/descrição do agendamento vinculado, se existir
  const getSessaoDescricao = (s: Sessao) => {
    const ag = agendamentos.find(a => a.id === (s.agendamento_id || ''));
    const texto = ag?.descricao || s.descricao || '';
    return formatDescricao(texto);
  };

  const salvarEdicaoSessao = async () => {
    if (!editingSessao) return;
    try {
      const { error } = await supabase
        .from('projeto_sessoes')
        .update({
          data_sessao: editSessaoForm.data,
          valor_sessao: editSessaoForm.valor,
          observacoes_tecnicas: editSessaoForm.descricao,
          status_pagamento: mapSessaoStatusToPagamento(editSessaoForm.status),
        })
        .eq('id', editingSessao.id);
      if (error) throw error;

      setSessoes(prev => prev.map(s => s.id === editingSessao.id ? {
        ...s,
        data: editSessaoForm.data,
        valor: editSessaoForm.valor,
        descricao: editSessaoForm.descricao,
        status: editSessaoForm.status,
      } : s));

      setEditSessaoDialogOpen(false);
      setEditingSessao(null);
      toast({ title: 'Sessão atualizada', description: 'As alterações foram salvas.' });

      // Atualizar status automaticamente
      if (projeto) {
        const sessoesCompletas = sessoes.filter(s => s.status === 'concluida').length;
        const totalPlanejadas = projeto.quantidade_sessoes || sessoes.length || 0;
        await atualizarStatusAutomatico(sessoesCompletas, totalPlanejadas);
      }
    } catch (err) {
      console.error('Erro ao salvar edição da sessão:', err);
      toast({ title: 'Erro ao salvar sessão', description: String(err), variant: 'destructive' });
    }
  };

  const registrarSessaoManual = async () => {
    try {
      const { data: sessoesExistentes, error: countError } = await supabase
        .from('projeto_sessoes')
        .select('id')
        .eq('projeto_id', id);
      if (countError) throw countError;
      const numeroSessao = (sessoesExistentes?.length || 0) + 1;
      const { error: insertErr } = await supabase
        .from('projeto_sessoes')
        .insert({
          projeto_id: id,
          agendamento_id: null,
          numero_sessao: numeroSessao,
          data_sessao: manualSessaoForm.data,
          valor_sessao: manualSessaoForm.valor,
          status_pagamento: mapSessaoStatusToPagamento(manualSessaoForm.status),
          metodo_pagamento: null,
          observacoes_tecnicas: manualSessaoForm.descricao || null,
        });
      if (insertErr) throw insertErr;
      setSessoes(prev => [...prev, {
        id: crypto.randomUUID(),
        data: manualSessaoForm.data,
        duracao: 120,
        descricao: manualSessaoForm.descricao,
        valor: manualSessaoForm.valor,
        status: manualSessaoForm.status,
        numero_sessao: numeroSessao,
      }]);
      setManualSessaoDialogOpen(false);
      setManualSessaoForm({ data: '', valor: 0, descricao: '', status: 'concluida' });
      toast({ title: 'Sessão registrada', description: 'Sessão adicionada ao histórico.' });

      // Atualizar status automaticamente
      if (projeto) {
        const sessoesCompletas = [...sessoes, { status: manualSessaoForm.status }].filter(s => s.status === 'concluida').length;
        const totalPlanejadas = projeto.quantidade_sessoes || sessoes.length + 1 || 0;
        await atualizarStatusAutomatico(sessoesCompletas, totalPlanejadas);
      }
    } catch (err) {
      toast({ title: 'Erro ao registrar sessão', description: String(err), variant: 'destructive' });
    }
  };

  // Atualiza automaticamente o status do projeto baseado no progresso
  const atualizarStatusAutomatico = async (sessoesCompletas: number, totalPlanejadas: number) => {
    if (!id || totalPlanejadas === 0) return;

    const progresso = (sessoesCompletas / totalPlanejadas) * 100;
    let novoStatus: Projeto['status'];

    if (progresso === 0) {
      novoStatus = 'planejamento';
    } else if (progresso >= 100) {
      novoStatus = 'concluido';
    } else {
      novoStatus = 'andamento';
    }

    // Atualiza o status no banco de dados
    const { error } = await supabase
      .from('projetos')
      .update({ status: novoStatus })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar status do projeto:', error);
      return;
    }

    // Atualiza o estado local
    setProjeto(prev => prev ? { ...prev, status: novoStatus } : null);
  };

  // Exclusão de sessão
  const [deleteSessaoDialogOpen, setDeleteSessaoDialogOpen] = useState(false);
  const [sessaoToDelete, setSessaoToDelete] = useState<Sessao | null>(null);

  const solicitarExclusaoSessao = (s: Sessao) => {
    setSessaoToDelete(s);
    setDeleteSessaoDialogOpen(true);
  };

  const excluirSessao = async () => {
    if (!sessaoToDelete) return;
    try {
      const { error } = await supabase
        .from('projeto_sessoes')
        .delete()
        .eq('id', sessaoToDelete.id);
      if (error) throw error;

      setSessoes(prev => prev.filter(s => s.id !== sessaoToDelete.id));
      setDeleteSessaoDialogOpen(false);
      setSessaoToDelete(null);
      toast({ title: 'Sessão excluída', description: 'O histórico foi removido.' });

      // Atualizar status automaticamente
      if (projeto) {
        const sessoesCompletas = sessoes.filter(s => s.id !== sessaoToDelete.id && s.status === 'concluida').length;
        const totalPlanejadas = projeto.quantidade_sessoes || (sessoes.length - 1) || 0;
        await atualizarStatusAutomatico(sessoesCompletas, totalPlanejadas);
      }
    } catch (err) {
      console.error('Erro ao excluir sessão:', err);
      toast({ title: 'Erro ao excluir', description: String(err), variant: 'destructive' });
    }
  };

  const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

  const loadSessoes = async () => {
    if (!id) return;

    try {
      const { data: sessoesData, error } = await supabase
        .from('projeto_sessoes')
        .select('*')
        .eq('projeto_id', id)
        .order('numero_sessao', { ascending: true });

      if (error) throw error;

      const sessoesFormatadas: Sessao[] = (sessoesData || []).map(sessao => {
        const isPastOrToday = new Date(sessao.data_sessao) <= new Date();
        const isConcluida = sessao.status_pagamento === 'pago' || (sessao.status_pagamento === 'pendente' && isPastOrToday);

        return {
          id: sessao.id,
          data: sessao.data_sessao,
          duracao: 120,
          descricao: sessao.observacoes_tecnicas || `Sessão ${sessao.numero_sessao}`,
          valor: sessao.valor_sessao || 0,
          status: sessao.status_pagamento === 'cancelado' ? 'cancelada' : (isConcluida ? 'concluida' : 'agendada'),
          feedback_cliente: sessao.feedback_cliente,
          observacoes_tecnicas: sessao.observacoes_tecnicas,
          avaliacao: sessao.avaliacao,
          agendamento_id: sessao.agendamento_id || null,
          numero_sessao: sessao.numero_sessao
        };
      });
      setSessoes(sessoesFormatadas);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };

  const loadAgendamentos = async () => {
    if (!id) return;

    try {
      const { data: agendamentosData, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('projeto_id', id)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;

      const agsFormatados: AgendamentoProjeto[] = (agendamentosData || []).map((a: any) => ({
        id: a.id,
        titulo: a.titulo || 'Agendamento',
        data: a.data,
        hora: typeof a.hora === 'string' ? a.hora.slice(0, 5) : '',
        status: a.status || 'agendado',
        descricao: a.descricao || '',
      }));

      setAgendamentos(agsFormatados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    }
  };

  const confirmarSessao = async (a: AgendamentoProjeto) => {
    try {
      // Descobrir próximo número de sessão do projeto
      const { data: sessoesExistentes, error: countError } = await supabase
        .from('projeto_sessoes')
        .select('id')
        .eq('projeto_id', id);
      if (countError) throw countError;
      const numeroSessao = (sessoesExistentes?.length || 0) + 1;

      const { error: sessaoError } = await supabase
        .from('projeto_sessoes')
        .insert({
          projeto_id: id,
          agendamento_id: isUUID(a.id) ? a.id : null,
          numero_sessao: numeroSessao,
          data_sessao: a.data,
          valor_sessao: null,
          status_pagamento: 'pendente',
          metodo_pagamento: null,
          observacoes_tecnicas: a.descricao || null,
        });
      if (sessaoError) throw sessaoError;

      // Atualizar status do agendamento para concluído
      if (isUUID(a.id)) {
        const { error: updErr } = await supabase
          .from('agendamentos')
          .update({ status: 'concluido' })
          .eq('id', a.id);
        if (updErr) throw updErr;
      }

      // Reflete localmente
      setAgendamentos(prev => prev.map(item => item.id === a.id ? { ...item, status: 'concluido' } : item));
    } catch (error) {
      console.error('Erro ao confirmar sessão:', error);
    }
  };

  const cancelarAgendamento = async (agendamentoId: string) => {
    try {
      if (isUUID(agendamentoId)) {
        const { error: updErr } = await supabase
          .from('agendamentos')
          .update({ status: 'cancelado' })
          .eq('id', agendamentoId);
        if (updErr) throw updErr;
      }
      setAgendamentos(prev => prev.map(a => a.id === agendamentoId ? { ...a, status: 'cancelado' } : a));
      toast({ title: 'Agendamento cancelado', description: 'O status foi atualizado para cancelado.' });
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({ title: 'Erro ao cancelar', description: String(error), variant: 'destructive' });
    }
  };

  const abrirEdicao = (a: AgendamentoProjeto) => {
    setEditingAgendamento(a);
    setEditForm({
      titulo: a.titulo || '',
      descricao: a.descricao || '',
      data: a.data || '',
      hora: a.hora || '',
      status: a.status || 'agendado'
    });
    setEditDialogOpen(true);
  };

  const salvarEdicao = async () => {
    if (!editingAgendamento) return;
    try {
      if (isUUID(editingAgendamento.id)) {
        const { error: updErr } = await supabase
          .from('agendamentos')
          .update({
            titulo: editForm.titulo,
            descricao: editForm.descricao,
            data: editForm.data,
            hora: editForm.hora,
            status: editForm.status,
          })
          .eq('id', editingAgendamento.id);
        if (updErr) throw updErr;
      }
      setAgendamentos(prev => prev.map(a => a.id === editingAgendamento.id ? {
        ...a,
        titulo: editForm.titulo,
        descricao: editForm.descricao,
        data: editForm.data,
        hora: editForm.hora,
        status: editForm.status,
      } : a));
      setEditDialogOpen(false);
      setEditingAgendamento(null);
    } catch (error) {
      console.error('Erro ao salvar edição do agendamento:', error);
    }
  };

  useEffect(() => {
    const carregarProjeto = async () => {
      if (!id) {
        toast({
          title: "Erro",
          description: "ID do projeto não encontrado",
          variant: "destructive",
        });
        navigate('/projetos');
        return;
      }

      try {
        setLoading(true);

        // Buscar projeto
        const { data: projetoEncontrado, error: projetoError } = await supabase
          .from('projetos')
          .select('*')
          .eq('id', id)
          .single();

        if (projetoError || !projetoEncontrado) {
          toast({
            title: "Projeto não encontrado",
            description: "O projeto solicitado não existe",
            variant: "destructive",
          });
          navigate('/projetos');
          return;
        }

        // Buscar cliente
        const { data: cliente } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', projetoEncontrado.cliente_id)
          .single();

        // Calcular valor pago
        const { data: sessoes } = await supabase
          .from('projeto_sessoes')
          .select('valor_sessao')
          .eq('projeto_id', id)
          .eq('status_pagamento', 'pago');

        const valorPago = (sessoes || []).reduce((sum, s) => sum + (s.valor_sessao || 0), 0);

        // Montar dados do projeto
        const projetoCompleto: Projeto = {
          id: projetoEncontrado.id,
          titulo: projetoEncontrado.titulo,
          descricao: projetoEncontrado.descricao || '',
          cliente_nome: cliente?.nome || 'Cliente não encontrado',
          cliente_id: projetoEncontrado.cliente_id,
          status: projetoEncontrado.status as any,
          data_inicio: projetoEncontrado.data_inicio || '',
          data_fim: projetoEncontrado.data_fim || undefined,
          valor_total: projetoEncontrado.valor_total || 0,
          valor_pago: valorPago,
          categoria: projetoEncontrado.categoria || '',
          prioridade: 'media',
          observacoes: projetoEncontrado.notas || '',
          quantidade_sessoes: projetoEncontrado.quantidade_sessoes || 0,
        };

        setProjeto(projetoCompleto);

        // Carregar sessões
        await loadSessoes();
        // Carregar agendamentos do projeto
        await loadAgendamentos();

      } catch (error) {
        console.error('Erro ao carregar projeto:', error);
        toast({
          title: "Erro ao carregar projeto",
          description: "Não foi possível carregar os dados do projeto",
          variant: "destructive",
        });
        navigate('/projetos');
      } finally {
        setLoading(false);
      }
    };

    carregarProjeto();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejamento': return 'bg-primary/10 text-primary border-primary/20';
      case 'em_andamento': return 'bg-primary/10 text-primary border-primary/20';
      case 'pausado': return 'bg-muted/10 text-muted-foreground border-muted/20';
      case 'concluido': return 'bg-success/10 text-success border-success/20';
      case 'cancelado': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planejamento': return 'Planejamento';
      case 'em_andamento': return 'Em Andamento';
      case 'pausado': return 'Pausado';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'bg-muted/10 text-muted-foreground border-muted/20';
      case 'media': return 'bg-info/10 text-info border-info/20';
      case 'alta': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getSessaoStatusColor = (status: string) => {
    switch (status) {
      case 'agendada': return 'bg-primary/10 text-primary border-primary/20';
      case 'concluida': return 'bg-success/10 text-success border-success/20';
      case 'cancelada': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Projeto não encontrado</p>
          <Button onClick={() => navigate('/projetos')} className="mt-4 rounded-xl">
            Voltar aos Projetos
          </Button>
        </div>
      </div>
    );
  }

  const progressoPagamento = (projeto.valor_pago / (projeto.valor_total || 1)) * 100;
  const sessoesCompletas = sessoes.filter(s => s.status === 'concluida').length;
  const totalPlanejadas = projeto.quantidade_sessoes || sessoes.length || 0;
  const progressoSessoes = totalPlanejadas > 0 ? (sessoesCompletas / totalPlanejadas) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              navigate('/projetos');
            }}
            className="rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{projeto.titulo}</h1>
            <p className="text-muted-foreground">Cliente: {projeto.cliente_nome}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={`rounded-xl ${getStatusColor(projeto.status)}`}>
              {getStatusLabel(projeto.status)}
            </Badge>
            <Badge variant="outline" className={`rounded-xl ${getPrioridadeColor(projeto.prioridade)}`}>
              Prioridade {projeto.prioridade}
            </Badge>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-primary">R$ {projeto.valor_total.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pago</p>
                  <p className="text-2xl font-bold text-primary">R$ {projeto.valor_pago.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Sessões</p>
                  <p className="text-2xl font-bold text-primary">{sessoesCompletas}/{totalPlanejadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <p className="text-2xl font-bold text-primary">{Math.round(progressoSessoes)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="detalhes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 rounded-2xl">
            <TabsTrigger value="detalhes" className="rounded-xl">Detalhes</TabsTrigger>
            <TabsTrigger value="sessoes" className="rounded-xl">Sessões</TabsTrigger>
            <TabsTrigger value="feedbacks" className="rounded-xl">Feedbacks</TabsTrigger>
            <TabsTrigger value="financeiro" className="rounded-xl">Financeiro</TabsTrigger>
            <TabsTrigger value="galeria" className="rounded-xl">Galeria</TabsTrigger>
          </TabsList>

          {/* Aba Detalhes */}
          <TabsContent value="detalhes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Informações do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                    <p className="mt-1">{projeto.descricao}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Categoria</Label>
                    <p className="mt-1">{projeto.categoria}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data de Início</Label>
                    <p className="mt-1">{new Date(projeto.data_inicio).toLocaleDateString()}</p>
                  </div>
                  {projeto.data_fim && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data de Conclusão</Label>
                      <p className="mt-1">{new Date(projeto.data_fim).toLocaleDateString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                    <p className="mt-1">{projeto.cliente_nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                    <p className="mt-1">{projeto.observacoes}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate(`/clientes/${projeto.cliente_id}`);
                    }}
                    className="w-full rounded-xl"
                  >
                    Ver Perfil do Cliente
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Sessões */}
          <TabsContent value="sessoes" className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Histórico de Sessões</CardTitle>
                <CardDescription>
                  {sessoesCompletas} de {totalPlanejadas} sessões concluídas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessoes.map((sessao, index) => (
                    <ContextMenu key={sessao.id}>
                      <ContextMenuTrigger asChild>
                        <div className="flex items-start justify-between gap-4 p-4 border rounded-xl">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium">{sessao.numero_sessao ?? (index + 1)}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{new Date(sessao.data).toLocaleDateString()}</span>
                                <Badge variant="outline" className={`rounded-xl ${getSessaoStatusColor(sessao.status)}`}>
                                  {sessao.status}
                                </Badge>
                              </div>
                              <p className="font-medium">{getSessaoDescricao(sessao)}</p>
                              <p className="text-sm text-muted-foreground">
                                {sessao.duracao} min • R$ {sessao.valor.toFixed(2)}
                              </p>
                              {/* ID do agendamento ocultado conforme preferência do usuário */}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => abrirEdicaoSessao(sessao)}>
                              Editar
                            </Button>
                            <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => solicitarExclusaoSessao(sessao)}>
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => abrirEdicaoSessao(sessao)}>Editar</ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem className="text-destructive" onClick={() => solicitarExclusaoSessao(sessao)}>Excluir</ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Dialog de edição de agendamento */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle>Editar Agendamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input value={editForm.titulo} onChange={(e) => setEditForm(prev => ({ ...prev, titulo: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={editForm.descricao} onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))} className="rounded-xl" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data</Label>
                    <Input type="date" value={editForm.data} onChange={(e) => setEditForm(prev => ({ ...prev, data: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div>
                    <Label>Hora</Label>
                    <Input type="time" value={editForm.hora} onChange={(e) => setEditForm(prev => ({ ...prev, hora: e.target.value }))} className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm(prev => ({ ...prev, status: v as AgendamentoProjeto['status'] }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="em_andamento">Em andamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => { setEditDialogOpen(false); setEditingAgendamento(null); }}>Cancelar</Button>
                  <Button className="rounded-xl" onClick={salvarEdicao}>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog de edição de sessão */}
          <Dialog open={editSessaoDialogOpen} onOpenChange={setEditSessaoDialogOpen}>
            <DialogContent className="max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle>Editar Sessão</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data</Label>
                    <Popover open={editSessaoCalendarOpen} onOpenChange={setEditSessaoCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 w-full justify-start text-left font-normal rounded-xl">
                          <Calendar className="mr-2 h-4 w-4" />
                          {editSessaoForm.data ? format(parseDateOnly(editSessaoForm.data), "dd/MM/yyyy", { locale: ptBR }) : "dd/mm/aaaa"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComp
                          mode="single"
                          selected={editSessaoForm.data ? parseDateOnly(editSessaoForm.data) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setEditSessaoForm(prev => ({ ...prev, data: format(date, "yyyy-MM-dd") }));
                              setEditSessaoCalendarOpen(false);
                            }
                          }}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Valor</Label>
                    <Input type="number" step="0.01" value={editSessaoForm.valor} onChange={(e) => setEditSessaoForm(prev => ({ ...prev, valor: Number(e.target.value) }))} className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={editSessaoForm.descricao} onChange={(e) => setEditSessaoForm(prev => ({ ...prev, descricao: e.target.value }))} className="rounded-xl" rows={3} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editSessaoForm.status} onValueChange={(v) => setEditSessaoForm(prev => ({ ...prev, status: v as Sessao['status'] }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agendada">Agendada</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => { setEditSessaoDialogOpen(false); setEditingSessao(null); }}>Cancelar</Button>
                  <Button className="rounded-xl" onClick={salvarEdicaoSessao}>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Confirmação de exclusão de sessão */}
          <AlertDialog open={deleteSessaoDialogOpen} onOpenChange={setDeleteSessaoDialogOpen}>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir sessão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação removerá definitivamente o registro da sessão do histórico.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                <AlertDialogAction className="rounded-xl" onClick={excluirSessao}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Aba Feedbacks */}
          <TabsContent value="feedbacks" className="space-y-6">
            <FeedbackManager
              projetoId={projeto.id}
              onFeedbackUpdate={() => {
                // Recarregar dados quando feedback for atualizado
                setSessoes([]);
                loadSessoes();
              }}
            />
          </TabsContent>

          {/* Aba Financeiro */}
          <TabsContent value="financeiro" className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-xl">
                    <p className="text-2xl font-bold text-primary">R$ {projeto.valor_total.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                  </div>
                  <div className="text-center p-4 border rounded-xl">
                    <p className="text-2xl font-bold text-primary">R$ {projeto.valor_pago.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Valor Pago</p>
                  </div>
                  <div className="text-center p-4 border rounded-xl">
                    <p className="text-2xl font-bold text-primary">R$ {(projeto.valor_total - projeto.valor_pago).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Saldo Restante</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso do Pagamento</span>
                    <span>{Math.round(progressoPagamento)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressoPagamento}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Galeria */}
          <TabsContent value="galeria" className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Galeria do Projeto
                </CardTitle>
                <CardDescription>
                  Fotos do progresso e resultado final
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma imagem adicionada ainda</p>
                  <Button variant="outline" className="mt-4 rounded-xl">
                    Adicionar Fotos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ações */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  navigate(`/agendamentos?projeto=${projeto.id}`);
                }}
                className="rounded-xl"
              >
                Agendar Sessão
              </Button>
              <Button
                variant="outline"
                onClick={() => setManualSessaoDialogOpen(true)}
                className="rounded-xl"
              >
                Registrar Sessão
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigate(`/clientes/${projeto.cliente_id}`);
                }}
                className="rounded-xl"
              >
                Ver Cliente
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigate(`/projetos`);
                }}
                className="rounded-xl"
              >
                Voltar aos Projetos
              </Button>
            </div>
          </CardContent>
        </Card>
        <Dialog open={manualSessaoDialogOpen} onOpenChange={setManualSessaoDialogOpen}>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Sessão</DialogTitle>
              <DialogDescription>Adicionar sessão passada sem agendamento</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <Popover open={manualSessaoCalendarOpen} onOpenChange={setManualSessaoCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9 w-full justify-start text-left font-normal rounded-xl">
                        <Calendar className="mr-2 h-4 w-4" />
                        {manualSessaoForm.data ? format(parseDateOnly(manualSessaoForm.data), "dd/MM/yyyy", { locale: ptBR }) : "dd/mm/aaaa"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComp
                        mode="single"
                        selected={manualSessaoForm.data ? parseDateOnly(manualSessaoForm.data) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setManualSessaoForm(prev => ({ ...prev, data: format(date, "yyyy-MM-dd") }));
                            setManualSessaoCalendarOpen(false);
                          }
                        }}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Valor</Label>
                  <Input type="number" step="0.01" value={manualSessaoForm.valor} onChange={(e) => setManualSessaoForm(prev => ({ ...prev, valor: Number(e.target.value) }))} className="rounded-xl" />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={manualSessaoForm.descricao} onChange={(e) => setManualSessaoForm(prev => ({ ...prev, descricao: e.target.value }))} className="rounded-xl" rows={3} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={manualSessaoForm.status} onValueChange={(v) => setManualSessaoForm(prev => ({ ...prev, status: v as Sessao['status'] }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setManualSessaoDialogOpen(false)}>Cancelar</Button>
                <Button className="rounded-xl" onClick={registrarSessaoManual}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium text-muted-foreground ${className || ''}`}>{children}</label>;
}
