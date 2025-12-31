import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import {
  Agendamento,
  AgendamentoFormData,
  AgendamentoStatus,
  Cliente,
  Projeto,
  INITIAL_FORM_DATA,
  DEFAULT_SESSION_MINUTES
} from "./types";
import { isUUID, addMinutes, getStatusLabel } from "./utils";

interface UseAgendamentosCrudProps {
  agendamentos: Agendamento[];
  setAgendamentos: React.Dispatch<React.SetStateAction<Agendamento[]>>;
  clientes: Cliente[];
  projetos: Projeto[];
  checkAgendamentosMilestone: (count: number) => void;
}

export function useAgendamentosCrud({
  agendamentos,
  setAgendamentos,
  clientes,
  projetos,
  checkAgendamentosMilestone,
}: UseAgendamentosCrudProps) {
  const { toast } = useToast();
  const { user, masterId } = useAuth();
  const supabaseClient = isSupabaseLocalConfigured ? supabaseLocal : supabase;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [formData, setFormData] = useState<AgendamentoFormData>(INITIAL_FORM_DATA);

  // Buscar owner do agendamento
  const fetchAgendamentoOwner = async (id: string) => {
    try {
      if (!user || !isUUID(id)) return null;
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, user_id, status')
        .eq('id', id)
        .maybeSingle();
      if (error) return null;
      return data as any;
    } catch {
      return null;
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

  const handleSubmit = async () => {
    const scrollContainer = document.querySelector('main.flex-1') as HTMLElement | null;
    const prevScrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
    sessionStorage.setItem('agendamentos-scroll-y', String(prevScrollTop));

    if (editingAgendamento) {
      const agendamentoAtualizado: Agendamento = {
        ...editingAgendamento,
        ...formData
      };
      setAgendamentos(prev => prev.map(a => a.id === editingAgendamento.id ? agendamentoAtualizado : a));

      try {
        if (masterId && isUUID(editingAgendamento.id)) {
          const projetoSelecionado = projetos.find((p) => p.titulo === formData.tatuador) || projetos.find((p) => p.id === formData.tatuador);
          const basePayload: any = {
            titulo: formData.servico || formData.cliente_nome,
            descricao: formData.observacoes,
            data: formData.data_agendamento,
            hora: formData.hora_inicio,
            status: formData.status,
          };
          if (projetoSelecionado?.id) {
            basePayload.projeto_id = projetoSelecionado.id;
          }
          let updatedOk = false;
          try {
            const { data: updated, error } = await supabaseClient
              .from('agendamentos')
              .update({ ...basePayload, valor_estimado: formData.valor_estimado })
              .eq('id', editingAgendamento.id)
              .eq('user_id', masterId)
              .select('id')
              .maybeSingle();
            if (error) throw error;
            if (updated) updatedOk = true;
          } catch (err: any) {
            const msg = String(err?.message || '').toLowerCase();
            if (msg.includes('column') && msg.includes('valor_estimado')) {
              const { data: updated2, error: error2 } = await supabaseClient
                .from('agendamentos')
                .update(basePayload)
                .eq('id', editingAgendamento.id)
                .eq('user_id', masterId)
                .select('id')
                .maybeSingle();
              if (error2) throw error2;
              if (updated2) updatedOk = true;
            } else {
              throw err;
            }
          }
          if (!updatedOk) {
            toast({ title: "Atualização não aplicada", description: "Nenhuma linha foi atualizada.", variant: "destructive" });
          } else {
            toast({ title: "Agendamento atualizado com sucesso!" });
          }
        } else {
          toast({ title: "Agendamento atualizado localmente" });
        }
      } catch (err) {
        console.error('Erro ao atualizar agendamento no banco:', err);
        toast({ title: "Erro ao atualizar no banco", description: "Tente novamente mais tarde.", variant: "destructive" });
      }
    } else {
      if (masterId) {
        try {
          const projeto = projetos.find(p => p.titulo === formData.tatuador);
          if (!projeto?.id) {
            toast({ title: 'Selecione um projeto', description: 'É necessário escolher um projeto para salvar.' });
            return;
          }

          const { data: inserted, error } = await supabase
            .from('agendamentos')
            .insert({
              user_id: masterId,
              projeto_id: projeto.id,
              titulo: formData.servico || `${formData.cliente_nome}`,
              descricao: formData.observacoes,
              data: formData.data_agendamento,
              hora: formData.hora_inicio,
              status: formData.status,
              valor_estimado: formData.valor_estimado || 0,
            })
            .select()
            .single();

          if (error) throw error;

          const clienteNomeNovo = formData.cliente_nome || clientes.find(c => c.id === formData.cliente_id)?.nome || "Cliente";

          if (formData.valor_estimado && formData.valor_estimado > 0) {
            await supabase
              .from('transacoes')
              .insert({
                user_id: masterId,
                tipo: 'RECEITA',
                categoria: 'Serviços',
                valor: formData.valor_estimado,
                data_vencimento: formData.data_agendamento,
                descricao: `Sessão: ${formData.servico} - ${clienteNomeNovo}`,
                agendamento_id: inserted.id,
              });
          }

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
    setFormData(INITIAL_FORM_DATA);

    requestAnimationFrame(() => {
      if (scrollContainer) {
        scrollContainer.scrollTop = prevScrollTop;
      } else {
        window.scrollTo(0, prevScrollTop);
      }
    });
  };

  const handleEdit = (agendamento: Agendamento) => {
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
    setAgendamentos(prev => prev.filter(a => a.id !== id));

    try {
      if (masterId && isUUID(id)) {
        const { error } = await supabaseClient.from('agendamentos').delete().eq('id', id);
        if (error) throw error;

        await supabaseClient.from('projeto_sessoes').delete().eq('agendamento_id', id);
        await supabaseClient.from('transacoes').delete().eq('agendamento_id', id);
      }

      toast({ title: "Agendamento removido com sucesso!" });
    } catch (err) {
      console.error('Erro ao excluir agendamento no banco:', err);
      toast({ title: "Erro ao excluir no banco", description: "Tente novamente mais tarde." });
    }
  };

  const handleStatusChange = async (id: string, novoStatus: AgendamentoStatus) => {
    const prevStatus = agendamentos.find(a => a.id === id)?.status;
    setAgendamentos(prev => prev.map(a =>
      a.id === id ? { ...a, status: novoStatus } : a
    ));

    try {
      if (masterId && isUUID(id)) {
        const owner = await fetchAgendamentoOwner(id);
        if (!owner || String(owner.user_id) !== String(masterId)) {
          throw new Error('owner_mismatch');
        }
        const { data: updated, error } = await supabaseClient
          .from('agendamentos')
          .update({ status: novoStatus })
          .eq('id', id)
          .select('id, status')
          .maybeSingle();
        if (error) throw error;
        if (!updated) throw new Error('no_rows_updated');
      }
      toast({ title: `Status alterado para ${getStatusLabel(novoStatus)}` });
    } catch (err) {
      console.error('Erro ao atualizar status no banco:', err);
      if (prevStatus) {
        setAgendamentos(prev => prev.map(a =>
          a.id === id ? { ...a, status: prevStatus } : a
        ));
      }
      const desc = (err as any)?.message === 'owner_mismatch' ? 'Este agendamento não pertence ao seu usuário.' : 'Tente novamente mais tarde.';
      toast({ title: 'Falha ao atualizar status', description: desc, variant: 'destructive' });
    }
  };

  // Funções do calendário
  const handleAppointmentMove = async (appointmentId: string, newDate: string) => {
    const previous = agendamentos.find(a => a.id === appointmentId)?.data_agendamento;
    setAgendamentos(prev => prev.map(a =>
      a.id === appointmentId ? { ...a, data_agendamento: newDate } : a
    ));

    try {
      if (masterId && isUUID(appointmentId)) {
        const { error } = await supabaseClient
          .from('agendamentos')
          .update({ data: newDate })
          .eq('id', appointmentId)
          .eq('user_id', masterId);
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

  const resetForm = () => {
    setEditingAgendamento(null);
    setFormData(INITIAL_FORM_DATA);
  };

  return {
    // Form
    formData,
    setFormData,
    editingAgendamento,
    isDialogOpen,
    setIsDialogOpen,

    // Filtros
    filtroStatus,
    setFiltroStatus,
    busca,
    setBusca,
    agendamentosFiltrados,

    // Handlers
    handleSubmit,
    handleEdit,
    handleDelete,
    handleStatusChange,
    handleAppointmentMove,
    handleAppointmentClick,
    handleDateClick,
    resetForm,
  };
}

