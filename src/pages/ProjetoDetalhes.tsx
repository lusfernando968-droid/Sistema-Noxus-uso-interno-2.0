import { useState, useEffect } from "react";
import { useProjetoDetalhesReducer } from "@/hooks/useProjetoDetalhesReducer";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { ArrowLeft, Calendar, DollarSign, User, Clock, FileText, Image, CheckCircle, MessageSquare, Star, MoveVertical, Save, X, ExternalLink, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackManager } from "@/components/projetos/FeedbackManager";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import { ProjetoDetalhesSkeleton } from "@/components/ui/skeletons";
import { ProjectBuilder } from "@/components/projetos/ProjectBuilder";
import { useAuth } from "@/contexts/AuthContext";

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
  capa_url?: string;
  capa_posicao?: number;
  drive_link?: string;
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
  const { user } = useAuth();

  // Dados do servidor
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoProjeto[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para reposicionamento da capa
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [coverPosition, setCoverPosition] = useState(50);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [originalPosition, setOriginalPosition] = useState(50);

  // Estado para edição do projeto
  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);



  // Reducer para estados de UI complexos (dialogs, formulários de edição)
  const { state: uiState, actions: uiActions } = useProjetoDetalhesReducer();

  // Aliases para compatibilidade com código existente
  const isAgendamentosDialogOpen = uiState.isAgendamentosDialogOpen;
  const setIsAgendamentosDialogOpen = uiActions.setAgendamentosDialogOpen;
  const cancelDialogOpen = uiState.cancelDialogOpen;
  const setCancelDialogOpen = uiActions.setCancelDialogOpen;
  const agendamentoToCancel = uiState.agendamentoToCancel;
  const editingAgendamento = uiState.editingAgendamento;
  const editDialogOpen = uiState.editDialogOpen;
  const setEditDialogOpen = uiActions.setEditDialogOpen;
  const editForm = uiState.editForm;
  const setEditForm = (form: Partial<typeof uiState.editForm>) => uiActions.setEditForm(form);

  // Edição de sessão - aliases
  const editingSessao = uiState.editingSessao;
  const editSessaoDialogOpen = uiState.editSessaoDialogOpen;
  const setEditSessaoDialogOpen = uiActions.setEditSessaoDialogOpen;
  const editSessaoForm = uiState.editSessaoForm;
  const setEditSessaoForm = (form: Partial<typeof uiState.editSessaoForm>) => uiActions.setEditSessaoForm(form);
  const manualSessaoDialogOpen = uiState.manualSessaoDialogOpen;
  const setManualSessaoDialogOpen = uiActions.setManualSessaoDialogOpen;
  const manualSessaoForm = uiState.manualSessaoForm;
  const setManualSessaoForm = (form: Partial<typeof uiState.manualSessaoForm>) => uiActions.setManualSessaoForm(form);
  const parseDateOnly = (s: string) => {
    const [y, m, d] = (s || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1, 12);
  };

  const abrirEdicaoSessao = (s: Sessao) => {
    uiActions.openEditSessaoDialog(s as Parameters<typeof uiActions.openEditSessaoDialog>[0]);
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
    const texto = d.replace(/^Local:\s*/i, 'Estúdio: ');
    // Capitaliza apenas a primeira letra
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
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

      uiActions.closeEditSessaoDialog();
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
        .order('data_sessao', { ascending: true });

      if (error) throw error;

      const sessoesFormatadas: Sessao[] = (sessoesData || []).map((sessao, index) => {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
        const isPastOrToday = sessao.data_sessao <= today;
        const isConcluida = sessao.status_pagamento === 'pago' || (sessao.status_pagamento === 'pendente' && isPastOrToday);

        return {
          id: sessao.id,
          data: sessao.data_sessao,
          duracao: 120,
          descricao: sessao.observacoes_tecnicas || `Sessão ${sessao.numero_sessao}`,
          valor: Number(sessao.valor_sessao) ?? 0,
          status: sessao.status_pagamento === 'cancelado' ? 'cancelada' : (isConcluida ? 'concluida' : 'agendada'),
          feedback_cliente: sessao.feedback_cliente,
          observacoes_tecnicas: sessao.observacoes_tecnicas,
          avaliacao: sessao.avaliacao,
          agendamento_id: sessao.agendamento_id || null,
          numero_sessao: index + 1 // Use index based numbering
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
    uiActions.openEditAgendamentoDialog(a as Parameters<typeof uiActions.openEditAgendamentoDialog>[0]);
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
      uiActions.closeEditAgendamentoDialog();
    } catch (error) {
      console.error('Erro ao salvar edição do agendamento:', error);
    }
  };

  const startRepositioning = () => {
    if (!projeto) return;
    setIsRepositioning(true);
    setOriginalPosition(coverPosition);
  };

  const cancelRepositioning = () => {
    setIsRepositioning(false);
    setCoverPosition(originalPosition);
  };

  const saveRepositioning = async () => {
    if (!id) return;
    setIsRepositioning(false);

    try {
      const { error } = await supabase
        .from('projetos')
        .update({ capa_posicao: Math.round(coverPosition) })
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Capa atualizada", description: "Posição da capa salva com sucesso." });
    } catch (error) {
      console.error("Erro ao salvar posição da capa:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar a posição da capa." });
      setCoverPosition(originalPosition);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioning) return;
    setDragStartY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isRepositioning || dragStartY === null) return;

    const deltaY = e.clientY - dragStartY;
    const sensitivity = 0.2; // Ajuste para suavidade

    let newPosition = coverPosition - (deltaY * sensitivity);

    // Limitar entre 0 e 100
    if (newPosition < 0) newPosition = 0;
    if (newPosition > 100) newPosition = 100;

    setCoverPosition(newPosition);
    setDragStartY(e.clientY); // Reset para movimento relativo contínuo
  };

  const handleMouseUp = () => {
    setDragStartY(null);
  };

  const handleMouseLeave = () => {
    setDragStartY(null);
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
        const { data: sessoesPagamento } = await supabase
          .from('projeto_sessoes')
          .select('valor_sessao, data_sessao, status_pagamento')
          .eq('projeto_id', id);

        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
        const valorPago = (sessoesPagamento || []).reduce((sum, s) => {
          const isPastOrToday = s.data_sessao <= today;
          const isPago = s.status_pagamento === 'pago' || (s.status_pagamento === 'pendente' && isPastOrToday);
          return isPago ? sum + (s.valor_sessao || 0) : sum;
        }, 0);

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
          capa_url: projetoEncontrado.capa_url,
          capa_posicao: projetoEncontrado.capa_posicao || 50,
          drive_link: projetoEncontrado.drive_link,
        };

        setProjeto(projetoCompleto);



        // Carregar sessões
        await loadSessoes();
        // Carregar agendamentos do projeto
        await loadAgendamentos();

        // Carregar clientes para o ProjectBuilder
        const { data: clientesData } = await supabase
          .from('clientes')
          .select('*')
          .eq('user_id', user?.id || '')
          .order('nome');

        if (clientesData) {
          setClientes(clientesData);
        }

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
    return <ProjetoDetalhesSkeleton />;
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
            {projeto.drive_link && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
                onClick={() => window.open(projeto.drive_link, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Acessar Drive
              </Button>
            )}
            <Badge variant="outline" className={`rounded-xl ${getStatusColor(projeto.status)}`}>
              {getStatusLabel(projeto.status)}
            </Badge>
            <Badge variant="outline" className={`rounded-xl ${getPrioridadeColor(projeto.prioridade)}`}>
              Prioridade {projeto.prioridade}
            </Badge>
          </div>
        </div>

        {/* Capa do Projeto */}
        {projeto.capa_url && (
          <div
            className={`w-full h-48 md:h-64 relative rounded-2xl overflow-hidden shadow-sm border border-muted/20 group select-none ${isRepositioning ? 'cursor-move ring-2 ring-primary ring-offset-2' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={projeto.capa_url}
              alt={`Capa do projeto ${projeto.titulo}`}
              className="w-full h-full object-cover transition-none pointer-events-none"
              style={{ objectPosition: `center ${coverPosition}%` }}
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-background/80 to-transparent transition-opacity duration-300 ${isRepositioning ? 'opacity-0' : 'opacity-100'}`} />

            {/* Botão Reposicionar (aparece no hover se não estiver editando) */}
            {!isRepositioning && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm text-xs h-8"
                  onClick={startRepositioning}
                >
                  <MoveVertical className="w-3 h-3 mr-1.5" />
                  Reposicionar
                </Button>
              </div>
            )}

            {/* Controles de Edição (aparecem apenas quando editando) */}
            {isRepositioning && (
              <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-background/90 backdrop-blur-sm shadow-sm h-8"
                  onClick={cancelRepositioning}
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="h-8 shadow-sm"
                  onClick={saveRepositioning}
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Salvar Posição
                </Button>
              </div>
            )}

            {isRepositioning && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                Arraste para mover
              </div>
            )}
          </div>
        )}

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
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Informações do Projeto
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditProjectDialogOpen(true)}
                      className="rounded-xl"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
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
                                <span className="text-sm font-medium">{index + 1}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{format(parseDateOnly(sessao.data), "dd/MM/yyyy", { locale: ptBR })}</span>
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

            <Card className="rounded-2xl mt-6">
              <CardHeader>
                <CardTitle>Histórico de Agendamentos (Calendário)</CardTitle>
                <CardDescription>
                  Todos os agendamentos vinculados a este projeto, incluindo cancelados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agendamentos.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Nenhum agendamento encontrado.</p>
                  ) : (
                    agendamentos.map((agendamento) => (
                      <div key={agendamento.id} className="flex items-start justify-between gap-4 p-4 border rounded-xl">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-secondary-foreground" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-muted-foreground">
                                {agendamento.data && format(parseDateOnly(agendamento.data), "dd/MM/yyyy", { locale: ptBR })}
                                {agendamento.hora && ` às ${agendamento.hora}`}
                              </span>
                              <Badge variant="outline" className={`rounded-xl ${agendamento.status === 'cancelado' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                agendamento.status === 'concluido' ? 'bg-success/10 text-success border-success/20' :
                                  'bg-primary/10 text-primary border-primary/20'
                                }`}>
                                {agendamento.status === 'em_andamento' ? 'Em andamento' :
                                  agendamento.status === 'agendado' ? 'Agendado' :
                                    agendamento.status === 'confirmado' ? 'Confirmado' :
                                      agendamento.status === 'concluido' ? 'Concluído' :
                                        agendamento.status === 'cancelado' ? 'Cancelado' : agendamento.status}
                              </Badge>
                            </div>
                            <p className="font-medium">{agendamento.titulo}</p>
                            {agendamento.descricao && (
                              <p className="text-sm text-muted-foreground text-wrap">{agendamento.descricao}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => abrirEdicao(agendamento)}>
                            Editar
                          </Button>
                          {agendamento.status !== 'cancelado' && (
                            <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => cancelarAgendamento(agendamento.id)}>
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
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
                  <Button variant="outline" className="rounded-xl" onClick={() => uiActions.closeEditAgendamentoDialog()}>Cancelar</Button>
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
                    <DatePickerInput
                      value={editSessaoForm.data}
                      onChange={(date) => setEditSessaoForm(prev => ({ ...prev, data: date }))}
                      placeholder="dd/mm/aaaa"
                    />
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
                  <Button variant="outline" className="rounded-xl" onClick={() => uiActions.closeEditSessaoDialog()}>Cancelar</Button>
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
                  <DatePickerInput
                    value={manualSessaoForm.data}
                    onChange={(date) => setManualSessaoForm(prev => ({ ...prev, data: date }))}
                    placeholder="dd/mm/aaaa"
                  />
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

        {/* ProjectBuilder para edição do projeto */}
        <ProjectBuilder
          open={editProjectDialogOpen}
          onOpenChange={setEditProjectDialogOpen}
          projetoId={projeto?.id}
          clientes={clientes}
          onSuccess={() => {
            // Recarregar dados do projeto após edição
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium text-muted-foreground ${className || ''}`}>{children}</label>;
}
