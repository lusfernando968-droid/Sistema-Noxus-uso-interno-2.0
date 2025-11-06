import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { Calendar, Plus, Edit, Trash2, Clock, User, MapPin, CheckCircle, AlertCircle, CalendarDays, List, Search, Star } from "lucide-react";
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
  const navigate = useNavigate();
  const { toast } = useToastWithSound();
  const { playSound } = useSoundEffects();
  const { checkAgendamentosMilestone } = useAchievementNotifications();
  const { user } = useAuth();

  // Estados
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [projetos, setProjetos] = useState<{ id: string; titulo: string; valor_por_sessao?: number; cliente_id: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState('');

  // Confirmação com feedback (Agendamentos de Hoje)
  const [isFeedbackPromptOpen, setIsFeedbackPromptOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [agendamentoParaConfirmar, setAgendamentoParaConfirmar] = useState<Agendamento | null>(null);
  const [feedbackCliente, setFeedbackCliente] = useState('');
  const [avaliacao, setAvaliacao] = useState<number>(5);
  const [observacoesTecnicas, setObservacoesTecnicas] = useState<string>('');

  const initialFormData = {
    cliente_nome: "",
    cliente_id: "",
    data_agendamento: "",
    hora_inicio: "",
    hora_fim: "",
    servico: "",
    status: "agendado" as const,
    observacoes: "",
    valor_estimado: 0,
    tatuador: "",
    local: "Estúdio Principal"
  };

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
  }>(initialFormData);

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
          .select("id, titulo, valor_por_sessao, cliente_id")
          .order("titulo");
        if (error) throw error;
        setProjetos(data || []);
      } catch (err) {
        console.error("Erro ao buscar projetos:", err);
      }
    };
    fetchProjetos();
  }, []);

  // Dados simulados iniciais (apenas quando NÃO há usuário logado)
  useEffect(() => {
    if (user) return; // Evita demo quando logado
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
  }, [user, checkAgendamentosMilestone]);

  // Funções auxiliares
  const isUUID = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
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

  // ===== Helpers elegantes para horário =====
  const DEFAULT_SESSION_MINUTES = 120; // 2h padrão

  const normalizeTime = (time: string) => {
    // Garante formato HH:mm, removendo segundos se vierem
    if (!time) return "";
    return time.slice(0, 5);
  };

  const toMinutes = (time: string) => {
    const [h, m] = normalizeTime(time).split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
  };

  const fromMinutes = (mins: number) => {
    const clamped = Math.max(0, Math.min(23 * 60 + 59, mins));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const addMinutes = (time: string, add: number) => {
    const base = toMinutes(time);
    if (Number.isNaN(base)) return normalizeTime(time);
    return fromMinutes(base + add);
  };

  const handleTimeChange = (field: 'hora_inicio' | 'hora_fim', value: string) => {
    const valueNorm = normalizeTime(value);

    setFormData(prev => {
      const next = { ...prev, [field]: valueNorm } as typeof prev;

      return next;
    });
  };

  // Digitação manual com máscara HH:mm
  const formatTimeInput = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`.slice(0, 5);
  };

  const clampTime = (time: string) => {
    const [hStr = "", mStr = ""] = normalizeTime(time).split(":");
    let h = parseInt(hStr || "0", 10);
    let m = parseInt(mStr || "0", 10);
    if (Number.isNaN(h)) h = 0;
    if (Number.isNaN(m)) m = 0;
    h = Math.max(0, Math.min(23, h));
    m = Math.max(0, Math.min(59, m));
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const handleTimeInput = (field: 'hora_inicio' | 'hora_fim', raw: string) => {
    const masked = formatTimeInput(raw);
    handleTimeChange(field, masked);
  };

  const handleTimeBlur = (field: 'hora_inicio' | 'hora_fim') => {
    setFormData(prev => {
      const clamped = clampTime(prev[field]);
      return { ...prev, [field]: clamped } as typeof prev;
    });
  };

  // Confirmar sessão realizada: atualiza status local e registra em tabelas relacionadas
  const handleConfirmSessao = async (
    agendamento: Agendamento,
    feedback?: string,
    observacoes?: string,
    avaliacaoValor?: number
  ) => {
    try {
      playSound('success');

      // Atualiza status local para concluído
      setAgendamentos(prev => prev.map(a => a.id === agendamento.id ? { ...a, status: 'concluido' } : a));

      // Se não estiver logado, apenas feedback visual
      if (!user) {
        toast({ title: 'Sessão confirmada localmente', description: 'Faça login para registrar nas tabelas.' });
        return;
      }

      // Encontrar projeto pelo título selecionado no agendamento (campo tatuador armazena o título do projeto)
      const projeto = projetos.find(p => p.titulo === agendamento.tatuador);

      // Registrar/atualizar sessão do projeto, se conseguirmos resolver o projeto
      if (projeto?.id) {
        // Verificar se já existe sessão vinculada a este agendamento
        const agendamentoUUID = isUUID(agendamento.id) ? agendamento.id : null;
        let existingSessaoId: string | null = null;

        if (agendamentoUUID) {
          const { data: sessaoDoAgendamento, error: sessaoLookupError } = await supabase
            .from('projeto_sessoes')
            .select('id')
            .eq('projeto_id', projeto.id)
            .eq('agendamento_id', agendamentoUUID)
            .limit(1)
            .maybeSingle();

          if (sessaoLookupError && sessaoLookupError.code !== 'PGRST116') throw sessaoLookupError;
          existingSessaoId = sessaoDoAgendamento?.id || null;
        }

        if (existingSessaoId) {
          // Atualiza feedback (e campos úteis) na sessão existente
          const { error: updateError } = await supabase
            .from('projeto_sessoes')
            .update({
              feedback_cliente: feedback || null,
              observacoes_tecnicas: observacoes ?? null,
              valor_sessao: agendamento.valor_estimado || null,
              data_sessao: agendamento.data_agendamento,
              avaliacao: avaliacaoValor ?? null,
            })
            .eq('id', existingSessaoId);

          if (updateError) throw updateError;
        } else {
          // Descobrir próximo número de sessão e inserir nova
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
              agendamento_id: agendamentoUUID,
              numero_sessao: numeroSessao,
              data_sessao: agendamento.data_agendamento,
              valor_sessao: agendamento.valor_estimado || null,
              status_pagamento: 'pendente',
              metodo_pagamento: null,
              observacoes_tecnicas: observacoes ?? null,
              feedback_cliente: feedback || null,
              avaliacao: avaliacaoValor ?? null,
            });

          if (sessaoError) throw sessaoError;
        }
      }

      // Registrar/atualizar transação (receita) referente à sessão
      // Evita duplicidade: se já existir uma transação vinculada ao agendamento, apenas atualiza a descrição
      if (agendamento.valor_estimado && agendamento.valor_estimado > 0) {
        const agendamentoUUID = isUUID(agendamento.id) ? agendamento.id : null;

        if (agendamentoUUID) {
          const { data: existingTransacao, error: lookupError } = await supabase
            .from('transacoes')
            .select('id')
            .eq('agendamento_id', agendamentoUUID)
            .limit(1)
            .maybeSingle();

          // Ignora erro de "no rows returned" (PGRST116)
          if (lookupError && lookupError.code !== 'PGRST116') throw lookupError;

          if (existingTransacao?.id) {
            const { error: updateErro } = await supabase
              .from('transacoes')
              .update({
                descricao: `Sessão realizada: ${agendamento.servico}`,
              })
              .eq('id', existingTransacao.id);
            if (updateErro) throw updateErro;
          } else {
            const { error: transacaoError } = await supabase
              .from('transacoes')
              .insert({
                user_id: user.id,
                tipo: 'RECEITA',
                categoria: 'Serviços',
                valor: agendamento.valor_estimado,
                data_vencimento: agendamento.data_agendamento,
                descricao: `Sessão realizada: ${agendamento.servico}`,
                agendamento_id: agendamentoUUID,
              });
            if (transacaoError) throw transacaoError;
          }
        }
      }

      // Atualiza status no banco, quando o agendamento já existir lá
      if (isUUID(agendamento.id)) {
        await supabase
          .from('agendamentos')
          .update({ status: 'concluido' })
          .eq('id', agendamento.id);
      }

      toast({ title: 'Sessão confirmada!', description: 'Registro salvo nas tabelas relacionadas.' });
    } catch (err) {
      console.error('Erro ao confirmar sessão:', err);
      toast({ title: 'Erro ao confirmar sessão', description: 'Tente novamente mais tarde.' });
    }
  };

  // Fluxo de feedback (Agendamentos de Hoje)
  const openFeedbackPrompt = (ag: Agendamento) => {
    setAgendamentoParaConfirmar(ag);
    setIsFeedbackPromptOpen(true);
  };

  const confirmWithoutFeedback = async () => {
    if (!agendamentoParaConfirmar) return;
    setIsFeedbackPromptOpen(false);
    await handleConfirmSessao(agendamentoParaConfirmar);
    setAgendamentoParaConfirmar(null);
    setFeedbackCliente('');
  };

  const confirmWithFeedback = () => {
    setIsFeedbackPromptOpen(false);
    setIsFeedbackDialogOpen(true);
  };

  const submitFeedbackAndConfirm = async () => {
    if (!agendamentoParaConfirmar) return;
    // Se não estiver logado, manter o diálogo aberto e avisar
    if (!user) {
      toast({
        title: 'Faça login para salvar o feedback',
        description: 'Sem login, os textos não serão persistidos no banco.',
      });
      return; // mantém o diálogo aberto para o usuário não perder o texto
    }
    const texto = feedbackCliente.trim();
    await handleConfirmSessao(
      agendamentoParaConfirmar,
      texto || undefined,
      observacoesTecnicas.trim() || undefined,
      avaliacao || undefined
    );
    setIsFeedbackDialogOpen(false);
    setAgendamentoParaConfirmar(null);
    setFeedbackCliente('');
    setObservacoesTecnicas('');
    setAvaliacao(5);
  };

  // Handlers
  const handleSubmit = async () => {
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
      // Se estiver logado, persistir no Supabase respeitando RLS e relações
      if (user) {
        try {
          // Resolver projeto selecionado (campo tatuador guarda o título do projeto)
          const projeto = projetos.find(p => p.titulo === formData.tatuador);
          if (!projeto?.id) {
            toast({ title: 'Selecione um projeto', description: 'É necessário escolher um projeto para salvar.' });
            return;
          }

          const { data: inserted, error } = await supabase
            .from('agendamentos')
            .insert({
              user_id: user.id,
              projeto_id: projeto.id,
              titulo: formData.servico || `${formData.cliente_nome}`,
              // Local não é utilizado; salvamos apenas observações
              descricao: formData.observacoes,
              data: formData.data_agendamento,
              hora: formData.hora_inicio,
              status: formData.status,
            })
            .select()
            .single();

          if (error) throw error;

          // Criar transação vinculada ao agendamento, se houver valor
          if (formData.valor_estimado && formData.valor_estimado > 0) {
            await supabase
              .from('transacoes')
              .insert({
                user_id: user.id,
                tipo: 'RECEITA',
                categoria: 'Serviços',
                valor: formData.valor_estimado,
                data_vencimento: formData.data_agendamento,
                descricao: `Sessão: ${formData.servico}`,
                agendamento_id: inserted.id,
              });
          }

          // Reflete na UI com o ID real do banco
          const novoAgendamento: Agendamento = {
            id: inserted.id,
            cliente_nome: formData.cliente_nome,
            cliente_id: formData.cliente_id,
            data_agendamento: formData.data_agendamento,
            hora_inicio: formData.hora_inicio,
            hora_fim: formData.hora_fim || (formData.hora_inicio ? addMinutes(formData.hora_inicio, DEFAULT_SESSION_MINUTES) : ''),
            servico: formData.servico,
            status: formData.status,
            observacoes: formData.observacoes,
            valor_estimado: formData.valor_estimado,
            tatuador: formData.tatuador,
            // Local não é utilizado no app
            local: ''
          };

          setAgendamentos(prev => {
            const novosAgendamentos = [...prev, novoAgendamento];
            checkAgendamentosMilestone(novosAgendamentos.length);
            return novosAgendamentos;
          });
          toast({ title: "Agendamento criado e salvo com sucesso!" });
        } catch (err) {
          console.error('Erro ao salvar agendamento:', err);
          toast({ title: 'Erro ao salvar agendamento', description: 'Verifique o login e tente novamente.' });
          // fallback: cria localmente
          const novoAgendamento: Agendamento = {
            id: Date.now().toString(),
            ...formData
          };
          setAgendamentos(prev => {
            const novosAgendamentos = [...prev, novoAgendamento];
            checkAgendamentosMilestone(novosAgendamentos.length);
            return novosAgendamentos;
          });
        }
      } else {
        // Sem login: cria localmente
        const novoAgendamento: Agendamento = {
          id: Date.now().toString(),
          ...formData
        };
        setAgendamentos(prev => {
          const novosAgendamentos = [...prev, novoAgendamento];
          checkAgendamentosMilestone(novosAgendamentos.length);
          return novosAgendamentos;
        });
        toast({ title: "Agendamento criado localmente" });
      }
    }

    setIsDialogOpen(false);
    setEditingAgendamento(null);
    setFormData(initialFormData);

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

  const handleDelete = async (id: string) => {
    playSound('click');
    // Atualiza UI imediatamente
    setAgendamentos(prev => prev.filter(a => a.id !== id));

    // Persiste no banco quando houver ID real
    try {
      if (user && isUUID(id)) {
        const { error } = await supabase.from('agendamentos').delete().eq('id', id);
        if (error) throw error;

        // Remover registros relacionados (opcional) se existirem vínculos por agendamento_id
        await supabase.from('projeto_sessoes').delete().eq('agendamento_id', id);
        await supabase.from('transacoes').delete().eq('agendamento_id', id);
      }

      toast({ title: "Agendamento removido com sucesso!" });
    } catch (err) {
      console.error('Erro ao excluir agendamento no banco:', err);
      toast({ title: "Erro ao excluir no banco", description: "Tente novamente mais tarde." });
    }
  };

  const handleStatusChange = async (id: string, novoStatus: Agendamento['status']) => {
    playSound('click');
    const prevStatus = agendamentos.find(a => a.id === id)?.status;
    setAgendamentos(prev => prev.map(a => 
      a.id === id ? { ...a, status: novoStatus } : a
    ));

    try {
      if (user && isUUID(id)) {
        const { error } = await supabase
          .from('agendamentos')
          .update({ status: novoStatus })
          .eq('id', id);
        if (error) throw error;
      }
      toast({ title: `Status alterado para ${getStatusLabel(novoStatus)}` });
    } catch (err) {
      console.error('Erro ao atualizar status no banco:', err);
      if (prevStatus) {
        setAgendamentos(prev => prev.map(a => 
          a.id === id ? { ...a, status: prevStatus } : a
        ));
      }
      toast({ title: 'Falha ao atualizar status', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    }
  };

  // Funções do calendário
  const handleAppointmentMove = async (appointmentId: string, newDate: string) => {
    playSound('success');
    const previous = agendamentos.find(a => a.id === appointmentId)?.data_agendamento;
    setAgendamentos(prev => prev.map(a => 
      a.id === appointmentId ? { ...a, data_agendamento: newDate } : a
    ));

    try {
      if (user && isUUID(appointmentId)) {
        const { error } = await supabase
          .from('agendamentos')
          .update({ data: newDate })
          .eq('id', appointmentId);
        if (error) throw error;
      }
      toast({ title: "Agendamento movido com sucesso!" });
    } catch (err) {
      console.error('Erro ao mover agendamento no banco:', err);
      if (previous) {
        setAgendamentos(prev => prev.map(a => 
          a.id === appointmentId ? { ...a, data_agendamento: previous } : a
        ));
      }
      toast({ title: "Falha ao mover agendamento", description: "Tente novamente mais tarde.", variant: 'destructive' });
    }
  };

  const handleAppointmentClick = (appointment: Agendamento) => {
    handleEdit(appointment);
  };

  const handleDateClick = (date: string) => {
    setFormData(prev => {
      const defaultStart = prev.hora_inicio && prev.hora_inicio.trim() !== '' ? prev.hora_inicio : '09:00';
      const defaultEnd = prev.hora_fim && prev.hora_fim.trim() !== '' ? prev.hora_fim : addMinutes(defaultStart, DEFAULT_SESSION_MINUTES);
      return { ...prev, data_agendamento: date, hora_inicio: defaultStart, hora_fim: defaultEnd };
    });
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

  // Carregar agendamentos do Supabase e mapear para a UI quando logado
  useEffect(() => {
    const fetchDbAgendamentos = async () => {
      try {
        if (!user) return;
        if (projetos.length === 0 || clientes.length === 0) return;
        const { data, error } = await supabase
          .from('agendamentos')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;

        const mapped = (data || []).map((row: any) => {
          const proj = projetos.find(p => p.id === row.projeto_id);
          const clienteId = proj?.cliente_id || '';
          const clienteNome = clientes.find(c => c.id === clienteId)?.nome || '';
          const horaInicio = typeof row.hora === 'string' ? row.hora.slice(0,5) : '';
          return {
            id: row.id,
            cliente_nome: clienteNome,
            cliente_id: clienteId,
            data_agendamento: row.data,
            hora_inicio: horaInicio,
            hora_fim: horaInicio ? addMinutes(horaInicio, DEFAULT_SESSION_MINUTES) : '',
            servico: row.titulo,
            status: row.status || 'agendado',
            observacoes: row.descricao || '',
            valor_estimado: 0,
            tatuador: proj?.titulo || '',
            // Local não é utilizado no app
            local: ''
          } as Agendamento;
        });

        // Quando logado, usamos apenas os agendamentos do banco
        setAgendamentos(mapped);
      } catch (err) {
        console.error('Erro ao carregar agendamentos do banco:', err);
      }
    };
    fetchDbAgendamentos();
  }, [user, projetos, clientes]);

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

        {/* Diálogo: Pergunta se quer registrar feedback */}
        <Dialog open={isFeedbackPromptOpen} onOpenChange={setIsFeedbackPromptOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Confirmar sessão</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Deseja registrar o feedback da sessão?</p>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="rounded-xl" onClick={confirmWithoutFeedback}>Não, apenas confirmar</Button>
              <Button className="rounded-xl" onClick={confirmWithFeedback}>Sim, registrar feedback</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo: Campo para inserir feedback */}
        <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Registrar feedback da sessão</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Avaliação</Label>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAvaliacao(n)}
                    className="p-1"
                    aria-label={`Avaliar ${n} estrela${n>1 ? 's' : ''}`}
                  >
                    <Star className={`w-5 h-5 ${n <= avaliacao ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
                <span className="text-sm text-muted-foreground">{avaliacao} estrelas</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Feedback do cliente</Label>
              <Textarea
                value={feedbackCliente}
                onChange={(e) => setFeedbackCliente(e.target.value)}
                rows={4}
                className="rounded-xl"
                placeholder="Como foi a experiência do cliente? Observações, satisfação, etc."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Observações Técnicas</Label>
              <Textarea
                value={observacoesTecnicas}
                onChange={(e) => setObservacoesTecnicas(e.target.value)}
                rows={3}
                className="rounded-xl"
                placeholder="Procedimentos, materiais, etapas realizadas, notas internas..."
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="rounded-xl" onClick={() => { setIsFeedbackDialogOpen(false); setFeedbackCliente(''); setObservacoesTecnicas(''); setAvaliacao(5); }}>Cancelar</Button>
              <Button className="rounded-xl" onClick={submitFeedbackAndConfirm}>Salvar e confirmar</Button>
            </div>
          </DialogContent>
        </Dialog>

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
                    <Button size="sm" className="ml-3 rounded-xl" onClick={() => openFeedbackPrompt(a)}>
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

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) {
                    setEditingAgendamento(null);
                    setFormData(initialFormData);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => playSound('click')} className="rounded-lg gap-2 h-9 px-3">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Novo Agendamento</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="max-w-2xl"
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
                            cliente_nome: c?.nome || "",
                            tatuador: "",
                            valor_estimado: 0
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
                          <SelectItem value="Início de projeto">Início de projeto</SelectItem>
                          <SelectItem value="Continuação">Continuação</SelectItem>
                          <SelectItem value="Retoque">Retoque</SelectItem>
                          <SelectItem value="Orçamento">Orçamento</SelectItem>
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
                          const p = projetos.find((pr) => pr.titulo === value) || projetos.find((pr) => pr.id === value);
                          setFormData(prev => ({
                            ...prev,
                            tatuador: p?.titulo || value,
                            // Preenche o valor estimado com o valor por sessão do projeto, se existir
                            valor_estimado: typeof p?.valor_por_sessao === 'number' ? (p!.valor_por_sessao as number) : prev.valor_estimado
                          }))
                        }}
                      >
                        <SelectTrigger className="rounded-xl" disabled={!formData.cliente_id}>
                          <SelectValue placeholder={formData.cliente_id ? "Selecione o projeto" : "Selecione primeiro um cliente"} />
                        </SelectTrigger>
                        <SelectContent>
                          {projetos
                            .filter((projeto) => projeto.cliente_id === formData.cliente_id)
                            .map((projeto) => (
                              <SelectItem key={projeto.id} value={projeto.titulo}>
                                {projeto.titulo}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {formData.cliente_id && projetos.filter((p) => p.cliente_id === formData.cliente_id).length === 0 && (
                        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                          <span>Nenhum projeto para este cliente.</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl px-2"
                            onClick={() => navigate(`/projetos?cliente=${formData.cliente_id}`)}
                          >
                            Criar projeto
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Hora Início</Label>
                      <Input
                        type="time"
                        step="60"
                        value={formData.hora_inicio}
                        onChange={(e) => handleTimeChange('hora_inicio', e.target.value)}
                        onBlur={() => handleTimeBlur('hora_inicio')}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Hora Fim</Label>
                      <Input
                        type="time"
                        step="60"
                        value={formData.hora_fim}
                        onChange={(e) => handleTimeChange('hora_fim', e.target.value)}
                        onBlur={() => handleTimeBlur('hora_fim')}
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
                    <div className="col-span-2 relative z-50">
                      <Label>Observações</Label>
                      <Textarea
                        value={formData.observacoes}
                        onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      playSound('click');
                      setIsDialogOpen(false);
                      setEditingAgendamento(null);
                      setFormData(initialFormData);
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
              onAppointmentDelete={handleDelete}
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
                          <Select value={agendamento.status} onValueChange={(value) => handleStatusChange(agendamento.id, value as Agendamento['status'])}>
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